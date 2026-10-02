const { test } = require('node:test')
const assert = require('node:assert/strict')
const { nowPlayingTrack } = require('../utils/now-playing')

function fakeClient ({ playing, duration }) {
  return {
    userNowPlaying: (opts, cb) => cb(null, playing),
    trackInfo: (opts, cb) => cb(null, { name: opts.name, artistName: opts.artistName, duration })
  }
}

test('returns the now-playing track with its length in ms', async () => {
  const client = fakeClient({ playing: { name: 'Song', artistName: 'Band' }, duration: 215 })
  assert.deepEqual(await nowPlayingTrack(client, 'rj'), { name: 'Song', artistName: 'Band', durationMs: 215000 })
})

test('rejects when nothing is playing or the length is unknown', async () => {
  await assert.rejects(nowPlayingTrack(fakeClient({ playing: null }), 'rj'), /not scrobbling/)
  await assert.rejects(nowPlayingTrack(fakeClient({ playing: { name: 'S', artistName: 'B' }, duration: 0 }), 'rj'), /no track length/)
  await assert.rejects(nowPlayingTrack(fakeClient({}), '  '), /Missing Last.fm username/)
})
