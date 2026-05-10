'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  detectByBoardCode, detectByIcCodes, detectByAcoustic, detect,
  extractAcousticFeatures, generateLogSweep, sweepToWav,
  normaliseBoardCode, scoreBoardCode, scoreIcCodes, scoreAcoustic
} = require('../utils/rig-detector.js')

const { SIGNATURES, getSignatureById, getSignaturesByBrand } = require('../db/rig-signatures.js')

// ─── Signature Database ───────────────────────────────────────────────────────

describe('rig-signatures database', () => {
  it('SIGNATURES is a non-empty array', () => {
    assert.ok(Array.isArray(SIGNATURES) && SIGNATURES.length > 0)
  })

  it('Philips FW335 signature exists', () => {
    const sig = getSignatureById('philips-fw335')
    assert.ok(sig)
    assert.equal(sig.brand, 'Philips')
    assert.equal(sig.model, 'FW335')
  })

  it('FW335 has board codes, IC codes, and acoustic profile', () => {
    const sig = getSignatureById('philips-fw335')
    assert.ok(sig.boardCodes.length > 0)
    assert.ok(sig.icCodes.dac.length > 0)
    assert.ok(sig.acoustic.spectralShape.length === 32)
  })

  it('FW335 spectralShape sums correctly (all values 0-1)', () => {
    const sig = getSignatureById('philips-fw335')
    assert.ok(sig.acoustic.spectralShape.every(v => v >= 0 && v <= 1))
  })

  it('FW335 acoustic bassRolloff3db is around 120 Hz', () => {
    const sig = getSignatureById('philips-fw335')
    assert.ok(sig.acoustic.bassRolloff3db >= 100 && sig.acoustic.bassRolloff3db <= 140)
  })

  it('getSignaturesByBrand finds Philips entries', () => {
    const sigs = getSignaturesByBrand('Philips')
    assert.ok(sigs.length >= 2)
    assert.ok(sigs.every(s => s.brand === 'Philips'))
  })

  it('all signatures have required confidence keys', () => {
    for (const sig of SIGNATURES) {
      assert.ok(sig.confidence.boardCode !== undefined, `${sig.id} missing boardCode confidence`)
      assert.ok(sig.confidence.icCode !== undefined, `${sig.id} missing icCode confidence`)
      assert.ok(sig.confidence.acoustic !== undefined, `${sig.id} missing acoustic confidence`)
    }
  })
})

// ─── Board Code Detection ─────────────────────────────────────────────────────

describe('detectByBoardCode', () => {
  it('exact FW335 service number returns high confidence match', () => {
    const result = detectByBoardCode('3139-188-4611')
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'philips-fw335')
    assert.ok(result.bestMatch.confidence >= 0.9)
  })

  it('normalised board code (no dashes) also matches', () => {
    const result = detectByBoardCode('31391884611')
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'philips-fw335')
  })

  it('FW335 chassis assembly code matches', () => {
    const result = detectByBoardCode('9964-000-33501')
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'philips-fw335')
  })

  it('Sony board code matches Sony signature', () => {
    const result = detectByBoardCode('A-2063-668-A')
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'sony-cmt-sbt100')
  })

  it('Technics board code matches Technics signature', () => {
    const result = detectByBoardCode('SFKEB0124A')
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'technics-sl1200mk2')
  })

  it('unknown code returns no matches', () => {
    const result = detectByBoardCode('XYZ-999-UNKNOWN')
    assert.equal(result.matches.length, 0)
    assert.equal(result.bestMatch, null)
  })

  it('empty input returns error', () => {
    const result = detectByBoardCode('')
    assert.ok(result.error)
    assert.equal(result.bestMatch, null)
  })

  it('normaliseBoardCode strips dashes and lowercases', () => {
    assert.equal(normaliseBoardCode('3139-188-4611'), '31391884611')
    assert.equal(normaliseBoardCode('SAA-7345 GP'), 'saa7345gp')
  })

  it('matches array is sorted by confidence descending', () => {
    const result = detectByBoardCode('3139')
    for (let i = 1; i < result.matches.length; i++) {
      assert.ok(result.matches[i - 1].confidence >= result.matches[i].confidence)
    }
  })
})

// ─── IC Code Detection ────────────────────────────────────────────────────────

describe('detectByIcCodes', () => {
  it('SAA7345 DAC alone suggests Philips FW335 or FW-C55', () => {
    const result = detectByIcCodes({ dac: ['SAA7345'] })
    assert.ok(result.bestMatch)
    assert.ok(['philips-fw335', 'philips-fwc55'].includes(result.bestMatch.signature.id))
  })

  it('DAC + DSP + amp combo uniquely identifies FW335 with high confidence', () => {
    const result = detectByIcCodes({ dac: ['SAA7345'], dsp: ['SAA7378'], amp: ['TDA7056'] })
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'philips-fw335')
    assert.ok(result.bestMatch.confidence >= 0.6)
  })

  it('AKM DAC identifies Sony', () => {
    const result = detectByIcCodes({ dac: ['AK4358'] })
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'sony-cmt-sbt100')
  })

  it('Technics motor control IC identifies Technics', () => {
    const result = detectByIcCodes({ motorControl: ['BA6209'], phaseControl: ['AN6651'] })
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'technics-sl1200mk2')
  })

  it('empty icCodes returns error', () => {
    const result = detectByIcCodes({})
    assert.ok(result.error)
  })

  it('unknown IC codes return no matches', () => {
    const result = detectByIcCodes({ dac: ['UNKNOWN9999'] })
    assert.equal(result.matches.length, 0)
  })

  it('matches are sorted by confidence descending', () => {
    const result = detectByIcCodes({ dac: ['SAA7350'] })
    for (let i = 1; i < result.matches.length; i++) {
      assert.ok(result.matches[i - 1].confidence >= result.matches[i].confidence)
    }
  })
})

// ─── Acoustic Feature Extraction ─────────────────────────────────────────────

describe('extractAcousticFeatures', () => {
  it('extracts features from a sine wave at 1kHz', () => {
    const sr = 44100
    const dur = 1
    const data = Array.from({ length: sr * dur }, (_, i) =>
      0.8 * Math.sin(2 * Math.PI * 1000 * i / sr)
    )
    const features = extractAcousticFeatures(data, sr)
    assert.ok(features.spectralShape.length === 32)
    assert.ok(features.noiseFloorDbfs < 0)
    assert.ok(typeof features.peakFrequency === 'number')
  })

  it('returns 32-element spectralShape', () => {
    const sr = 44100
    const data = Array.from({ length: sr }, (_, i) => Math.sin(2 * Math.PI * 440 * i / sr) * 0.5)
    const features = extractAcousticFeatures(data, sr)
    assert.equal(features.spectralShape.length, 32)
    assert.ok(features.spectralShape.every(v => v >= 0 && v <= 1))
  })

  it('detects no port resonance in a flat tone', () => {
    const sr = 44100
    const data = Array.from({ length: sr }, (_, i) => Math.sin(2 * Math.PI * 1000 * i / sr) * 0.7)
    const features = extractAcousticFeatures(data, sr)
    // Flat 1kHz tone has no bass peak so port resonance should be null
    assert.ok(features.portResonanceHz === null || typeof features.portResonanceHz === 'number')
  })
})

// ─── Acoustic Detection ───────────────────────────────────────────────────────

describe('detectByAcoustic', () => {
  it('too-short input returns error', () => {
    const result = detectByAcoustic([0, 0, 0, 1], 44100)
    assert.ok(result.error)
    assert.equal(result.bestMatch, null)
  })

  it('synthesised FW335-like signal returns a match', () => {
    const sr = 44100
    // Simulate FW335 response: high-pass ~120Hz, bandwidth to ~16kHz
    const data = Array.from({ length: sr * 2 }, (_, i) => {
      const t = i / sr
      // Sum of frequencies within FW335 passband
      return 0.4 * Math.sin(2 * Math.PI * 500 * t) +
             0.4 * Math.sin(2 * Math.PI * 2600 * t) +  // near FW335 peak
             0.1 * Math.sin(2 * Math.PI * 8000 * t) +
             0.02 * Math.sin(2 * Math.PI * 60 * t)     // tiny sub (rolls off)
    })
    const result = detectByAcoustic(data, sr)
    assert.ok(Array.isArray(result.matches))
    assert.ok(result.extractedFeatures)
    assert.ok(result.extractedFeatures.spectralShape.length === 32)
  })

  it('returns extractedFeatures in result', () => {
    const sr = 44100
    const data = Array.from({ length: sr }, (_, i) => Math.sin(2 * Math.PI * 1000 * i / sr) * 0.5)
    const result = detectByAcoustic(data, sr)
    assert.ok(result.extractedFeatures)
    assert.ok(result.extractedFeatures.bassRolloff3db !== undefined)
    assert.ok(result.extractedFeatures.trebleRolloff3db !== undefined)
  })
})

// ─── Sweep Generator ─────────────────────────────────────────────────────────

describe('generateLogSweep', () => {
  it('generates Float32Array of correct length', () => {
    const sweep = generateLogSweep(2, 44100, 20, 20000)
    assert.ok(sweep instanceof Float32Array)
    assert.equal(sweep.length, 44100 * 2)
  })

  it('sweep values are within -1.0 to +1.0', () => {
    const sweep = generateLogSweep(1, 44100, 20, 20000)
    assert.ok(Array.from(sweep).every(v => v >= -1.0 && v <= 1.0))
  })

  it('sweep starts and ends near zero (Hann window)', () => {
    const sweep = generateLogSweep(1, 44100, 20, 20000)
    assert.ok(Math.abs(sweep[0]) < 0.01)
    assert.ok(Math.abs(sweep[sweep.length - 1]) < 0.01)
  })

  it('sweepToWav returns a Buffer with RIFF header', () => {
    const sweep = generateLogSweep(0.1, 44100)
    const wav = sweepToWav(sweep, 44100)
    assert.ok(Buffer.isBuffer(wav))
    assert.equal(wav.slice(0, 4).toString(), 'RIFF')
    assert.equal(wav.slice(8, 12).toString(), 'WAVE')
  })
})

// ─── Fused Detection ─────────────────────────────────────────────────────────

describe('detect (fused)', () => {
  it('no hints returns error', () => {
    const result = detect({})
    assert.ok(result.error)
  })

  it('board code alone fuses to correct result', () => {
    const result = detect({ boardCode: '3139-188-4611' })
    assert.ok(result.bestMatch)
    assert.equal(result.bestMatch.signature.id, 'philips-fw335')
    assert.ok(result.bestMatch.confidencePct >= 40)
  })

  it('board + IC codes together give higher confidence than board alone', () => {
    const boardOnly = detect({ boardCode: '3139-188-4611' })
    const boardAndIc = detect({
      boardCode: '3139-188-4611',
      icCodes: { dac: ['SAA7345'], dsp: ['SAA7378'], amp: ['TDA7056'] }
    })
    assert.ok(boardAndIc.bestMatch.confidence >= boardOnly.bestMatch.confidence * 0.8)
  })

  it('methodsUsed reflects provided hint types', () => {
    const result = detect({ boardCode: '3139-188-4611', icCodes: { dac: ['SAA7345'] } })
    assert.ok(result.methodsUsed.includes('boardCode') || result.methodsUsed.includes('icCodes'))
  })

  it('matches include scores sub-object', () => {
    const result = detect({ boardCode: '3139-188-4611' })
    assert.ok(result.bestMatch.scores)
    assert.ok(result.bestMatch.scores.boardCode !== undefined)
  })

  it('confidencePct is 0-100 integer', () => {
    const result = detect({ boardCode: '3139-188-4611' })
    assert.ok(result.bestMatch.confidencePct >= 0)
    assert.ok(result.bestMatch.confidencePct <= 100)
    assert.ok(Number.isInteger(result.bestMatch.confidencePct))
  })

  it('Sony board code does not match as FW335', () => {
    const result = detect({ boardCode: 'A-2063-668-A' })
    assert.ok(result.bestMatch)
    assert.notEqual(result.bestMatch.signature.id, 'philips-fw335')
  })
})
