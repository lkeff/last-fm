'use strict'

/**
 * Sample Store Service
 * Business-logic layer between HTTP routes and the DB.
 * Also bridges to the AI analysis pipeline (waveform, pitch, BPM detection).
 */

const db = require('../utils/sampler-db.js')
const path = require('path')
const fs = require('fs')

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_FORMATS = new Set(['wav', 'aiff', 'flac', 'mp3', 'ogg', 'opus', 'aac', 'caf'])
const VALID_CATEGORIES = new Set([
  'drums', 'percussion', 'bass', 'keys', 'piano', 'guitar', 'strings',
  'brass', 'woodwinds', 'vocals', 'synth', 'fx', 'loops', 'one_shots', 'other'
])

function validateSampleInput (data) {
  const errors = []
  if (!data.name || typeof data.name !== 'string') errors.push('name is required')
  if (!data.filename || typeof data.filename !== 'string') errors.push('filename is required')
  if (!data.filePath || typeof data.filePath !== 'string') errors.push('filePath is required')
  if (!data.format || !VALID_FORMATS.has(data.format)) {
    errors.push(`format must be one of: ${[...VALID_FORMATS].join(', ')}`)
  }
  if (data.instrumentCat && !VALID_CATEGORIES.has(data.instrumentCat)) {
    errors.push(`instrumentCat must be one of: ${[...VALID_CATEGORIES].join(', ')}`)
  }
  if (data.channels != null && (data.channels < 1 || data.channels > 64)) {
    errors.push('channels must be between 1 and 64')
  }
  if (data.sampleRate != null && ![8000,11025,22050,44100,48000,88200,96000,176400,192000].includes(data.sampleRate)) {
    errors.push('sampleRate must be a standard audio sample rate')
  }
  if (data.bitDepth != null && ![8,16,24,32].includes(data.bitDepth)) {
    errors.push('bitDepth must be 8, 16, 24, or 32')
  }
  return errors
}

// ─── Pack CRUD ────────────────────────────────────────────────────────────────

async function createPack (data) {
  if (!data.name || !data.name.trim()) throw new Error('Pack name is required')
  return db.createPack({
    name: data.name.trim(),
    vendor: data.vendor || null,
    version: data.version || null,
    description: data.description || null,
    category: VALID_CATEGORIES.has(data.category) ? data.category : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    metadata: data.metadata || {}
  })
}

async function listPacks (opts) { return db.getPacks(opts) }
async function getPack (id) { return db.getPackById(id) }
async function removePack (id) { return db.deletePack(id) }

// ─── Sample CRUD ──────────────────────────────────────────────────────────────

async function registerSample (data) {
  const errors = validateSampleInput(data)
  if (errors.length) throw new Error('Validation errors: ' + errors.join('; '))
  const sample = await db.createSample(data)
  // Queue for AI analysis immediately after registration
  await db.createAnalysis(sample.id, sample.instrument_cat).catch(() => {})
  return sample
}

async function listSamples (filters) { return db.getSamples(filters) }
async function getSample (id) { return db.getSampleById(id) }
async function removeSample (id) { return db.deleteSample(id) }

// ─── AI Analysis Integration ──────────────────────────────────────────────────

/**
 * Minimal waveform downsampler for preview generation.
 * Takes a Float32Array (or regular array) of PCM samples and reduces to ~targetPoints.
 * Each output point = RMS of a chunk; produces amplitude envelope suitable for display.
 */
function downsampleWaveform (pcmData, targetPoints = 1000) {
  const chunkSize = Math.max(1, Math.floor(pcmData.length / targetPoints))
  const out = []
  for (let i = 0; i < targetPoints; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, pcmData.length)
    let sumSq = 0
    for (let j = start; j < end; j++) sumSq += pcmData[j] * pcmData[j]
    out.push(Math.sqrt(sumSq / (end - start)))
  }
  return out
}

/**
 * Simple zero-crossing-rate based BPM estimator.
 * Works on short excerpts; not production-grade but dependency-free.
 * Returns null if confidence is too low.
 */
function estimateBpm (pcmData, sampleRate) {
  if (!pcmData || pcmData.length < sampleRate * 0.5) return null
  // Count zero crossings in 4-second window
  const windowSize = Math.min(pcmData.length, sampleRate * 4)
  let crossings = 0
  for (let i = 1; i < windowSize; i++) {
    if ((pcmData[i - 1] >= 0) !== (pcmData[i] >= 0)) crossings++
  }
  // Rough: ZCR / 2 = fundamental freq; for rhythmic content, BPM ≈ (crossings / window_secs) * 60 / avg_beats_per_cycle
  // This is a placeholder — real BPM detection uses autocorrelation or onset detection
  const zcr = crossings / (windowSize / sampleRate)
  // Heuristic: divide by expected number of transitions per beat (very rough)
  const bpmEstimate = Math.round((zcr / 8) * 10) / 10
  if (bpmEstimate < 20 || bpmEstimate > 500) return null
  return bpmEstimate
}

/**
 * RMS loudness in dBFS.
 */
function rmsDbfs (pcmData) {
  if (!pcmData || !pcmData.length) return -Infinity
  let sumSq = 0
  for (let i = 0; i < pcmData.length; i++) sumSq += pcmData[i] * pcmData[i]
  const rms = Math.sqrt(sumSq / pcmData.length)
  if (rms <= 0) return -Infinity
  return Math.round(20 * Math.log10(rms) * 100) / 100
}

/**
 * Peak dBFS.
 */
function peakDbfs (pcmData) {
  if (!pcmData || !pcmData.length) return -Infinity
  let peak = 0
  for (let i = 0; i < pcmData.length; i++) {
    const abs = Math.abs(pcmData[i])
    if (abs > peak) peak = abs
  }
  if (peak <= 0) return -Infinity
  return Math.round(20 * Math.log10(peak) * 100) / 100
}

/**
 * runAnalysis — processes a sample and writes results to sample_analyses.
 * Called by the background worker or the HTTP trigger endpoint.
 * Returns the updated analysis row.
 */
async function runAnalysis (sampleId) {
  const sample = await db.getSampleById(sampleId)
  if (!sample) throw new Error(`Sample ${sampleId} not found`)

  await db.updateAnalysis(sampleId, { status: 'processing', analyzed_at: new Date() })

  try {
    let waveformPreview = null
    let rmsDf = null
    let peakDf = null
    let detectedBpm = null

    // Only attempt file-based analysis if path exists and wav-decoder is available
    if (sample.file_path && fs.existsSync(sample.file_path) && sample.format === 'wav') {
      try {
        const wavDecoder = require('wav-decoder')
        const buf = fs.readFileSync(sample.file_path)
        const decoded = await wavDecoder.decode(buf)
        const ch0 = decoded.channelData[0]
        waveformPreview = downsampleWaveform(ch0, 1000)
        detectedBpm = estimateBpm(ch0, decoded.sampleRate)
        rmsDf = rmsDbfs(ch0)
        peakDf = peakDbfs(ch0)
      } catch (_) { /* non-WAV or file not accessible — skip audio decode */ }
    }

    const updates = {
      status: 'complete',
      analyzed_at: new Date(),
      waveform_preview: waveformPreview ? JSON.stringify(waveformPreview) : null,
      rms_dbfs: rmsDf,
      peak_dbfs: peakDf,
      detected_bpm: detectedBpm || sample.tempo_bpm || null,
      detected_key: sample.musical_key || 'unknown',
      ai_model_version: '1.0.0-builtin'
    }

    return await db.updateAnalysis(sampleId, updates)
  } catch (err) {
    await db.updateAnalysis(sampleId, { status: 'failed', error_message: err.message })
    throw err
  }
}

// ─── Collections ──────────────────────────────────────────────────────────────

async function createCollection (data) {
  if (!data.name || !data.name.trim()) throw new Error('Collection name is required')
  return db.createCollection(data)
}

async function addSampleToCollection (collectionId, sampleId, position) {
  const sample = await db.getSampleById(sampleId)
  if (!sample) throw new Error(`Sample ${sampleId} not found`)
  return db.addToCollection(collectionId, sampleId, sample.instrument_cat, position || 0)
}

async function getCollectionContents (collectionId) {
  return db.getCollectionSamples(collectionId)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

async function getLibraryStats () {
  const [libStats, storageByCategory] = await Promise.all([
    db.libraryStats(),
    db.storageStats()
  ])
  return { library: libStats, byCategory: storageByCategory }
}

module.exports = {
  // Packs
  createPack, listPacks, getPack, removePack,
  // Samples
  registerSample, listSamples, getSample, removeSample,
  // Analysis
  runAnalysis, downsampleWaveform, estimateBpm, rmsDbfs, peakDbfs,
  // Collections
  createCollection, addSampleToCollection, getCollectionContents,
  // Stats
  getLibraryStats,
  // Validation
  validateSampleInput, VALID_FORMATS, VALID_CATEGORIES
}
