'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  calcCoeffs, processBiquad, applyEqToChannel, applyEqToBuffer,
  computeFrequencyResponse, buildWebAudioParams, loadRigEqBands
} = require('../utils/audio-dsp/rig-eq.js')

// ─── helpers ─────────────────────────────────────────────────────────────────

function sineWave (freq, durationSec, sampleRate, amplitude = 0.8) {
  const N = Math.round(durationSec * sampleRate)
  return Float32Array.from({ length: N }, (_, i) =>
    amplitude * Math.sin(2 * Math.PI * freq * i / sampleRate)
  )
}

function rms (samples) {
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  return Math.sqrt(sum / samples.length)
}

function rmsDb (samples) {
  const r = rms(samples)
  return r > 0 ? 20 * Math.log10(r) : -Infinity
}

// ─── calcCoeffs ───────────────────────────────────────────────────────────────

describe('calcCoeffs', () => {
  it('returns 5 normalised coefficients', () => {
    const c = calcCoeffs('peaking', 1000, 3, 1, 44100)
    assert.ok(c.b0 !== undefined)
    assert.ok(c.b1 !== undefined)
    assert.ok(c.b2 !== undefined)
    assert.ok(c.a1 !== undefined)
    assert.ok(c.a2 !== undefined)
  })

  it('highpass at DC gives coefficients that attenuate DC', () => {
    // At DC (f=0), highpass output should be 0 → b0+b1+b2 = 0
    const c = calcCoeffs('highpass', 1000, 0, 0.707, 44100)
    const dcGain = Math.abs(c.b0 + c.b1 + c.b2)
    assert.ok(dcGain < 0.01, `DC gain should be ~0 for highpass, got ${dcGain}`)
  })

  it('peaking with 0dB gain is unity (b0=1, a1=-2cosW, coeffs symmetric)', () => {
    const c = calcCoeffs('peaking', 1000, 0, 1, 44100)
    // Zero gain peaking → allpass: b0/a0=1 and symmetric
    assert.ok(Math.abs(c.b0 - 1) < 0.001)
  })

  it('all filter types produce valid coefficients', () => {
    const types = ['highpass', 'lowpass', 'peaking', 'lowshelf', 'highshelf', 'notch', 'allpass']
    for (const type of types) {
      const c = calcCoeffs(type, 1000, 6, 1, 44100)
      assert.ok(isFinite(c.b0) && isFinite(c.b1) && isFinite(c.b2), `${type}: non-finite b coeffs`)
      assert.ok(isFinite(c.a1) && isFinite(c.a2), `${type}: non-finite a coeffs`)
    }
  })
})

// ─── processBiquad ────────────────────────────────────────────────────────────

describe('processBiquad', () => {
  it('passes 1kHz through a 1kHz peaking filter at 0dB unchanged', () => {
    const sr = 44100
    const signal = sineWave(1000, 0.5, sr)
    const coeffs = calcCoeffs('peaking', 1000, 0, 1, sr)
    const out = processBiquad(signal, coeffs)
    const inRms = rms(signal)
    const outRms = rms(out)
    assert.ok(Math.abs(inRms - outRms) < 0.001, 'Unity gain peaking should not change level')
  })

  it('highpass at 1kHz attenuates 100Hz signal', () => {
    const sr = 44100
    const low = sineWave(100, 1, sr)
    const coeffs = calcCoeffs('highpass', 1000, 0, 0.707, sr)
    const out = processBiquad(low, coeffs)
    // 100Hz is well below cutoff — should be significantly attenuated
    assert.ok(rmsDb(out) < rmsDb(low) - 20, '100Hz should be >20dB below input with 1kHz HP')
  })

  it('lowpass at 500Hz attenuates 4kHz signal', () => {
    const sr = 44100
    const high = sineWave(4000, 1, sr)
    const coeffs = calcCoeffs('lowpass', 500, 0, 0.707, sr)
    const out = processBiquad(high, coeffs)
    assert.ok(rmsDb(out) < rmsDb(high) - 20, '4kHz should be >20dB below input with 500Hz LP')
  })

  it('peaking +6dB at 1kHz boosts 1kHz signal', () => {
    const sr = 44100
    const signal = sineWave(1000, 1, sr)
    const refDb = rmsDb(signal)
    const coeffs = calcCoeffs('peaking', 1000, 6, 1, sr)
    const out = processBiquad(signal, coeffs)
    const outDb = rmsDb(out)
    assert.ok(outDb > refDb + 3, `1kHz signal should be boosted by ~6dB, got ${outDb - refDb}dB`)
  })

  it('returns Float32Array of same length', () => {
    const signal = sineWave(440, 0.1, 44100)
    const out = processBiquad(signal, calcCoeffs('highpass', 200, 0, 0.707, 44100))
    assert.ok(out instanceof Float32Array)
    assert.equal(out.length, signal.length)
  })
})

// ─── applyEqToChannel ─────────────────────────────────────────────────────────

describe('applyEqToChannel', () => {
  it('empty bands returns unchanged signal', () => {
    const signal = sineWave(440, 0.1, 44100)
    const out = applyEqToChannel(signal, 44100, [])
    assert.ok(Math.abs(rms(out) - rms(signal)) < 0.001)
  })

  it('FW335 80Hz highpass removes sub-bass', () => {
    const sr = 44100
    const subBass = sineWave(40, 0.5, sr)
    const hpBand = [{ type: 'highpass', freq: 80, gainDb: -6, q: 0.7 }]
    const out = applyEqToChannel(subBass, sr, hpBand)
    // 40Hz is one octave below 80Hz cutoff — should be significantly attenuated
    assert.ok(rmsDb(out) < rmsDb(subBass) - 6, '40Hz sub-bass should be attenuated by FW335 HP')
  })

  it('chained bands: boost then cut returns near-original at target freq', () => {
    const sr = 44100
    const signal = sineWave(1000, 0.5, sr)
    const bands = [
      { type: 'peaking', freq: 1000, gainDb: +6, q: 1 },
      { type: 'peaking', freq: 1000, gainDb: -6, q: 1 }
    ]
    const out = applyEqToChannel(signal, sr, bands)
    assert.ok(Math.abs(rmsDb(out) - rmsDb(signal)) < 1, 'Boost + equal cut should cancel')
  })

  it('processes large arrays without stack overflow', () => {
    const signal = sineWave(1000, 10, 44100)  // 10 seconds = 441000 samples
    const bands = [{ type: 'highpass', freq: 80, gainDb: -6, q: 0.7 }]
    const out = applyEqToChannel(signal, 44100, bands)
    assert.equal(out.length, signal.length)
  })
})

// ─── applyEqToBuffer ─────────────────────────────────────────────────────────

describe('applyEqToBuffer', () => {
  it('processes stereo interleaved buffer', () => {
    const sr = 44100
    const frames = sr  // 1 second
    const interleaved = new Float32Array(frames * 2)
    for (let i = 0; i < frames; i++) {
      interleaved[i * 2]     = 0.5 * Math.sin(2 * Math.PI * 1000 * i / sr)  // L
      interleaved[i * 2 + 1] = 0.5 * Math.sin(2 * Math.PI * 440  * i / sr)  // R (different freq)
    }
    const bands = [{ type: 'highpass', freq: 80, gainDb: -6, q: 0.7 }]
    const out = applyEqToBuffer(interleaved, 2, sr, bands)
    assert.equal(out.length, interleaved.length)
    assert.ok(out instanceof Float32Array)
  })

  it('mono buffer processes correctly', () => {
    const sr = 44100
    const mono = sineWave(440, 0.5, sr)
    const bands = [{ type: 'peaking', freq: 440, gainDb: 6, q: 1 }]
    const out = applyEqToBuffer(mono, 1, sr, bands)
    assert.equal(out.length, mono.length)
    // 440Hz boosted by 6dB
    assert.ok(rmsDb(out) > rmsDb(mono) + 3)
  })
})

// ─── computeFrequencyResponse ─────────────────────────────────────────────────

describe('computeFrequencyResponse', () => {
  it('returns array with frequency and gainDb fields', () => {
    const bands = [{ type: 'highpass', freq: 80, gainDb: -6, q: 0.7 }]
    const curve = computeFrequencyResponse(bands, 44100)
    assert.ok(Array.isArray(curve) && curve.length > 0)
    assert.ok(curve[0].frequency !== undefined)
    assert.ok(curve[0].gainDb !== undefined)
  })

  it('highpass at 1kHz shows strong attenuation below cutoff', () => {
    const bands = [{ type: 'highpass', freq: 1000, gainDb: 0, q: 0.707 }]
    const curve = computeFrequencyResponse(bands, 44100, [100, 1000, 10000])
    const at100 = curve.find(p => p.frequency === 100).gainDb
    const at10k = curve.find(p => p.frequency === 10000).gainDb
    assert.ok(at100 < -10, `100Hz should be attenuated, got ${at100}dB`)
    assert.ok(at10k > -3, `10kHz should pass, got ${at10k}dB`)
  })

  it('peaking +6dB at 1kHz shows boost at target frequency', () => {
    const bands = [{ type: 'peaking', freq: 1000, gainDb: 6, q: 1 }]
    const curve = computeFrequencyResponse(bands, 44100, [100, 1000, 10000])
    const at1k = curve.find(p => p.frequency === 1000).gainDb
    assert.ok(at1k > 3, `1kHz should be boosted, got ${at1k}dB`)
  })

  it('full FW335 EQ chain produces valid curve', () => {
    const bands = loadRigEqBands('philips-fw335')
    const curve = computeFrequencyResponse(bands, 44100)
    assert.ok(Array.isArray(curve) && curve.length === 31)
    assert.ok(curve.every(p => isFinite(p.gainDb)))
    // Sub-bass (20Hz) should be attenuated due to 80Hz highpass
    const at20 = curve[0].gainDb
    assert.ok(at20 < -6, `Sub-bass should be cut by HP filter, got ${at20}dB`)
  })
})

// ─── buildWebAudioParams ─────────────────────────────────────────────────────

describe('buildWebAudioParams', () => {
  it('maps band count correctly', () => {
    const bands = loadRigEqBands('philips-fw335')
    const params = buildWebAudioParams(bands, 44100)
    assert.equal(params.length, bands.length)
  })

  it('each param has type, frequency, gain, Q', () => {
    const bands = [{ type: 'highpass', freq: 80, gainDb: -6, q: 0.7 }]
    const params = buildWebAudioParams(bands, 44100)
    assert.equal(params[0].type, 'highpass')
    assert.equal(params[0].frequency, 80)
    assert.equal(params[0].gain, -6)
    assert.equal(params[0].Q, 0.7)
  })

  it('includes index for ordered chaining', () => {
    const bands = loadRigEqBands('philips-fw335')
    const params = buildWebAudioParams(bands)
    assert.equal(params[0].index, 0)
    assert.equal(params[params.length - 1].index, params.length - 1)
  })

  it('all Web Audio API type names are valid BiquadFilterNode types', () => {
    const validTypes = new Set(['lowpass','highpass','bandpass','lowshelf','highshelf','peaking','notch','allpass'])
    const bands = loadRigEqBands('philips-fw335')
    const params = buildWebAudioParams(bands)
    for (const p of params) {
      assert.ok(validTypes.has(p.type), `${p.type} is not a valid BiquadFilterNode type`)
    }
  })
})

// ─── loadRigEqBands ───────────────────────────────────────────────────────────

describe('loadRigEqBands', () => {
  it('loads FW335 bands', () => {
    const bands = loadRigEqBands('philips-fw335')
    assert.ok(Array.isArray(bands) && bands.length > 0)
  })

  it('returns null for unknown rig', () => {
    const bands = loadRigEqBands('unknown-rig-xyz')
    assert.equal(bands, null)
  })

  it('FW335 bands have required fields', () => {
    const bands = loadRigEqBands('philips-fw335')
    for (const b of bands) {
      assert.ok(b.type, `band missing type`)
      assert.ok(b.freq > 0, `band missing freq`)
    }
  })

  it('FW335 includes 80Hz highpass as first band', () => {
    const bands = loadRigEqBands('philips-fw335')
    assert.equal(bands[0].type, 'highpass')
    assert.equal(bands[0].freq, 80)
  })
})
