'use strict'

/**
 * Rig Detector — Three-path circuit/acoustic device fingerprinting
 *
 * Detection methods:
 *   1. detectByBoardCode(code)        — match PCB silk-screen service number
 *   2. detectByIcCodes(icMap)         — match IC part numbers from the board
 *   3. detectByAcoustic(pcmData, sr)  — match by measured frequency response
 *                                       and THD profile via FFT analysis of a
 *                                       recorded log-sine sweep response
 *   4. detect(hints)                  — combine all available evidence and
 *                                       return a fused confidence-ranked result
 *
 * All methods return: { matches: [{signature, confidence, method, detail}], bestMatch }
 */

const { SIGNATURES } = require('../db/rig-signatures.js')

// ─── Scoring weights (must sum to 1.0) ───────────────────────────────────────
const ACOUSTIC_WEIGHTS = {
  bassRolloff:    0.22,
  trebleRolloff:  0.18,
  thdReference:   0.22,
  noiseFloor:     0.12,
  spectralShape:  0.20,
  portResonance:  0.06
}

// ─── 1. Board Code Detection ──────────────────────────────────────────────────

/**
 * Normalise a board code for comparison:
 * strip dashes, spaces, lowercase, collapse runs.
 */
function normaliseBoardCode (code) {
  return String(code).toLowerCase().replace(/[\s\-_.]/g, '').trim()
}

/**
 * Score one signature against the provided board code string.
 * Returns 0.0–1.0.
 * - Exact match (normalised): 1.0
 * - Prefix or suffix match:  0.75
 * - Substring match:         0.50
 * - No match:                0.0
 */
function scoreBoardCode (sig, inputCode) {
  const needle = normaliseBoardCode(inputCode)
  for (const bc of sig.boardCodes) {
    const hay = normaliseBoardCode(bc)
    if (hay === needle) return 1.0
    if (hay.startsWith(needle) || needle.startsWith(hay)) return 0.75
    if (hay.includes(needle) || needle.includes(hay)) return 0.50
  }
  return 0.0
}

function detectByBoardCode (code) {
  if (!code || typeof code !== 'string') {
    return { matches: [], bestMatch: null, error: 'code must be a non-empty string' }
  }
  const matches = SIGNATURES
    .map(sig => {
      const raw = scoreBoardCode(sig, code)
      const confidence = Math.round(raw * sig.confidence.boardCode * 100) / 100
      return { signature: sig, confidence, method: 'boardCode', detail: { raw, inputCode: code } }
    })
    .filter(m => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)

  return { matches, bestMatch: matches[0] || null }
}

// ─── 2. IC Code Detection ─────────────────────────────────────────────────────

/**
 * Score one signature against a map of IC codes provided by the user.
 * icMap: { dac: ['SAA7345'], amp: ['TDA7056'], ... }
 *
 * For each IC family provided, count how many codes match the signature.
 * Score = (matching codes) / (total codes provided) — weighted by family importance.
 */
const IC_FAMILY_WEIGHT = {
  dac:           0.30,
  dsp:           0.25,
  amp:           0.20,
  tuner:         0.10,
  systemControl: 0.08,
  display:       0.04,
  motorControl:  0.03
}

function normIc (code) { return String(code).toUpperCase().replace(/\s/g, '') }

function scoreIcCodes (sig, icMap) {
  let totalWeight = 0
  let weightedScore = 0

  for (const [family, providedCodes] of Object.entries(icMap)) {
    if (!providedCodes || !providedCodes.length) continue
    const sigFamily = sig.icCodes[family]
    if (!sigFamily) continue
    const weight = IC_FAMILY_WEIGHT[family] || 0.05
    totalWeight += weight

    const sigNorm = sigFamily.map(normIc)
    const matchCount = providedCodes.filter(c => sigNorm.includes(normIc(c))).length
    weightedScore += weight * (matchCount / providedCodes.length)
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0
}

function detectByIcCodes (icMap) {
  if (!icMap || typeof icMap !== 'object') {
    return { matches: [], bestMatch: null, error: 'icMap must be an object keyed by IC family' }
  }
  const totalProvided = Object.values(icMap).flat().length
  if (totalProvided === 0) {
    return { matches: [], bestMatch: null, error: 'provide at least one IC part number' }
  }

  const matches = SIGNATURES
    .map(sig => {
      const raw = scoreIcCodes(sig, icMap)
      const confidence = Math.round(raw * sig.confidence.icCode * 100) / 100
      return { signature: sig, confidence, method: 'icCode', detail: { raw, totalProvided } }
    })
    .filter(m => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)

  return { matches, bestMatch: matches[0] || null }
}

// ─── 3. Acoustic Fingerprint Detection ───────────────────────────────────────

/**
 * Compute power spectral density from PCM float32 data using Cooley-Tukey FFT.
 * Returns array of { frequency, magnitude } for each FFT bin.
 *
 * Uses fft-js (already in package.json).
 */
function computeFFT (pcmData, sampleRate) {
  const fft = require('fft-js').fft
  const fftUtil = require('fft-js').util

  // FFT size: next power of 2 up to 16384
  let size = 1
  while (size < Math.min(pcmData.length, 16384)) size <<= 1

  // Window (Hann) to reduce spectral leakage
  const windowed = new Array(size)
  for (let i = 0; i < size; i++) {
    const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)))
    windowed[i] = (pcmData[i] || 0) * w
  }

  const phasors = fft(windowed)
  const magnitudes = fftUtil.fftMag(phasors)
  const binWidth = sampleRate / size

  return magnitudes.slice(0, size / 2).map((mag, i) => ({
    frequency: i * binWidth,
    magnitude: mag
  }))
}

/**
 * Extract acoustic features from a recorded sweep response.
 *
 * @param {number[]|Float32Array} pcmData - mono PCM float32, -1.0 to +1.0
 * @param {number} sampleRate - e.g. 44100
 * @returns {object} feature object matching signature.acoustic structure
 */
function extractAcousticFeatures (pcmData, sampleRate) {
  const bins = computeFFT(pcmData, sampleRate)

  // Peak magnitude for normalisation
  let peakMag = 0
  let peakFreq = 0
  for (const b of bins) {
    if (b.frequency >= 200 && b.frequency <= 8000 && b.magnitude > peakMag) {
      peakMag = b.magnitude
      peakFreq = b.frequency
    }
  }
  if (peakMag === 0) peakMag = 1

  // Reference magnitude at 1kHz (for THD and rolloff calculations)
  const ref1k = bins.find(b => Math.abs(b.frequency - 1000) < 50)
  const ref1kMag = ref1k ? ref1k.magnitude : peakMag
  const minus3db = ref1kMag / Math.SQRT2   // -3 dB = mag / √2
  const minus6db = ref1kMag / 2            // -6 dB = mag / 2

  // Bass rolloff — scan downward from 1kHz
  let bassRolloff3db = 20
  let bassRolloff6db = 20
  const below1k = bins.filter(b => b.frequency > 20 && b.frequency < 1000)
    .sort((a, b) => b.frequency - a.frequency)
  for (const b of below1k) {
    if (b.magnitude < minus3db && bassRolloff3db === 20) bassRolloff3db = b.frequency
    if (b.magnitude < minus6db && bassRolloff6db === 20) bassRolloff6db = b.frequency
    if (bassRolloff6db !== 20) break
  }

  // Treble rolloff — scan upward from 1kHz
  let trebleRolloff3db = sampleRate / 2
  let trebleRolloff6db = sampleRate / 2
  const above1k = bins.filter(b => b.frequency > 1000 && b.frequency < sampleRate / 2)
    .sort((a, b) => a.frequency - b.frequency)
  for (const b of above1k) {
    if (b.magnitude < minus3db && trebleRolloff3db === sampleRate / 2) trebleRolloff3db = b.frequency
    if (b.magnitude < minus6db && trebleRolloff6db === sampleRate / 2) trebleRolloff6db = b.frequency
    if (trebleRolloff6db !== sampleRate / 2) break
  }

  // Noise floor — average of bins above 18kHz (or top 5% of spectrum)
  const noiseFloorBins = bins.filter(b => b.frequency > sampleRate * 0.45)
  const noiseAvg = noiseFloorBins.length
    ? noiseFloorBins.reduce((s, b) => s + b.magnitude, 0) / noiseFloorBins.length
    : 1e-10
  const noiseFloorDbfs = noiseAvg > 0 ? Math.round(20 * Math.log10(noiseAvg / 1.0) * 10) / 10 : -96

  // THD at 1kHz — ratio of harmonics (2nd, 3rd, 4th) to fundamental
  const fundamentalMag = ref1kMag
  const h2 = bins.find(b => Math.abs(b.frequency - 2000) < 60)
  const h3 = bins.find(b => Math.abs(b.frequency - 3000) < 60)
  const h4 = bins.find(b => Math.abs(b.frequency - 4000) < 60)
  const harmonicSum = Math.sqrt(
    Math.pow(h2 ? h2.magnitude : 0, 2) +
    Math.pow(h3 ? h3.magnitude : 0, 2) +
    Math.pow(h4 ? h4.magnitude : 0, 2)
  )
  const thdAtReference = fundamentalMag > 0
    ? Math.round((harmonicSum / fundamentalMag) * 100 * 10) / 10
    : 0

  // Port resonance — local peak in 60-150Hz range above neighbours
  const portBins = bins.filter(b => b.frequency >= 60 && b.frequency <= 160)
  let portResonanceHz = null
  let portMax = 0
  for (const b of portBins) {
    if (b.magnitude > portMax) { portMax = b.magnitude; portResonanceHz = b.frequency }
  }
  // Only report port resonance if it sticks out meaningfully
  if (portMax < ref1kMag * 0.08) portResonanceHz = null

  // Normalised spectral shape (32 bands)
  const bandCentres = [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
    800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
    10000, 12500, 16000, 20000, 22050
  ]
  const spectralShape = bandCentres.map(centre => {
    const margin = centre * 0.15
    const nearby = bins.filter(b => Math.abs(b.frequency - centre) < margin)
    if (!nearby.length) return 0
    const avg = nearby.reduce((s, b) => s + b.magnitude, 0) / nearby.length
    return Math.min(1, avg / peakMag)
  })

  return {
    bassRolloff3db: Math.round(bassRolloff3db),
    bassRolloff6db: Math.round(bassRolloff6db),
    trebleRolloff3db: Math.round(trebleRolloff3db),
    trebleRolloff6db: Math.round(trebleRolloff6db),
    peakFrequency: Math.round(peakFreq),
    thdAtReference,
    noiseFloorDbfs,
    portResonanceHz: portResonanceHz ? Math.round(portResonanceHz) : null,
    spectralShape
  }
}

/**
 * Score one signature against extracted acoustic features.
 * Returns 0.0–1.0.
 */
function scoreAcoustic (sig, features) {
  const ref = sig.acoustic
  let score = 0

  // Bass rolloff (-3dB): tolerance ±20Hz logarithmically scaled
  const bassErr = Math.abs(ref.bassRolloff3db - features.bassRolloff3db) / Math.max(ref.bassRolloff3db, 1)
  score += ACOUSTIC_WEIGHTS.bassRolloff * Math.max(0, 1 - bassErr * 3)

  // Treble rolloff (-3dB): tolerance ±1kHz
  const trebleErr = Math.abs(ref.trebleRolloff3db - features.trebleRolloff3db) / Math.max(ref.trebleRolloff3db, 1)
  score += ACOUSTIC_WEIGHTS.trebleRolloff * Math.max(0, 1 - trebleErr * 5)

  // THD at reference: tolerance ±1%
  const thdErr = Math.abs(ref.thdAtReference - features.thdAtReference) / Math.max(ref.thdAtReference, 0.1)
  score += ACOUSTIC_WEIGHTS.thdReference * Math.max(0, 1 - thdErr * 2)

  // Noise floor: tolerance ±6 dB
  const nfErr = Math.abs(ref.noiseFloorDbfs - features.noiseFloorDbfs) / 6
  score += ACOUSTIC_WEIGHTS.noiseFloor * Math.max(0, 1 - nfErr)

  // Spectral shape: cosine similarity between 32-band vectors
  if (ref.spectralShape && features.spectralShape) {
    const a = ref.spectralShape
    const b = features.spectralShape
    const len = Math.min(a.length, b.length)
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < len; i++) {
      dot  += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }
    const cosine = (magA > 0 && magB > 0) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0
    score += ACOUSTIC_WEIGHTS.spectralShape * cosine
  }

  // Port resonance: bonus if both present and within ±15Hz, penalty if mismatch
  if (ref.portResonanceHz && features.portResonanceHz) {
    const portErr = Math.abs(ref.portResonanceHz - features.portResonanceHz) / ref.portResonanceHz
    score += ACOUSTIC_WEIGHTS.portResonance * Math.max(0, 1 - portErr * 4)
  } else if (!ref.portResonanceHz && !features.portResonanceHz) {
    score += ACOUSTIC_WEIGHTS.portResonance  // both correctly have no port peak
  }

  return Math.min(1, score)
}

function detectByAcoustic (pcmData, sampleRate = 44100) {
  if (!pcmData || pcmData.length < sampleRate * 0.1) {
    return { matches: [], bestMatch: null, error: 'pcmData must be at least 100ms of audio (float32 mono)' }
  }

  let features
  try {
    features = extractAcousticFeatures(Array.from(pcmData), sampleRate)
  } catch (err) {
    return { matches: [], bestMatch: null, error: 'FFT analysis failed: ' + err.message }
  }

  const matches = SIGNATURES
    .map(sig => {
      const raw = scoreAcoustic(sig, features)
      const confidence = Math.round(raw * sig.confidence.acoustic * 100) / 100
      return { signature: sig, confidence, method: 'acoustic', detail: { raw, features } }
    })
    .filter(m => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)

  return { matches, bestMatch: matches[0] || null, extractedFeatures: features }
}

// ─── 4. Fused Multi-Evidence Detection ───────────────────────────────────────

/**
 * Combine all available evidence for the strongest identification.
 *
 * @param {object} hints
 *   hints.boardCode  {string}   — PCB service number
 *   hints.icCodes    {object}   — { dac: [...], amp: [...], ... }
 *   hints.pcmData    {number[]} — float32 mono PCM
 *   hints.sampleRate {number}   — sample rate of pcmData
 *
 * Returns fused confidence per signature, ranked.
 */
function detect (hints = {}) {
  const results = {}

  // Initialise result slots
  for (const sig of SIGNATURES) {
    results[sig.id] = { signature: sig, boardScore: 0, icScore: 0, acousticScore: 0, methodsUsed: [] }
  }

  if (hints.boardCode) {
    const r = detectByBoardCode(hints.boardCode)
    for (const m of r.matches) {
      results[m.signature.id].boardScore = m.confidence
      results[m.signature.id].methodsUsed.push('boardCode')
    }
  }

  if (hints.icCodes && Object.keys(hints.icCodes).length) {
    const r = detectByIcCodes(hints.icCodes)
    for (const m of r.matches) {
      results[m.signature.id].icScore = m.confidence
      if (!results[m.signature.id].methodsUsed.includes('icCode')) {
        results[m.signature.id].methodsUsed.push('icCode')
      }
    }
  }

  if (hints.pcmData && hints.pcmData.length) {
    const r = detectByAcoustic(hints.pcmData, hints.sampleRate || 44100)
    for (const m of r.matches) {
      results[m.signature.id].acousticScore = m.confidence
      results[m.signature.id].acousticFeatures = m.detail.features
      if (!results[m.signature.id].methodsUsed.includes('acoustic')) {
        results[m.signature.id].methodsUsed.push('acoustic')
      }
    }
  }

  // Fuse: weighted average of available scores
  const methodCount = (hints.boardCode ? 1 : 0) + (hints.icCodes ? 1 : 0) + (hints.pcmData ? 1 : 0)
  if (methodCount === 0) {
    return { matches: [], bestMatch: null, error: 'provide at least one hint (boardCode, icCodes, or pcmData)' }
  }

  const fusedWeights = {
    boardCode: 0.50,  // most reliable — exact match
    icCode:    0.30,  // reliable but ICs shared across model family
    acoustic:  0.20   // approximate — room/cable variance
  }

  const matches = Object.values(results)
    .map(r => {
      const activeWeight =
        (r.boardScore > 0 || hints.boardCode ? fusedWeights.boardCode : 0) +
        (r.icScore > 0   || hints.icCodes    ? fusedWeights.icCode    : 0) +
        (r.acousticScore > 0 || hints.pcmData ? fusedWeights.acoustic : 0)
      const normaliser = activeWeight > 0 ? activeWeight : 1

      const fused =
        (r.boardScore   * fusedWeights.boardCode +
         r.icScore      * fusedWeights.icCode    +
         r.acousticScore * fusedWeights.acoustic) / normaliser

      return {
        signature: r.signature,
        confidence: Math.round(fused * 100) / 100,
        confidencePct: Math.round(fused * 100),
        method: 'fused',
        methodsUsed: r.methodsUsed,
        scores: { boardCode: r.boardScore, icCode: r.icScore, acoustic: r.acousticScore }
      }
    })
    .filter(m => m.confidence > 0.05)
    .sort((a, b) => b.confidence - a.confidence)

  return { matches, bestMatch: matches[0] || null, methodsUsed: Object.keys(hints).filter(k => hints[k]) }
}

// ─── Sweep Signal Generator ───────────────────────────────────────────────────

/**
 * Generate a log-sine sweep test signal (Farina sweep).
 * Play this through your system, record the output, pass to detectByAcoustic().
 *
 * @param {number} durationSec  — sweep duration in seconds (default 10)
 * @param {number} sampleRate   — default 44100
 * @param {number} f1           — start frequency Hz (default 20)
 * @param {number} f2           — end frequency Hz (default 20000)
 * @returns {Float32Array} mono PCM float32 sweep signal, -1.0 to +1.0
 */
function generateLogSweep (durationSec = 10, sampleRate = 44100, f1 = 20, f2 = 20000) {
  const N = Math.round(durationSec * sampleRate)
  const sweep = new Float32Array(N)
  const k = Math.log(f2 / f1)
  for (let i = 0; i < N; i++) {
    const t = i / sampleRate
    const phase = 2 * Math.PI * f1 * durationSec / k * (Math.exp(t * k / durationSec) - 1)
    // Hann window fade-in/out to avoid clicks
    const env = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)))
    sweep[i] = Math.sin(phase) * env
  }
  return sweep
}

/**
 * Generate a WAV file buffer from PCM data for playback/download.
 */
function sweepToWav (pcmData, sampleRate = 44100) {
  const numSamples = pcmData.length
  const byteRate = sampleRate * 2  // 16-bit mono
  const dataBytes = numSamples * 2
  const buf = Buffer.alloc(44 + dataBytes)
  // RIFF header
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataBytes, 4)
  buf.write('WAVE', 8); buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)    // chunk size
  buf.writeUInt16LE(1, 20)     // PCM
  buf.writeUInt16LE(1, 22)     // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(2, 32)     // block align
  buf.writeUInt16LE(16, 34)    // bits/sample
  buf.write('data', 36)
  buf.writeUInt32LE(dataBytes, 40)
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  return buf
}

module.exports = {
  detectByBoardCode,
  detectByIcCodes,
  detectByAcoustic,
  detect,
  extractAcousticFeatures,
  computeFFT,
  generateLogSweep,
  sweepToWav,
  normaliseBoardCode,
  scoreAcoustic,
  scoreIcCodes,
  scoreBoardCode
}
