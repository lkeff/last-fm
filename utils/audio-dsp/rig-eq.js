'use strict'

/**
 * Rig EQ — pure-JS biquad filter engine
 *
 * Implements the Audio EQ Cookbook (R. Bristow-Johnson) biquad filter types:
 *   highpass, lowpass, peaking, lowshelf, highshelf, notch, allpass
 *
 * Works identically on macOS, Windows, Linux — any Node.js 18+ or browser.
 * Browser path: use buildWebAudioChain() to wire BiquadFilterNode instances.
 * Server path:  use applyEqToChannel() / applyEqToBuffer() for offline processing.
 *
 * Usage:
 *   const { applyEqToBuffer, buildWebAudioParams } = require('./rig-eq')
 *   const { getPhilipsFw335EqBands } = require('../../rigs/philips-fw335')
 *   const processed = applyEqToBuffer(pcmFloat32, sampleRate, getPhilipsFw335EqBands())
 */

// ─── Biquad Coefficient Calculator ──────────────────────────────────────────
// All formulas from: https://www.w3.org/TR/audio-eq-cookbook/

function clamp (v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

/**
 * Calculate biquad coefficients {b0,b1,b2,a0,a1,a2} for one EQ band.
 * @param {string} type  — 'highpass'|'lowpass'|'peaking'|'lowshelf'|'highshelf'|'notch'|'allpass'
 * @param {number} freq  — centre/corner frequency in Hz
 * @param {number} gainDb — gain in dB (only used for peaking/shelf types)
 * @param {number} q     — Q factor (bandwidth control)
 * @param {number} sampleRate
 */
function calcCoeffs (type, freq, gainDb, q, sampleRate) {
  const f0 = clamp(freq, 1, sampleRate / 2 - 1)
  const Q  = clamp(q || 1, 0.01, 100)
  const dBgain = gainDb || 0

  const w0 = 2 * Math.PI * f0 / sampleRate
  const cosW0 = Math.cos(w0)
  const sinW0 = Math.sin(w0)
  const A  = Math.pow(10, dBgain / 40)          // for peaking/shelf
  const alpha = sinW0 / (2 * Q)

  let b0, b1, b2, a0, a1, a2

  switch (type) {
    case 'lowpass':
      b0 = (1 - cosW0) / 2; b1 = 1 - cosW0; b2 = (1 - cosW0) / 2
      a0 = 1 + alpha;       a1 = -2 * cosW0; a2 = 1 - alpha
      break

    case 'highpass':
      b0 = (1 + cosW0) / 2; b1 = -(1 + cosW0); b2 = (1 + cosW0) / 2
      a0 = 1 + alpha;       a1 = -2 * cosW0;    a2 = 1 - alpha
      break

    case 'peaking': {
      const alphaA = sinW0 / (2 * Q)
      b0 = 1 + alphaA * A;  b1 = -2 * cosW0; b2 = 1 - alphaA * A
      a0 = 1 + alphaA / A;  a1 = -2 * cosW0; a2 = 1 - alphaA / A
      break
    }

    case 'lowshelf': {
      const sqrtA = Math.sqrt(A)
      const alphaS = sinW0 / 2 * Math.sqrt((A + 1 / A) * (1 / Q - 1) + 2)
      b0 =      A * ((A + 1) - (A - 1) * cosW0 + 2 * sqrtA * alphaS)
      b1 = 2  * A * ((A - 1) - (A + 1) * cosW0)
      b2 =      A * ((A + 1) - (A - 1) * cosW0 - 2 * sqrtA * alphaS)
      a0 =          (A + 1) + (A - 1) * cosW0 + 2 * sqrtA * alphaS
      a1 = -2     * ((A - 1) + (A + 1) * cosW0)
      a2 =          (A + 1) + (A - 1) * cosW0 - 2 * sqrtA * alphaS
      break
    }

    case 'highshelf': {
      const sqrtA = Math.sqrt(A)
      const alphaS = sinW0 / 2 * Math.sqrt((A + 1 / A) * (1 / Q - 1) + 2)
      b0 =      A * ((A + 1) + (A - 1) * cosW0 + 2 * sqrtA * alphaS)
      b1 = -2 * A * ((A - 1) + (A + 1) * cosW0)
      b2 =      A * ((A + 1) + (A - 1) * cosW0 - 2 * sqrtA * alphaS)
      a0 =          (A + 1) - (A - 1) * cosW0 + 2 * sqrtA * alphaS
      a1 = 2      * ((A - 1) - (A + 1) * cosW0)
      a2 =          (A + 1) - (A - 1) * cosW0 - 2 * sqrtA * alphaS
      break
    }

    case 'notch':
      b0 = 1;     b1 = -2 * cosW0; b2 = 1
      a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha
      break

    default: // allpass
      b0 = 1 - alpha; b1 = -2 * cosW0; b2 = 1 + alpha
      a0 = 1 + alpha; a1 = -2 * cosW0; a2 = 1 - alpha
  }

  // Normalise by a0
  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 }
}

// ─── Single-Channel Biquad Processor ─────────────────────────────────────────

/**
 * Process one channel of float32 PCM through a single biquad filter (in-place).
 * Uses Direct Form II Transposed for numerical stability.
 */
function processBiquad (samples, coeffs) {
  const { b0, b1, b2, a1, a2 } = coeffs
  let z1 = 0, z2 = 0
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i]
    const y = b0 * x + z1
    z1 = b1 * x - a1 * y + z2
    z2 = b2 * x - a2 * y
    out[i] = y
  }
  return out
}

/**
 * Apply an array of EQ bands to one channel of float32 PCM.
 * Bands are processed in order — the output of each feeds the next.
 *
 * @param {Float32Array|number[]} samples — mono float32 PCM, -1.0 to +1.0
 * @param {number} sampleRate
 * @param {object[]} bands — array of { type, freq, gainDb, q } (matches rig EQ format)
 * @returns {Float32Array} processed samples
 */
function applyEqToChannel (samples, sampleRate, bands) {
  if (!bands || !bands.length) return Float32Array.from(samples)
  let buf = Float32Array.from(samples)
  for (const band of bands) {
    const coeffs = calcCoeffs(band.type, band.freq, band.gainDb, band.q, sampleRate)
    buf = processBiquad(buf, coeffs)
  }
  return buf
}

/**
 * Apply EQ to an interleaved multi-channel buffer.
 * e.g. stereo: [L0,R0,L1,R1,...] channels=2
 *
 * @param {Float32Array|number[]} interleaved
 * @param {number} channels
 * @param {number} sampleRate
 * @param {object[]} bands
 * @returns {Float32Array} processed interleaved buffer
 */
function applyEqToBuffer (interleaved, channels, sampleRate, bands) {
  const numFrames = Math.floor(interleaved.length / channels)
  const result = new Float32Array(interleaved.length)

  for (let ch = 0; ch < channels; ch++) {
    // Deinterleave
    const chData = new Float32Array(numFrames)
    for (let i = 0; i < numFrames; i++) chData[i] = interleaved[i * channels + ch]

    // Apply EQ
    const processed = applyEqToChannel(chData, sampleRate, bands)

    // Reinterleave
    for (let i = 0; i < numFrames; i++) result[i * channels + ch] = processed[i]
  }
  return result
}

// ─── Frequency Response Calculator ───────────────────────────────────────────

/**
 * Compute the combined frequency response of an EQ chain at a set of frequencies.
 * Returns an array of { frequency, gainDb } for plotting.
 *
 * @param {object[]} bands
 * @param {number} sampleRate
 * @param {number[]} frequencies — Hz values to evaluate (default: 31 log-spaced from 20–20000)
 */
function computeFrequencyResponse (bands, sampleRate, frequencies) {
  if (!frequencies) {
    // 31 third-octave points from 20Hz to 20kHz
    frequencies = []
    for (let i = 0; i <= 30; i++) {
      frequencies.push(Math.round(20 * Math.pow(10, i / 10)))
    }
  }

  return frequencies.map(f => {
    let totalGainDb = 0
    for (const band of bands) {
      const c = calcCoeffs(band.type, band.freq, band.gainDb, band.q, sampleRate)
      // Evaluate transfer function H(z) at z = e^(jw), w = 2π*f/sr
      const w = 2 * Math.PI * f / sampleRate
      const cosW = Math.cos(w), sinW = Math.sin(w)
      const cos2W = Math.cos(2 * w), sin2W = Math.sin(2 * w)
      // Numerator: b0 + b1*z^-1 + b2*z^-2
      const numRe = c.b0 + c.b1 * cosW + c.b2 * cos2W
      const numIm =       -c.b1 * sinW - c.b2 * sin2W
      // Denominator: 1 + a1*z^-1 + a2*z^-2
      const denRe = 1   + c.a1 * cosW + c.a2 * cos2W
      const denIm =      -c.a1 * sinW - c.a2 * sin2W
      // |H| = |num| / |den|
      const magNum = Math.sqrt(numRe * numRe + numIm * numIm)
      const magDen = Math.sqrt(denRe * denRe + denIm * denIm)
      const mag = magDen > 0 ? magNum / magDen : 0
      totalGainDb += mag > 0 ? 20 * Math.log10(mag) : -96
    }
    return { frequency: f, gainDb: Math.round(totalGainDb * 100) / 100 }
  })
}

// ─── Web Audio API Parameter Builder ─────────────────────────────────────────

/**
 * Convert rig EQ bands to Web Audio API BiquadFilterNode parameters.
 * Feed the result to buildWebAudioChain() in the browser.
 *
 * @param {object[]} bands — rig EQ bands
 * @param {number} sampleRate — target sample rate (default 44100)
 * @returns {object[]} Web Audio API compatible filter descriptors
 */
function buildWebAudioParams (bands, sampleRate = 44100) {
  // Map internal type names to W3C BiquadFilterNode types
  const typeMap = {
    highpass:  'highpass',
    lowpass:   'lowpass',
    peaking:   'peaking',
    lowshelf:  'lowshelf',
    highshelf: 'highshelf',
    notch:     'notch',
    allpass:   'allpass'
  }
  return bands.map((band, index) => ({
    index,
    type:      typeMap[band.type] || 'peaking',
    frequency: band.freq,
    gain:      band.gainDb || 0,
    Q:         band.q || 1,
    // Human-readable reason from the rig profile (if present)
    reason:    band.reason || null
  }))
}

/**
 * Browser-side factory: build and connect a BiquadFilterNode chain.
 * Call this in a browser context where AudioContext is available.
 *
 * Usage (browser):
 *   const params = await fetch('/api/detect/rig-eq/philips-fw335').then(r => r.json())
 *   const chain = buildWebAudioChain(audioContext, params.webAudioParams)
 *   sourceNode.connect(chain.input)
 *   chain.output.connect(audioContext.destination)
 *
 * @param {AudioContext} ctx — Web Audio API context
 * @param {object[]} params — output of buildWebAudioParams()
 * @returns {{ input, output, nodes }} — input/output nodes for connection
 */
function buildWebAudioChain (ctx, params) {
  if (typeof AudioContext === 'undefined' && typeof ctx === 'undefined') {
    throw new Error('buildWebAudioChain must be called in a browser context with AudioContext')
  }
  const nodes = params.map(p => {
    const node = ctx.createBiquadFilter()
    node.type      = p.type
    node.frequency.value = p.frequency
    node.gain.value = p.gain
    node.Q.value    = p.Q
    return node
  })
  // Chain: input → filter[0] → filter[1] → ... → output
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])
  return {
    input:  nodes[0],
    output: nodes[nodes.length - 1],
    nodes
  }
}

// ─── Rig Profile EQ Helpers ───────────────────────────────────────────────────

/**
 * Load EQ bands from a rig module by ID.
 * Returns null if the rig has no EQ profile.
 */
function loadRigEqBands (rigId) {
  const rigEqMap = {
    'philips-fw335': () => require('../../rigs/philips-fw335.js').getPhilipsFw335EqBands()
  }
  const loader = rigEqMap[rigId]
  return loader ? loader() : null
}

module.exports = {
  calcCoeffs,
  processBiquad,
  applyEqToChannel,
  applyEqToBuffer,
  computeFrequencyResponse,
  buildWebAudioParams,
  buildWebAudioChain,
  loadRigEqBands
}
