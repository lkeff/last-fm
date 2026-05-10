'use strict'

/**
 * Tests for the professional sampler database layer.
 * Uses an in-process mock pg pool — no real PostgreSQL required.
 */

const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')

// ─── Mock pg pool ─────────────────────────────────────────────────────────────
//
// We intercept require('pg') BEFORE loading sampler-db so the module picks up
// the mock. Node's module cache means the first require wins.
//
const _rows = {}  // table → rows[]
let _queryLog = []

function makeMockClient () {
  return {
    query: async (sql, params) => {
      _queryLog.push({ sql: sql.trim().slice(0, 60), params })
      // Route by SQL prefix
      const s = sql.trim().toUpperCase()

      if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK')) {
        return { rows: [], rowCount: 0 }
      }

      // INSERT INTO sample_packs
      if (s.includes('INSERT INTO SAMPLE_PACKS')) {
        const row = {
          id: 'pack-uuid-' + Math.random().toString(36).slice(2),
          name: params[0], vendor: params[1], version: params[2],
          description: params[3], category: params[4],
          tags: params[5] || [], metadata: params[6] || {},
          total_samples: 0, total_size_bytes: 0,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }
        if (!_rows.sample_packs) _rows.sample_packs = []
        _rows.sample_packs.push(row)
        return { rows: [row], rowCount: 1 }
      }

      // SELECT sample_packs
      if (s.includes('FROM SAMPLE_PACKS') && !s.includes('INSERT') && !s.includes('DELETE')) {
        const categoryParam = params && params.length > 0 && typeof params[0] === 'string' && isNaN(Number(params[0])) ? params[0] : null
        const rows = (_rows.sample_packs || []).filter(r => {
          if (categoryParam && r.category !== categoryParam) return false
          return true
        })
        return { rows, rowCount: rows.length }
      }

      // DELETE FROM sample_packs
      if (s.includes('DELETE FROM SAMPLE_PACKS')) {
        const before = (_rows.sample_packs || []).length
        _rows.sample_packs = (_rows.sample_packs || []).filter(r => r.id !== params[0])
        return { rows: [], rowCount: before - _rows.sample_packs.length }
      }

      // INSERT INTO samples
      if (s.includes('INSERT INTO SAMPLES')) {
        const row = {
          id: 'sample-uuid-' + Math.random().toString(36).slice(2),
          pack_id: params[0], name: params[1], filename: params[2],
          file_path: params[3], format: params[4], file_size_bytes: params[5] || 0,
          duration_ms: params[6], sample_rate: params[7], bit_depth: params[8],
          channels: params[9] || 2, instrument_cat: params[10] || 'other',
          root_note: params[11], musical_key: params[12] || 'unknown',
          tempo_bpm: params[13], loop_enabled: params[14] || false,
          loop_start_ms: params[15], loop_end_ms: params[16],
          tags: params[17] || [], metadata: params[18] || {},
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }
        if (!_rows.samples) _rows.samples = []
        _rows.samples.push(row)
        return { rows: [row], rowCount: 1 }
      }

      // SELECT FROM samples WHERE id=
      if (s.includes('FROM SAMPLES WHERE ID=')) {
        const found = (_rows.samples || []).find(r => r.id === params[0]) || null
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 }
      }

      // SELECT FROM samples (list)
      if (s.includes('FROM SAMPLES') && !s.includes('INSERT') && !s.includes('DELETE') && !s.includes('WHERE ID=')) {
        return { rows: _rows.samples || [], rowCount: (_rows.samples || []).length }
      }

      // DELETE FROM samples
      if (s.includes('DELETE FROM SAMPLES WHERE ID=')) {
        const before = (_rows.samples || []).length
        _rows.samples = (_rows.samples || []).filter(r => r.id !== params[0])
        return { rows: [], rowCount: before - (_rows.samples || []).length }
      }

      // INSERT INTO sample_analyses
      if (s.includes('INSERT INTO SAMPLE_ANALYSES')) {
        const row = {
          id: 'analysis-uuid-' + Math.random().toString(36).slice(2),
          sample_id: params[0], sample_cat: params[1], status: 'pending',
          analyzed_at: null, waveform_preview: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }
        if (!_rows.sample_analyses) _rows.sample_analyses = []
        _rows.sample_analyses.push(row)
        return { rows: [row], rowCount: 1 }
      }

      // UPDATE sample_analyses
      if (s.includes('UPDATE SAMPLE_ANALYSES')) {
        const analysisRow = (_rows.sample_analyses || []).find(r => r.sample_id === params[0])
        if (analysisRow) {
          Object.assign(analysisRow, { updated_at: new Date().toISOString() })
        }
        return { rows: analysisRow ? [analysisRow] : [], rowCount: analysisRow ? 1 : 0 }
      }

      // SELECT FROM sample_analyses
      if (s.includes('FROM SAMPLE_ANALYSES WHERE SAMPLE_ID=')) {
        const found = (_rows.sample_analyses || []).find(r => r.sample_id === params[0]) || null
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 }
      }

      // storage_stats / library_stats views
      if (s.includes('FROM STORAGE_STATS')) {
        return { rows: [{ instrument_cat: 'drums', sample_count: '2', total_bytes: '204800' }], rowCount: 1 }
      }
      if (s.includes('FROM LIBRARY_STATS')) {
        return { rows: [{ total_samples: '2', total_bytes: '204800', total_size_pretty: '200 kB', total_packs: '1', analysed_samples: '0', pending_analyses: '2', total_minutes: '1.0' }], rowCount: 1 }
      }

      // SELECT 1 (health check)
      if (s.startsWith('SELECT 1')) {
        return { rows: [{ ok: 1 }], rowCount: 1 }
      }

      return { rows: [], rowCount: 0 }
    },
    release: () => {}
  }
}

const mockPool = {
  connect: async () => makeMockClient(),
  end: async () => {},
  on: () => {}
}

// Inject mock before loading modules
const db = require('../utils/sampler-db.js')
db._setPool(mockPool)

const store = require('../services/sample-store.js')

// Reset state between test groups
before(() => {
  Object.keys(_rows).forEach(k => delete _rows[k])
  _queryLog.length = 0
})

// ─── sampler-db unit tests ────────────────────────────────────────────────────

describe('sampler-db', () => {
  it('healthCheck returns ok:true', async () => {
    const result = await db.healthCheck()
    assert.equal(result.ok, true)
  })

  it('createPack inserts and returns row', async () => {
    const pack = await db.createPack({
      name: 'Test Drums Pack', vendor: 'Acme Samples', category: 'drums', tags: ['kick', 'snare'], metadata: {}
    })
    assert.ok(pack.id)
    assert.equal(pack.name, 'Test Drums Pack')
    assert.equal(pack.category, 'drums')
    assert.deepEqual(pack.tags, ['kick', 'snare'])
  })

  it('getPacks returns inserted packs', async () => {
    const packs = await db.getPacks()
    assert.ok(Array.isArray(packs))
    assert.ok(packs.length >= 1)
  })

  it('getPackById returns null for unknown id', async () => {
    const pack = await db.getPackById('00000000-0000-0000-0000-000000000000')
    assert.equal(pack, null)
  })

  it('createSample inserts and returns row', async () => {
    const sample = await db.createSample({
      packId: null, name: 'Kick 001', filename: 'kick_001.wav',
      filePath: '/samples/kick_001.wav', format: 'wav', fileSizeBytes: 102400,
      durationMs: 500, sampleRate: 44100, bitDepth: 24, channels: 1,
      instrumentCat: 'drums', musicalKey: 'unknown'
    })
    assert.ok(sample.id)
    assert.equal(sample.name, 'Kick 001')
    assert.equal(sample.format, 'wav')
    assert.equal(sample.instrument_cat, 'drums')
  })

  it('getSamples returns all samples', async () => {
    const samples = await db.getSamples()
    assert.ok(Array.isArray(samples))
    assert.ok(samples.length >= 1)
  })

  it('createAnalysis creates pending analysis', async () => {
    const sample = (_rows.samples || [])[0]
    if (!sample) return
    const analysis = await db.createAnalysis(sample.id, sample.instrument_cat)
    assert.ok(analysis)
    assert.equal(analysis.status, 'pending')
    assert.equal(analysis.sample_id, sample.id)
  })

  it('getAnalysis returns analysis by sample_id', async () => {
    const sample = (_rows.samples || [])[0]
    if (!sample) return
    const analysis = await db.getAnalysis(sample.id)
    assert.ok(analysis)
    assert.equal(analysis.sample_id, sample.id)
  })

  it('deleteSample removes the row', async () => {
    const sample = (_rows.samples || [])[0]
    if (!sample) return
    const deleted = await db.deleteSample(sample.id)
    assert.equal(deleted, true)
  })

  it('storageStats returns array', async () => {
    const stats = await db.storageStats()
    assert.ok(Array.isArray(stats))
    assert.ok(stats[0].instrument_cat)
  })

  it('libraryStats returns object with totals', async () => {
    const stats = await db.libraryStats()
    assert.ok(stats.total_samples !== undefined)
    assert.ok(stats.total_size_pretty)
  })
})

// ─── sample-store service tests ───────────────────────────────────────────────

describe('sample-store service', () => {
  before(() => {
    Object.keys(_rows).forEach(k => delete _rows[k])
  })

  it('createPack validates name', async () => {
    await assert.rejects(() => store.createPack({ name: '' }), /name is required/i)
  })

  it('createPack succeeds with valid data', async () => {
    const pack = await store.createPack({ name: 'Bass Library Vol.1', vendor: 'Studio X', category: 'bass' })
    assert.ok(pack.id)
    assert.equal(pack.name, 'Bass Library Vol.1')
  })

  it('registerSample validates required fields', async () => {
    await assert.rejects(
      () => store.registerSample({ name: 'Missing fields' }),
      /validation errors/i
    )
  })

  it('registerSample validates format', async () => {
    await assert.rejects(
      () => store.registerSample({ name: 'x', filename: 'x.mp4', filePath: '/x.mp4', format: 'mp4' }),
      /format must be one of/i
    )
  })

  it('registerSample succeeds with valid data', async () => {
    const sample = await store.registerSample({
      name: 'Snare Tight', filename: 'snare_tight.wav', filePath: '/samples/snare.wav',
      format: 'wav', fileSizeBytes: 204800, durationMs: 300,
      sampleRate: 44100, bitDepth: 24, channels: 1, instrumentCat: 'drums'
    })
    assert.ok(sample.id)
    assert.equal(sample.name, 'Snare Tight')
  })

  it('listSamples returns array', async () => {
    const samples = await store.listSamples()
    assert.ok(Array.isArray(samples))
  })

  it('validateSampleInput returns errors for invalid input', () => {
    const errors = store.validateSampleInput({})
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.includes('name')))
  })

  it('validateSampleInput passes for valid input', () => {
    const errors = store.validateSampleInput({
      name: 'Hi-Hat Open', filename: 'hihat_open.flac', filePath: '/samples/hihat.flac',
      format: 'flac', channels: 1, sampleRate: 48000, bitDepth: 24
    })
    assert.deepEqual(errors, [])
  })

  it('VALID_FORMATS includes wav, flac, aiff, mp3', () => {
    assert.ok(store.VALID_FORMATS.has('wav'))
    assert.ok(store.VALID_FORMATS.has('flac'))
    assert.ok(store.VALID_FORMATS.has('aiff'))
    assert.ok(store.VALID_FORMATS.has('mp3'))
  })

  it('VALID_CATEGORIES includes drums, bass, vocals, synth', () => {
    assert.ok(store.VALID_CATEGORIES.has('drums'))
    assert.ok(store.VALID_CATEGORIES.has('bass'))
    assert.ok(store.VALID_CATEGORIES.has('vocals'))
    assert.ok(store.VALID_CATEGORIES.has('synth'))
  })

  it('getLibraryStats returns library and byCategory', async () => {
    const stats = await store.getLibraryStats()
    assert.ok(stats.library)
    assert.ok(Array.isArray(stats.byCategory))
  })

  it('createCollection validates name', async () => {
    await assert.rejects(() => store.createCollection({ name: '' }), /name is required/i)
  })
})

// ─── Analysis DSP helpers ─────────────────────────────────────────────────────

describe('sample-store analysis DSP', () => {
  it('downsampleWaveform reduces to targetPoints', () => {
    const input = new Array(44100).fill(0).map((_, i) => Math.sin(i * 0.01))
    const out = store.downsampleWaveform(input, 500)
    assert.equal(out.length, 500)
    assert.ok(out.every(v => typeof v === 'number'))
  })

  it('downsampleWaveform values are non-negative (RMS)', () => {
    const input = [-1, 0.5, -0.3, 0.8, -0.2, 0.9]
    const out = store.downsampleWaveform(input, 2)
    assert.ok(out.every(v => v >= 0))
  })

  it('rmsDbfs returns negative value for quiet signal', () => {
    const signal = new Array(1000).fill(0.01)
    const rms = store.rmsDbfs(signal)
    assert.ok(rms < 0)
    assert.ok(rms > -100)
  })

  it('rmsDbfs returns -Infinity for silence', () => {
    const rms = store.rmsDbfs(new Array(100).fill(0))
    assert.equal(rms, -Infinity)
  })

  it('peakDbfs returns 0 dBFS for full-scale signal', () => {
    const signal = [1.0, -1.0, 0.5, -0.5]
    const peak = store.peakDbfs(signal)
    assert.equal(peak, 0)
  })

  it('estimateBpm returns null for very short signal', () => {
    const result = store.estimateBpm(new Array(100).fill(0), 44100)
    assert.equal(result, null)
  })

  it('estimateBpm returns null or number for longer signal', () => {
    const signal = new Array(44100 * 2).fill(0).map((_, i) => Math.sin(i * 0.1))
    const result = store.estimateBpm(signal, 44100)
    assert.ok(result === null || typeof result === 'number')
  })
})
