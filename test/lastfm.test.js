'use strict'

/**
 * Unit tests for the LastFM client (index.js).
 * Uses a stub HTTP server so no real API key is required.
 */

const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')

// Stub network client — intercepts lastfmNetworkClient.request calls
// by pointing LastFM at our local test server.
// We monkey-patch the network module before requiring LastFM.
const networkModule = require('../utils/network.js')

let stubServer
let stubPort
let stubResponse = { status: 200, body: {} }

before(() => new Promise((resolve) => {
  stubServer = http.createServer((req, res) => {
    res.writeHead(stubResponse.status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(stubResponse.body))
  })
  stubServer.listen(0, '127.0.0.1', () => {
    stubPort = stubServer.address().port
    resolve()
  })
}))

after(() => new Promise((resolve) => stubServer.close(resolve)))

// Override the lastfmNetworkClient so LastFM hits our stub server
const origRequest = networkModule.lastfmNetworkClient.request.bind(networkModule.lastfmNetworkClient)
networkModule.lastfmNetworkClient.request = function (opts) {
  const overrideUrl = `http://127.0.0.1:${stubPort}/`
  return origRequest({ ...opts, url: overrideUrl, dedupKey: null })
}

const LastFM = require('../index.js')

function makeClient () {
  return new LastFM('TEST_KEY', { cache: false })
}

// ─── Constructor ─────────────────────────────────────────────────────────────
describe('LastFM constructor', () => {
  it('throws if key is missing', () => {
    assert.throws(() => new LastFM(), /Missing required/)
  })

  it('creates instance with key', () => {
    const lfm = makeClient()
    assert.equal(lfm._key, 'TEST_KEY')
  })

  it('initialises cache when opts.cache is set', () => {
    const lfm = new LastFM('K', { cache: { ttl: 1000 } })
    assert.ok(lfm._cache)
  })
})

// ─── albumSearch ─────────────────────────────────────────────────────────────
describe('LastFM.albumSearch', () => {
  it('returns parsed result', async () => {
    stubResponse = {
      status: 200,
      body: {
        results: {
          'opensearch:totalResults': '2',
          'opensearch:itemsPerPage': '10',
          'opensearch:startIndex': '0',
          albummatches: {
            album: [
              { name: 'Album A', artist: { name: 'Artist A' }, image: [] },
              { name: 'Album B', artist: 'Artist B', image: [] }
            ]
          }
        }
      }
    }
    const lfm = makeClient()
    const data = await new Promise((resolve, reject) => {
      lfm.albumSearch({ q: 'test' }, (err, d) => err ? reject(err) : resolve(d))
    })
    assert.equal(data.result.length, 2)
    assert.equal(data.result[0].type, 'album')
    assert.equal(data.result[0].name, 'Album A')
  })

  it('returns error cb if q is missing', async () => {
    const lfm = makeClient()
    const err = await new Promise((resolve) => {
      lfm.albumSearch({}, (e) => resolve(e))
    })
    assert.match(err.message, /Missing required param/)
  })
})

// ─── artistSearch ────────────────────────────────────────────────────────────
describe('LastFM.artistSearch', () => {
  it('returns parsed artists', async () => {
    stubResponse = {
      status: 200,
      body: {
        results: {
          'opensearch:totalResults': '1',
          'opensearch:itemsPerPage': '10',
          'opensearch:startIndex': '0',
          artistmatches: {
            artist: [
              { name: 'Test Artist', listeners: '500000', image: [] }
            ]
          }
        }
      }
    }
    const lfm = makeClient()
    const data = await new Promise((resolve, reject) => {
      lfm.artistSearch({ q: 'test' }, (err, d) => err ? reject(err) : resolve(d))
    })
    assert.equal(data.result[0].name, 'Test Artist')
    assert.equal(data.result[0].listeners, 500000)
  })
})

// ─── trackSearch ─────────────────────────────────────────────────────────────
describe('LastFM.trackSearch', () => {
  it('returns parsed tracks', async () => {
    stubResponse = {
      status: 200,
      body: {
        results: {
          'opensearch:totalResults': '1',
          'opensearch:itemsPerPage': '10',
          'opensearch:startIndex': '0',
          trackmatches: {
            track: [
              { name: 'Song A', artist: { name: 'Artist A' }, listeners: '1000', duration: '240', image: [] }
            ]
          }
        }
      }
    }
    const lfm = makeClient()
    const data = await new Promise((resolve, reject) => {
      lfm.trackSearch({ q: 'song a' }, (err, d) => err ? reject(err) : resolve(d))
    })
    assert.equal(data.result[0].name, 'Song A')
    assert.equal(data.result[0].type, 'track')
  })
})

// ─── Last.fm API error propagation ───────────────────────────────────────────
describe('LastFM API error propagation', () => {
  it('returns error when API returns error field', async () => {
    stubResponse = {
      status: 200,
      body: { error: 6, message: 'Artist not found' }
    }
    const lfm = makeClient()
    const err = await new Promise((resolve) => {
      lfm.artistInfo({ name: 'Nonexistent' }, (e) => resolve(e))
    })
    assert.match(err.message, /Artist not found/)
  })
})

// ─── Cache behaviour ──────────────────────────────────────────────────────────
describe('LastFM cache', () => {
  it('returns cached result on second call (no extra server hit)', async () => {
    let hits = 0
    const savedRequest = networkModule.lastfmNetworkClient.request
    networkModule.lastfmNetworkClient.request = async () => {
      hits++
      return { statusCode: 200, body: Buffer.from(JSON.stringify({
        results: {
          'opensearch:totalResults': '1',
          'opensearch:itemsPerPage': '10',
          'opensearch:startIndex': '0',
          artistmatches: { artist: [{ name: 'CachedArtist', listeners: '1', image: [] }] }
        }
      })) }
    }
    const lfm = new LastFM('K', { cache: { ttl: 5000 } })
    const fetch = () => new Promise((resolve, reject) => {
      lfm.artistSearch({ q: 'cached' }, (err, d) => err ? reject(err) : resolve(d))
    })
    await fetch()
    await fetch()
    networkModule.lastfmNetworkClient.request = savedRequest
    assert.equal(hits, 1) // second call served from cache
  })
})
