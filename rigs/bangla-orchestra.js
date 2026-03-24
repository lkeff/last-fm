/**
 * Professional Bangla Classical Orchestra Configuration
 * A 32-musician Bengali classical ensemble (Baul-Fusion to Rabindra Sangit)
 * featuring traditional South Asian instruments with full MIDI channel mappings,
 * studio microphone setup, and ensemble hookup for the remastering-studio.
 *
 * MIDI channel assignments follow GM2 conventions where possible,
 * with channel 10 reserved for percussion per the MIDI standard.
 *
 * @module rigs/bangla-orchestra
 */

'use strict'

// ---------------------------------------------------------------------------
// MIDI Channel Map
// Each instrument family gets a dedicated channel (1-16).
// Channel 10 is the GM percussion channel (always on).
// ---------------------------------------------------------------------------
const MIDI_CHANNELS = {
  sitar: 1,
  sarod: 2,
  tanpura: 3,
  esraj: 4,
  sarangi: 5,
  dotara: 6,
  bansuri: 7,
  shehnai: 8,
  harmonium: 9,
  tabla: 10, // GM standard percussion channel
  dhol: 11,
  khol: 12,
  pakhawaj: 13,
  vocals: 14,
  conductor: 15,
  ensemble: 16
}

// ---------------------------------------------------------------------------
// General MIDI 2 program numbers (0-indexed) for closest approximations.
// Real-world use would substitute sampler patches / SFZ instruments.
// ---------------------------------------------------------------------------
const GM2_PROGRAMS = {
  sitar: 104, // Sitar (GM #105)
  sarod: 105, // Banjo (closest bowed/plucked approximation, replaced in SFZ)
  tanpura: 104, // Sitar (drone role)
  esraj: 40, // Violin (bowed string)
  sarangi: 40, // Violin (bowed string)
  dotara: 25, // Acoustic Guitar (Steel)
  bansuri: 73, // Flute
  shehnai: 68, // Oboe (closest approximation)
  harmonium: 20, // Reed Organ
  tabla: null, // Percussion channel — no program change needed
  dhol: null,
  khol: null,
  pakhawaj: null,
  vocals: 52 // Choir Aahs
}

// ---------------------------------------------------------------------------
// Percussion note assignments on channel 10 (MIDI note numbers)
// Based on GM2 percussion map with Bangla-specific extensions.
// ---------------------------------------------------------------------------
const PERCUSSION_NOTES = {
  tabla: {
    na: 38, // Snare (Dayan open stroke)
    tin: 40, // Electric Snare (Dayan closed)
    ge: 41, // Low Floor Tom (Bayan low tone)
    ke: 43, // High Floor Tom (Bayan slap)
    tun: 45, // Low Tom (Dayan resonant open)
    te: 47, // Low-Mid Tom (Dayan closed muted)
    dha: 49, // Crash Cymbal (full combo stroke)
    dhin: 51 // Ride Cymbal (resonant combo)
  },
  dhol: {
    bass: 36, // Bass Drum 1
    snare: 38, // Acoustic Snare
    rim: 37 // Side Stick
  },
  khol: {
    open: 60, // High Bongo
    slap: 61, // Low Bongo
    bass: 62 // Mute High Conga
  },
  pakhawaj: {
    left: 64, // Low Conga
    right: 63, // Open High Conga
    bass: 58 // Vibraslap (resonant bass)
  }
}

// ---------------------------------------------------------------------------
// Main configuration object
// ---------------------------------------------------------------------------
const BANGLA_ORCHESTRA = {
  name: 'Professional Bangla Classical Orchestra',
  version: '1.0.0',
  type: 'bangla-orchestra',
  style: 'Bengali Classical / Rabindra Sangit / Baul Fusion',
  totalMusicians: 32,
  tuningReference: 'Sa = C4 (Western C), A = 440 Hz (concert pitch)',

  midiChannels: MIDI_CHANNELS,
  gm2Programs: GM2_PROGRAMS,
  percussionNotes: PERCUSSION_NOTES,

  // -------------------------------------------------------------------------
  // Stage Layout
  // Semi-circular traditional arrangement facing audience.
  // Conductor (Ustad/Guru) sits at center-rear elevated.
  // -------------------------------------------------------------------------
  layout: {
    arrangement: 'Traditional Bengali semi-circle',
    conductorPosition: { x: 0, y: 3, facing: 'audience' },
    stageDepth: 8, // metres
    stageWidth: 14, // metres
    tiers: 2,
    acousticShell: true,
    carpeted: true // traditional floor seating for some performers
  },

  // -------------------------------------------------------------------------
  // PLUCKED STRINGS SECTION — 8 musicians
  // -------------------------------------------------------------------------
  pluckedStrings: {
    totalMusicians: 8,
    midiChannel: null, // each sub-instrument has its own channel

    sitar: {
      count: 2,
      midiChannel: MIDI_CHANNELS.sitar,
      gm2Program: GM2_PROGRAMS.sitar,
      tuning: 'C# – G# – C# – G# – C# – G# – C# (pancham tuning)',
      positions: [
        { seat: 1, role: 'Principal Sitar', position: 'Centre-left' },
        { seat: 2, role: 'Second Sitar', position: 'Centre-left inner' }
      ]
    },

    sarod: {
      count: 2,
      midiChannel: MIDI_CHANNELS.sarod,
      gm2Program: GM2_PROGRAMS.sarod,
      tuning: 'PA – SA – PA – MA (standard Sarod tuning)',
      positions: [
        { seat: 1, role: 'Principal Sarod', position: 'Centre-right' },
        { seat: 2, role: 'Second Sarod', position: 'Centre-right inner' }
      ]
    },

    tanpura: {
      count: 2,
      midiChannel: MIDI_CHANNELS.tanpura,
      gm2Program: GM2_PROGRAMS.tanpura,
      note: 'Drone instrument — sustained Sa-Pa-Sa',
      tuning: 'Pa – Sa – Sa – Sa (male) / Ma – Sa – Sa – Sa (female)',
      positions: [
        { seat: 1, role: 'Lead Tanpura (male)', position: 'Stage far left' },
        { seat: 2, role: 'Lead Tanpura (female)', position: 'Stage far right' }
      ]
    },

    dotara: {
      count: 2,
      midiChannel: MIDI_CHANNELS.dotara,
      gm2Program: GM2_PROGRAMS.dotara,
      note: 'Folk two-string lute, prominent in Baul tradition',
      tuning: 'Open G or open D depending on regional style',
      positions: [
        { seat: 1, role: 'Principal Dotara', position: 'Left-mid' },
        { seat: 2, role: 'Second Dotara', position: 'Left-mid inner' }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // BOWED STRINGS SECTION — 4 musicians
  // -------------------------------------------------------------------------
  bowedStrings: {
    totalMusicians: 4,

    esraj: {
      count: 2,
      midiChannel: MIDI_CHANNELS.esraj,
      gm2Program: GM2_PROGRAMS.esraj,
      note: 'Bowed instrument with sympathetic strings, central to Rabindra Sangit',
      tuning: 'D – G – D – G (standard Esraj)',
      positions: [
        { seat: 1, role: 'Principal Esraj', position: 'Left-front' },
        { seat: 2, role: 'Second Esraj', position: 'Left-front inner' }
      ]
    },

    sarangi: {
      count: 2,
      midiChannel: MIDI_CHANNELS.sarangi,
      gm2Program: GM2_PROGRAMS.sarangi,
      note: 'Bowed melodic accompaniment, 35–40 sympathetic strings',
      tuning: 'C – G – C – G (main strings)',
      positions: [
        { seat: 1, role: 'Principal Sarangi', position: 'Right-front' },
        { seat: 2, role: 'Second Sarangi', position: 'Right-front inner' }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // WIND SECTION — 4 musicians
  // -------------------------------------------------------------------------
  winds: {
    totalMusicians: 4,

    bansuri: {
      count: 2,
      midiChannel: MIDI_CHANNELS.bansuri,
      gm2Program: GM2_PROGRAMS.bansuri,
      note: 'Transverse bamboo flute; key of G, C, or D depending on raga',
      sizes: ['Bass Bansuri (E/D key)', 'Concert Bansuri (C/G key)'],
      positions: [
        { seat: 1, role: 'Principal Bansuri', position: 'Right-mid' },
        { seat: 2, role: 'Second Bansuri', position: 'Right-mid inner' }
      ]
    },

    shehnai: {
      count: 2,
      midiChannel: MIDI_CHANNELS.shehnai,
      gm2Program: GM2_PROGRAMS.shehnai,
      note: 'Double-reed aerophone — ceremonial and classical contexts',
      positions: [
        { seat: 1, role: 'Principal Shehnai', position: 'Stage right' },
        { seat: 2, role: 'Second Shehnai / Dum (drone pipe)', position: 'Stage right inner' }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // KEYBOARD / HARMONIUM — 2 musicians
  // -------------------------------------------------------------------------
  keyboards: {
    totalMusicians: 2,

    harmonium: {
      count: 2,
      midiChannel: MIDI_CHANNELS.harmonium,
      gm2Program: GM2_PROGRAMS.harmonium,
      note: 'Pump harmonium — central to Bengali vocal and devotional music',
      type: 'Pump Harmonium (3.5 octave, 42-key)',
      positions: [
        { seat: 1, role: 'Lead Harmonium', position: 'Centre-front' },
        { seat: 2, role: 'Second Harmonium / Shruti Box', position: 'Centre-front inner' }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // PERCUSSION SECTION — 8 musicians
  // -------------------------------------------------------------------------
  percussion: {
    totalMusicians: 8,

    tabla: {
      count: 2,
      midiChannel: MIDI_CHANNELS.tabla, // GM ch10
      notes: PERCUSSION_NOTES.tabla,
      note: 'Paired hand drums — Dayan (right, treble) + Bayan (left, bass)',
      positions: [
        { seat: 1, role: 'Principal Tabla', position: 'Centre slightly right' },
        { seat: 2, role: 'Second Tabla', position: 'Centre right inner' }
      ],
      setup: {
        dayan: { material: 'Goatskin head, teak/rosewood shell', tuning: 'C/D/E (raga dependent)' },
        bayan: { material: 'Buffalo skin head, copper/brass shell', pitch: 'Low drone' }
      }
    },

    dhol: {
      count: 2,
      midiChannel: MIDI_CHANNELS.dhol,
      notes: PERCUSSION_NOTES.dhol,
      note: 'Double-headed barrel drum — traditional folk and processional',
      positions: [
        { seat: 1, role: 'Principal Dhol', position: 'Stage far right, tier 1' },
        { seat: 2, role: 'Second Dhol', position: 'Stage far right, tier 2' }
      ]
    },

    khol: {
      count: 2,
      midiChannel: MIDI_CHANNELS.khol,
      notes: PERCUSSION_NOTES.khol,
      note: 'Clay/wood double-headed drum — sacred to Vaishnava and Baul traditions',
      positions: [
        { seat: 1, role: 'Principal Khol', position: 'Stage left rear' },
        { seat: 2, role: 'Second Khol', position: 'Stage left rear inner' }
      ]
    },

    pakhawaj: {
      count: 2,
      midiChannel: MIDI_CHANNELS.pakhawaj,
      notes: PERCUSSION_NOTES.pakhawaj,
      note: 'Barrel drum — older form of tabla, dhrupad tradition',
      positions: [
        { seat: 1, role: 'Principal Pakhawaj', position: 'Stage right rear' },
        { seat: 2, role: 'Second Pakhawaj', position: 'Stage right rear inner' }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // VOCAL SECTION — 6 musicians
  // -------------------------------------------------------------------------
  vocals: {
    totalMusicians: 6,
    midiChannel: MIDI_CHANNELS.vocals,
    gm2Program: GM2_PROGRAMS.vocals,

    lead: {
      count: 2,
      positions: [
        { seat: 1, role: 'Lead Vocalist (female)', style: 'Rabindra Sangit / Thumri', position: 'Centre-front' },
        { seat: 2, role: 'Lead Vocalist (male)', style: 'Khayal / Baul', position: 'Centre-front right' }
      ]
    },

    chorus: {
      count: 4,
      position: 'Rear tier, spread evenly',
      note: 'Provide drone and call-response with leads'
    }
  },

  // -------------------------------------------------------------------------
  // CONDUCTOR / USTAD
  // -------------------------------------------------------------------------
  conductor: {
    title: 'Ustad / Guru',
    midiChannel: MIDI_CHANNELS.conductor,
    position: 'Rear centre elevated, facing ensemble',
    equipment: [
      'Tanpura (reference drone)',
      'Score / notation scroll',
      'Tala handclap / Tal count cue'
    ]
  },

  // -------------------------------------------------------------------------
  // MIDI ENSEMBLE HOOKUP
  // Routes each section to a specific MIDI output port and channel.
  // Designed for use with rigs/midi-ensemble.js EnsembleController.
  // -------------------------------------------------------------------------
  ensembleHookup: {
    portName: 'Bangla Orchestra MIDI Bus',
    sections: [
      { name: 'Plucked Strings', instruments: ['sitar', 'sarod', 'tanpura', 'dotara'], channels: [1, 2, 3, 6] },
      { name: 'Bowed Strings', instruments: ['esraj', 'sarangi'], channels: [4, 5] },
      { name: 'Winds', instruments: ['bansuri', 'shehnai'], channels: [7, 8] },
      { name: 'Keyboards', instruments: ['harmonium'], channels: [9] },
      { name: 'Percussion', instruments: ['tabla', 'dhol', 'khol', 'pakhawaj'], channels: [10, 11, 12, 13] },
      { name: 'Vocals', instruments: ['vocals'], channels: [14] }
    ],
    // Raga-based scale maps: MIDI note offsets from root Sa (C4 = MIDI 60)
    ragaScales: {
      yaman: [0, 2, 4, 6, 7, 9, 11], // Kalyan thaat
      bhairav: [0, 1, 4, 5, 7, 8, 11], // Bhairav thaat
      khamaj: [0, 2, 4, 5, 7, 9, 10], // Khamaj thaat
      bhairavi: [0, 1, 3, 5, 7, 8, 10], // Bhairavi thaat
      bilawal: [0, 2, 4, 5, 7, 9, 11] // Bilawal thaat (Western major equivalent)
    }
  },

  // -------------------------------------------------------------------------
  // REMASTERING STUDIO AUDIO PROCESSING PRESETS
  // Optimised for the acoustic profile of Indian classical instruments.
  // Compatible with remastering-studio WebSocket 'updateParams' message.
  // -------------------------------------------------------------------------
  studioPreset: {
    normalize: { enabled: true, targetLevel: -3.0 }, // Softer ceiling for dynamic playing
    compress: { enabled: true, threshold: -18, ratio: 2.5, attack: 15, release: 250 }, // Gentle, slow attack to preserve transients
    reverb: { enabled: true, level: 0.25, decay: 1.8, reverse: false }, // Hall reverb for concert feel
    delay: { enabled: false, time: 350, feedback: 0.3, mix: 0.2 }, // Disabled by default; enable for Baul folk style
    master: { enabled: true, limiterThreshold: -0.5, makeUpGain: 1.2, stereoEnhance: 1.05 }
  },

  // -------------------------------------------------------------------------
  // RECORDING MICROPHONE SETUP
  // -------------------------------------------------------------------------
  recording: {
    mainArray: {
      technique: 'ORTF near-coincident pair',
      microphones: [
        { position: 'Left', model: 'Neumann KM 184', height: '2.5m' },
        { position: 'Right', model: 'Neumann KM 184', height: '2.5m' }
      ],
      spacing: '17cm, 110° angle'
    },
    spotMics: {
      tabla: { model: 'AKG C414 XLII', quantity: 2, placement: '10cm overhead, aimed at head centres' },
      sitar: { model: 'Neumann U 87', quantity: 1, placement: '30cm from soundhole, off-axis 30°' },
      sarod: { model: 'Neumann U 87', quantity: 1, placement: '25cm bridge area' },
      esraj: { model: 'Schoeps CMC 6 MK4', quantity: 1, placement: '20cm from body, mid-position' },
      bansuri: { model: 'DPA 4011', quantity: 1, placement: '15cm from embouchure hole, 45° off-axis' },
      shehnai: { model: 'DPA 4011', quantity: 1, placement: '20cm from bell' },
      harmonium: { model: 'Rode NT5', quantity: 2, placement: 'Spaced pair above bellows' },
      vocals: { model: 'Neumann U 87 or TLM 103', quantity: 2, placement: '15cm, slight off-axis pop filter' },
      ambience: { model: 'Neumann M 50', quantity: 2, placement: 'Spaced omnis 8m from stage' }
    },
    totalMicChannels: 14,
    preamps: 'Neve 1073 (melodic instruments) / API 512c (percussion)',
    converters: 'Avid Pro Tools MTRX II @ 96kHz / 32-bit'
  },

  // -------------------------------------------------------------------------
  // TECHNICAL REQUIREMENTS
  // -------------------------------------------------------------------------
  technical: {
    tuning: {
      sa: 'C4 (MIDI note 60) or performer-preferred root',
      concert: 'A = 440 Hz (international standard)',
      shruti: 'C-shruti box set to match lead vocalist'
    },
    tala: {
      common: [
        { name: 'Teentaal', beats: 16, divisions: '4+4+4+4', bpm: '60-120' },
        { name: 'Ektaal', beats: 12, divisions: '2+2+2+2+2+2', bpm: '50-90' },
        { name: 'Rupak', beats: 7, divisions: '3+2+2', bpm: '60-100' },
        { name: 'Jhaptaal', beats: 10, divisions: '2+3+2+3', bpm: '60-80' },
        { name: 'Dadra', beats: 6, divisions: '3+3', bpm: '80-130' }
      ]
    },
    rehearsal: {
      typical: '3 hours with 30-minute break',
      alap: '15 minutes per raga for opening improvisation warm-up'
    }
  },

  // -------------------------------------------------------------------------
  // Complete Musician Roster
  // -------------------------------------------------------------------------
  roster: {
    generateFullRoster: function () {
      const roster = []
      let id = 1

      const sections = [
        { section: 'Plucked Strings', instrument: 'Sitar', count: 2, roles: ['Principal Sitar', 'Second Sitar'] },
        { section: 'Plucked Strings', instrument: 'Sarod', count: 2, roles: ['Principal Sarod', 'Second Sarod'] },
        { section: 'Plucked Strings', instrument: 'Tanpura', count: 2, roles: ['Lead Tanpura (male)', 'Lead Tanpura (female)'] },
        { section: 'Plucked Strings', instrument: 'Dotara', count: 2, roles: ['Principal Dotara', 'Second Dotara'] },
        { section: 'Bowed Strings', instrument: 'Esraj', count: 2, roles: ['Principal Esraj', 'Second Esraj'] },
        { section: 'Bowed Strings', instrument: 'Sarangi', count: 2, roles: ['Principal Sarangi', 'Second Sarangi'] },
        { section: 'Winds', instrument: 'Bansuri', count: 2, roles: ['Principal Bansuri', 'Second Bansuri'] },
        { section: 'Winds', instrument: 'Shehnai', count: 2, roles: ['Principal Shehnai', 'Second Shehnai'] },
        { section: 'Keyboards', instrument: 'Harmonium', count: 2, roles: ['Lead Harmonium', 'Second Harmonium'] },
        { section: 'Percussion', instrument: 'Tabla', count: 2, roles: ['Principal Tabla', 'Second Tabla'] },
        { section: 'Percussion', instrument: 'Dhol', count: 2, roles: ['Principal Dhol', 'Second Dhol'] },
        { section: 'Percussion', instrument: 'Khol', count: 2, roles: ['Principal Khol', 'Second Khol'] },
        { section: 'Percussion', instrument: 'Pakhawaj', count: 2, roles: ['Principal Pakhawaj', 'Second Pakhawaj'] },
        { section: 'Vocals', instrument: 'Voice', count: 2, roles: ['Lead Vocalist (female)', 'Lead Vocalist (male)'] },
        { section: 'Vocals', instrument: 'Chorus', count: 4, roles: ['Chorus 1', 'Chorus 2', 'Chorus 3', 'Chorus 4'] }
      ]

      sections.forEach(s => {
        for (let i = 0; i < s.count; i++) {
          roster.push({
            id: id++,
            section: s.section,
            subsection: s.instrument,
            seat: i + 1,
            role: s.roles[i] || `${s.instrument} ${i + 1}`,
            instrument: s.instrument,
            midiChannel: MIDI_CHANNELS[s.instrument.toLowerCase()] || MIDI_CHANNELS.ensemble
          })
        }
      })

      return roster
    }
  },

  // -------------------------------------------------------------------------
  // Seating Chart Coordinates
  // Semi-circular arrangement, conductor at rear centre.
  // X: left(-) / right(+), Y: front(0) / rear(+)
  // -------------------------------------------------------------------------
  seatingChart: {
    generateCoordinates: function () {
      const positions = []
      const radius = 4.5
      const totalFront = 14 // players in front arc
      const step = Math.PI / (totalFront + 1)

      // Front arc — melodic instruments
      const frontPlayers = [
        'Lead Vocals', 'Lead Harmonium', 'Principal Sitar', 'Principal Esraj',
        'Principal Bansuri', 'Principal Sarod', 'Principal Sarangi',
        'Second Sitar', 'Second Esraj', 'Second Bansuri', 'Second Sarod',
        'Second Harmonium', 'Second Sarangi', 'Second Vocals'
      ]

      frontPlayers.forEach((label, i) => {
        const angle = Math.PI - step * (i + 1)
        positions.push({
          role: label,
          x: parseFloat((radius * Math.cos(angle)).toFixed(2)),
          y: parseFloat((radius * Math.sin(angle) + 0.5).toFixed(2)),
          angle: 0,
          tier: 1
        })
      })

      // Rear arc — drones, percussion, backing
      const rearRadius = 6.5
      const rearPlayers = [
        'Lead Tanpura (female)', 'Principal Tabla', 'Principal Khol',
        'Principal Dhol', 'Principal Pakhawaj', 'Lead Tanpura (male)'
      ]
      const rearStep = Math.PI / (rearPlayers.length + 1)

      rearPlayers.forEach((label, i) => {
        const angle = Math.PI - rearStep * (i + 1)
        positions.push({
          role: label,
          x: parseFloat((rearRadius * Math.cos(angle)).toFixed(2)),
          y: parseFloat((rearRadius * Math.sin(angle) + 1.5).toFixed(2)),
          angle: 0,
          tier: 2,
          elevated: true
        })
      })

      // Dotara — far wings
      positions.push({ role: 'Principal Dotara', x: -6, y: 3.5, angle: 30, tier: 1 })
      positions.push({ role: 'Second Dotara', x: -5, y: 4.5, angle: 25, tier: 1 })

      // Shehnai — far right
      positions.push({ role: 'Principal Shehnai', x: 6, y: 3.5, angle: -30, tier: 1 })
      positions.push({ role: 'Second Shehnai', x: 5, y: 4.5, angle: -25, tier: 1 })

      // Chorus — rear standing
      for (let i = 0; i < 4; i++) {
        positions.push({
          role: `Chorus ${i + 1}`,
          x: -3 + i * 2,
          y: 7,
          angle: 0,
          tier: 2,
          standing: true
        })
      }

      // Conductor / Ustad
      positions.push({ role: 'Ustad / Conductor', x: 0, y: 3, angle: 180, tier: 2, elevated: true })

      return positions
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function getBanglaOrchestra () {
  return BANGLA_ORCHESTRA
}

function getSection (section) {
  return BANGLA_ORCHESTRA[section] || null
}

function getMusicianCount () {
  return {
    pluckedStrings: BANGLA_ORCHESTRA.pluckedStrings.totalMusicians,
    bowedStrings: BANGLA_ORCHESTRA.bowedStrings.totalMusicians,
    winds: BANGLA_ORCHESTRA.winds.totalMusicians,
    keyboards: BANGLA_ORCHESTRA.keyboards.totalMusicians,
    percussion: BANGLA_ORCHESTRA.percussion.totalMusicians,
    vocals: BANGLA_ORCHESTRA.vocals.totalMusicians,
    total: BANGLA_ORCHESTRA.totalMusicians
  }
}

function generateRoster () {
  return BANGLA_ORCHESTRA.roster.generateFullRoster()
}

function generateSeatingChart () {
  return BANGLA_ORCHESTRA.seatingChart.generateCoordinates()
}

function getMidiChannels () {
  return BANGLA_ORCHESTRA.midiChannels
}

function getPercussionNotes () {
  return BANGLA_ORCHESTRA.percussionNotes
}

function getRagaScale (ragaName) {
  return BANGLA_ORCHESTRA.ensembleHookup.ragaScales[ragaName] || null
}

function getAvailableRagas () {
  return Object.keys(BANGLA_ORCHESTRA.ensembleHookup.ragaScales)
}

function getStudioPreset () {
  return BANGLA_ORCHESTRA.studioPreset
}

function getEnsembleHookup () {
  return BANGLA_ORCHESTRA.ensembleHookup
}

module.exports = {
  BANGLA_ORCHESTRA,
  MIDI_CHANNELS,
  GM2_PROGRAMS,
  PERCUSSION_NOTES,
  getBanglaOrchestra,
  getSection,
  getMusicianCount,
  generateRoster,
  generateSeatingChart,
  getMidiChannels,
  getPercussionNotes,
  getRagaScale,
  getAvailableRagas,
  getStudioPreset,
  getEnsembleHookup
}
