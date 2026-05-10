'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  PHILIPS_FW335,
  getPhilipsFw335Rig, getPhilipsFw335EqBands, getPhilipsFw335PlaybackChain,
  getPhilipsFw335InstrumentNote, getPhilipsFw335DspModes, getPhilipsFw335OutputFormat
} = require('../rigs/philips-fw335.js')

describe('Philips FW335 output profile', () => {
  it('PHILIPS_FW335 has correct type and model', () => {
    assert.equal(PHILIPS_FW335.type, 'philips-fw335')
    assert.equal(PHILIPS_FW335.model, 'FW335')
    assert.equal(PHILIPS_FW335.brand, 'Philips')
  })

  it('getPhilipsFw335Rig() returns config object', () => {
    assert.deepEqual(getPhilipsFw335Rig(), PHILIPS_FW335)
  })

  it('amplifier is 2-channel stereo', () => {
    assert.equal(PHILIPS_FW335.amplifier.channels, 2)
  })

  it('speaker config is 2.0 (no subwoofer)', () => {
    assert.equal(PHILIPS_FW335.speakers.configuration.includes('2.0'), true)
    assert.equal(PHILIPS_FW335.speakers.subwoofer, null)
  })

  it('Digital Surround has 0 true surround output channels (stereo virtualiser)', () => {
    assert.equal(PHILIPS_FW335.digitalSurroundDsp.trueSurroundChannels, 0)
  })

  it('recommended sampler DSP mode is stereo (bypass)', () => {
    assert.equal(PHILIPS_FW335.digitalSurroundDsp.recommendedModeForSampler, 'stereo')
  })

  it('getPhilipsFw335DspModes() includes stereo and digitalSurround modes', () => {
    const modes = getPhilipsFw335DspModes()
    assert.ok(modes.stereo)
    assert.ok(modes.digitalSurround)
    assert.equal(modes.stereo.id, 0)
  })

  it('getPhilipsFw335EqBands() returns 6 bands', () => {
    const bands = getPhilipsFw335EqBands()
    assert.ok(Array.isArray(bands))
    assert.equal(bands.length, 6)
  })

  it('EQ bands include 80Hz highpass to protect speakers', () => {
    const bands = getPhilipsFw335EqBands()
    const hp = bands.find(b => b.type === 'highpass')
    assert.ok(hp)
    assert.equal(hp.freq, 80)
    assert.ok(hp.gainDb < 0)
  })

  it('EQ bands include presence boost for sitar/tabla clarity', () => {
    const bands = getPhilipsFw335EqBands()
    const presence = bands.find(b => b.freq === 3500)
    assert.ok(presence)
    assert.ok(presence.gainDb > 0)
  })

  it('getPhilipsFw335PlaybackChain() has 7 steps', () => {
    const chain = getPhilipsFw335PlaybackChain()
    assert.ok(Array.isArray(chain.steps))
    assert.equal(chain.steps.length, 7)
  })

  it('playback chain step 1 specifies -6 dBFS master limit', () => {
    const chain = getPhilipsFw335PlaybackChain()
    assert.ok(chain.steps[0].action.includes('-6 dBFS'))
  })

  it('output format is 44100 Hz / 16-bit stereo PCM', () => {
    const fmt = getPhilipsFw335OutputFormat()
    assert.equal(fmt.sampleRate, 44100)
    assert.equal(fmt.bitDepth, 16)
    assert.equal(fmt.channels, 2)
  })

  it('getPhilipsFw335InstrumentNote() returns note for gamelan', () => {
    const note = getPhilipsFw335InstrumentNote('gamelan')
    assert.ok(note)
    assert.ok(typeof note === 'string')
  })

  it('getPhilipsFw335InstrumentNote() returns note for didgeridoo', () => {
    const note = getPhilipsFw335InstrumentNote('didgeridoo')
    assert.ok(note)
    assert.ok(note.toLowerCase().includes('drone') || note.toLowerCase().includes('hz'))
  })

  it('getPhilipsFw335InstrumentNote() returns null for unknown instrument', () => {
    assert.equal(getPhilipsFw335InstrumentNote('nonexistent'), null)
  })

  it('sampler interface recommends AUX IN via 3.5mm jack', () => {
    const iface = PHILIPS_FW335.samplerInterface
    assert.ok(iface.recommendedConnection.toLowerCase().includes('aux'))
    assert.ok(iface.cableType.includes('3.5mm'))
  })

  it('speaker bass rolloff frequency is 120 Hz', () => {
    assert.equal(PHILIPS_FW335.speakers.satellites.frequencyResponse.low, 120)
  })
})

// rigs/index integration
const rigs = require('../rigs/index.js')

describe('rigs/index.js Philips FW335 integration', () => {
  it('RIGS.philipsFw335 exists', () => {
    assert.ok(rigs.RIGS.philipsFw335)
  })

  it('getRig("philipsFw335") returns config', () => {
    assert.ok(rigs.getRig('philipsFw335'))
    assert.equal(rigs.getRig('philipsFw335').model, 'FW335')
  })

  it('getRigsSummary() includes philipsFw335 entry', () => {
    const summary = rigs.getRigsSummary()
    assert.ok(summary.philipsFw335)
    assert.equal(summary.philipsFw335.model, 'FW335')
    assert.equal(summary.philipsFw335.channels, 2)
  })

  it('PHILIPS_FW335 direct export exists', () => {
    assert.ok(rigs.PHILIPS_FW335)
    assert.equal(rigs.PHILIPS_FW335.brand, 'Philips')
  })

  it('searchEquipment finds "philips" in fw335 rig', () => {
    const results = rigs.searchEquipment('philips')
    assert.ok(results.some(r => r.rig === 'philipsFw335'))
  })

  it('searchEquipment finds "surround" in fw335 rig', () => {
    const results = rigs.searchEquipment('surround')
    assert.ok(results.some(r => r.rig === 'philipsFw335'))
  })
})
