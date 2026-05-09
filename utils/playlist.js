'use strict'

/**
 * Playlist format parser and generator.
 *
 * Supported formats (read + write):
 *   PLS  — Winamp / Shoutcast playlist (INI-style)
 *   M3U  — Extended M3U / M3U8
 *   XSPF — XML Shareable Playlist Format (read + write)
 *   JSON — Internal normalised representation
 *
 * Normalised track object:
 *   {
 *     url:      string   (required — stream URL or file path)
 *     title:    string   (optional)
 *     duration: number   (seconds; -1 = unknown/live)
 *     artist:   string   (optional)
 *     album:    string   (optional)
 *     image:    string   (optional — artwork URL)
 *   }
 */

// ─── PLS ────────────────────────────────────────────────────────────────────

/**
 * Parse a PLS playlist string into an array of track objects.
 * Tolerates whitespace around '=', missing sections header, and mixed case keys.
 */
function parsePls (text) {
  if (typeof text !== 'string') throw new TypeError('parsePls: text must be a string')

  const lines = text.split(/\r?\n/)
  const entries = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('[')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase()
    const val = trimmed.slice(eqIdx + 1).trim()

    const fileMatch = key.match(/^file(\d+)$/)
    if (fileMatch) {
      const n = fileMatch[1]
      entries[n] = entries[n] || {}
      entries[n].url = val
      continue
    }
    const titleMatch = key.match(/^title(\d+)$/)
    if (titleMatch) {
      const n = titleMatch[1]
      entries[n] = entries[n] || {}
      entries[n].title = val
      continue
    }
    const lengthMatch = key.match(/^length(\d+)$/)
    if (lengthMatch) {
      const n = lengthMatch[1]
      entries[n] = entries[n] || {}
      entries[n].duration = parseInt(val, 10)
    }
  }

  return Object.keys(entries)
    .sort((a, b) => Number(a) - Number(b))
    .map(n => entries[n])
    .filter(t => t.url)
}

/**
 * Serialize an array of track objects to PLS format string.
 */
function generatePls (tracks, opts = {}) {
  if (!Array.isArray(tracks)) throw new TypeError('generatePls: tracks must be an array')
  const lines = ['[playlist]', '']
  tracks.forEach((t, i) => {
    const n = i + 1
    lines.push(`File${n}=${t.url || ''}`)
    if (t.title) lines.push(`Title${n}=${t.title}`)
    lines.push(`Length${n}=${t.duration != null ? t.duration : -1}`)
    lines.push('')
  })
  lines.push(`NumberOfEntries=${tracks.length}`)
  lines.push('Version=2')
  return lines.join('\r\n')
}

// ─── M3U / M3U8 ─────────────────────────────────────────────────────────────

/**
 * Parse an M3U or Extended M3U (M3U8) playlist string.
 * Handles #EXTM3U header, #EXTINF directives, and bare URL lines.
 */
function parseM3u (text) {
  if (typeof text !== 'string') throw new TypeError('parseM3u: text must be a string')

  const tracks = []
  const lines = text.split(/\r?\n/)
  let pending = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('#EXTM3U')) continue

    if (line.startsWith('#EXTINF:')) {
      // #EXTINF:<duration>[,<title>]
      // title may include "Artist - Title" format
      const rest = line.slice('#EXTINF:'.length)
      const commaIdx = rest.indexOf(',')
      let duration = -1
      let title = ''
      if (commaIdx === -1) {
        duration = parseInt(rest, 10)
      } else {
        duration = parseInt(rest.slice(0, commaIdx), 10)
        title = rest.slice(commaIdx + 1).trim()
      }
      pending = { duration: isNaN(duration) ? -1 : duration, title }
      continue
    }

    if (line.startsWith('#')) continue // other directives — skip

    // It's a URL / file path
    const track = { url: line }
    if (pending) {
      track.duration = pending.duration
      if (pending.title) track.title = pending.title
      pending = null
    } else {
      track.duration = -1
    }
    tracks.push(track)
  }

  return tracks
}

/**
 * Serialize tracks to Extended M3U format string.
 */
function generateM3u (tracks, opts = {}) {
  if (!Array.isArray(tracks)) throw new TypeError('generateM3u: tracks must be an array')
  const lines = ['#EXTM3U']
  if (opts.title) lines.push(`#PLAYLIST:${opts.title}`)
  lines.push('')

  for (const t of tracks) {
    const dur = t.duration != null ? t.duration : -1
    const label = [t.artist, t.title].filter(Boolean).join(' - ') || t.title || ''
    lines.push(`#EXTINF:${dur},${label}`)
    lines.push(t.url || '')
    lines.push('')
  }

  return lines.join('\n')
}

// ─── XSPF ───────────────────────────────────────────────────────────────────

/**
 * Parse an XSPF (XML Shareable Playlist Format) string.
 * Uses a lightweight regex-based extractor — no external XML parser required.
 */
function parseXspf (text) {
  if (typeof text !== 'string') throw new TypeError('parseXspf: text must be a string')

  const tracks = []
  const trackListMatch = text.match(/<trackList[^>]*>([\s\S]*?)<\/trackList>/i)
  if (!trackListMatch) return tracks

  const trackBlocks = trackListMatch[1].match(/<track[^>]*>([\s\S]*?)<\/track>/ig) || []
  for (const block of trackBlocks) {
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : undefined
    }
    const loc = get('location')
    if (!loc) continue
    const track = { url: loc }
    const title = get('title')
    const creator = get('creator')
    const album = get('album')
    const image = get('image')
    const durMs = get('duration')
    if (title) track.title = title
    if (creator) track.artist = creator
    if (album) track.album = album
    if (image) track.image = image
    if (durMs) track.duration = Math.round(Number(durMs) / 1000)
    tracks.push(track)
  }

  return tracks
}

function _xmlEscape (s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Serialize tracks to XSPF format string.
 */
function generateXspf (tracks, opts = {}) {
  if (!Array.isArray(tracks)) throw new TypeError('generateXspf: tracks must be an array')
  const title = opts.title ? `  <title>${_xmlEscape(opts.title)}</title>\n` : ''
  const creator = opts.creator ? `  <creator>${_xmlEscape(opts.creator)}</creator>\n` : ''

  const trackXml = tracks.map(t => {
    const parts = ['    <track>']
    if (t.url) parts.push(`      <location>${_xmlEscape(t.url)}</location>`)
    if (t.title) parts.push(`      <title>${_xmlEscape(t.title)}</title>`)
    if (t.artist) parts.push(`      <creator>${_xmlEscape(t.artist)}</creator>`)
    if (t.album) parts.push(`      <album>${_xmlEscape(t.album)}</album>`)
    if (t.image) parts.push(`      <image>${_xmlEscape(t.image)}</image>`)
    if (t.duration != null && t.duration >= 0) {
      parts.push(`      <duration>${t.duration * 1000}</duration>`)
    }
    parts.push('    </track>')
    return parts.join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<playlist version="1" xmlns="http://xspf.org/ns/0/">',
    title + creator + `  <trackList>\n${trackXml}\n  </trackList>`,
    '</playlist>'
  ].join('\n')
}

// ─── Auto-detect parser ──────────────────────────────────────────────────────

/**
 * Auto-detect format from content or filename extension and parse.
 * Returns normalised track array.
 */
function parsePlaylist (text, { filename = '', format = null } = {}) {
  if (typeof text !== 'string') throw new TypeError('parsePlaylist: text must be a string')

  const ext = (format || filename.split('.').pop() || '').toLowerCase()

  if (ext === 'pls') return parsePls(text)
  if (ext === 'm3u' || ext === 'm3u8') return parseM3u(text)
  if (ext === 'xspf' || ext === 'xml') return parseXspf(text)

  // Heuristic detection
  const trimmed = text.trim()
  if (trimmed.startsWith('[playlist]') || /^File\d+=/im.test(trimmed)) return parsePls(trimmed)
  if (trimmed.startsWith('#EXTM3U') || trimmed.startsWith('#EXTINF')) return parseM3u(trimmed)
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<playlist')) return parseXspf(trimmed)

  // Fall back to M3U (most permissive)
  return parseM3u(trimmed)
}

/**
 * Serialize tracks to the requested format.
 * format: 'pls' | 'm3u' | 'xspf'
 */
function generatePlaylist (tracks, { format = 'm3u', title, creator } = {}) {
  switch (format.toLowerCase()) {
    case 'pls': return { content: generatePls(tracks), contentType: 'audio/x-scpls', ext: 'pls' }
    case 'xspf': return { content: generateXspf(tracks, { title, creator }), contentType: 'application/xspf+xml', ext: 'xspf' }
    default: return { content: generateM3u(tracks, { title }), contentType: 'audio/x-mpegurl', ext: 'm3u' }
  }
}

/**
 * Convert a Last.fm track result array (from index.js) to normalised playlist tracks.
 * Optionally supply a streamUrlResolver(track) -> url to populate the url field.
 */
function lastfmTracksToPlaylist (tracks, streamUrlResolver = null) {
  return tracks.map(t => {
    const url = streamUrlResolver ? streamUrlResolver(t) : ''
    const entry = { url, title: t.name, duration: t.duration || -1 }
    if (t.artistName) entry.artist = t.artistName
    if (t.albumName) entry.album = t.albumName
    if (t.images && t.images.length > 0) entry.image = t.images[t.images.length - 1]
    return entry
  })
}

module.exports = {
  // PLS
  parsePls,
  generatePls,
  // M3U
  parseM3u,
  generateM3u,
  // XSPF
  parseXspf,
  generateXspf,
  // Auto-detect
  parsePlaylist,
  generatePlaylist,
  // Last.fm helper
  lastfmTracksToPlaylist
}
