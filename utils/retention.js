/**
 * Data Retention Utility
 *
 * Automatically purges data and log files older than a configurable TTL
 * (default: 19 days). Runs as a scheduled interval inside the server process.
 *
 * Targets:
 *   - data/   JSON/binary data files written by the API/scrobbler
 *   - logs/   Log files written by the server
 *
 * @module utils/retention
 * @version 1.0.0
 */

'use strict'

const fs = require('fs').promises
const path = require('path')

const DEFAULT_TTL_DAYS = 19
const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000 // run every 6 hours

/**
 * Delete files in a directory whose mtime is older than ttlMs.
 *
 * @param {string} dir     Absolute directory path
 * @param {number} ttlMs   Max age in milliseconds
 * @returns {Promise<{deleted: string[], errors: string[]}>}
 */
async function purgeDirectory (dir, ttlMs) {
  const deleted = []
  const errors = []

  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return { deleted, errors }
    errors.push(`retention: cannot read dir '${dir}' — ${err.message}`)
    return { deleted, errors }
  }

  const cutoff = Date.now() - ttlMs

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const filePath = path.join(dir, entry.name)
    try {
      const stat = await fs.stat(filePath)
      if (stat.mtimeMs < cutoff) {
        await fs.unlink(filePath)
        deleted.push(filePath)
      }
    } catch (err) {
      errors.push(`retention: failed to purge '${filePath}' — ${err.message}`)
    }
  }

  return { deleted, errors }
}

/**
 * Run a single retention pass over data/ and logs/ directories.
 *
 * @param {object} opts
 * @param {string} opts.dataDir   Absolute path to data directory
 * @param {string} opts.logsDir   Absolute path to logs directory
 * @param {number} [opts.ttlDays] Files older than this are deleted (default: 19)
 * @returns {Promise<{dataDir: object, logsDir: object, ttlDays: number, ranAt: string}>}
 */
async function runRetention (opts = {}) {
  const ttlDays = opts.ttlDays || DEFAULT_TTL_DAYS
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000
  const dataDir = opts.dataDir || path.resolve(__dirname, '../data')
  const logsDir = opts.logsDir || path.resolve(__dirname, '../logs')

  const [dataResult, logsResult] = await Promise.all([
    purgeDirectory(dataDir, ttlMs),
    purgeDirectory(logsDir, ttlMs)
  ])

  const report = {
    ttlDays,
    ranAt: new Date().toISOString(),
    dataDir: dataResult,
    logsDir: logsResult
  }

  const totalDeleted = dataResult.deleted.length + logsResult.deleted.length
  const totalErrors = dataResult.errors.length + logsResult.errors.length

  if (totalDeleted > 0) {
    console.log(`[retention] purged ${totalDeleted} file(s) older than ${ttlDays} days`)
    for (const f of [...dataResult.deleted, ...logsResult.deleted]) {
      console.log(`  deleted: ${f}`)
    }
  }
  if (totalErrors > 0) {
    for (const e of [...dataResult.errors, ...logsResult.errors]) {
      console.warn(`  ${e}`)
    }
  }

  return report
}

/**
 * Start a recurring retention schedule.
 * Call once at server startup; it returns a stopper function.
 *
 * @param {object} opts              Same as runRetention opts
 * @param {number} [opts.intervalMs] How often to run (default: every 6 hours)
 * @returns {{ stop: function, runNow: function }}
 */
function startRetentionSchedule (opts = {}) {
  const intervalMs = opts.intervalMs || DEFAULT_INTERVAL_MS

  // Run immediately on start, then on schedule
  runRetention(opts).catch(err => console.error('[retention] startup run failed:', err.message))

  const handle = setInterval(() => {
    runRetention(opts).catch(err => console.error('[retention] scheduled run failed:', err.message))
  }, intervalMs)

  // Don't keep process alive just for retention
  if (handle.unref) handle.unref()

  return {
    stop: () => clearInterval(handle),
    runNow: () => runRetention(opts)
  }
}

module.exports = { runRetention, startRetentionSchedule, purgeDirectory }
