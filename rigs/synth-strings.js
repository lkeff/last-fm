/**
 * Synth Strings / Pads Module Configuration
 *
 * Comprehensive specification for synthesizer-based string and pad sounds
 * covering hardware vintage synths, modern polyphonic synthesizers, virtual
 * instruments, and modular synthesis approaches for orchestral string emulation
 * and textural pad creation.
 *
 * Coverage:
 *   Hardware Vintage  — Roland, Korg, ARP, Oberheim, Solina, Mellotron
 *   Hardware Modern   — Sequential Prophet, Moog, Dave Smith, Waldorf
 *   Virtual Instruments — Spitfire, Output, Native Instruments, UVI
 *   Modular / Eurorack — Mutable Instruments, Make Noise, Intellijel string modules
 *   Synthesis Methods — Subtractive, FM, Wavetable, Sample-based, Granular, Spectral
 *   Signal Routing    — MIDI mapping, patch parameters, DAW integration
 *
 * @module rigs/synth-strings
 */

'use strict'

const SYNTH_STRINGS_RIG = {
  name: 'Synth Strings & Pads Rig',
  version: '1.0.0',
  type: 'synth-strings',
  totalUnits: 18,
  origin: 'Electronic / Electro-acoustic hybrid production',

  // ─── Stage / studio layout ─────────────────────────────────────────────
  layout: {
    arrangement: 'Keyboard tier (1 player) + rack mount behind + modular tower stage-left',
    primaryPlayer: 1,
    additionalOperators: 1, // patch-switcher / sound designer
    stageDepth: 4,
    stageWidth: 8,
    powerRequirements: {
      totalWatts: 2400,
      circuits: 4,
      conditioning: 'Furman Elite-15 PFi power conditioner per tier',
      isolation: 'Toroid isolation transformer recommended for modular rack'
    }
  },

  // ─── Hardware vintage synths ───────────────────────────────────────────
  vintageHardware: {
    label: 'Vintage Hardware Synthesizers',
    totalUnits: 6,
    position: 'Keyboard tier and rack — primary tonal foundation',

    solinaStringEnsemble: {
      manufacturer: 'ARP / Eminent',
      model: 'Solina String Ensemble (ARP Solina)',
      year: 1974,
      type: 'String machine (analog divide-down + BBD ensemble chorus)',
      polyphony: 'Fully polyphonic (divide-down oscillator per key)',
      keys: 49,
      sections: {
        strings: { voices: ['Violin', 'Viola', 'Cello', 'Bass'], octaveFootages: ['8\'', '16\''] },
        brass: { voices: ['Horn', 'Brass Ensemble'], note: 'Adds tonal variation when layered' }
      },
      ensembleEffect: {
        type: 'Bucket Brigade Device (BBD) chorus — three clock rates create lush, warbly modulation',
        character: 'The definitive 1970s string sound — warm, slightly detuned, chorus-rich',
        famousUse: ['ABBA recordings', 'Jean Michel Jarre', 'Boney M']
      },
      signalChain: {
        output: 'Mono (single output)',
        recommendedProcessing: 'Stereo spread via Eventide H3000 or Roland Dimension D'
      },
      patchParams: {
        attack: 'Fixed slow attack (~200 ms)',
        release: 'Fixed medium release (~300 ms)',
        filterCutoff: 'Fixed — no cutoff control; character comes from voice mix ratios'
      }
    },

    rolandJuno106: {
      manufacturer: 'Roland',
      model: 'Juno-106',
      year: 1984,
      type: 'Analog subtractive (DCO — digitally controlled oscillators)',
      polyphony: '6 voices',
      keys: 61,
      synthesisMethod: 'Subtractive (single DCO per voice, sub-oscillator, noise)',
      stringPatches: {
        famous: ['JUN0-106 Strings (patch 25-2)', 'Soft Pad', 'Slow Strings', 'Warm Strings'],
        technique: 'Low cutoff frequency + slow attack on VCA + chorus on for classic string character',
        chorus: { type: 'Roland Dimension-style stereo chorus (modes I, II, I+II)', character: 'Wide, warm, slightly shimmer' }
      },
      patchParams: {
        dco: { waveform: 'Sawtooth or pulse (for strings: sawtooth)', octave: "8'" },
        vcf: { cutoff: '40–60% open', resonance: 'Minimal (0–10%)', envAmount: 'Slight positive for slow bloom' },
        vca: { attack: '300–800 ms', decay: 'Sustain', sustain: 'Full', release: '500–1500 ms' },
        chorus: 'Mode I or I+II always on for string patches',
        lfo: { rate: '5–6 Hz', depth: 'Subtle on cutoff and/or pitch for vibrato' }
      },
      midiImplementation: { channels: 1, controlChange: ['CC7 Volume', 'CC10 Pan', 'CC1 Mod Wheel → LFO depth'] }
    },

    korgPolysix: {
      manufacturer: 'Korg',
      model: 'Polysix',
      year: 1981,
      type: 'Analog subtractive with onboard ensemble/chorus/phaser',
      polyphony: '6 voices',
      keys: 61,
      builtInEffects: ['Chorus', 'Ensemble', 'Phaser'],
      stringCharacter: 'Slightly thinner than Juno but more aggressive chorus — useful for cutting string layers',
      patchParams: {
        vco: { waveform: 'Sawtooth', octave: "8' + 4' mix" },
        vcf: { cutoff: 'Moderate', resonance: 'Low', arpegHoldChord: true },
        ensemble: 'Enables onboard ensemble effect for string sound'
      }
    },

    oberheimOBXa: {
      manufacturer: 'Oberheim',
      model: 'OB-Xa',
      year: 1980,
      type: 'Analog subtractive — 2 VCO per voice',
      polyphony: '8 voices (4 voice cards × 2)',
      keys: 61,
      synthesisMethod: 'Subtractive with 2 VCOs per voice (can detune for thickness)',
      stringCharacter: 'Thick, creamy, slow-attack pads — different from Juno; more weight in low-mids',
      patchParams: {
        vco1: { waveform: 'Sawtooth', octave: "8'" },
        vco2: { waveform: 'Sawtooth', octave: "8'", detune: '+3 to +7 cents' },
        vcf: { cutoff: 'Low-mid', resonance: 0, attack: 'Medium-slow' },
        vca: { attack: '500 ms', release: '1 s' }
      }
    },

    mellotronM400: {
      manufacturer: 'Mellotron',
      model: 'M400',
      year: 1970,
      type: 'Tape replay keyboard (sample playback via magnetic tape strips)',
      polyphony: '35 simultaneous voices (one tape per key)',
      keys: 35,
      tapeLibrary: {
        strings: {
          eightViolinStrings: 'The iconic Mellotron strings — raw, vintage, with tape wow/flutter',
          cellos: 'Darker, more resonant string sound',
          violins: 'Bright solo violin section sound'
        },
        flutes: '8 flute ensemble',
        choir: 'Aah choir — choral pad texture',
        brass: 'Brass section stabs'
      },
      stringCharacter: 'Distinctive tape artefacts — wow, flutter, tape hiss; immediately recognisable',
      famousUse: ['The Beatles — Strawberry Fields Forever', 'Led Zeppelin — Kashmir', 'King Crimson — In the Court of the Crimson King'],
      patchParams: {
        attack: 'Instant (tape playback — no envelope shaping)',
        sustain: 'As long as key held (max ~8 s per note)',
        release: 'Immediate (tape stops on key release)'
      },
      maintenance: {
        tapeSplicing: 'Tapes degrade; periodic splicing and alignment required',
        headAlignment: 'Critical — misaligned heads cause pitch drift',
        motorService: 'Motor serviced every 5 years; capstan rubber may need replacement'
      }
    },

    arpOdyssey: {
      manufacturer: 'ARP',
      model: 'Odyssey (Mk III)',
      year: 1975,
      type: 'Analog duophonic (2-voice) subtractive',
      polyphony: 2,
      keys: 37,
      use: 'Lead strings, descant lines; not used for full pads due to limited polyphony',
      filterOptions: { arpFilter: '4-pole ladder (12 dB/oct) or 2-pole steiner-parker depending on version' }
    }
  },

  // ─── Modern hardware synths ────────────────────────────────────────────
  modernHardware: {
    label: 'Modern Hardware Synthesizers',
    totalUnits: 4,
    position: 'Keyboard tier and rack — precision and layering',

    sequentialProphet6: {
      manufacturer: 'Sequential',
      model: 'Prophet-6',
      year: 2015,
      type: 'Analog subtractive (modern recreation of Prophet-5 architecture)',
      polyphony: 6,
      keys: 49,
      stringPatches: {
        technique: 'Slightly detuned dual-oscillator patch + slow attack + low resonance filter + digital reverb',
        character: 'Warm, musical analog strings with modern precision and reliability'
      },
      patchParams: {
        osc1: { waveform: 'Sawtooth', octave: "8'" },
        osc2: { waveform: 'Sawtooth', octave: "8'", fineTune: '-5 cents' },
        filter: { type: 'Lowpass', cutoff: 45, resonance: 0, attack: 600, release: 1200, envAmount: 10 },
        amp: { attack: 500, decay: 0, sustain: 127, release: 1500 },
        effects: { reverb: 'Onboard spring/hall; supplement with external Strymon BigSky' }
      },
      midiImplementation: { channels: 1, mpeModeAvailable: false }
    },

    waldorfQuantum: {
      manufacturer: 'Waldorf',
      model: 'Quantum',
      year: 2018,
      type: 'Hybrid (wavetable + granular + virtual analog)',
      polyphony: 8,
      keys: 61,
      synthesisEngines: {
        wavetable: 'Waldorf classic wavetable oscillators (1024 wavetables)',
        granular: 'Granular synthesis from sample — critical for evolving string textures',
        va: 'Virtual analog oscillators with PWM',
        resonator: 'Physical modelling resonator layer'
      },
      stringPatches: {
        granularStrings: 'Load live string sample → granular engine → evolving, cloud-like texture',
        wavetableStrings: 'Use string-attack wavetable → morph through filter for bow-to-sustain simulation',
        layers: 'Up to 3 oscillator types simultaneously layered per voice'
      },
      patchParams: {
        granularEngine: { grainSize: '80–200 ms', density: 8, spread: 60, scanSpeed: 0.2, pitch: 0 },
        filter: { type: 'Ladder or state-variable', cutoff: 50, resonance: 5 },
        amp: { attack: 400, release: 2000 }
      }
    },

    moogMatriarch: {
      manufacturer: 'Moog',
      model: 'Matriarch',
      year: 2019,
      type: 'Analog semi-modular (paraphonic — 4 voice shared filter)',
      polyphony: '4 (paraphonic)',
      keys: 49,
      use: 'Deep pad drones, bass string textures, mono cello-like lines',
      patchParams: {
        oscillators: { count: 4, waveform: 'Sawtooth', note: 'All 4 share same filter path — paraphonic' },
        filter: { type: 'Moog 4-pole ladder 24 dB/oct', cutoff: 35, resonance: 0, attack: 700 },
        delay: { onboard: true, type: 'Stereo analog BBD delay; use for shimmer/reverb-adjacent texture' }
      }
    },

    rolandJupiter8Rack: {
      manufacturer: 'Roland',
      model: 'Jupiter-8 (rack emulation via System-8 with Plug-Out)',
      year: 2017,
      type: 'Digital emulation of Jupiter-8 analog (ACB — Analog Circuit Behavior)',
      polyphony: 8,
      keys: 49,
      note: 'Roland System-8 with Jupiter-8 Plug-Out loaded; provides faithful recreation',
      stringPatches: {
        jpStrings: 'Jupiter-8 factory strings patch — warm, thick, spacious; complement to Juno-106',
        split: 'Can split keyboard for strings (upper) + bass pad (lower) simultaneously'
      }
    }
  },

  // ─── Virtual instruments ───────────────────────────────────────────────
  virtualInstruments: {
    label: 'Virtual / Software Instruments',
    totalPlugins: 6,
    host: 'macOS — Logic Pro X / Pro Tools / Ableton Live 12 Suite',
    note: 'All VIs run on a dedicated Mac Studio M2 Ultra for zero-latency monitoring',

    outputAnalogStrings: {
      developer: 'Output',
      name: 'Analog Strings',
      year: 2020,
      type: 'Sample + synthesis hybrid — vintage analog string machines',
      library: '20 GB — samples from 75+ vintage string machines, harpsichords, pianos',
      engines: {
        source: 'Multi-sampled vintage string machine (tuned, velocity-layered)',
        arc: 'Spectral morphing between source samples',
        air: 'Granular texture engine (adds evolving shimmer)',
        motion: 'Rhythmic modulation / arpeggio / stutter engine'
      },
      highlights: ['Authentic Solina, Eminent, Optigan samples', 'Macro controls for quick texture morphing', 'Built-in effects chain (delay, reverb, filter)'],
      useCases: ['Lush slow-attack pads', 'Retro 70s string layers', 'Modern cinematic hybrid textures']
    },

    spitfireLabsStrings: {
      developer: 'Spitfire Audio',
      name: 'LABS — Soft Piano / Strings (free)',
      type: 'Sample-based (Kontakt-free player)',
      recordingLocation: 'Air Studios, London',
      articulations: ['Long bows (sul tasto)', 'Short detaché', 'Tremolo', 'Harmonics'],
      noteCount: 9,
      useCases: ['Realistic chamber string textures', 'Film-score soft pads', 'Supplement to synth layers']
    },

    niSessionStringsProII: {
      developer: 'Native Instruments',
      name: 'Session Strings Pro 2',
      type: 'Sample-based Kontakt instrument',
      ensemble: '18 players (6 violins I, 4 violins II, 4 violas, 4 cellos)',
      articulations: ['Sustain', 'Spiccato', 'Staccato', 'Pizzicato', 'Tremolo', 'Sul ponticello', 'Col legno', 'Harmonics'],
      adaptiveLegato: 'Intelligent legato transitions based on interval size',
      nkcPatterns: 'Built-in chord voicing and rhythmic patterns',
      useCases: ['Pop/cinematic string writing', 'Quick mockups', 'Demo recordings with high realism']
    },

    korgWavestatePlugin: {
      developer: 'Korg',
      name: 'Wavestate Native',
      type: 'Wave Sequencing 2.0 — probability-driven wavetable sequences',
      synthesis: 'Layered wavetables with randomised step sequencing of samples, pitch, and filters',
      stringApplication: {
        waveSequence: 'Create slowly evolving string texture by sequencing bow-attack + sustain + harmonic samples at variable lengths',
        randomisation: 'Each note trigger slightly randomises sequence start position → organic variation',
        polyphony: 64
      },
      useCases: ['Generative / evolving string textures', 'Glitchy hybrid strings', 'Ambient drone beds']
    },

    uviGranularSynth: {
      developer: 'UVI',
      name: 'Falcon (with Granular module)',
      type: 'Multi-synthesis platform with granular engine',
      granularEngine: {
        grainSize: 'Variable 1–2000 ms',
        density: 'Configurable overlapping grain count (1–200)',
        scanning: 'Auto-scan or manual position control across sample',
        pitch: 'Per-grain pitch randomisation',
        spread: 'Stereo position randomisation per grain'
      },
      stringPatch: 'Load orchestral string sample → granular engine → slow scan + medium grain → creates cloud-like evolving string texture indistinguishable from real ensemble at distance',
      useCases: ['Atmospheric string beds', 'Textural pads', 'Sound design']
    },

    kontaktStringsLibrary: {
      developer: 'Various (Orchestral Tools, EastWest, Cinesamples)',
      name: 'Stacked orchestral string libraries',
      libraries: [
        { name: 'Berlin Strings (Orchestral Tools)', size: '120 GB', character: 'Detailed, articulate, Berlin Philharmonie hall' },
        { name: 'Hollywood Strings (EastWest)', size: '90 GB', character: 'Epic, wide, Hollywood scoring stage' },
        { name: 'CineSamples CineStrings', size: '60 GB', character: 'Intimate, warm, close-mic options' }
      ],
      useCases: ['Full orchestral mockups', 'Film score production', 'Blending with real strings']
    }
  },

  // ─── Eurorack / Modular strings ────────────────────────────────────────
  eurorackModular: {
    label: 'Eurorack Modular — String & Pad Synthesis',
    totalModules: 8,
    rackUnits: '9U × 84HP (three rows)',
    power: 'Make Noise ZOIA (switching) + Tiptop Zeus power',
    position: 'Modular tower, stage-left',

    oscillatorModules: [
      { manufacturer: 'Mutable Instruments', model: 'Plaits', hp: 12, description: 'Multi-algorithm digital oscillator; use "string machine" or "particles" modes for string-adjacent tones' },
      { manufacturer: 'Mutable Instruments', model: 'Rings', hp: 14, description: 'Physical modelling resonator — bowed string, plucked string, and struck bar modes; most string-authentic modular module' },
      { manufacturer: 'Make Noise', model: 'STO (Simple Tracking Oscillator)', hp: 8, description: 'Analog VCO for layering with digital modules; sawtooth for string-like harmonic content' }
    ],

    filterModules: [
      { manufacturer: 'Intellijel', model: 'Morgasmatron', hp: 12, description: 'Dual filter (independent or serial/parallel); LP+LP gives string-like formant shape' },
      { manufacturer: 'Mutable Instruments', model: 'Ripples', hp: 8, description: 'Transparent Sallen-Key filter; clean LP for string textures' }
    ],

    effectsModules: [
      { manufacturer: 'Mutable Instruments', model: 'Clouds', hp: 18, description: 'Granular processor — feed in any oscillator → cloud of time-smeared grains → pad-like string texture', mode: 'Granular or Spectral' },
      { manufacturer: 'Intellijel', model: 'Rainmaker', hp: 26, description: 'Spectral multiband delay — use for shimmer-reverb style string enhancement' },
      { manufacturer: 'Make Noise', model: 'Mimeophon', hp: 14, description: 'Stereo color delay; rate modulation for pitch shimmer on string patches' }
    ],

    signalFlow: {
      step1: 'Rings (bowed string mode) or Plaits (string machine) → oscillator layer',
      step2: 'Run through Morgasmatron (LP filter, slow attack via VCA envelope)',
      step3: 'Patch into Clouds (granular) at ~40% wet → smear attack into pad',
      step4: 'Stereo out → Rainmaker (shimmer) → DAW interface',
      voltageControl: 'V/OCT tracking from MIDI-to-CV (Intellijel Designs MIDI 1U) for keyboard playability'
    }
  },

  // ─── Patch presets / templates ─────────────────────────────────────────
  patchPresets: {
    classicAnalogStrings: {
      description: 'Vintage string machine sound (Solina-inspired)',
      instruments: ['Solina String Ensemble', 'Roland Juno-106'],
      layering: 'Solina for ensemble chorus body; Juno-106 for cutoff movement and pad support',
      processing: ['Eventide H3000 stereo spread', 'Strymon BigSky (hall reverb)', 'SSL compressor at 2:1 gentle glue']
    },

    cinematicHybridStrings: {
      description: 'Modern cinematic strings (real sample + synth blend)',
      instruments: ['NI Session Strings Pro 2', 'Output Analog Strings', 'Sequential Prophet-6'],
      layering: ['NI Session Strings (realistic, close)', 'Analog Strings (character, warmth)', 'Prophet-6 (harmonic support and attack softening)'],
      processing: ['Bricasti M7 (large hall, 2.2 s RT60)', 'Neve 1073 (slight 12 kHz air boost)', 'Bus compressor (ratio 1.5:1, slow attack)']
    },

    mellotronTexture: {
      description: 'Vintage tape string texture (The Beatles / Prog era)',
      instruments: ['Mellotron M400 (8 Violin Strings tape)', 'Waldorf Quantum (granular layer)'],
      layering: 'Mellotron as dry signal source; Quantum granular engine to extend and blend',
      processing: ['No pitch correction on Mellotron — embrace wow/flutter', 'Tape saturation plugin (UAD Ampex ATR-102)', 'Gentle spring reverb']
    },

    ambientGranularBed: {
      description: 'Evolving ambient string cloud for soundscapes',
      instruments: ['Eurorack: Rings + Clouds', 'UVI Falcon Granular'],
      layering: 'Rings → Clouds (max grain scatter) → long shimmer reverb',
      processing: ['Eventide Blackhole reverb (infinite decay)', 'High-pass at 80 Hz', 'Mid-side processing to widen']
    }
  },

  // ─── MIDI & signal routing ─────────────────────────────────────────────
  midiRouting: {
    masterController: { make: 'Studiologic', model: 'SL88 Grand (88-key, hammer action)', midiOut: ['USB MIDI', 'DIN MIDI × 2'] },
    midiInterface: { make: 'MOTU', model: '128', ports: { din: 8, usb: 1 }, note: 'Routes master keyboard to all hardware synths + DAW simultaneously' },
    zones: [
      { zone: 'Lower (C1–B3)', target: 'Mellotron M400 — bass/cello strings' },
      { zone: 'Middle (C4–B5)', target: 'Solina String Ensemble + Juno-106 (layered)' },
      { zone: 'Upper (C6–C8)', target: 'Sequential Prophet-6 — high string shimmer' },
      { zone: 'Full Range (Mod Wheel CC1)', action: 'Cross-fade between Solina (low MW) and Waldorf Quantum granular (high MW)' }
    ],
    daw: {
      software: 'Pro Tools Ultimate / Ableton Live 12 Suite',
      recordingBitDepth: 32,
      sampleRate: 96000,
      latencyTarget: '< 5 ms round-trip',
      stems: ['Vintage Hardware', 'Modern Hardware', 'Virtual Instruments', 'Modular', 'FX Returns']
    }
  },

  // ─── Signal processing chain ───────────────────────────────────────────
  signalProcessing: {
    hardwareInserts: [
      { unit: 'API 2500 (stereo bus compressor)', purpose: 'Glue across layered synth stack; ratio 1.5:1–2:1' },
      { unit: 'Neve 1081 (EQ)', purpose: 'High shelf boost +2 dB at 12 kHz; low shelf cut -2 dB at 100 Hz' },
      { unit: 'Strymon BigSky', purpose: 'Hall/shimmer reverb; used as hardware insert for lowest latency' }
    ],
    pluginChain: [
      { plugin: 'FabFilter Pro-Q3', stage: 'High-pass 80 Hz (Butterworth 12 dB), notch at ~320 Hz (boxy resonance)' },
      { plugin: 'Soundtoys Crystallizer', stage: 'Reverse-delay shimmer on ambient patches only' },
      { plugin: 'iZotope Ozone Imager', stage: 'Stereo width control — narrow for mono-compatibility check' },
      { plugin: 'UAD Lexicon 224', stage: 'Vintage room reverb for vintage patches (Mellotron, Solina)' }
    ]
  },

  // ─── Repertoire / use cases ────────────────────────────────────────────
  useCases: {
    filmScore: {
      genres: ['Thriller', 'Drama', 'Sci-fi', 'Animation'],
      patches: ['Cinematic Hybrid Strings', 'Ambient Granular Bed'],
      tempoRange: '40–140 BPM',
      keyConsiderations: 'Ensure mono-compatibility; check against 5.1 mix'
    },
    popProduction: {
      genres: ['Synth-pop', 'Indie', 'Dream pop', 'R&B'],
      patches: ['Classic Analog Strings', 'Juno-106 slow pad'],
      tempoRange: '90–128 BPM',
      layering: 'Typically sits below vocals; high-pass above 200 Hz to prevent mud'
    },
    electronicDance: {
      genres: ['Progressive house', 'Trance', 'Ambient techno'],
      patches: ['Korg Polysix ensemble', 'Waldorf Quantum granular'],
      sidechain: 'Side-chain compress string pad to kick drum for pumping effect',
      automation: 'Filter cutoff automated through breakdown/build sections'
    },
    neoClassical: {
      genres: ['Neo-classical', 'Minimalism', 'Modern classical'],
      patches: ['Mellotron Texture', 'Eurorack Rings bowed'],
      tempoRange: '40–100 BPM',
      note: 'Avoid over-processing; let imperfections (wow/flutter, tuning drift) breathe'
    },
    livePerformance: {
      setupTime: '45 minutes',
      powerRequirements: '2400 W across dedicated circuits',
      backupPlan: 'Ableton Live with all VI patches loaded as cold backup in case of hardware failure',
      spares: ['Spare MIDI cables', 'Backup Juno-106 reed (not applicable — electronic; backup = software emulation)']
    }
  }
}

// ─── Exported helper functions ─────────────────────────────────────────────

function getSynthStringsRig () {
  return SYNTH_STRINGS_RIG
}

function getSynthStringsSection (section) {
  return SYNTH_STRINGS_RIG[section] || null
}

function getSynthUnitsCount () {
  return {
    vintageHardware: SYNTH_STRINGS_RIG.vintageHardware.totalUnits,
    modernHardware: SYNTH_STRINGS_RIG.modernHardware.totalUnits,
    virtualInstruments: SYNTH_STRINGS_RIG.virtualInstruments.totalPlugins,
    eurorackModules: SYNTH_STRINGS_RIG.eurorackModular.totalModules,
    total: SYNTH_STRINGS_RIG.totalUnits
  }
}

function getSynthInstruments () {
  const vintage = Object.entries(SYNTH_STRINGS_RIG.vintageHardware)
    .filter(([k]) => k !== 'label' && k !== 'totalUnits' && k !== 'position')
    .map(([, v]) => ({ name: v.model || v.name, manufacturer: v.manufacturer, year: v.year, type: v.type, category: 'vintage' }))

  const modern = Object.entries(SYNTH_STRINGS_RIG.modernHardware)
    .filter(([k]) => k !== 'label' && k !== 'totalUnits' && k !== 'position')
    .map(([, v]) => ({ name: v.model || v.name, manufacturer: v.manufacturer, year: v.year, type: v.type, category: 'modern' }))

  const vst = Object.entries(SYNTH_STRINGS_RIG.virtualInstruments)
    .filter(([k]) => !['label', 'totalPlugins', 'host', 'note'].includes(k))
    .map(([, v]) => ({ name: v.name, developer: v.developer, type: v.type, category: 'virtual' }))

  return { vintage, modern, vst }
}

function getSynthPatchPreset (name) {
  return SYNTH_STRINGS_RIG.patchPresets[name] || null
}

function getSynthPatchPresets () {
  return Object.keys(SYNTH_STRINGS_RIG.patchPresets).map(k => ({
    id: k,
    ...SYNTH_STRINGS_RIG.patchPresets[k]
  }))
}

function getSynthMidiZones () {
  return SYNTH_STRINGS_RIG.midiRouting.zones
}

function getSynthUseCases () {
  return SYNTH_STRINGS_RIG.useCases
}

module.exports = {
  SYNTH_STRINGS_RIG,
  getSynthStringsRig,
  getSynthStringsSection,
  getSynthUnitsCount,
  getSynthInstruments,
  getSynthPatchPreset,
  getSynthPatchPresets,
  getSynthMidiZones,
  getSynthUseCases
}
