'use strict'

const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const http = require('http')
const { NetworkClient, CircuitBreaker, RequestDeduplicator } = require('../utils/network.js')

// ─── Minimal HTTP test server ───────────────────────────────────────────────
let server
let serverPort
let serverBehavior = { status: 200, body: '{"ok":true}', delay: 0 }

before(() => new Promise((resolve) => {
  server = http.createServer((req, res) => {
    const respond = () => {
      res.writeHead(serverBehavior.status, { 'Content-Type': 'application/json' })
      res.end(serverBehavior.body)
    }
    if (serverBehavior.delay > 0) setTimeout(respond, serverBehavior.delay)
    else respond()
  })
  server.listen(0, '127.0.0.1', () => {
    serverPort = server.address().port
    resolve()
  })
}))

after(() => new Promise((resolve) => server.close(resolve)))

function baseUrl (path = '/') {
  return `http://127.0.0.1:${serverPort}${path}`
}

// ─── CircuitBreaker ─────────────────────────────────────────────────────────
describe('CircuitBreaker', () => {
  it('starts CLOSED', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    assert.equal(cb.state, 'CLOSED')
    assert.equal(cb.canRequest(), true)
  })

  it('opens after failureThreshold failures', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, halfOpenTimeout: 50_000 })
    cb.recordFailure()
    cb.recordFailure()
    assert.equal(cb.state, 'CLOSED')
    cb.recordFailure()
    assert.equal(cb.state, 'OPEN')
    assert.equal(cb.canRequest(), false)
  })

  it('transitions OPEN → HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, halfOpenTimeout: 50 })
    cb.recordFailure()
    assert.equal(cb.state, 'OPEN')
    await new Promise(r => setTimeout(r, 60))
    assert.equal(cb.canRequest(), true)
    assert.equal(cb.state, 'HALF_OPEN')
  })

  it('closes again after successThreshold successes in HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, halfOpenTimeout: 50, successThreshold: 2 })
    cb.recordFailure()
    await new Promise(r => setTimeout(r, 60))
    cb.canRequest() // triggers HALF_OPEN
    cb.recordSuccess()
    assert.equal(cb.state, 'HALF_OPEN')
    cb.recordSuccess()
    assert.equal(cb.state, 'CLOSED')
  })

  it('re-opens if failure happens in HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, halfOpenTimeout: 50 })
    cb.recordFailure()
    await new Promise(r => setTimeout(r, 60))
    cb.canRequest() // → HALF_OPEN
    cb.recordFailure()
    assert.equal(cb.state, 'OPEN')
  })
})

// ─── RequestDeduplicator ────────────────────────────────────────────────────
describe('RequestDeduplicator', () => {
  it('returns same promise for duplicate keys', () => {
    const dedup = new RequestDeduplicator()
    let calls = 0
    const factory = () => new Promise(r => { calls++; setTimeout(() => r(42), 10) })
    const p1 = dedup.get('k', factory)
    const p2 = dedup.get('k', factory)
    assert.strictEqual(p1, p2)
    assert.equal(calls, 1)
  })

  it('allows a new call after the previous promise settles', async () => {
    const dedup = new RequestDeduplicator()
    let calls = 0
    const factory = () => new Promise(r => { calls++; r(calls) })
    await dedup.get('k', factory)
    await dedup.get('k', factory)
    assert.equal(calls, 2)
  })
})

// ─── NetworkClient ──────────────────────────────────────────────────────────
describe('NetworkClient', () => {
  it('makes a successful GET request', async () => {
    serverBehavior = { status: 200, body: '{"hello":"world"}', delay: 0 }
    const client = new NetworkClient({ maxRetries: 0 })
    const { statusCode, body } = await client.request({ url: baseUrl() })
    assert.equal(statusCode, 200)
    assert.deepEqual(JSON.parse(body.toString()), { hello: 'world' })
  })

  it('retries on 500 and succeeds on third attempt', async () => {
    let attempts = 0
    const retryServer = http.createServer((req, res) => {
      attempts++
      if (attempts < 3) { res.writeHead(500); res.end('err') }
      else { res.writeHead(200); res.end('{"ok":true}') }
    })
    await new Promise(r => retryServer.listen(0, '127.0.0.1', r))
    const port = retryServer.address().port
    const client = new NetworkClient({ maxRetries: 3, baseRetryDelayMs: 5, maxRetryDelayMs: 10 })
    const { statusCode } = await client.request({ url: `http://127.0.0.1:${port}/` })
    await new Promise(r => retryServer.close(r))
    assert.equal(statusCode, 200)
    assert.equal(attempts, 3)
  })

  it('throws ECIRCUITOPEN when circuit is open', async () => {
    const client = new NetworkClient({ maxRetries: 0, circuitBreaker: { failureThreshold: 1, halfOpenTimeout: 60_000 } })
    client.circuitBreaker.recordFailure() // force open
    await assert.rejects(
      () => client.request({ url: baseUrl() }),
      (err) => err.code === 'ECIRCUITOPEN'
    )
  })

  it('deduplicates concurrent identical requests', async () => {
    serverBehavior = { status: 200, body: '{"ok":true}', delay: 20 }
    const client = new NetworkClient({ maxRetries: 0 })
    const url = baseUrl('/dedup')
    const [r1, r2] = await Promise.all([
      client.request({ url, dedupKey: 'same-key' }),
      client.request({ url, dedupKey: 'same-key' })
    ])
    assert.equal(r1.statusCode, 200)
    assert.strictEqual(r1, r2) // same promise, same object reference
  })

  it('exposes stats()', async () => {
    serverBehavior = { status: 200, body: '{}', delay: 0 }
    const client = new NetworkClient({ maxRetries: 0 })
    await client.request({ url: baseUrl() })
    const s = client.stats()
    assert.equal(s.totalRequests, 1)
    assert.equal(typeof s.circuitBreaker.state, 'string')
  })
})
