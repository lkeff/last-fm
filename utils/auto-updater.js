'use strict'

const { EventEmitter } = require('events')
const normalization = require('./normalization.js')

const DEFAULT_INTERVAL_MS = parseInt(process.env.AUTOUPDATE_INTERVAL_MS) || 60_000 // 1 min default

/**
 * AutoUpdater — runs a 24/7 polling loop that re-reads the samples DB,
 * recomputes normalization ranges, and emits 'update' events with fresh data.
 *
 * Usage (web-server / Node context):
 *   const { AutoUpdater } = require('./utils/auto-updater')
 *   const updater = new AutoUpdater({ readDB, intervalMs: 30_000 })
 *   updater.on('update', ({ samples, ranges, timestamp }) => { ... })
 *   updater.start()
 *
 * Usage (Electron main process):
 *   updater.on('update', (data) => mainWindow.webContents.send('db-updated', data))
 */
class AutoUpdater extends EventEmitter {
  constructor (options = {}) {
    super()
    if (typeof options.readDB !== 'function') {
      throw new TypeError('AutoUpdater requires a readDB function')
    }
    this._readDB = options.readDB
    this._intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS
    this._fields = options.fields || null
    this._timer = null
    this._running = false
    this.lastRun = null
    this.lastError = null
    this.runCount = 0
  }

  start () {
    if (this._running) return this
    this._running = true
    this._tick()
    return this
  }

  stop () {
    this._running = false
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
    return this
  }

  get isRunning () {
    return this._running
  }

  status () {
    return {
      running: this._running,
      intervalMs: this._intervalMs,
      lastRun: this.lastRun,
      lastError: this.lastError ? this.lastError.message : null,
      runCount: this.runCount
    }
  }

  async _tick () {
    if (!this._running) return

    const startedAt = new Date().toISOString()
    try {
      const samples = await Promise.resolve(this._readDB())
      const fields = this._fields || _inferFields(samples)
      const ranges = fields.length > 0
        ? normalization.computeRanges(samples, fields)
        : {}
      const normalized = fields.length > 0
        ? normalization.normalizeDataset(samples, fields)
        : samples

      this.lastRun = startedAt
      this.lastError = null
      this.runCount++

      this.emit('update', {
        samples,
        normalized,
        ranges,
        fields,
        timestamp: startedAt,
        runCount: this.runCount
      })
    } catch (err) {
      this.lastError = err
      this.emit('error', err)
    }

    if (this._running) {
      this._timer = setTimeout(() => this._tick(), this._intervalMs)
    }
  }
}

function _inferFields (samples) {
  if (!Array.isArray(samples) || samples.length === 0) return []
  const first = samples[0]
  if (!first || typeof first !== 'object') return []
  return Object.keys(first).filter(k => typeof first[k] === 'number')
}

module.exports = { AutoUpdater, DEFAULT_INTERVAL_MS }
