const { EventEmitter } = require('events')

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const DEFAULT_ALERTS_SECONDS = [60, 30, 10]
const DEFAULT_MAX_DURATION_MS = 24 * HOUR
const DEFAULT_MAX_PER_OWNER = 5

const UNIT_MS = new Map([['h', HOUR], ['m', MINUTE], ['s', SECOND]])

/**
 * Parse a human duration into milliseconds.
 * Accepts plain seconds ("90"), unit strings ("1h30m", "5m", "45s")
 * and clock notation ("1:30", "01:02:03").
 * @param {string|number} input
 * @returns {number} milliseconds
 */
function parseDuration (input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) throw new Error('Duration must be a positive number of seconds')
    return Math.round(input * SECOND)
  }
  if (typeof input !== 'string') throw new Error('Duration must be a string or number')

  const value = input.trim().toLowerCase().replace(/\s+/g, '')
  if (value === '') throw new Error('Duration is empty')

  let ms
  if (/^\d+$/.test(value)) {
    ms = Number(value) * SECOND
  } else if (value.includes(':')) {
    const parts = value.split(':')
    if (parts.length > 3 || !parts.every(p => /^\d+$/.test(p)) || parts.slice(1).some(p => p.length > 2 || Number(p) >= 60)) {
      throw new Error(`Invalid clock duration: "${input}"`)
    }
    const [h, m, sec] = [0, 0, 0, ...parts.map(Number)].slice(-3)
    ms = h * HOUR + m * MINUTE + sec * SECOND
  } else if (value.replace(/\d+[hms]/g, '') === '') {
    ms = 0
    const seen = new Set()
    for (const [, amount, unit] of value.matchAll(/(\d+)([hms])/g)) {
      if (seen.has(unit)) throw new Error(`Duplicate unit "${unit}" in "${input}"`)
      seen.add(unit)
      ms += Number(amount) * UNIT_MS.get(unit)
    }
  } else {
    throw new Error(`Invalid duration: "${input}". Use e.g. 90, 45s, 5m, 1h30m or 1:30`)
  }

  if (ms <= 0) throw new Error('Duration must be greater than zero')
  return ms
}

/**
 * Format milliseconds as a compact human string, e.g. "1h 2m 3s".
 * Rounds up to the next whole second so a running timer never shows 0s early.
 * @param {number} ms
 * @returns {string}
 */
function formatDuration (ms) {
  const total = Math.max(0, Math.ceil(ms / SECOND))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (s || parts.length === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

/**
 * Manages concurrent countdown timers.
 *
 * Events:
 *  - 'start'  (timer)
 *  - 'alert'  (timer, remainingMs)  fired at each configured threshold
 *  - 'finish' (timer)
 *  - 'cancel' (timer)
 */
class CountdownManager extends EventEmitter {
  /**
   * @param {Object} [opts]
   * @param {number[]} [opts.alertsAt] seconds-remaining thresholds that emit 'alert'
   * @param {number} [opts.maxDurationMs]
   * @param {number} [opts.maxPerOwner]
   */
  constructor (opts = {}) {
    super()
    this.alertsAt = [...new Set(opts.alertsAt || DEFAULT_ALERTS_SECONDS)]
      .filter(s => Number.isFinite(s) && s > 0)
      .sort((a, b) => b - a)
    this.maxDurationMs = opts.maxDurationMs || DEFAULT_MAX_DURATION_MS
    this.maxPerOwner = opts.maxPerOwner || DEFAULT_MAX_PER_OWNER
    this._timers = new Map()
    this._nextId = 1
  }

  /**
   * Start a countdown.
   * @param {Object} params
   * @param {number|string} params.duration milliseconds (number) or a duration string
   * @param {string} [params.label]
   * @param {string} [params.ownerId]
   * @param {string} [params.channelId]
   * @returns {Object} public timer info
   */
  start ({ duration, label = '', ownerId = null, channelId = null }) {
    const durationMs = typeof duration === 'string' ? parseDuration(duration) : duration
    if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('Duration must be greater than zero')
    if (durationMs > this.maxDurationMs) {
      throw new Error(`Duration exceeds the maximum of ${formatDuration(this.maxDurationMs)}`)
    }
    if (ownerId !== null && this.list({ ownerId }).length >= this.maxPerOwner) {
      throw new Error(`You already have ${this.maxPerOwner} active countdowns`)
    }

    const now = Date.now()
    const timer = {
      id: this._nextId++,
      label: String(label).trim().slice(0, 100),
      ownerId,
      channelId,
      durationMs,
      startedAt: now,
      endsAt: now + durationMs
    }

    const handles = []
    for (const seconds of this.alertsAt) {
      const remainingMs = seconds * SECOND
      if (remainingMs >= durationMs) continue
      handles.push(setTimeout(() => this.emit('alert', { ...timer }, remainingMs), durationMs - remainingMs))
    }
    handles.push(setTimeout(() => {
      this._timers.delete(timer.id)
      this.emit('finish', { ...timer })
    }, durationMs))

    this._timers.set(timer.id, { timer, handles })
    this.emit('start', { ...timer })
    return { ...timer }
  }

  /**
   * Cancel a countdown. When ownerId is given, only that owner's timer can be cancelled.
   * @returns {boolean} true if a timer was cancelled
   */
  cancel (id, ownerId) {
    const entry = this._timers.get(Number(id))
    if (!entry) return false
    if (ownerId !== undefined && entry.timer.ownerId !== ownerId) return false
    entry.handles.forEach(clearTimeout)
    this._timers.delete(entry.timer.id)
    this.emit('cancel', { ...entry.timer })
    return true
  }

  cancelAll () {
    for (const id of [...this._timers.keys()]) this.cancel(id)
  }

  get (id) {
    const entry = this._timers.get(Number(id))
    return entry ? { ...entry.timer } : null
  }

  remaining (id) {
    const entry = this._timers.get(Number(id))
    return entry ? Math.max(0, entry.timer.endsAt - Date.now()) : null
  }

  /**
   * List active timers, soonest first.
   * @param {Object} [filter]
   * @param {string} [filter.ownerId]
   * @param {string} [filter.channelId]
   */
  list (filter = {}) {
    return [...this._timers.values()]
      .map(entry => entry.timer)
      .filter(t => filter.ownerId === undefined || t.ownerId === filter.ownerId)
      .filter(t => filter.channelId === undefined || t.channelId === filter.channelId)
      .sort((a, b) => a.endsAt - b.endsAt)
      .map(t => ({ ...t }))
  }
}

module.exports = {
  CountdownManager,
  parseDuration,
  formatDuration
}
