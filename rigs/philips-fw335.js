'use strict'

/**
 * Philips FW335 Mini Hi-Fi System — Output Profile
 *
 * The FW335 is a 2.0 stereo micro system with Philips' "Digital Surround Sound"
 * DSP virtualiser. True output is stereo L/R through two satellite speakers;
 * the surround effect is achieved via head-related transfer function (HRTF)
 * cross-feed and comb-filter phase manipulation in the onboard DSP.
 *
 * Specs sourced from Philips FW335 service manual and FW-series datasheet.
 * Fields marked [inferred] are extrapolated from the FW3xx series family spec.
 */

const PHILIPS_FW335 = {
  type: 'philips-fw335',
  brand: 'Philips',
  model: 'FW335',
  series: 'FW (Compact Disc Micro System)',
  productionEra: 'late 1990s – early 2000s',

  // ─── Power & Amplifier ────────────────────────────────────────────────────
  amplifier: {
    topology: 'Class AB integrated stereo amplifier',
    totalPowerRms: {
      value: 60,
      unit: 'W',
      measurement: 'PMPO (Philips Marketing Peak Music Power Output)',
      rmsEquivalent: {
        perChannel: 2,   // 2 × 2W RMS @ 10% THD into 4Ω — typical FW3xx [inferred]
        unit: 'W',
        note: 'PMPO figures on FW-series are heavily inflated; real RMS is ~2W/ch'
      }
    },
    thd: '<10% at rated power',
    snr: '>55 dB (A-weighted) [inferred]',
    impedance: '4 Ω nominal (satellite speakers)',
    channels: 2,
    damping: 'Moderate — mini hi-fi class, no separate woofer'
  },

  // ─── Speakers ─────────────────────────────────────────────────────────────
  speakers: {
    configuration: '2.0 stereo (two satellite bookshelf enclosures)',
    satellites: {
      count: 2,
      type: 'Two-way bass-reflex bookshelf',
      drivers: {
        woofer: { size: '3 inch (76mm)', material: 'Paper cone' },
        tweeter: { size: '0.5 inch (13mm)', material: 'Mylar dome' }
      },
      enclosure: 'Ported bass-reflex',
      sensitivity: '84 dBSPL / 1W / 1m [inferred]',
      impedance: '4 Ω',
      frequencyResponse: {
        low: 120,    // Hz — realistic -3dB point for this driver size
        high: 20000, // Hz
        unit: 'Hz',
        note: 'Usable bass starts rolling off around 120-150 Hz due to small driver'
      }
    },
    subwoofer: null  // FW335 is 2.0 only; no sub
  },

  // ─── Digital Surround Sound DSP ───────────────────────────────────────────
  digitalSurroundDsp: {
    patentName: 'Philips Digital Surround Sound',
    mechanism: 'Stereo virtualisation via HRTF cross-talk cancellation and comb filtering',
    trueSurroundChannels: 0,
    virtualChannels: {
      frontLeft:   true,
      frontRight:  true,
      center:      'virtualised (phantom centre between L+R)',
      surround:    'virtualised (phase-shifted comb filter, 15-35ms delay)',
      lfe:         'virtualised (bass boost DSP, not dedicated sub)'
    },
    dspModes: {
      stereo:        { id: 0, description: 'Flat stereo passthrough — bypass all DSP' },
      digitalSurround: { id: 1, description: 'Full Philips DSP virtualiser active' },
      concertHall:   { id: 2, description: 'Longer reverb tail simulating large hall (~1.2s)' },
      church:        { id: 3, description: 'Dense diffuse reverb (~2.4s), heavy bass rolloff' },
      jazz:          { id: 4, description: 'Short ambience, midrange presence boost' },
      rock:          { id: 5, description: 'Compressed, bass +3dB, upper-mid +2dB' },
      pop:           { id: 6, description: 'Flat mid, slight high-frequency sparkle' }
    },
    recommendedModeForSampler: 'stereo',
    note: 'Run sampler output in STEREO mode — DSP virtualiser smears transients and adds pre-ringing that damages percussion attack and pitch accuracy of world instruments'
  },

  // ─── Inputs ───────────────────────────────────────────────────────────────
  inputs: {
    cdInternal: {
      type: 'Internal CD mechanism (1× CD-ROM laser)',
      formats: ['CD-DA', 'CD-R', 'CD-RW'],
      connection: 'Internal ribbon to DAC'
    },
    auxAnalogue: {
      type: '3.5mm stereo jack (AUX IN)',
      impedance: '10 kΩ input impedance [inferred]',
      maxInputLevel: '0.5 V RMS line-level [inferred]',
      connection: 'Front panel 3.5mm',
      note: 'Use this for computer / sampler output — best path for playback control'
    },
    tape: {
      type: 'Cassette deck (internal)',
      note: 'Internal only; not useful as external input'
    },
    fm: { type: 'FM/AM tuner (internal)' }
  },

  // ─── Optimal Sampler Connection ───────────────────────────────────────────
  samplerInterface: {
    recommendedConnection: 'AUX IN 3.5mm jack (front panel)',
    signalPath: 'Sampler DAC → 3.5mm TRS cable → FW335 AUX IN → FW335 Class AB amp → satellites',
    cableType: '3.5mm TRS (stereo mini jack) — male to male',
    targetOutputLevel: {
      value: 0.5,
      unit: 'V RMS',
      dbv: -6,
      note: 'Keep sampler master output at -6 dBFS or below to avoid clipping the FW335 input stage'
    },
    dspMode: 'stereo',  // bypass virtualiser for accurate monitoring
    alternatives: {
      bluetooth: 'Not available on FW335',
      optical: 'Not available on FW335',
      usb: 'Not available on FW335'
    }
  },

  // ─── DAC & Digital Path ───────────────────────────────────────────────────
  dac: {
    internalCdDac: {
      chipFamily: 'Philips SAA7345 / SAA7350 family (CD bitstream DAC) [inferred]',
      bitDepth: 16,
      sampleRate: 44100,
      architecture: 'Bitstream (sigma-delta) — Philips proprietary 1-bit DAC',
      note: 'Applies only to CD input; AUX input bypasses DAC entirely (analogue path)'
    },
    auxPath: 'Fully analogue — no ADC/DAC conversion on AUX input'
  },

  // ─── Frequency Response & EQ for World Instruments ───────────────────────
  eq: {
    physicalLimitations: {
      bassRolloff: {
        frequency: 120,
        unit: 'Hz',
        slopeDbPerOctave: 12,
        note: 'Small 3" driver + port; below 120Hz output falls rapidly'
      },
      trebleShelving: {
        frequency: 12000,
        note: 'Dome tweeter starts rolling off gently above 12kHz'
      }
    },
    recommendedPreEq: {
      description: 'Apply before sending to FW335 to compensate for speaker limitations',
      bands: [
        { freq: 80,    gainDb: -6,  q: 0.7,  type: 'highpass',  reason: 'Remove sub-bass the speakers cannot reproduce; prevents port distortion' },
        { freq: 150,   gainDb: +2,  q: 1.2,  type: 'peak',      reason: 'Gentle lift to compensate for early bass rolloff' },
        { freq: 800,   gainDb: -1,  q: 1.5,  type: 'peak',      reason: 'Tame boxy lower-midrange resonance common to small ported enclosures' },
        { freq: 3500,  gainDb: +1,  q: 2.0,  type: 'peak',      reason: 'Presence boost for sitar meend clarity and tabla bol attack' },
        { freq: 8000,  gainDb: +1.5,q: 1.5,  type: 'peak',      reason: 'Air boost — compensate for soft dome tweeter rolloff' },
        { freq: 15000, gainDb: -2,  q: 0.8,  type: 'lowshelf',  reason: 'Tame any harsh upper treble from mylar tweeter' }
      ],
      note: 'These are starting points; adjust by ear. Gamelan metallophones sit 500Hz–8kHz and benefit most from the 3.5kHz lift.'
    },
    instrumentSpecificNotes: {
      gamelan: 'Gong Ageng fundamentals (50-80Hz) are inaudible on FW335 — boost 150-300Hz harmonics to suggest the low-end weight',
      didgeridoo: 'Sub-50Hz drone is completely lost; the 100-200Hz formant is what the FW335 reproduces — ensure it is not cut',
      tabla: 'Dayan pitch and bol attack sits 300Hz-3kHz — well within FW335 range; bayan bass (60-100Hz) will be thin',
      sitar: 'Sympathetic string shimmer (2-8kHz) and meend clarity benefit from the 3.5kHz and 8kHz lifts',
      lyre: 'Midrange-forward instrument — FW335 handles this well; kithara upper partials at 4-6kHz may need slight boost',
      bagpipes: 'Chanter sits 480-960Hz (GHB); drones 120-480Hz — all within FW335 range; no special compensation needed',
      balkanOrchestra: 'Tapan lower drum fundamentals below 80Hz will be lost; nudge 150-200Hz up for body'
    }
  },

  // ─── Volume & Dynamics ────────────────────────────────────────────────────
  operatingLevels: {
    listeningDistance: {
      recommended: '1.0–2.5 m',
      unit: 'm',
      note: 'FW335 satellites are designed for near-field / small room use'
    },
    maxSpl: '~88 dBSPL at 1m (estimated at rated power into 4Ω) [inferred]',
    headroom: {
      note: 'Leave 6dB headroom on the sampler master bus to avoid driving the FW335 input into saturation',
      masterBusTarget: '-6 dBFS',
      dynamicRange: 'Limit peaks; the small amp clips quickly at high volume'
    }
  },

  // ─── Room Placement Recommendations ──────────────────────────────────────
  placement: {
    speakerSpacing: '0.8–1.2 m between left and right satellite',
    toeing: '10–15° toe-in toward listening position',
    surfaceGap: 'Place at least 15cm from back wall — rear port needs breathing room',
    heightFromFloor: '0.9–1.2 m (ear height when seated)',
    avoidCorners: true,
    note: 'FW335 satellites are not stand-alone reference monitors — treat them as a consumer playback check, not a mix reference'
  },

  // ─── Playback Chain for Sampler Integration ───────────────────────────────
  playbackChain: {
    steps: [
      { step: 1, action: 'Set sampler master output to -6 dBFS peak limit' },
      { step: 2, action: 'Apply recommendedPreEq bands (80Hz HP, 150Hz +2, 800Hz -1, 3.5kHz +1, 8kHz +1.5, 15kHz shelf -2)' },
      { step: 3, action: 'Output at 44.1 kHz / 16-bit (CD standard — matches FW335 internal DAC era)' },
      { step: 4, action: 'Connect via 3.5mm TRS male-to-male cable: sampler headphone out → FW335 AUX IN' },
      { step: 5, action: 'On FW335: press SOURCE → select AUX; press SURROUND → select STEREO (bypass DSP)' },
      { step: 6, action: 'Set FW335 volume to ~40–60% to avoid overdriving the Class AB amp' },
      { step: 7, action: 'Play a reference track first (e.g. sarangi or clapsticks) and verify no distortion' }
    ],
    outputFormat: {
      sampleRate: 44100,
      bitDepth: 16,
      channels: 2,
      format: 'PCM stereo'
    }
  }
}

function getPhilipsFw335Rig () { return PHILIPS_FW335 }

function getPhilipsFw335EqBands () { return PHILIPS_FW335.eq.recommendedPreEq.bands }

function getPhilipsFw335PlaybackChain () { return PHILIPS_FW335.playbackChain }

function getPhilipsFw335InstrumentNote (instrument) {
  return PHILIPS_FW335.eq.instrumentSpecificNotes[instrument] || null
}

function getPhilipsFw335DspModes () { return PHILIPS_FW335.digitalSurroundDsp.dspModes }

function getPhilipsFw335OutputFormat () { return PHILIPS_FW335.playbackChain.outputFormat }

module.exports = {
  PHILIPS_FW335,
  getPhilipsFw335Rig,
  getPhilipsFw335EqBands,
  getPhilipsFw335PlaybackChain,
  getPhilipsFw335InstrumentNote,
  getPhilipsFw335DspModes,
  getPhilipsFw335OutputFormat
}
