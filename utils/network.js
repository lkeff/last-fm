'use strict'

/**
 * Industry-grade networking layer for last-fm.
 *
 * Features:
 *  - Keep-alive connection pooling (http.Agent / https.Agent)
 *  - Jittered exponential backoff retry
 *  - Circuit breaker (CLOSED → OPEN → HALF_OPEN)
 *  - In-flight request deduplication (coalescing identical concurrent calls)
 *  - Retry-After / 429 awareness
 *  - Transparent gzip / deflate / brotli decompression
 *  - Structured stats endpoint
 */

const http = require('http')
const https = require('https')
const zlib = require('zlib')
const { EventEmitter } = require('events')

// ─── Connection pool agents ────────────────────────────────────────────────
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60_000,
  scheduling: 'lifo'
})

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60_000,
  scheduling: 'lifo'
})

// ─── Circuit breaker ────────────────────────────────────────────────────────
const CB_CLOSED = 'CLOSED'
const CB_OPEN = 'OPEN'
const CB_HALF_OPEN = 'HALF_OPEN'

class CircuitBreaker extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.failureThreshold = opts.failureThreshold ?? 5
    this.successThreshold = opts.successThreshold ?? 2
    this.halfOpenTimeout = opts.halfOpenTimeout ?? 30_000
    this.state = CB_CLOSED
    this._failures = 0
    this._successes = 0
    this._nextAttempt = Date.now()
  }

  canRequest () {
    if (this.state === CB_CLOSED) return true
    if (this.state === CB_OPEN) {
      if (Date.now() >= this._nextAttempt) {
        this.state = CB_HALF_OPEN
        this._successes = 0
        this.emit('half-open')
      } else {
        return false
      }
    }
    return true // CLOSED or HALF_OPEN
  }

  recordSuccess () {
    this._failures = 0
    if (this.state === CB_HALF_OPEN) {
      this._successes++
      if (this._successes >= this.successThreshold) {
        this.state = CB_CLOSED
        this._successes = 0
        this.emit('closed')
      }
    }
  }

  recordFailure () {
    this._failures++
    this._successes = 0
    if (this.state === CB_HALF_OPEN || this._failures >= this.failureThreshold) {
      this.state = CB_OPEN
      this._nextAttempt = Date.now() + this.halfOpenTimeout
      this.emit('open', { failures: this._failures })
    }
  }

  toJSON () {
    return {
      state: this.state,
      failures: this._failures,
      nextAttemptMs: this._nextAttempt
    }
  }
}

// ─── In-flight deduplicator ─────────────────────────────────────────────────
class RequestDeduplicator {
  constructor () {
    this._inflight = new Map()
  }

  /** Returns the promise for this key, creating it with factory() if new. */
  get (key, factory) {
    if (this._inflight.has(key)) return this._inflight.get(key)
    const p = factory().finally(() => this._inflight.delete(key))
    this._inflight.set(key, p)
    return p
  }

  size () { return this._inflight.size }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function jitteredDelay (attempt, baseMs = 200, maxMs = 10_000) {
  const exp = Math.min(baseMs * Math.pow(2, attempt), maxMs)
  return Math.floor(exp * (0.5 + Math.random() * 0.5))
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryable (err) {
  const status = err.statusCode
  if (status === 408 || status === 425 || status === 429) return true
  if (status >= 500 && status <= 599) return true
  const retryableCodes = new Set([
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
    'EPIPE', 'EHOSTUNREACH', 'ENETUNREACH', 'EAI_AGAIN'
  ])
  return !!(err.code && retryableCodes.has(err.code))
}

// ─── Core request (single attempt) ─────────────────────────────────────────
function doRequest ({ url, method = 'GET', headers = {}, body, timeoutMs = 30_000 }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const lib = isHttps ? https : http
    const agent = isHttps ? httpsAgent : httpAgent

    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        ...headers
      },
      agent,
      timeout: timeoutMs
    }

    const req = lib.request(reqOpts, (res) => {
      const statusCode = res.statusCode

      // Surface 429 with Retry-After so the retry loop can honour it
      if (statusCode === 429) {
        res.resume()
        const retryAfter = parseInt(res.headers['retry-after'] || '1', 10)
        return reject(Object.assign(
          new Error(`HTTP 429 Too Many Requests`),
          { statusCode: 429, retryAfter }
        ))
      }

      // Decompress response
      const enc = (res.headers['content-encoding'] || '').toLowerCase()
      let stream = res
      if (enc === 'gzip' || enc === 'x-gzip') stream = res.pipe(zlib.createGunzip())
      else if (enc === 'deflate') stream = res.pipe(zlib.createInflate())
      else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress())

      const chunks = []
      stream.on('data', c => chunks.push(c))
      stream.on('error', reject)
      stream.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (statusCode >= 400) {
          return reject(Object.assign(
            new Error(`HTTP ${statusCode}`),
            { statusCode, body: buf.toString('utf8') }
          ))
        }
        resolve({ statusCode, headers: res.headers, body: buf })
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' }))
    })
    req.on('error', reject)

    if (body) req.write(body)
    req.end()
  })
}

// ─── NetworkClient ──────────────────────────────────────────────────────────
class NetworkClient {
  constructor (opts = {}) {
    this.maxRetries = opts.maxRetries ?? 3
    this.baseRetryDelayMs = opts.baseRetryDelayMs ?? 300
    this.maxRetryDelayMs = opts.maxRetryDelayMs ?? 15_000
    this.requestTimeoutMs = opts.requestTimeoutMs ?? 30_000
    this.circuitBreaker = new CircuitBreaker(opts.circuitBreaker || {})
    this._dedup = new RequestDeduplicator()
    this._totalRequests = 0
    this._totalErrors = 0
    this._totalRetries = 0
  }

  /** Make an HTTP/HTTPS request with retry, circuit breaker, and deduplication. */
  request (opts) {
    const key = opts.dedupKey || `${(opts.method || 'GET').toUpperCase()}:${opts.url}`
    return this._dedup.get(key, () => this._withRetry(opts))
  }

  async _withRetry (opts) {
    if (!this.circuitBreaker.canRequest()) {
      const err = Object.assign(
        new Error('Circuit breaker OPEN — request rejected'),
        { code: 'ECIRCUITOPEN', circuitBreaker: this.circuitBreaker.toJSON() }
      )
      throw err
    }

    let lastErr
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await doRequest({ ...opts, timeoutMs: this.requestTimeoutMs })
        this.circuitBreaker.recordSuccess()
        this._totalRequests++
        return result
      } catch (err) {
        lastErr = err
        if (!isRetryable(err) || attempt >= this.maxRetries) break
        this._totalRetries++
        const delay = err.retryAfter
          ? err.retryAfter * 1000
          : jitteredDelay(attempt, this.baseRetryDelayMs, this.maxRetryDelayMs)
        await sleep(delay)
      }
    }

    this.circuitBreaker.recordFailure()
    this._totalErrors++
    throw lastErr
  }

  /** Returns runtime metrics. */
  stats () {
    return {
      totalRequests: this._totalRequests,
      totalErrors: this._totalErrors,
      totalRetries: this._totalRetries,
      inflightRequests: this._dedup.size(),
      circuitBreaker: this.circuitBreaker.toJSON()
    }
  }
}

// ─── Shared singleton for the Last.fm API ───────────────────────────────────
const lastfmNetworkClient = new NetworkClient({
  maxRetries: 3,
  baseRetryDelayMs: 300,
  maxRetryDelayMs: 15_000,
  requestTimeoutMs: 30_000,
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 2,
    halfOpenTimeout: 60_000
  }
})

module.exports = {
  NetworkClient,
  CircuitBreaker,
  RequestDeduplicator,
  lastfmNetworkClient,
  httpsAgent,
  httpAgent
}
