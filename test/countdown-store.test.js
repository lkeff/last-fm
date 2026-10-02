const { test, describe, beforeEach, afterEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { CountdownManager } = require('../utils/countdown')
const { JsonFileStore } = require('../utils/countdown-store')

describe('JsonFileStore', () => {
  let dir

  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'countdown-')) })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  test('returns [] when the file is missing or corrupt, and round-trips timers', () => {
    const file = path.join(dir, 'nested', 'timers.json')
    const store = new JsonFileStore(file)
    assert.deepEqual(store.load(), { timers: [] })
    store.save({ nextId: 2, timers: [{ id: 1, endsAt: 5 }] })
    assert.deepEqual(store.load(), { nextId: 2, timers: [{ id: 1, endsAt: 5 }] })
    fs.writeFileSync(file, '{not json')
    mock.method(console, 'error', () => {})
    assert.deepEqual(store.load(), { timers: [] })
  })
})

describe('CountdownManager persistence', () => {
  let saved
  const memoryStore = () => ({ load: () => saved, save: state => { saved = state } })

  beforeEach(() => {
    saved = { timers: [] }
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000 })
  })
  afterEach(() => mock.timers.reset())

  test('saves on start, finish and cancel', () => {
    const m = new CountdownManager({ store: memoryStore() })
    const a = m.start({ duration: '1m', ownerId: 'u' })
    const b = m.start({ duration: '2m', ownerId: 'u' })
    assert.deepEqual(saved.timers.map(t => t.id), [a.id, b.id])
    m.cancel(b.id)
    assert.deepEqual(saved.timers.map(t => t.id), [a.id])
    mock.timers.tick(60000)
    assert.deepEqual(saved, { nextId: 3, timers: [] })
  })

  test('ids keep increasing after a restart with no active timers', () => {
    const first = new CountdownManager({ store: memoryStore() })
    const old = first.start({ duration: '10s' })
    first.cancel(old.id)
    const second = new CountdownManager({ store: memoryStore() })
    second.restore()
    assert.ok(second.start({ duration: '10s' }).id > old.id)
    second.cancelAll()
  })

  test('start rolls back and throws when the store cannot save', () => {
    const m = new CountdownManager({ store: { load: () => ({ timers: [] }), save: () => { throw new Error('disk full') } } })
    assert.throws(() => m.start({ duration: '10s' }), /Could not save countdown: disk full/)
    assert.deepEqual(m.list(), [])
  })

  test('restore re-arms pending timers, reports missed ones and continues ids', () => {
    const first = new CountdownManager({ store: memoryStore() })
    const pending = first.start({ duration: '5m', label: 'pending' })
    const expired = first.start({ duration: '1m', label: 'expired' })
    first.stop()
    assert.equal(saved.timers.length, 2)

    mock.timers.tick(4 * 60000) // "offline" for 4 minutes

    const second = new CountdownManager({ store: memoryStore() })
    const events = []
    second.on('alert', (t, ms) => events.push(['alert', t.id, ms]))
    second.on('finish', (t, info) => events.push(['finish', t.id, info.missed]))

    assert.deepEqual(second.restore(), { restored: 1, missed: 1 })
    assert.deepEqual(events, [['finish', expired.id, true]])
    assert.deepEqual(saved.timers.map(t => t.id), [pending.id])
    assert.equal(second.remaining(pending.id), 60000)

    mock.timers.tick(60000)
    assert.deepEqual(events.slice(1), [
      ['alert', pending.id, 30000],
      ['alert', pending.id, 10000],
      ['finish', pending.id, false]
    ])

    const next = second.start({ duration: '10s' })
    assert.ok(next.id > expired.id)
    second.cancelAll()
  })
})
