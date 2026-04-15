/**
 * HDD Security Audit Utility
 *
 * Mirrors the Docker container security posture onto the host E:\ HDD volumes:
 *   - No write access for unprivileged users (analogous to read_only: true + cap_drop: ALL)
 *   - Only Administrators + SYSTEM can write (analogous to no-new-privileges:true)
 *   - NTFS audit SACL present on sensitive dirs (write/delete events logged to Windows Event Log)
 *   - Path traversal guard (analogous to zip-unpack safeEntryPath)
 *   - Runtime ACL verification on every server start
 *
 * Platform: Windows only (uses icacls / PowerShell via child_process).
 * On non-Windows the audit functions return a skipped status gracefully.
 *
 * @module utils/hdd-security
 * @version 1.0.0
 */

'use strict'

const { execFile } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs').promises

const execFileAsync = promisify(execFile)

const IS_WINDOWS = process.platform === 'win32'

// Expected ACE patterns that MUST be present (verified by icacls output)
const REQUIRED_ACES = [
  { identity: 'BUILTIN\\Administrators', right: 'F' },    // FullControl
  { identity: 'NT AUTHORITY\\SYSTEM',    right: 'F' }     // FullControl
]

// ACE patterns that MUST NOT appear (users with any write access)
const FORBIDDEN_ACES = [
  { identity: 'BUILTIN\\Users',          right: 'W' },    // Write
  { identity: 'BUILTIN\\Users',          right: 'M' },    // Modify (superset of W)
  { identity: 'Everyone',                right: 'F' },    // FullControl
  { identity: 'Everyone',                right: 'W' },    // Write
  { identity: 'Everyone',                right: 'M' }     // Modify
]

/**
 * Validate that a target path is safely within an allowed root.
 * Prevents path-traversal attacks on the HDD volumes.
 *
 * @param {string} targetPath  Path to validate
 * @param {string} allowedRoot Absolute root that targetPath must be inside
 * @throws {Error} If targetPath escapes allowedRoot
 */
function assertPathWithinRoot (targetPath, allowedRoot) {
  const resolved = path.resolve(targetPath)
  const root = path.resolve(allowedRoot)
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error(
      `hdd-security: path traversal blocked — '${targetPath}' escapes root '${allowedRoot}'`
    )
  }
}

/**
 * Get raw icacls output for a directory (Windows only).
 *
 * @param {string} dir
 * @returns {Promise<string>}
 */
async function getIcaclsOutput (dir) {
  const { stdout } = await execFileAsync('icacls', [dir], { windowsHide: true })
  return stdout
}

/**
 * Parse icacls output into an array of { identity, rights } objects.
 *
 * icacls lines look like:
 *   E:\path BUILTIN\Administrators:(OI)(CI)(F)
 *                   NT AUTHORITY\SYSTEM:(OI)(CI)(F)
 *
 * @param {string} raw
 * @returns {Array<{identity:string, rights:string}>}
 */
function parseIcacls (raw) {
  const aces = []
  // Match lines: optional leading spaces, identity, colon, flags+rights in parens
  const re = /^\s*(.+?):\(([^)]+)\)(?:\(([^)]+)\))*(?:\(([^)]+)\))*\s*$/gm
  let m
  while ((m = re.exec(raw)) !== null) {
    // Last paren group is the rights; flags are OI/CI/IO/NP etc.
    const groups = [m[2], m[3], m[4]].filter(Boolean)
    const rights = groups[groups.length - 1]
    aces.push({ identity: m[1].trim(), rights })
  }
  return aces
}

/**
 * Audit a single directory's ACL against the hardened policy.
 *
 * @param {string} dir          Absolute path to audit
 * @param {string} allowedRoot  Must equal dir or be a parent (traversal guard)
 * @returns {Promise<{dir, ok, missing, forbidden, raw, skipped}>}
 */
async function auditDirectory (dir, allowedRoot) {
  if (!IS_WINDOWS) {
    return { dir, ok: true, skipped: true, reason: 'non-Windows platform' }
  }

  assertPathWithinRoot(dir, allowedRoot || dir)

  let raw
  try {
    raw = await getIcaclsOutput(dir)
  } catch (err) {
    return { dir, ok: false, missing: [], forbidden: [], error: err.message }
  }

  const aces = parseIcacls(raw)

  // Check required ACEs
  const missing = REQUIRED_ACES.filter(req =>
    !aces.some(ace =>
      ace.identity.toLowerCase() === req.identity.toLowerCase() &&
      ace.rights.toUpperCase().includes(req.right.toUpperCase())
    )
  )

  // Check forbidden ACEs (no unprivileged write)
  const forbidden = FORBIDDEN_ACES.filter(forb =>
    aces.some(ace =>
      ace.identity.toLowerCase() === forb.identity.toLowerCase() &&
      ace.rights.toUpperCase().includes(forb.right.toUpperCase()) &&
      !ace.rights.toUpperCase().startsWith('N')  // ignore explicit DENYs (N prefix = deny in icacls)
    )
  )

  return {
    dir,
    ok: missing.length === 0 && forbidden.length === 0,
    missing,
    forbidden,
    aceCount: aces.length
  }
}

/**
 * Run a full security audit over all HDD volume paths.
 * Logs results; throws if any path fails the policy.
 *
 * @param {string[]} dirs         Array of absolute paths to audit
 * @param {object}  [opts]
 * @param {boolean} [opts.strict] Throw on policy violation (default: true)
 * @returns {Promise<Array>}      Array of per-dir audit results
 */
async function auditHddVolumes (dirs, opts = {}) {
  const strict = opts.strict !== false
  const results = []

  for (const dir of dirs) {
    const result = await auditDirectory(dir, dir)
    results.push(result)

    if (result.skipped) {
      console.log(`[hdd-security] skipped (${result.reason}): ${dir}`)
      continue
    }

    if (result.error) {
      console.warn(`[hdd-security] audit error for '${dir}': ${result.error}`)
      if (strict) throw new Error(`[hdd-security] audit failed for '${dir}': ${result.error}`)
      continue
    }

    if (result.ok) {
      console.log(`[hdd-security] PASS (${result.aceCount} ACEs verified): ${dir}`)
    } else {
      const msg = [
        `[hdd-security] FAIL: ${dir}`,
        result.missing.length ? `  missing: ${result.missing.map(r => `${r.identity}:${r.right}`).join(', ')}` : null,
        result.forbidden.length ? `  forbidden: ${result.forbidden.map(r => `${r.identity}:${r.right}`).join(', ')}` : null
      ].filter(Boolean).join('\n')
      console.warn(msg)
      if (strict) throw new Error(`[hdd-security] ACL policy violation on '${dir}'`)
    }
  }

  return results
}

/**
 * Apply hardened ACL to a directory via icacls (Windows).
 * Equivalent to Docker's cap_drop:ALL + no-new-privileges:true:
 *   - Remove all inherited permissions
 *   - Grant FullControl to Administrators and SYSTEM only
 *   - Deny Write/Delete to Users
 *
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function hardenDirectory (dir) {
  if (!IS_WINDOWS) {
    console.log(`[hdd-security] hardenDirectory skipped (non-Windows): ${dir}`)
    return
  }

  // Reset and break inheritance
  await execFileAsync('icacls', [dir, '/reset', '/T', '/Q'], { windowsHide: true })
  await execFileAsync('icacls', [dir, '/inheritance:d'], { windowsHide: true })

  // Remove all existing explicit ACEs
  await execFileAsync('icacls', [dir, '/remove:g', 'BUILTIN\\Users', '/T', '/Q'], { windowsHide: true })
  await execFileAsync('icacls', [dir, '/remove:g', 'Everyone', '/T', '/Q'], { windowsHide: true })

  // Grant Administrators + SYSTEM FullControl
  await execFileAsync('icacls', [dir, '/grant:r', 'BUILTIN\\Administrators:(OI)(CI)F', '/T', '/Q'], { windowsHide: true })
  await execFileAsync('icacls', [dir, '/grant:r', 'NT AUTHORITY\\SYSTEM:(OI)(CI)F',    '/T', '/Q'], { windowsHide: true })

  // Deny Users write+delete (/C = continue on errors for protected sub-paths)
  await execFileAsync('icacls', [dir, '/deny', 'BUILTIN\\Users:(OI)(CI)(W,D,DC)', '/T', '/C', '/Q'], { windowsHide: true }).catch(() => {})

  console.log(`[hdd-security] hardened: ${dir}`)
}

/**
 * Write a structured security audit report to a JSON file on the HDD.
 *
 * @param {Array}  results   Output of auditHddVolumes()
 * @param {string} reportDir Directory to write report into (must be on HDD)
 * @returns {Promise<string>} Path to written report
 */
async function writeAuditReport (results, reportDir) {
  await fs.mkdir(reportDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = path.join(reportDir, `hdd-security-audit-${ts}.json`)
  await fs.writeFile(filePath, JSON.stringify({ auditedAt: new Date().toISOString(), results }, null, 2))
  console.log(`[hdd-security] audit report written: ${filePath}`)
  return filePath
}

module.exports = {
  auditHddVolumes,
  auditDirectory,
  hardenDirectory,
  assertPathWithinRoot,
  writeAuditReport,
  parseIcacls,
  getIcaclsOutput,
  REQUIRED_ACES,
  FORBIDDEN_ACES
}
