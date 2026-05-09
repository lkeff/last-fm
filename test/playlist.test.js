'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const {
  parsePls, generatePls,
  parseM3u, generateM3u,
  parseXspf, generateXspf,
  parsePlaylist, generatePlaylist,
  lastfmTracksToPlaylist
} = require('../utils/playlist.js')

// ─── PLS ────────────────────────────────────────────────────────────────────
describe('PLS', () => {
  const sample = `[playlist]

File1=http://stream.example.com/radio
Title1=Example Radio
Length1=-1

File2=/local/music/song.mp3
Title2=Local Song
Length2=210

NumberOfEntries=2
Version=2`

  it('parsePls returns correct track count', () => {
    const tracks = parsePls(sample)
    assert.equal(tracks.length, 2)
  })

  it('parsePls extracts url, title, duration', () => {
    const [t1, t2] = parsePls(sample)
    assert.equal(t1.url, 'http://stream.example.com/radio')
    assert.equal(t1.title, 'Example Radio')
    assert.equal(t1.duration, -1)
    assert.equal(t2.url, '/local/music/song.mp3')
    assert.equal(t2.title, 'Local Song')
    assert.equal(t2.duration, 210)
  })

  it('parsePls tolerates missing title / length', () => {
    const minimal = '[playlist]\nFile1=http://a.com/s\nNumberOfEntries=1\nVersion=2'
    const tracks = parsePls(minimal)
    assert.equal(tracks.length, 1)
    assert.equal(tracks[0].url, 'http://a.com/s')
  })

  it('parsePls returns [] for empty / invalid input', () => {
    assert.deepEqual(parsePls(''), [])
    assert.deepEqual(parsePls('[playlist]\nVersion=2'), [])
  })

  it('generatePls round-trips correctly', () => {
    const tracks = [
      { url: 'http://a.com/1', title: 'Track One', duration: 120 },
      { url: 'http://b.com/2', title: 'Track Two', duration: -1 }
    ]
    const pls = generatePls(tracks)
    const back = parsePls(pls)
    assert.equal(back.length, 2)
    assert.equal(back[0].url, 'http://a.com/1')
    assert.equal(back[0].title, 'Track One')
    assert.equal(back[0].duration, 120)
    assert.equal(back[1].duration, -1)
  })

  it('generatePls throws on non-array input', () => {
    assert.throws(() => generatePls('bad'), TypeError)
  })
})

// ─── M3U ────────────────────────────────────────────────────────────────────
describe('M3U', () => {
  const extended = `#EXTM3U
#EXTINF:180,Artist - Title
http://stream.example.com/audio
#EXTINF:-1,Live Stream
http://live.example.com/stream
`

  it('parseM3u returns correct track count', () => {
    const tracks = parseM3u(extended)
    assert.equal(tracks.length, 2)
  })

  it('parseM3u parses duration and title', () => {
    const [t1, t2] = parseM3u(extended)
    assert.equal(t1.url, 'http://stream.example.com/audio')
    assert.equal(t1.duration, 180)
    assert.equal(t1.title, 'Artist - Title')
    assert.equal(t2.duration, -1)
  })

  it('parseM3u handles bare URLs (no EXTINF)', () => {
    const bare = 'http://a.com/1\nhttp://b.com/2'
    const tracks = parseM3u(bare)
    assert.equal(tracks.length, 2)
    assert.equal(tracks[0].url, 'http://a.com/1')
    assert.equal(tracks[0].duration, -1)
  })

  it('generateM3u round-trips correctly', () => {
    const tracks = [
      { url: 'http://a.com/1', title: 'Song A', artist: 'Artist X', duration: 240 },
      { url: 'http://b.com/2', duration: -1 }
    ]
    const m3u = generateM3u(tracks, { title: 'My List' })
    const back = parseM3u(m3u)
    assert.equal(back.length, 2)
    assert.equal(back[0].url, 'http://a.com/1')
    assert.equal(back[0].duration, 240)
    assert.equal(back[1].url, 'http://b.com/2')
  })

  it('generateM3u throws on non-array', () => {
    assert.throws(() => generateM3u(null), TypeError)
  })
})

// ─── XSPF ───────────────────────────────────────────────────────────────────
describe('XSPF', () => {
  const xspf = `<?xml version="1.0" encoding="UTF-8"?>
<playlist version="1" xmlns="http://xspf.org/ns/0/">
  <trackList>
    <track>
      <location>http://stream.example.com/audio</location>
      <title>My Song</title>
      <creator>Some Artist</creator>
      <album>Some Album</album>
      <duration>180000</duration>
    </track>
    <track>
      <location>http://live.example.com/</location>
    </track>
  </trackList>
</playlist>`

  it('parseXspf returns correct track count', () => {
    const tracks = parseXspf(xspf)
    assert.equal(tracks.length, 2)
  })

  it('parseXspf extracts all fields', () => {
    const [t] = parseXspf(xspf)
    assert.equal(t.url, 'http://stream.example.com/audio')
    assert.equal(t.title, 'My Song')
    assert.equal(t.artist, 'Some Artist')
    assert.equal(t.album, 'Some Album')
    assert.equal(t.duration, 180) // ms → seconds
  })

  it('parseXspf handles track with only location', () => {
    const tracks = parseXspf(xspf)
    assert.equal(tracks[1].url, 'http://live.example.com/')
    assert.equal(tracks[1].title, undefined)
  })

  it('parseXspf returns [] when no trackList', () => {
    assert.deepEqual(parseXspf('<playlist/>'), [])
  })

  it('generateXspf round-trips correctly', () => {
    const tracks = [
      { url: 'http://a.com/1', title: 'A & B', artist: 'Artist <X>', duration: 90 }
    ]
    const xml = generateXspf(tracks, { title: 'Test List' })
    const back = parseXspf(xml)
    assert.equal(back.length, 1)
    assert.equal(back[0].url, 'http://a.com/1')
    assert.equal(back[0].title, 'A & B')
    assert.equal(back[0].artist, 'Artist <X>')
    assert.equal(back[0].duration, 90)
  })
})

// ─── Auto-detect ─────────────────────────────────────────────────────────────
describe('parsePlaylist (auto-detect)', () => {
  it('detects PLS by content', () => {
    const text = '[playlist]\nFile1=http://x.com\nVersion=2'
    assert.equal(parsePlaylist(text)[0].url, 'http://x.com')
  })

  it('detects M3U by content', () => {
    const text = '#EXTM3U\n#EXTINF:10,T\nhttp://x.com'
    assert.equal(parsePlaylist(text)[0].url, 'http://x.com')
  })

  it('detects PLS by filename extension', () => {
    const text = 'File1=http://x.com'
    assert.equal(parsePlaylist(text, { filename: 'list.pls' })[0].url, 'http://x.com')
  })

  it('detects M3U8 by filename extension', () => {
    const text = 'http://x.com/stream'
    assert.equal(parsePlaylist(text, { filename: 'stream.m3u8' })[0].url, 'http://x.com/stream')
  })
})

// ─── generatePlaylist ────────────────────────────────────────────────────────
describe('generatePlaylist', () => {
  const tracks = [{ url: 'http://a.com', title: 'Song', duration: 60 }]

  it('generates M3U by default', () => {
    const { contentType, ext } = generatePlaylist(tracks)
    assert.equal(ext, 'm3u')
    assert.match(contentType, /mpegurl/)
  })

  it('generates PLS on request', () => {
    const { content, ext } = generatePlaylist(tracks, { format: 'pls' })
    assert.equal(ext, 'pls')
    assert.match(content, /\[playlist\]/)
  })

  it('generates XSPF on request', () => {
    const { content, ext } = generatePlaylist(tracks, { format: 'xspf' })
    assert.equal(ext, 'xspf')
    assert.match(content, /<playlist/)
  })
})

// ─── lastfmTracksToPlaylist ──────────────────────────────────────────────────
describe('lastfmTracksToPlaylist', () => {
  it('converts Last.fm track objects to playlist entries', () => {
    const lfmTracks = [
      { name: 'Song A', artistName: 'Artist A', albumName: 'Album A', duration: 200, images: ['sm.jpg', 'lg.jpg'] },
      { name: 'Song B', artistName: 'Artist B' }
    ]
    const playlist = lastfmTracksToPlaylist(lfmTracks)
    assert.equal(playlist.length, 2)
    assert.equal(playlist[0].title, 'Song A')
    assert.equal(playlist[0].artist, 'Artist A')
    assert.equal(playlist[0].album, 'Album A')
    assert.equal(playlist[0].duration, 200)
    assert.equal(playlist[0].image, 'lg.jpg')
    assert.equal(playlist[0].url, '')
  })

  it('uses streamUrlResolver when provided', () => {
    const tracks = [{ name: 'X', artistName: 'Y' }]
    const resolver = (t) => `https://audio.example.com/${encodeURIComponent(t.name)}`
    const playlist = lastfmTracksToPlaylist(tracks, resolver)
    assert.equal(playlist[0].url, 'https://audio.example.com/X')
  })
})
