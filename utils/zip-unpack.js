/**
 * zip-unpack — Cut-free zip extraction via RAMDAC double-buffering
 *
 * Streams each zip entry into its own RAMDAC back-buffer and only commits
 * (makes readable) after every byte of that entry has been received.
 * This prevents any "cut" where a consumer could observe a partial file.
 *
 * Security hardening:
 *   - Zip-slip path traversal check: all entry paths are normalised and must
 *     remain within the declared target root.
 *   - Per-entry and total decompressed size caps.
 *
 * @module utils/zip-unpack
 * @version 1.0.0
 */

'use strict'

const path = require('path')
const yauzl = require('yauzl')
const { RAMDAC } = require('./ramdac')

const DEFAULT_MAX_ENTRY_BYTES = 256 * 1024 * 1024  // 256 MB per entry
const DEFAULT_MAX_TOTAL_BYTES = 512 * 1024 * 1024  // 512 MB total

/**
 * Validate that an entry path cannot escape the target root (zip-slip guard).
 *
 * @param {string} entryName   Raw entry name from zip central directory
 * @param {string} targetRoot  Resolved absolute target root
 * @returns {string}           Safe resolved output path
 * @throws {Error}             If path traversal detected
 */
function safeEntryPath (entryName, targetRoot) {
  const resolvedTarget = path.resolve(targetRoot)
  const resolved = path.resolve(resolvedTarget, entryName)
  const targetWithSep = resolvedTarget.endsWith(path.sep)
    ? resolvedTarget
    : resolvedTarget + path.sep
  if (!resolved.startsWith(targetWithSep) && resolved !== resolvedTarget) {
    throw new Error(`zip-unpack: zip-slip detected — entry '${entryName}' escapes root '${targetRoot}'`)
  }
  return resolved
}

/**
 * Unpack a zip archive (from a Buffer or file path) into a Map of RAMDAC instances.
 *
 * Each value in the returned Map is a committed RAMDAC whose `read()` returns
 * the full, uncut Buffer for that zip entry.
 *
 * @param {Buffer|string} source         Buffer of zip data OR absolute file path
 * @param {object}        [opts]
 * @param {string}        [opts.root='/'] Virtual root used for zip-slip checks
 * @param {number}        [opts.maxEntryBytes]  Per-entry decompressed size cap
 * @param {number}        [opts.maxTotalBytes]  Total decompressed size cap
 * @param {function}      [opts.morph]   Optional transform applied to each entry before commit
 *                                       Receives (Buffer, entryName) → Buffer|any
 * @param {function}      [opts.filter]  (entryName) → bool — return false to skip entry
 * @returns {Promise<Map<string, RAMDAC>>}
 */
function unpack (source, opts = {}) {
  const maxEntry = opts.maxEntryBytes || DEFAULT_MAX_ENTRY_BYTES
  const maxTotal = opts.maxTotalBytes || DEFAULT_MAX_TOTAL_BYTES
  const virtualRoot = opts.root ? path.resolve(opts.root) : null

  return new Promise((resolve, reject) => {
    const results = new Map()
    let totalBytes = 0

    const openOpts = { lazyEntries: true, autoClose: true }

    const onZip = (err, zipfile) => {
      if (err) return reject(new Error(`zip-unpack: failed to open zip — ${err.message}`))

      zipfile.readEntry()

      zipfile.on('entry', entry => {
        const name = entry.fileName

        // Skip directories
        if (/\/$/.test(name)) {
          zipfile.readEntry()
          return
        }

        // User-supplied filter
        if (opts.filter && !opts.filter(name)) {
          zipfile.readEntry()
          return
        }

        // Zip-slip guard (only enforced when opts.root is provided)
        if (virtualRoot) {
          try {
            safeEntryPath(name, virtualRoot)
          } catch (slipErr) {
            return reject(slipErr)
          }
        }

        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr) return reject(new Error(`zip-unpack: cannot open stream for '${name}' — ${streamErr.message}`))

          const chunks = []
          let entryBytes = 0

          readStream.on('data', chunk => {
            entryBytes += chunk.length
            totalBytes += chunk.length

            if (entryBytes > maxEntry) {
              readStream.destroy()
              return reject(new RangeError(
                `zip-unpack: entry '${name}' exceeds maxEntryBytes (${maxEntry})`
              ))
            }
            if (totalBytes > maxTotal) {
              readStream.destroy()
              return reject(new RangeError(
                `zip-unpack: total decompressed size exceeds maxTotalBytes (${maxTotal})`
              ))
            }

            chunks.push(chunk)
          })

          readStream.on('error', streamReadErr => {
            reject(new Error(`zip-unpack: read error in '${name}' — ${streamReadErr.message}`))
          })

          readStream.on('end', () => {
            const fullBuffer = Buffer.concat(chunks)
            const ramdac = new RAMDAC({ maxBytes: maxEntry, id: `zip:${name}` })

            // Load raw (already decompressed by yauzl), apply morph, commit atomically
            ramdac.load(fullBuffer, 'raw')
              .then(() => {
                if (opts.morph) {
                  ramdac.morphWith(buf => opts.morph(buf, name))
                }
                ramdac.commit()
                results.set(name, ramdac)
                zipfile.readEntry()
              })
              .catch(reject)
          })
        })
      })

      zipfile.on('end', () => resolve(results))
      zipfile.on('error', zipErr => reject(new Error(`zip-unpack: zip error — ${zipErr.message}`)))
    }

    if (Buffer.isBuffer(source)) {
      yauzl.fromBuffer(source, openOpts, onZip)
    } else if (typeof source === 'string') {
      yauzl.open(source, openOpts, onZip)
    } else {
      reject(new TypeError('zip-unpack: source must be a Buffer or a file path string'))
    }
  })
}

/**
 * Convenience wrapper: unpack and immediately return plain Buffer map.
 * Useful when callers want raw buffers without managing RAMDAC instances.
 *
 * @param {Buffer|string} source
 * @param {object}        [opts]   Same as unpack()
 * @returns {Promise<Map<string, Buffer|*>>}
 */
async function unpackBuffers (source, opts = {}) {
  const ramdacMap = await unpack(source, opts)
  const out = new Map()
  for (const [name, ramdac] of ramdacMap) {
    out.set(name, ramdac.read())
  }
  return out
}

module.exports = { unpack, unpackBuffers, safeEntryPath }
