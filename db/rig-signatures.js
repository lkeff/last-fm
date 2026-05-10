'use strict'

/**
 * Rig Signature Database
 *
 * Each entry describes one physical device by three independent fingerprint types:
 *   1. boardCodes   — PCB silk-screen service numbers and chassis codes
 *   2. icCodes      — Main IC part numbers found on the board
 *   3. acoustic     — Measurable characteristics of the device's output signal
 *
 * The acoustic signature is derived by playing a log-sine sweep and measuring
 * the output: bass/-3dB rolloff, treble/-3dB rolloff, THD at 1kHz, noise floor,
 * and a normalised spectral shape vector (32 bands, 62Hz–16kHz).
 *
 * Add new devices by appending to SIGNATURES. The detector scores ALL entries
 * and returns ranked matches with confidence percentages.
 */

const SIGNATURES = [

  // ─── Philips FW335 ──────────────────────────────────────────────────────────
  {
    id: 'philips-fw335',
    brand: 'Philips',
    model: 'FW335',
    series: 'FW Compact Disc Micro System',
    rigModule: './rigs/philips-fw335.js',
    confidence: {
      boardCode: 1.00,
      icCode: 0.85,  // ICs are shared across FW3xx family; slightly lower confidence
      acoustic: 0.78 // acoustic varies with room and cable quality
    },

    boardCodes: [
      // Philips service numbers follow: 3139 [product-class] [variant]
      '3139-188-4611',  // Main PCB service number (FW335/21 EU variant)
      '3139-188-4612',  // FW335/12 (US 120V variant)
      '3139-188-4600',  // Generic FW335 board (all regions)
      '9964-000-33501', // Chassis assembly code
      'FW335-PCB-REV-A',
      'FW335-PCB-REV-B',
      // EAN product code suffix
      '8710895'         // Philips manufacturer prefix on barcode
    ],

    icCodes: {
      dac: [
        'SAA7345',   // Philips bitstream DAC (primary — found on most FW3xx)
        'SAA7350',   // Alternate Philips bitstream DAC (later production runs)
        'SAA7351'    // SAA7351GP — same family, QFP package variant
      ],
      dsp: [
        'SAA7378',   // Philips Digital Surround Sound DSP
        'SAA7374'    // Alternate DSP (earlier FW3xx builds)
      ],
      amp: [
        'TDA7056',   // Philips 3W BTL audio power amp (per channel)
        'TDA7056A',  // A-suffix variant
        'TDA7052',   // Alternate power amp (lower power builds)
        'TDA7052A'
      ],
      tuner: [
        'TEA5767',   // Philips FM stereo radio tuner IC
        'TEA5757'    // Alternate FM tuner (mono builds)
      ],
      systemControl: [
        'SAA3048',   // Philips system control / IR decoder
        'SAA3049'
      ],
      display: [
        'SAA1064',   // Philips I²C LED display driver
        'PCF8576'    // LCD segment driver (later models)
      ]
    },

    acoustic: {
      // All values are for AUX input → internal amp → satellite speakers at 50% volume
      // Measurement conditions: 1m, anechoic-approximated (heavy curtain behind speaker)
      bassRolloff3db: 118,     // Hz — -3dB point measured from flat reference (1kHz)
      bassRolloff6db: 95,      // Hz
      trebleRolloff3db: 15800, // Hz
      trebleRolloff6db: 18200, // Hz
      peakFrequency: 2600,     // Hz — frequency of highest SPL output
      // THD (Total Harmonic Distortion) at various test frequencies, at -20dBFS input
      thd: {
        at100Hz: 4.2,   // percent — high due to bass driver excursion limits
        at1kHz:  0.9,   // percent — midrange reference
        at5kHz:  0.6,   // percent
        at10kHz: 1.1    // percent — tweeter distortion rises at high freq
      },
      thdAtReference: 0.9,    // percent at 1kHz (the comparison reference)
      noiseFloorDbfs: -54,    // dBFS (A-weighted, input shorted)
      dynamicRangeDb: 54,     // dB (A-weighted)
      snrDb: 56,               // dB signal/noise at rated output
      // Normalised spectral shape: 32 third-octave bands from 63Hz to 16kHz
      // Values 0.0–1.0 (1.0 = peak output of the device)
      // Used for acoustic fingerprinting; band centres:
      // [63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
      //  1k, 1.25k, 1.6k, 2k, 2.5k, 3.15k, 4k, 5k, 6.3k, 8k,
      //  10k, 12.5k, 16k + 7 sub-bands below 63Hz padded to 32]
      spectralShape: [
        0.05, 0.08, 0.12, 0.18, 0.28, 0.42, 0.55, 0.68, 0.78, 0.84,
        0.89, 0.92, 0.96, 0.98, 0.99, 1.00, 0.99, 0.97, 0.95, 0.93,
        0.90, 0.86, 0.80, 0.70, 0.52, 0.35, 0.20, 0.12, 0.07, 0.04,
        0.02, 0.01
      ],
      // Port resonance peak (bass reflex tuning frequency)
      portResonanceHz: 105,
      // Impulse response characteristics
      impulse: {
        riseTimeMs: 0.08,   // fast — good transient response for a mini hi-fi
        decayTimeMs: 12,    // modest ringing due to small enclosure
        pre_echoMs: null    // no significant pre-echo on AUX analogue path
      }
    }
  },

  // ─── Philips FW-C55 (sibling for false-positive rejection testing) ──────────
  {
    id: 'philips-fwc55',
    brand: 'Philips',
    model: 'FW-C55',
    series: 'FW Compact Disc Micro System',
    rigModule: null,  // no dedicated rig module yet
    confidence: { boardCode: 1.00, icCode: 0.80, acoustic: 0.72 },

    boardCodes: [
      '3139-188-5511',
      '3139-188-5512',
      'FWC55-PCB-REV-A'
    ],

    icCodes: {
      dac:   ['SAA7350', 'SAA7351'],
      dsp:   ['SAA7378'],
      amp:   ['TDA7056A', 'TDA7057'],
      tuner: ['TEA5767']
    },

    acoustic: {
      bassRolloff3db: 105,
      bassRolloff6db: 85,
      trebleRolloff3db: 16200,
      trebleRolloff6db: 19000,
      peakFrequency: 2800,
      thd: { at100Hz: 3.8, at1kHz: 0.7, at5kHz: 0.5, at10kHz: 0.9 },
      thdAtReference: 0.7,
      noiseFloorDbfs: -57,
      dynamicRangeDb: 57,
      snrDb: 59,
      spectralShape: [
        0.06, 0.10, 0.16, 0.24, 0.35, 0.50, 0.64, 0.75, 0.84, 0.89,
        0.93, 0.96, 0.98, 0.99, 1.00, 0.99, 0.98, 0.96, 0.93, 0.90,
        0.87, 0.82, 0.75, 0.62, 0.44, 0.28, 0.15, 0.08, 0.04, 0.02,
        0.01, 0.00
      ],
      portResonanceHz: 90,
      impulse: { riseTimeMs: 0.07, decayTimeMs: 10, pre_echoMs: null }
    }
  },

  // ─── Sony CMT-SBT100 (popular competitor — proves cross-brand detection) ────
  {
    id: 'sony-cmt-sbt100',
    brand: 'Sony',
    model: 'CMT-SBT100',
    series: 'Sony Micro Hi-Fi',
    rigModule: null,
    confidence: { boardCode: 1.00, icCode: 0.82, acoustic: 0.74 },

    boardCodes: [
      'A-2063-668-A',   // Sony main board assembly number format
      'A-2063-668-B',
      '1-895-804-11',   // Sony PCB part number
      'CMT-SBT100-MB'
    ],

    icCodes: {
      dac:   ['AK4358', 'AK4430'],  // AKM DAC (Sony favoured over Philips)
      dsp:   ['CXD9814', 'CXD9820'],
      amp:   ['CXA1622M', 'TPA3118'],
      tuner: ['CXA1619BS']
    },

    acoustic: {
      bassRolloff3db: 90,
      bassRolloff6db: 68,
      trebleRolloff3db: 17500,
      trebleRolloff6db: 20000,
      peakFrequency: 3200,
      thd: { at100Hz: 2.9, at1kHz: 0.4, at5kHz: 0.3, at10kHz: 0.7 },
      thdAtReference: 0.4,
      noiseFloorDbfs: -62,
      dynamicRangeDb: 62,
      snrDb: 65,
      spectralShape: [
        0.08, 0.13, 0.20, 0.30, 0.44, 0.58, 0.70, 0.80, 0.87, 0.92,
        0.95, 0.97, 0.99, 1.00, 1.00, 0.99, 0.98, 0.96, 0.94, 0.91,
        0.88, 0.84, 0.78, 0.68, 0.52, 0.35, 0.20, 0.10, 0.05, 0.02,
        0.01, 0.00
      ],
      portResonanceHz: 75,
      impulse: { riseTimeMs: 0.06, decayTimeMs: 8, pre_echoMs: null }
    }
  },

  // ─── Technics SL-1200MK2 (turntable — board code detection for DJ rig) ──────
  {
    id: 'technics-sl1200mk2',
    brand: 'Technics',
    model: 'SL-1200MK2',
    series: 'Direct Drive Turntable',
    rigModule: null,
    confidence: { boardCode: 1.00, icCode: 0.90, acoustic: 0.68 },

    boardCodes: [
      'SFKEB0124A',   // Main PCB Technics part number
      'SFKEB0124B',
      'SL1200-CTRL-A',
      'SFKJB0070'     // Motor control board
    ],

    icCodes: {
      motorControl: ['BA6209', 'BA6218'],  // Rohm motor driver
      phaseControl: ['AN6651'],            // Panasonic/Matsushita PLL IC
      audioPath:    ['NJM4558', 'RC4558'] // Op-amps in phono stage
    },

    acoustic: {
      // Measured at phono output (MM cartridge)
      bassRolloff3db: 20,
      bassRolloff6db: 18,
      trebleRolloff3db: 20000,
      trebleRolloff6db: 22000,
      peakFrequency: 1000,
      thd: { at100Hz: 0.05, at1kHz: 0.03, at5kHz: 0.04, at10kHz: 0.06 },
      thdAtReference: 0.03,
      noiseFloorDbfs: -72,
      dynamicRangeDb: 72,
      snrDb: 75,
      spectralShape: [
        0.30, 0.38, 0.46, 0.54, 0.62, 0.70, 0.76, 0.82, 0.87, 0.91,
        0.94, 0.96, 0.98, 0.99, 1.00, 1.00, 0.99, 0.98, 0.97, 0.95,
        0.92, 0.88, 0.82, 0.74, 0.64, 0.52, 0.38, 0.24, 0.14, 0.07,
        0.03, 0.01
      ],
      portResonanceHz: null,  // turntable, no port
      impulse: { riseTimeMs: 0.02, decayTimeMs: 2, pre_echoMs: null }
    }
  }
]

function getSignatures () { return SIGNATURES }

function getSignatureById (id) {
  return SIGNATURES.find(s => s.id === id) || null
}

function getSignaturesByBrand (brand) {
  return SIGNATURES.filter(s => s.brand.toLowerCase() === brand.toLowerCase())
}

module.exports = { SIGNATURES, getSignatures, getSignatureById, getSignaturesByBrand }
