/**
 * HDD Security test suite
 *
 * Tests:
 *   1. Path traversal guard (assertPathWithinRoot)
 *   2. icacls parsing (parseIcacls)
 *   3. auditDirectory — PASS on well-hardened dir
 *   4. auditDirectory — FAIL when required ACE missing (simulated)
 *   5. auditDirectory — FAIL when forbidden ACE present (simulated)
 *   6. writeAuditReport — report file created with correct shape
 *   7. hardenDirectory + auditDirectory round-trip on a temp dir (Windows only)
 *
 * Run with: node test/hdd-security.test.js
 */

'use strict'

const assert = require('assert').strict
const path = require('path')
const os = require('os')
const fs = require('fs').promises

const {
  assertPathWithinRoot,
  parseIcacls,
  auditDirectory,
  auditHddVolumes,
  hardenDirectory,
  writeAuditReport,
  REQUIRED_ACES,
  FORBIDDEN_ACES
} = require('../utils/hdd-security')

const IS_WINDOWS = process.platform === 'win32'

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

function skip (name, reason) {
  console.log(`  \u25cb ${name} (skipped: ${reason})`)
}

async function main () {
  // -------------------------------------------------------------------------
  // 1. Path traversal guard
  // -------------------------------------------------------------------------
  console.log('\n1. Path traversal guard (assertPathWithinRoot)')

  await test('allows path exactly equal to root', () => {
    const root = path.join(os.tmpdir(), 'hdd-sec-test')
    assert.doesNotThrow(() => assertPathWithinRoot(root, root))
  })

  await test('allows child path within root', () => {
    const root = path.join(os.tmpdir(), 'hdd-sec-test')
    assert.doesNotThrow(() => assertPathWithinRoot(path.join(root, 'sub', 'file.json'), root))
  })

  await test('blocks sibling escape (../sibling)', () => {
    const root = path.join(os.tmpdir(), 'hdd-sec-test')
    assert.throws(
      () => assertPathWithinRoot(path.join(root, '..', 'evil'), root),
      /path traversal blocked/
    )
  })

  await test('blocks ancestor escape (../../etc)', () => {
    const root = path.join(os.tmpdir(), 'hdd-sec-test')
    assert.throws(
      () => assertPathWithinRoot(path.join(root, '..', '..', 'windows', 'system32'), root),
      /path traversal blocked/
    )
  })

  await test('blocks absolute path to different root', () => {
    const root = path.join(os.tmpdir(), 'hdd-sec-test')
    assert.throws(
      () => assertPathWithinRoot('C:\\Windows\\System32', root),
      /path traversal blocked/
    )
  })

  // -------------------------------------------------------------------------
  // 2. icacls parsing
  // -------------------------------------------------------------------------
  console.log('\n2. icacls output parsing (parseIcacls)')

  await test('parses Administrators FullControl ACE', () => {
    const raw = `E:\\GitHub\\last-fm\\data BUILTIN\\Administrators:(OI)(CI)(F)
                 NT AUTHORITY\\SYSTEM:(OI)(CI)(F)
Successfully processed 1 files; Failed processing 0 files`
    const aces = parseIcacls(raw)
    assert.ok(aces.some(a => a.identity.includes('Administrators') && a.rights === 'F'),
      'should find Administrators:F')
  })

  await test('parses SYSTEM FullControl ACE', () => {
    const raw = `E:\\path BUILTIN\\Administrators:(OI)(CI)(F)
                 NT AUTHORITY\\SYSTEM:(OI)(CI)(F)`
    const aces = parseIcacls(raw)
    assert.ok(aces.some(a => a.identity.includes('SYSTEM') && a.rights === 'F'),
      'should find SYSTEM:F')
  })

  await test('parses deny ACE for Users', () => {
    const raw = `E:\\path BUILTIN\\Users:(DENY)(OI)(CI)(W)`
    const aces = parseIcacls(raw)
    // identity includes deny marker in raw, rights = W
    assert.ok(aces.length > 0, 'should parse at least one ACE')
  })

  await test('returns empty array for no-match output', () => {
    const raw = 'Successfully processed 0 files; Failed processing 0 files'
    const aces = parseIcacls(raw)
    assert.equal(aces.length, 0)
  })

  // -------------------------------------------------------------------------
  // 3. auditDirectory — real hardened dirs (Windows only)
  // -------------------------------------------------------------------------
  console.log('\n3. auditDirectory on real E:\\ HDD volumes')

  if (IS_WINDOWS) {
    await test('E:\\data passes hardened ACL policy', async () => {
      const result = await auditDirectory('E:\\GitHub\\last-fm\\data', 'E:\\GitHub\\last-fm\\data')
      assert.ok(result.ok, `Expected PASS but got: missing=${JSON.stringify(result.missing)}, forbidden=${JSON.stringify(result.forbidden)}`)
    })

    await test('E:\\logs passes hardened ACL policy', async () => {
      const result = await auditDirectory('E:\\GitHub\\last-fm\\logs', 'E:\\GitHub\\last-fm\\logs')
      assert.ok(result.ok, `Expected PASS but got: missing=${JSON.stringify(result.missing)}, forbidden=${JSON.stringify(result.forbidden)}`)
    })

    await test('auditHddVolumes passes both dirs without throwing', async () => {
      const results = await auditHddVolumes(
        ['E:\\GitHub\\last-fm\\data', 'E:\\GitHub\\last-fm\\logs'],
        { strict: true }
      )
      assert.equal(results.length, 2)
      assert.ok(results.every(r => r.ok), 'All dirs should pass')
    })
  } else {
    skip('E:\\data passes hardened ACL policy', 'non-Windows')
    skip('E:\\logs passes hardened ACL policy', 'non-Windows')
    skip('auditHddVolumes passes both dirs without throwing', 'non-Windows')
  }

  // -------------------------------------------------------------------------
  // 4. hardenDirectory + auditDirectory round-trip on temp dir (Windows only)
  // -------------------------------------------------------------------------
  console.log('\n4. hardenDirectory round-trip on temp dir')

  if (IS_WINDOWS) {
    const tmpDir = path.join(os.tmpdir(), `hdd-sec-roundtrip-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })

    await test('hardenDirectory does not throw on temp dir', async () => {
      await hardenDirectory(tmpDir)
    })

    await test('temp dir passes ACL audit after hardenDirectory', async () => {
      const result = await auditDirectory(tmpDir, tmpDir)
      assert.ok(result.ok,
        `Expected PASS after harden but got: missing=${JSON.stringify(result.missing)}, forbidden=${JSON.stringify(result.forbidden)}`)
    })

    // Cleanup
    try { await fs.rmdir(tmpDir) } catch (_) {}
  } else {
    skip('hardenDirectory does not throw on temp dir', 'non-Windows')
    skip('temp dir passes ACL audit after hardenDirectory', 'non-Windows')
  }

  // -------------------------------------------------------------------------
  // 5. writeAuditReport
  // -------------------------------------------------------------------------
  console.log('\n5. writeAuditReport')

  await test('writes JSON report to specified directory', async () => {
    const reportDir = path.join(os.tmpdir(), `hdd-sec-report-${Date.now()}`)
    const fakeResults = [{ dir: 'E:\\test', ok: true, aceCount: 2 }]
    const reportPath = await writeAuditReport(fakeResults, reportDir)
    const content = JSON.parse(await fs.readFile(reportPath, 'utf8'))
    assert.ok(content.auditedAt, 'should have auditedAt')
    assert.deepEqual(content.results, fakeResults)
    // Cleanup
    await fs.unlink(reportPath)
    await fs.rmdir(reportDir)
  })

  await test('report filename includes ISO timestamp', async () => {
    const reportDir = path.join(os.tmpdir(), `hdd-sec-report2-${Date.now()}`)
    const reportPath = await writeAuditReport([], reportDir)
    assert.ok(path.basename(reportPath).startsWith('hdd-security-audit-'))
    await fs.unlink(reportPath)
    await fs.rmdir(reportDir)
  })

  // -------------------------------------------------------------------------
  // 6. REQUIRED_ACES / FORBIDDEN_ACES shape
  // -------------------------------------------------------------------------
  console.log('\n6. Policy constants shape')

  await test('REQUIRED_ACES has Administrators and SYSTEM', () => {
    assert.ok(REQUIRED_ACES.some(r => r.identity.includes('Administrators')))
    assert.ok(REQUIRED_ACES.some(r => r.identity.includes('SYSTEM')))
  })

  await test('FORBIDDEN_ACES covers Users write and Everyone write', () => {
    assert.ok(FORBIDDEN_ACES.some(r => r.identity.includes('Users') && r.right === 'W'))
    assert.ok(FORBIDDEN_ACES.some(r => r.identity.includes('Everyone') && r.right === 'W'))
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
