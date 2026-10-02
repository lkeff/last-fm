const { promisify } = require('util')

/**
 * Look up the track a Last.fm user is scrobbling right now, with its length.
 * Last.fm does not expose playback position, so callers can only count down
 * the full track length from the moment of the lookup.
 * @param {import('../index.js')} lastfm
 * @param {string} user Last.fm username
 * @returns {Promise<{ name: string, artistName: string, durationMs: number }>}
 */
async function nowPlayingTrack (lastfm, user) {
  const username = String(user || '').trim()
  if (!username) throw new Error('Missing Last.fm username')

  const playing = await promisify(lastfm.userNowPlaying.bind(lastfm))({ user: username })
  if (!playing) throw new Error(`${username} is not scrobbling anything right now`)

  const info = await promisify(lastfm.trackInfo.bind(lastfm))({ name: playing.name, artistName: playing.artistName })
  const durationMs = Number(info.duration) * 1000
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`Last.fm has no track length for ${playing.artistName} - ${playing.name}`)
  }
  return { name: playing.name, artistName: playing.artistName, durationMs }
}

module.exports = { nowPlayingTrack }
