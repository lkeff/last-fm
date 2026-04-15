/**
 * RAMDAC — RAM Double-buffer Atomic Commit
 *
 * Eliminates "cuts" (partial reads, glitches, stale state) during zip/buffer
 * decompression by decoding into a hidden back-buffer and only swapping it into
 * the front-buffer (committing) once the entire payload is ready.
 *
 * Usage:
 *   const ramdac = new RAMDAC({ maxBytes: 512 * 1024 * 1024 })
 *   await ramdac.load(compressedBuffer)           // decompress into back-buffer
 *   ramdac.morphWith(buf => buf.toString('utf8'))  // optional transform
 *   ramdac.commit()                               // atomic front ← back swap
 *   const data = ramdac.read()                    // always returns complete data
 *
 * @module utils/ramdac
 * @version 1.0.0
 */

'use strict'

const zlib = require('zlib')
const { promisify } = require('util')

const gunzip = promisify(zlib.gunzip)
const inflate = promisify(zlib.inflate)
const brotliDecompress = promisify(zlib.brotliDecompress)

const RAMDAC_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  COMMITTED: 'committed'
}

const DEFAULT_MAX_BYTES = 512 * 1024 * 1024 // 512 MB decompression bomb guard

/**
 * Detect compression format from magic bytes.
 * @param {Buffer} buf
 * @returns {'gzip'|'deflate'|'brotli'|'raw'}
 */
function detectFormat (buf) {
  if (!buf || buf.length < 2) return 'raw'
  // gzip magic: 0x1f 0x8b
  if (buf[0] === 0x1f && buf[1] === 0x8b) return 'gzip'
  // zlib deflate: first byte 0x78 (0x78 0x01, 0x78 0x9c, 0x78 0xda)
  if (buf[0] === 0x78 && (buf[1] === 0x01 || buf[1] === 0x9c || buf[1] === 0xda)) return 'deflate'
  // brotli has no universal magic; treat as raw unless caller specifies
  return 'raw'
}

class RAMDAC {
  /**
   * @param {object} [opts]
   * @param {number} [opts.maxBytes=536870912]  Max decompressed size (bomb guard)
   * @param {string} [opts.id]                  Optional label for debugging
   */
  constructor (opts = {}) {
    this._maxBytes = opts.maxBytes || DEFAULT_MAX_BYTES
    this.id = opts.id || `ramdac-${Date.now()}`

    this._frontBuffer = null
    this._backBuffer = null
    this._status = RAMDAC_STATUS.IDLE
    this._morphFn = null
    this._meta = {}
  }

  /** Current status: idle | loading | ready | committed */
  get status () { return this._status }

  /**
   * Decompress source into the back-buffer.
   * Accepts a Buffer (compressed or raw) or a Promise<Buffer>.
   * Does NOT touch the front-buffer — reads remain safe during loading.
   *
   * @param {Buffer|Promise<Buffer>} source
   * @param {'gzip'|'deflate'|'brotli'|'raw'|'auto'} [format='auto']
   * @returns {Promise<void>}
   */
  async load (source, format = 'auto') {
    this._status = RAMDAC_STATUS.LOADING
    this._backBuffer = null

    let raw
    try {
      raw = Buffer.isBuffer(source) ? source : await Promise.resolve(source)
    } catch (err) {
      this._status = RAMDAC_STATUS.IDLE
      throw new Error(`RAMDAC[${this.id}] load: failed to resolve source — ${err.message}`)
    }

    if (!Buffer.isBuffer(raw)) {
      this._status = RAMDAC_STATUS.IDLE
      throw new TypeError(`RAMDAC[${this.id}] load: source must resolve to a Buffer`)
    }

    const fmt = format === 'auto' ? detectFormat(raw) : format

    let decompressed
    try {
      if (fmt === 'gzip') {
        decompressed = await gunzip(raw)
      } else if (fmt === 'deflate') {
        decompressed = await inflate(raw)
      } else if (fmt === 'brotli') {
        decompressed = await brotliDecompress(raw)
      } else {
        decompressed = raw
      }
    } catch (err) {
      this._status = RAMDAC_STATUS.IDLE
      throw new Error(`RAMDAC[${this.id}] decompression failed (${fmt}) — ${err.message}`)
    }

    if (decompressed.length > this._maxBytes) {
      this._status = RAMDAC_STATUS.IDLE
      throw new RangeError(
        `RAMDAC[${this.id}] decompressed size ${decompressed.length} exceeds maxBytes ${this._maxBytes} (zip-bomb guard)`
      )
    }

    this._backBuffer = decompressed
    this._status = RAMDAC_STATUS.READY
  }

  /**
   * Register a synchronous transform applied to the back-buffer just before commit.
   * The transform receives a Buffer and must return a Buffer or any value.
   * Calling this resets any previously registered transform.
   *
   * @param {function(Buffer): *} fn
   * @returns {this}
   */
  morphWith (fn) {
    if (typeof fn !== 'function') throw new TypeError(`RAMDAC[${this.id}] morphWith: argument must be a function`)
    this._morphFn = fn
    return this
  }

  /**
   * Atomically swap back-buffer → front-buffer.
   * Only succeeds when status is 'ready'.
   * After commit, read() returns the new data immediately with no partial state.
   *
   * @returns {this}
   */
  commit () {
    if (this._status !== RAMDAC_STATUS.READY) {
      throw new Error(
        `RAMDAC[${this.id}] commit: cannot commit in state '${this._status}' — must be 'ready'`
      )
    }

    let payload = this._backBuffer

    if (this._morphFn) {
      try {
        payload = this._morphFn(payload)
      } catch (err) {
        throw new Error(`RAMDAC[${this.id}] morphWith transform threw — ${err.message}`)
      }
      this._morphFn = null
    }

    // Atomic pointer swap — the single critical line
    this._frontBuffer = payload
    this._backBuffer = null
    this._status = RAMDAC_STATUS.COMMITTED
    this._meta.committedAt = Date.now()

    return this
  }

  /**
   * Convenience: load → optional morphWith → commit in one call.
   *
   * @param {Buffer|Promise<Buffer>} source
   * @param {object} [opts]
   * @param {'gzip'|'deflate'|'brotli'|'raw'|'auto'} [opts.format='auto']
   * @param {function(Buffer): *} [opts.morph]   Applied before commit
   * @returns {Promise<this>}
   */
  async loadAndCommit (source, opts = {}) {
    await this.load(source, opts.format || 'auto')
    if (opts.morph) this.morphWith(opts.morph)
    this.commit()
    return this
  }

  /**
   * Read the front-buffer (always complete, never partial).
   * Returns null until at least one successful commit.
   *
   * @returns {Buffer|*|null}
   */
  read () {
    return this._frontBuffer
  }

  /**
   * Reset to idle, discarding both buffers.
   * @returns {this}
   */
  reset () {
    this._frontBuffer = null
    this._backBuffer = null
    this._morphFn = null
    this._status = RAMDAC_STATUS.IDLE
    this._meta = {}
    return this
  }

  /**
   * Diagnostic snapshot.
   * @returns {object}
   */
  inspect () {
    return {
      id: this.id,
      status: this._status,
      frontBufferSize: this._frontBuffer != null
        ? (Buffer.isBuffer(this._frontBuffer) ? this._frontBuffer.length : typeof this._frontBuffer)
        : null,
      backBufferSize: this._backBuffer ? this._backBuffer.length : null,
      maxBytes: this._maxBytes,
      committedAt: this._meta.committedAt || null
    }
  }
}

module.exports = { RAMDAC, RAMDAC_STATUS, detectFormat }
