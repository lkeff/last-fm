const { test, describe, beforeEach, afterEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { CountdownManager, countdownOptionsFromEnv, parseDuration, formatDuration } = require('../utils/countdown')

describe('parseDuration', () => {
  test('parses plain seconds, units and clock notation', () => {
    assert.equal(parseDuration('90'), 90000)
    assert.equal(parseDuration(45), 45000)
    assert.equal(parseDuration('45s'), 45000)
    assert.equal(parseDuration('5m'), 300000)
    assert.equal(parseDuration('1h30m'), 5400000)
    assert.equal(parseDuration('1h 2m 3s'), 3723000)
    assert.equal(parseDuration('1:30'), 90000)
    assert.equal(parseDuration('01:02:03'), 3723000)
  })

  test('rejects invalid input', () => {
    for (const bad of ['', 'abc', '0', '0s', '5x', '1:75', '5m5m', -3, null]) {
      assert.throws(() => parseDuration(bad), undefined, `expected "${bad}" to throw`)
    }
  })
})

describe('formatDuration', () => {
  test('formats compactly and rounds up partial seconds', () => {
    assert.equal(formatDuration(0), '0s')
    assert.equal(formatDuration(45000), '45s')
    assert.equal(formatDuration(44001), '45s')
    assert.equal(formatDuration(90000), '1m 30s')
    assert.equal(formatDuration(3600000), '1h')
    assert.equal(formatDuration(3723000), '1h 2m 3s')
  })
})

describe('CountdownManager', () => {
  let manager

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    manager = new CountdownManager()
  })

  afterEach(() => {
    manager.cancelAll()
    mock.timers.reset()
  })

  test('emits alerts at 60/30/10s remaining and then finishes', () => {
    const events = []
    manager.on('alert', (t, remaining) => events.push(['alert', t.id, remaining]))
    manager.on('finish', t => events.push(['finish', t.id]))

    const timer = manager.start({ duration: '2m', label: 'Tea' })
    assert.equal(timer.label, 'Tea')

    mock.timers.tick(59000)
    assert.deepEqual(events, [])
    mock.timers.tick(1000)
    assert.deepEqual(events, [['alert', timer.id, 60000]])
    mock.timers.tick(30000)
    mock.timers.tick(20000)
    assert.equal(manager.remaining(timer.id), 10000)
    mock.timers.tick(10000)
    assert.deepEqual(events, [
      ['alert', timer.id, 60000],
      ['alert', timer.id, 30000],
      ['alert', timer.id, 10000],
      ['finish', timer.id]
    ])
    assert.equal(manager.get(timer.id), null)
  })

  test('skips alerts that are not shorter than the duration', () => {
    const alerts = []
    manager.on('alert', (_t, remaining) => alerts.push(remaining))
    manager.start({ duration: 30000 })
    mock.timers.tick(30000)
    assert.deepEqual(alerts, [10000])
  })

  test('cancel stops pending events and respects ownership', () => {
    const events = []
    manager.on('alert', () => events.push('alert'))
    manager.on('finish', () => events.push('finish'))
    manager.on('cancel', t => events.push(`cancel:${t.id}`))

    const timer = manager.start({ duration: '5m', ownerId: 'alice' })
    assert.equal(manager.cancel(timer.id, 'bob'), false)
    assert.equal(manager.cancel(timer.id, 'alice'), true)
    assert.equal(manager.cancel(timer.id, 'alice'), false)
    mock.timers.tick(5 * 60000)
    assert.deepEqual(events, [`cancel:${timer.id}`])
  })

  test('lists timers soonest first with filters', () => {
    const a = manager.start({ duration: '10m', ownerId: 'alice', channelId: 'c1' })
    const b = manager.start({ duration: '1m', ownerId: 'bob', channelId: 'c1' })
    const c = manager.start({ duration: '5m', ownerId: 'alice', channelId: 'c2' })
    assert.deepEqual(manager.list().map(t => t.id), [b.id, c.id, a.id])
    assert.deepEqual(manager.list({ ownerId: 'alice' }).map(t => t.id), [c.id, a.id])
    assert.deepEqual(manager.list({ channelId: 'c1' }).map(t => t.id), [b.id, a.id])
  })

  test('enforces max duration and per-owner limits', () => {
    const limited = new CountdownManager({ maxDurationMs: 60000, maxPerOwner: 2 })
    assert.throws(() => limited.start({ duration: '2m' }), /maximum/)
    limited.start({ duration: '30s', ownerId: 'alice' })
    limited.start({ duration: '30s', ownerId: 'alice' })
    assert.throws(() => limited.start({ duration: '30s', ownerId: 'alice' }), /active countdowns/)
    limited.start({ duration: '30s', ownerId: 'bob' })
    limited.cancelAll()
    assert.deepEqual(limited.list(), [])
  })
})

test('countdownOptionsFromEnv reads env with defaults, and max duration is clamped to the setTimeout limit', () => {
  assert.deepEqual(countdownOptionsFromEnv({}), { alertsAt: [60, 30, 10], maxDurationMs: 24 * 3600000, maxPerOwner: 5 })
  assert.deepEqual(
    countdownOptionsFromEnv({ COUNTDOWN_ALERTS: '120, x, 5', COUNTDOWN_MAX_HOURS: '2', COUNTDOWN_MAX_PER_USER: '3' }),
    { alertsAt: [120, 5], maxDurationMs: 2 * 3600000, maxPerOwner: 3 }
  )
  assert.equal(new CountdownManager({ maxDurationMs: 1000 * 3600000 }).maxDurationMs, 2 ** 31 - 1)
})
