'use strict'

const zlib = require('zlib')
const { PassThrough } = require('stream')

const GZIP_MAGIC = Buffer.from([0x1f, 0x8b])
const DEFLATE_MAGIC_1 = 0x78
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

function detectCompression (header) {
  if (header.length >= 2 && header.slice(0, 2).equals(GZIP_MAGIC)) {
    return 'gzip'
  }
  if (header.length >= 4 && header.slice(0, 4).equals(ZIP_MAGIC)) {
    return 'zip'
  }
  if (header.length >= 1 && header[0] === DEFLATE_MAGIC_1) {
    return 'deflate'
  }
  return null
}

function buildDecompressStream (encoding) {
  if (encoding === 'gzip') return zlib.createGunzip()
  if (encoding === 'deflate') return zlib.createInflate()
  return null
}

function contentEncodingDecoder (contentEncoding) {
  if (!contentEncoding) return null
  const enc = contentEncoding.toLowerCase().trim()
  if (enc === 'gzip' || enc === 'x-gzip') return zlib.createGunzip()
  if (enc === 'deflate') return zlib.createInflate()
  if (enc === 'br') return zlib.createBrotliDecompress()
  return null
}

function pipeDecompressed (sourceStream, contentEncoding) {
  const headerDecoder = contentEncodingDecoder(contentEncoding)
  if (headerDecoder) {
    const out = new PassThrough()
    sourceStream.pipe(headerDecoder).pipe(out)
    headerDecoder.on('error', err => out.destroy(err))
    return out
  }

  const out = new PassThrough()
  const chunks = []
  let sniffed = false

  sourceStream.on('data', chunk => {
    if (!sniffed) {
      chunks.push(chunk)
      const header = Buffer.concat(chunks)
      if (header.length < 4) return
      sniffed = true

      const detected = detectCompression(header)
      if (detected === 'zip') {
        out.destroy(new Error('Raw .zip archives are not streamable; serve the inner audio file directly.'))
        return
      }

      const decoder = buildDecompressStream(detected)
      if (decoder) {
        decoder.on('error', err => out.destroy(err))
        decoder.pipe(out)
        decoder.write(header)
        sourceStream.pipe(decoder)
      } else {
        out.write(header)
        sourceStream.pipe(out)
      }
    }
  })

  sourceStream.on('error', err => out.destroy(err))
  sourceStream.on('end', () => {
    if (!sniffed) {
      const header = Buffer.concat(chunks)
      out.write(header)
      out.end()
    }
  })

  return out
}

module.exports = { pipeDecompressed, detectCompression, contentEncodingDecoder }
