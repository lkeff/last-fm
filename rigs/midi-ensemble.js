/**
 * MIDI Ensemble Controller
 * Provides a functional MIDI interface for the Bangla Orchestra (and any
 * other configured rig) using the Web MIDI API when running in the Electron
 * renderer process, and a Node.js EventEmitter virtual bus when running in
 * main/Node context (unit-tests, CLI, remastering-studio WebSocket bridge).
 *
 * Usage (renderer / browser):
 *   const ctrl = new EnsembleController({ portName: 'My IAC Bus' })
 *   await ctrl.connect()
 *   ctrl.noteOn(1, 60, 100)   // channel 1, middle C, velocity 100
 *   ctrl.noteOff(1, 60)
 *   ctrl.programChange(1, 104) // Sitar patch
 *
 * Usage (Node.js / main process):
 *   const ctrl = new EnsembleController({ virtual: true })
 *   ctrl.on('midiMessage', msg => console.log(msg))
 *   ctrl.noteOn(10, 38, 90)   // tabla na stroke on ch10
 *
 * @module rigs/midi-ensemble
 */

'use strict'

const EventEmitter = require('events')
const banglaOrchestra = require('./bangla-orchestra')

// ---------------------------------------------------------------------------
// MIDI status byte helpers
// ---------------------------------------------------------------------------
const STATUS = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  POLY_PRESSURE: 0xA0,
  CONTROL_CHANGE: 0xB0,
  PROGRAM_CHANGE: 0xC0,
  CHANNEL_PRESSURE: 0xD0,
  PITCH_BEND: 0xE0,
  SYSTEM: 0xF0
}

// Common CC numbers
const CC = {
  MODULATION: 1,
  BREATH: 2,
  VOLUME: 7,
  PANNING: 10,
  EXPRESSION: 11,
  SUSTAIN: 64,
  REVERB: 91,
  CHORUS: 93,
  ALL_NOTES_OFF: 123
}

/**
 * Build a MIDI status byte for a given message type and channel.
 * @param {number} statusBase - e.g. STATUS.NOTE_ON
 * @param {number} channel - 1-indexed MIDI channel (1-16)
 * @returns {number} Raw status byte
 */
function statusByte (statusBase, channel) {
  return statusBase | ((channel - 1) & 0x0F)
}

// ---------------------------------------------------------------------------
// EnsembleController
// ---------------------------------------------------------------------------

class EnsembleController extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {string} [options.portName] - MIDI output port name to open (Web MIDI)
   * @param {boolean} [options.virtual=false] - Force virtual (EventEmitter) mode
   * @param {object} [options.orchestraConfig] - Rig config with midiChannels/percussionNotes
   */
  constructor (options = {}) {
    super()
    this._portName = options.portName || 'Bangla Orchestra MIDI Bus'
    this._virtual = options.virtual || (typeof navigator === 'undefined')
    this._orchestraConfig = options.orchestraConfig || banglaOrchestra.BANGLA_ORCHESTRA
    this._midiAccess = null
    this._output = null
    this._connected = false
    this._scheduledEvents = []
  }

  // -------------------------------------------------------------------------
  // Connection
  // -------------------------------------------------------------------------

  /**
   * Connect to a MIDI output port.
   * In virtual mode this resolves immediately (Node.js / test context).
   * @returns {Promise<void>}
   */
  async connect () {
    if (this._virtual) {
      this._connected = true
      this.emit('connected', { mode: 'virtual', portName: this._portName })
      return
    }

    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      throw new Error('Web MIDI API not available. Use virtual: true for Node.js environments.')
    }

    this._midiAccess = await navigator.requestMIDIAccess({ sysex: false })
    this._output = this._findOutput(this._portName)

    if (!this._output) {
      // Fall back to first available output
      const outputs = Array.from(this._midiAccess.outputs.values())
      if (outputs.length === 0) {
        throw new Error(`No MIDI output ports found. Tried: "${this._portName}"`)
      }
      this._output = outputs[0]
      console.warn(`MIDI port "${this._portName}" not found — using "${this._output.name}"`)
    }

    this._connected = true
    this.emit('connected', { mode: 'webmidi', portName: this._output.name })
  }

  disconnect () {
    this._cancelAllScheduled()
    if (this._output) {
      this.allNotesOff()
      this._output = null
    }
    this._connected = false
    this.emit('disconnected')
  }

  get connected () {
    return this._connected
  }

  // -------------------------------------------------------------------------
  // Core send
  // -------------------------------------------------------------------------

  /**
   * Send raw MIDI bytes.
   * @param {number[]} bytes - Array of MIDI bytes [status, data1, data2?]
   * @param {number} [timestamp] - Web MIDI timestamp (ms); ignored in virtual mode
   */
  send (bytes, timestamp) {
    if (!this._connected) {
      throw new Error('EnsembleController not connected. Call connect() first.')
    }

    const msg = { bytes, timestamp: timestamp || performance.now() }

    if (this._virtual) {
      this.emit('midiMessage', msg)
    } else if (this._output) {
      this._output.send(bytes, timestamp)
      this.emit('midiMessage', msg)
    }
  }

  // -------------------------------------------------------------------------
  // Note messages
  // -------------------------------------------------------------------------

  /**
   * Send Note On.
   * @param {number} channel - 1-16
   * @param {number} note - 0-127
   * @param {number} [velocity=64] - 0-127
   * @param {number} [timestamp]
   */
  noteOn (channel, note, velocity = 64, timestamp) {
    this.send([statusByte(STATUS.NOTE_ON, channel), note & 0x7F, velocity & 0x7F], timestamp)
  }

  /**
   * Send Note Off.
   * @param {number} channel - 1-16
   * @param {number} note - 0-127
   * @param {number} [velocity=0] - release velocity
   * @param {number} [timestamp]
   */
  noteOff (channel, note, velocity = 0, timestamp) {
    this.send([statusByte(STATUS.NOTE_OFF, channel), note & 0x7F, velocity & 0x7F], timestamp)
  }

  /**
   * Play a note for a given duration then send note-off.
   * @param {number} channel
   * @param {number} note
   * @param {number} velocity
   * @param {number} durationMs
   * @returns {object} Handle with cancel() method
   */
  noteOnOff (channel, note, velocity = 64, durationMs = 500) {
    this.noteOn(channel, note, velocity)
    const timer = setTimeout(() => this.noteOff(channel, note), durationMs)
    const handle = {
      cancel: () => {
        clearTimeout(timer)
        this.noteOff(channel, note)
      }
    }
    this._scheduledEvents.push(handle)
    return handle
  }

  // -------------------------------------------------------------------------
  // Control messages
  // -------------------------------------------------------------------------

  programChange (channel, program) {
    this.send([statusByte(STATUS.PROGRAM_CHANGE, channel), program & 0x7F])
  }

  controlChange (channel, controller, value) {
    this.send([statusByte(STATUS.CONTROL_CHANGE, channel), controller & 0x7F, value & 0x7F])
  }

  pitchBend (channel, value) {
    // value: -8192 to +8191
    const normalised = Math.max(-8192, Math.min(8191, value)) + 8192
    const lsb = normalised & 0x7F
    const msb = (normalised >> 7) & 0x7F
    this.send([statusByte(STATUS.PITCH_BEND, channel), lsb, msb])
  }

  aftertouch (channel, pressure) {
    this.send([statusByte(STATUS.CHANNEL_PRESSURE, channel), pressure & 0x7F])
  }

  allNotesOff (channel) {
    if (channel) {
      this.controlChange(channel, CC.ALL_NOTES_OFF, 0)
    } else {
      for (let ch = 1; ch <= 16; ch++) {
        this.controlChange(ch, CC.ALL_NOTES_OFF, 0)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Orchestra-aware helpers
  // -------------------------------------------------------------------------

  /**
   * Initialise all orchestra channels: send program changes from GM2_PROGRAMS.
   */
  initOrchestra () {
    const programs = this._orchestraConfig.gm2Programs
    for (const [instrument, program] of Object.entries(programs)) {
      if (program === null) continue // percussion channels need no program change
      const ch = this._orchestraConfig.midiChannels[instrument]
      if (ch) this.programChange(ch, program)
    }
    this.emit('orchestraInitialised', { instruments: Object.keys(programs) })
  }

  /**
   * Play a raga scale as an ascending arpeggio on the given instrument channel.
   * @param {string} ragaName - Key from banglaOrchestra.ensembleHookup.ragaScales
   * @param {string} instrument - Key from MIDI_CHANNELS (e.g. 'sitar')
   * @param {number} [rootMidi=60] - Root note MIDI number (Sa)
   * @param {number} [velocity=80]
   * @param {number} [noteDurationMs=300]
   * @param {number} [gapMs=50]
   */
  playRagaAscent (ragaName, instrument, rootMidi = 60, velocity = 80, noteDurationMs = 300, gapMs = 50) {
    const scale = banglaOrchestra.getRagaScale(ragaName)
    if (!scale) throw new Error(`Unknown raga: ${ragaName}. Available: ${banglaOrchestra.getAvailableRagas().join(', ')}`)

    const channel = this._orchestraConfig.midiChannels[instrument]
    if (!channel) throw new Error(`Unknown instrument: ${instrument}`)

    scale.forEach((interval, i) => {
      const note = rootMidi + interval
      const delay = i * (noteDurationMs + gapMs)
      const timer = setTimeout(() => {
        this.noteOnOff(channel, note, velocity, noteDurationMs)
      }, delay)
      this._scheduledEvents.push({ cancel: () => clearTimeout(timer) })
    })
  }

  /**
   * Trigger a tabla stroke pattern (sequence of bols).
   * @param {string[]} bols - Array of tabla bol names e.g. ['dha','dhin','dha','tin']
   * @param {number} [bpm=80]
   * @param {number} [velocity=90]
   */
  playTablaPattern (bols, bpm = 80, velocity = 90) {
    const msBeat = (60 / bpm) * 1000
    const tablaChannel = this._orchestraConfig.midiChannels.tabla
    const noteMap = this._orchestraConfig.percussionNotes.tabla

    bols.forEach((bol, i) => {
      const note = noteMap[bol]
      if (note === undefined) return // unknown bol — skip silently
      const delay = i * msBeat
      const timer = setTimeout(() => {
        this.noteOnOff(tablaChannel, note, velocity, msBeat * 0.8)
      }, delay)
      this._scheduledEvents.push({ cancel: () => clearTimeout(timer) })
    })
  }

  /**
   * Apply the orchestra's studioPreset to the remastering-studio via WebSocket.
   * @param {WebSocket} ws - An open WebSocket connection to the remastering-studio
   */
  sendStudioPreset (ws) {
    const preset = this._orchestraConfig.studioPreset
    ws.send(JSON.stringify({ type: 'updateParams', params: preset }))
  }

  // -------------------------------------------------------------------------
  // Section volume control (CC7)
  // -------------------------------------------------------------------------

  setSectionVolume (instrument, volume) {
    const channel = this._orchestraConfig.midiChannels[instrument]
    if (!channel) throw new Error(`Unknown instrument: ${instrument}`)
    this.controlChange(channel, CC.VOLUME, Math.max(0, Math.min(127, volume)))
  }

  setAllSectionVolumes (volume) {
    for (const ch of Object.values(this._orchestraConfig.midiChannels)) {
      this.controlChange(ch, CC.VOLUME, Math.max(0, Math.min(127, volume)))
    }
  }

  setReverbLevel (instrument, amount) {
    const channel = this._orchestraConfig.midiChannels[instrument]
    if (!channel) throw new Error(`Unknown instrument: ${instrument}`)
    this.controlChange(channel, CC.REVERB, Math.max(0, Math.min(127, amount)))
  }

  // -------------------------------------------------------------------------
  // Ensemble playback helpers
  // -------------------------------------------------------------------------

  /**
   * Drone: hold tanpura notes (Sa, Pa, Sa) continuously.
   * @param {number} [rootMidi=60]
   * @param {number} [velocity=50]
   */
  startDrone (rootMidi = 60, velocity = 50) {
    const ch = this._orchestraConfig.midiChannels.tanpura
    const notes = [rootMidi, rootMidi + 7, rootMidi + 12] // Sa Pa Sa (octave)
    notes.forEach(note => this.noteOn(ch, note, velocity))
    this._droneNotes = { ch, notes }
  }

  stopDrone () {
    if (this._droneNotes) {
      this._droneNotes.notes.forEach(note => this.noteOff(this._droneNotes.ch, note))
      this._droneNotes = null
    }
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  _findOutput (name) {
    if (!this._midiAccess) return null
    for (const output of this._midiAccess.outputs.values()) {
      if (output.name.includes(name) || name.includes(output.name)) return output
    }
    return null
  }

  _cancelAllScheduled () {
    this._scheduledEvents.forEach(h => h.cancel && h.cancel())
    this._scheduledEvents = []
    this.stopDrone()
  }

  /** List available MIDI output ports (Web MIDI only). */
  listPorts () {
    if (this._virtual) return ['[virtual bus]']
    if (!this._midiAccess) return []
    return Array.from(this._midiAccess.outputs.values()).map(o => o.name)
  }
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Create a pre-configured controller for the Bangla Orchestra ensemble.
 * @param {object} [options] - Passed to EnsembleController constructor
 * @returns {EnsembleController}
 */
function createBanglaEnsemble (options = {}) {
  return new EnsembleController({
    portName: banglaOrchestra.BANGLA_ORCHESTRA.ensembleHookup.portName,
    orchestraConfig: banglaOrchestra.BANGLA_ORCHESTRA,
    ...options
  })
}

module.exports = {
  EnsembleController,
  createBanglaEnsemble,
  STATUS,
  CC,
  statusByte
}
