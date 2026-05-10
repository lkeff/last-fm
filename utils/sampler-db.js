'use strict'

const { Pool } = require('pg')

// Connection pool — singleton, shared across all routes.
// Config sourced from environment; falls back to sampler-specific vars.
let _pool = null

function getPool () {
  if (_pool) return _pool
  _pool = new Pool({
    host:     process.env.SAMPLER_DB_HOST     || process.env.PGHOST     || 'localhost',
    port:     parseInt(process.env.SAMPLER_DB_PORT || process.env.PGPORT || '5432', 10),
    database: process.env.SAMPLER_DB_NAME     || process.env.PGDATABASE || 'sampler',
    user:     process.env.SAMPLER_DB_USER     || process.env.PGUSER     || 'sampler_app',
    password: process.env.SAMPLER_DB_PASSWORD || process.env.PGPASSWORD || 'sampler_app_pw',
    // Pool sizing: tuned for audio metadata query mix (mostly reads, occasional bulk inserts)
    max:              parseInt(process.env.SAMPLER_DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // Keep connections alive across container restarts
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: process.env.SAMPLER_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  })

  _pool.on('error', (err) => {
    console.error('[sampler-db] Unexpected pool error:', err.message)
  })

  return _pool
}

// Allow tests to inject a mock pool
function _setPool (mockPool) { _pool = mockPool }

async function query (sql, params) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result
  } finally {
    client.release()
  }
}

async function transaction (fn) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function healthCheck () {
  try {
    const { rows } = await query('SELECT 1 AS ok')
    return { ok: rows[0].ok === 1 }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function storageStats () {
  const { rows } = await query('SELECT * FROM storage_stats')
  return rows
}

async function libraryStats () {
  const { rows } = await query('SELECT * FROM library_stats')
  return rows[0] || {}
}

// ─── Sample Packs ─────────────────────────────────────────────────────────────

async function createPack ({ name, vendor, version, description, category, tags, metadata }) {
  const { rows } = await query(
    `INSERT INTO sample_packs (name, vendor, version, description, category, tags, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [name, vendor || null, version || null, description || null, category || null,
      tags || [], metadata || {}]
  )
  return rows[0]
}

async function getPacks ({ limit = 50, offset = 0, category, search } = {}) {
  const conditions = []
  const params = []
  if (category) { params.push(category); conditions.push(`category = $${params.length}`) }
  if (search) { params.push(search); conditions.push(`name ILIKE '%' || $${params.length} || '%'`) }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  params.push(limit); params.push(offset)
  const { rows } = await query(
    `SELECT * FROM sample_packs ${where}
     ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return rows
}

async function getPackById (id) {
  const { rows } = await query('SELECT * FROM sample_packs WHERE id=$1', [id])
  return rows[0] || null
}

async function deletePack (id) {
  const { rowCount } = await query('DELETE FROM sample_packs WHERE id=$1', [id])
  return rowCount > 0
}

// ─── Samples ──────────────────────────────────────────────────────────────────

async function createSample ({
  packId, name, filename, filePath, format, fileSizeBytes, durationMs,
  sampleRate, bitDepth, channels, instrumentCat, rootNote, musicalKey,
  tempoBpm, loopEnabled, loopStartMs, loopEndMs, tags, metadata
}) {
  const { rows } = await query(
    `INSERT INTO samples
      (pack_id, name, filename, file_path, format, file_size_bytes, duration_ms,
       sample_rate, bit_depth, channels, instrument_cat, root_note, musical_key,
       tempo_bpm, loop_enabled, loop_start_ms, loop_end_ms, tags, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING id, instrument_cat, name, filename, format, duration_ms, sample_rate, bit_depth, channels`,
    [packId || null, name, filename, filePath, format, fileSizeBytes || 0, durationMs || null,
      sampleRate || null, bitDepth || null, channels || 2, instrumentCat || 'other',
      rootNote || null, musicalKey || 'unknown', tempoBpm || null, loopEnabled || false,
      loopStartMs || null, loopEndMs || null, tags || [], metadata || {}]
  )
  return rows[0]
}

async function getSamples ({
  packId, category, musicalKey, minBpm, maxBpm, format, search,
  tags, limit = 100, offset = 0
} = {}) {
  const conditions = []
  const params = []

  if (packId) { params.push(packId); conditions.push(`pack_id = $${params.length}`) }
  if (category) { params.push(category); conditions.push(`instrument_cat = $${params.length}`) }
  if (musicalKey) { params.push(musicalKey); conditions.push(`musical_key = $${params.length}`) }
  if (minBpm != null) { params.push(minBpm); conditions.push(`tempo_bpm >= $${params.length}`) }
  if (maxBpm != null) { params.push(maxBpm); conditions.push(`tempo_bpm <= $${params.length}`) }
  if (format) { params.push(format); conditions.push(`format = $${params.length}`) }
  if (search) {
    params.push(search)
    conditions.push(`tsv @@ plainto_tsquery('english', $${params.length})`)
  }
  if (tags && tags.length) {
    params.push(tags)
    conditions.push(`tags && $${params.length}`)
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  params.push(limit); params.push(offset)

  const { rows } = await query(
    `SELECT id, instrument_cat, name, filename, format, file_size_bytes, duration_ms,
            sample_rate, bit_depth, channels, musical_key, tempo_bpm, tags, created_at
     FROM samples ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return rows
}

async function getSampleById (id) {
  const { rows } = await query('SELECT * FROM samples WHERE id=$1', [id])
  return rows[0] || null
}

async function deleteSample (id) {
  const { rowCount } = await query('DELETE FROM samples WHERE id=$1', [id])
  return rowCount > 0
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

async function createAnalysis (sampleId, sampleCat) {
  const { rows } = await query(
    `INSERT INTO sample_analyses (sample_id, sample_cat, status)
     VALUES ($1,$2,'pending')
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [sampleId, sampleCat]
  )
  return rows[0] || null
}

async function updateAnalysis (sampleId, updates) {
  const fields = []
  const params = [sampleId]
  for (const [key, val] of Object.entries(updates)) {
    params.push(val)
    fields.push(`${key} = $${params.length}`)
  }
  if (!fields.length) return null
  const { rows } = await query(
    `UPDATE sample_analyses SET ${fields.join(', ')}, updated_at=NOW()
     WHERE sample_id=$1 RETURNING *`,
    params
  )
  return rows[0] || null
}

async function getAnalysis (sampleId) {
  const { rows } = await query(
    'SELECT * FROM sample_analyses WHERE sample_id=$1', [sampleId]
  )
  return rows[0] || null
}

async function getPendingAnalyses (limit = 20) {
  const { rows } = await query(
    `SELECT a.*, s.filename, s.file_path, s.format
     FROM sample_analyses a
     JOIN samples s ON s.id = a.sample_id
     WHERE a.status = 'pending'
     ORDER BY a.created_at ASC LIMIT $1`,
    [limit]
  )
  return rows
}

// ─── Collections ──────────────────────────────────────────────────────────────

async function createCollection ({ name, description, tags, metadata }) {
  const { rows } = await query(
    `INSERT INTO sample_collections (name, description, tags, metadata)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, description || null, tags || [], metadata || {}]
  )
  return rows[0]
}

async function addToCollection (collectionId, sampleId, sampleCat, position) {
  const { rows } = await query(
    `INSERT INTO sample_collection_items (collection_id, sample_id, sample_cat, position)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (collection_id, sample_id, sample_cat) DO UPDATE SET position=EXCLUDED.position
     RETURNING *`,
    [collectionId, sampleId, sampleCat, position || 0]
  )
  return rows[0]
}

async function getCollectionSamples (collectionId) {
  const { rows } = await query(
    `SELECT s.*, ci.position FROM sample_collection_items ci
     JOIN samples s ON s.id = ci.sample_id AND s.instrument_cat = ci.sample_cat
     WHERE ci.collection_id=$1
     ORDER BY ci.position ASC`,
    [collectionId]
  )
  return rows
}

// ─── Shutdown ─────────────────────────────────────────────────────────────────

async function closePool () {
  if (_pool) { await _pool.end(); _pool = null }
}

module.exports = {
  getPool,
  _setPool,
  query,
  transaction,
  healthCheck,
  storageStats,
  libraryStats,
  createPack,
  getPacks,
  getPackById,
  deletePack,
  createSample,
  getSamples,
  getSampleById,
  deleteSample,
  createAnalysis,
  updateAnalysis,
  getAnalysis,
  getPendingAnalyses,
  createCollection,
  addToCollection,
  getCollectionSamples,
  closePool
}
