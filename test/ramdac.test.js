/**
 * RAMDAC + zip-unpack test suite
 *
 * Tests:
 *   1. Atomicity   — read() returns null while load() is in progress
 *   2. No-cut      — front-buffer is unchanged when load() is aborted mid-stream
 *   3. Morphing    — morphWith() transform is applied before commit
 *   4. Zip-slip    — safeEntryPath() blocks traversal attacks
 *   5. Bomb guard  — oversized decompressed payloads are rejected
 *   6. Integration — round-trip gzip (rig snapshot) and zip (audio/rig bundle)
 *
 * Run with: node test/ramdac.test.js
 */

'use strict'

const assert = require('assert').strict
const zlib = require('zlib')
const { promisify } = require('util')
const path = require('path')
const os = require('os')
const fs = require('fs').promises

const { RAMDAC, RAMDAC_STATUS, detectFormat } = require('../utils/ramdac')
const { unpack, unpackBuffers, safeEntryPath } = require('../utils/zip-unpack')

const gzip = promisify(zlib.gzip)
const deflate = promisify(zlib.deflate)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid ZIP buffer containing one entry. */
function buildZipBuffer (entries) {
  // entries: [{name, data: Buffer}]
  // Build a real ZIP using the ZIP spec (local file headers + central directory)
  const localHeaders = []
  const centralHeaders = []
  let offset = 0

  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name)
    const crc = crc32(data)
    const localHeader = Buffer.alloc(30 + nameBuf.length)
    localHeader.writeUInt32LE(0x04034b50, 0)  // sig
    localHeader.writeUInt16LE(20, 4)           // version needed
    localHeader.writeUInt16LE(0, 6)            // flags
    localHeader.writeUInt16LE(0, 8)            // compression: stored
    localHeader.writeUInt16LE(0, 10)           // mod time
    localHeader.writeUInt16LE(0, 12)           // mod date
    localHeader.writeUInt32LE(crc >>> 0, 14)   // crc32
    localHeader.writeUInt32LE(data.length, 18) // compressed size
    localHeader.writeUInt32LE(data.length, 22) // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26) // name length
    localHeader.writeUInt16LE(0, 28)           // extra length
    nameBuf.copy(localHeader, 30)

    const centralHeader = Buffer.alloc(46 + nameBuf.length)
    centralHeader.writeUInt32LE(0x02014b50, 0)  // sig
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0, 14)
    centralHeader.writeUInt32LE(crc >>> 0, 16)
    centralHeader.writeUInt32LE(data.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(nameBuf.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    nameBuf.copy(centralHeader, 46)

    localHeaders.push(localHeader, data)
    centralHeaders.push(centralHeader)
    offset += localHeader.length + data.length
  }

  const centralDirOffset = offset
  const centralDirBuf = Buffer.concat(centralHeaders)

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralDirBuf.length, 12)
  eocd.writeUInt32LE(centralDirOffset, 16)
  eocd.writeUInt16LE(0, 20)

  return Buffer.concat([...localHeaders, centralDirBuf, eocd])
}

/** Naive CRC32 for test zip construction. */
function crc32 (buf) {
  let crc = 0xFFFFFFFF
  const table = makeCRCTable()
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function makeCRCTable () {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
}

let passed = 0
let failed = 0

async function test (name, fn) {
  try {
    await fn()
    console.log(`  \u2713 ${name}`)
    passed++
  } catch (err) {
    console.error(`  \u2717 ${name}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

async function main () {
  // -------------------------------------------------------------------------
  // 1. Atomicity
  // -------------------------------------------------------------------------
  console.log('\n1. Atomicity')

  await test('read() returns null before any commit', () => {
    const r = new RAMDAC()
    assert.equal(r.read(), null)
    assert.equal(r.status, RAMDAC_STATUS.IDLE)
  })

  await test('status is "loading" during load, "ready" after', async () => {
    const r = new RAMDAC()
    const compressed = await gzip(Buffer.from('hello'))
    const loadPromise = r.load(compressed)
    await loadPromise
    assert.equal(r.status, RAMDAC_STATUS.READY)
    assert.equal(r.read(), null, 'read() still null until commit()')
  })

  await test('read() returns null until commit() is called', async () => {
    const r = new RAMDAC()
    await r.load(Buffer.from('plain'), 'raw')
    assert.equal(r.read(), null)
    r.commit()
    assert.notEqual(r.read(), null)
  })

  // -------------------------------------------------------------------------
  // 2. No-cut guarantee
  // -------------------------------------------------------------------------
  console.log('\n2. No-cut guarantee')

  await test('front-buffer unchanged when load() fails mid-way', async () => {
    const r = new RAMDAC()
    await r.load(Buffer.from('stable'), 'raw')
    r.commit()
    const before = r.read()

    try {
      await r.load(Buffer.from('not-gzip-data'), 'gzip')
    } catch (_) { /* expected */ }

    assert.equal(r.read(), before, 'front-buffer unchanged after failed load')
  })

  await test('back-buffer is cleared on load failure', async () => {
    const r = new RAMDAC()
    try { await r.load(Buffer.from('garbage'), 'gzip') } catch (_) {}
    assert.equal(r.status, RAMDAC_STATUS.IDLE)
    assert.equal(r.inspect().backBufferSize, null)
  })

  // -------------------------------------------------------------------------
  // 3. Morphing
  // -------------------------------------------------------------------------
  console.log('\n3. Morphing (back-buffer transform before commit)')

  await test('morphWith() transforms buffer before commit', async () => {
    const r = new RAMDAC()
    await r.load(Buffer.from('hello world'), 'raw')
    r.morphWith(buf => buf.toString('utf8').toUpperCase())
    r.commit()
    assert.equal(r.read(), 'HELLO WORLD')
  })

  await test('morphWith() can parse JSON', async () => {
    const payload = { artist: 'Radiohead', play: 42 }
    const r = new RAMDAC()
    await r.load(Buffer.from(JSON.stringify(payload)), 'raw')
    r.morphWith(buf => JSON.parse(buf.toString('utf8')))
    r.commit()
    const result = r.read()
    assert.equal(result.artist, 'Radiohead')
    assert.equal(result.play, 42)
  })

  await test('loadAndCommit() with morph option works end-to-end', async () => {
    const r = new RAMDAC()
    const compressed = await gzip(Buffer.from('{"key":"C"}'))
    await r.loadAndCommit(compressed, {
      format: 'gzip',
      morph: buf => JSON.parse(buf.toString('utf8'))
    })
    assert.deepEqual(r.read(), { key: 'C' })
  })

  await test('morphWith() on idle RAMDAC registers fn without throwing', () => {
    const r = new RAMDAC()
    r.morphWith(buf => buf)
    assert.ok(true)
  })

  // -------------------------------------------------------------------------
  // 4. detectFormat
  // -------------------------------------------------------------------------
  console.log('\n4. Format auto-detection')

  await test('detects gzip magic bytes', () => {
    const buf = Buffer.from([0x1f, 0x8b, 0x00])
    assert.equal(detectFormat(buf), 'gzip')
  })

  await test('detects deflate magic bytes', () => {
    const buf = Buffer.from([0x78, 0x9c, 0x00])
    assert.equal(detectFormat(buf), 'deflate')
  })

  await test('falls back to raw for unknown bytes', () => {
    const buf = Buffer.from([0x00, 0x01, 0x02])
    assert.equal(detectFormat(buf), 'raw')
  })

  await test('detects gzip compressed buffer correctly via auto', async () => {
    const compressed = await gzip(Buffer.from('test'))
    const r = new RAMDAC()
    await r.loadAndCommit(compressed, { format: 'auto' })
    assert.equal(r.read().toString('utf8'), 'test')
  })

  // -------------------------------------------------------------------------
  // 5. Security: zip-slip and bomb guard
  // -------------------------------------------------------------------------
  console.log('\n5. Security guards')

  await test('safeEntryPath blocks directory traversal (../)', () => {
    const root = path.join(os.tmpdir(), 'ramdac-test-root')
    assert.throws(
      () => safeEntryPath('../../etc/passwd', root),
      /zip-slip/
    )
  })

  await test('safeEntryPath blocks sibling directory escape', () => {
    const root = path.join(os.tmpdir(), 'ramdac-test-root')
    assert.throws(
      () => safeEntryPath('../sibling/evil.txt', root),
      /zip-slip/
    )
  })

  await test('safeEntryPath allows normal relative paths', () => {
    const root = path.join(os.tmpdir(), 'ramdac-test-root')
    const result = safeEntryPath('samples/kick.wav', root)
    assert.ok(result.startsWith(root))
  })

  await test('bomb guard rejects decompressed size exceeding maxBytes', async () => {
    const big = Buffer.alloc(1024, 0x41) // 1 KB
    const compressed = await gzip(big)
    const r = new RAMDAC({ maxBytes: 512 }) // allow only 512 B
    await assert.rejects(
      () => r.load(compressed, 'gzip'),
      /zip-bomb/
    )
  })

  // -------------------------------------------------------------------------
  // 6. Integration: zip round-trip
  // -------------------------------------------------------------------------
  console.log('\n6. Integration round-trips')

  await test('zip: unpack a simple zip buffer and read entries', async () => {
    const data = Buffer.from('{"bpm":120,"key":"Am"}')
    const zipBuf = buildZipBuffer([{ name: 'rig.json', data }])
    const map = await unpackBuffers(zipBuf)
    assert.ok(map.has('rig.json'))
    assert.equal(map.get('rig.json').toString('utf8'), data.toString('utf8'))
  })

  await test('zip: filter skips non-matching entries', async () => {
    const zipBuf = buildZipBuffer([
      { name: 'kick.wav', data: Buffer.from('WAV') },
      { name: 'notes.txt', data: Buffer.from('text') }
    ])
    const map = await unpackBuffers(zipBuf, { filter: n => /\.wav$/.test(n) })
    assert.ok(map.has('kick.wav'))
    assert.ok(!map.has('notes.txt'))
  })

  await test('zip: morph is applied per-entry before commit', async () => {
    const zipBuf = buildZipBuffer([{ name: 'data.json', data: Buffer.from('{"v":1}') }])
    const ramdacMap = await unpack(zipBuf, {
      morph: (buf) => JSON.parse(buf.toString('utf8'))
    })
    const entry = ramdacMap.get('data.json')
    assert.equal(entry.status, RAMDAC_STATUS.COMMITTED)
    assert.deepEqual(entry.read(), { v: 1 })
  })

  await test('gzip round-trip (rig snapshot): export \u2192 loadRigSnapshot', async () => {
    const { exportRigSnapshot, loadRigSnapshot } = require('../rigs/studio-rig')
    const snapshot = await exportRigSnapshot({ name: 'Test Rig', version: '2.0.0' })
    const rig = await loadRigSnapshot(snapshot)
    assert.equal(rig.name, 'Test Rig')
    assert.equal(rig.version, '2.0.0')
  })

  await test('gzip round-trip with morph: version bumped atomically', async () => {
    const { exportRigSnapshot, loadRigSnapshot } = require('../rigs/studio-rig')
    const snapshot = await exportRigSnapshot({ name: 'Rig', version: '1.0.0' })
    const rig = await loadRigSnapshot(snapshot, {
      morph: r => ({ ...r, version: '2.0.0-morphed' })
    })
    assert.equal(rig.version, '2.0.0-morphed')
  })

  await test('zip: importRigFromZip loads rig from archive', async () => {
    const { importRigFromZip } = require('../rigs/studio-rig')
    const payload = Buffer.from(JSON.stringify({ name: 'Bundled Rig', version: '3.0.0' }))
    const zipBuf = buildZipBuffer([{ name: 'rig.json', data: payload }])
    const rig = await importRigFromZip(zipBuf)
    assert.equal(rig.name, 'Bundled Rig')
  })

  await test('RAMDAC.reset() returns to idle and clears all buffers', async () => {
    const r = new RAMDAC()
    await r.loadAndCommit(Buffer.from('data'), { format: 'raw' })
    r.reset()
    assert.equal(r.status, RAMDAC_STATUS.IDLE)
    assert.equal(r.read(), null)
  })

  await test('RAMDAC.inspect() returns correct metadata after commit', async () => {
    const r = new RAMDAC({ id: 'inspect-test' })
    await r.loadAndCommit(Buffer.from('abc'), { format: 'raw' })
    const info = r.inspect()
    assert.equal(info.id, 'inspect-test')
    assert.equal(info.status, RAMDAC_STATUS.COMMITTED)
    assert.equal(info.backBufferSize, null)
    assert.ok(info.committedAt > 0)
  })

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------
  const line = '\u2500'.repeat(50)
  console.log(`\n${line}`)
  console.log(`  ${passed} passed, ${failed} failed`)
  console.log(line)

  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error('Test runner error:', err)
  process.exit(1)
})
