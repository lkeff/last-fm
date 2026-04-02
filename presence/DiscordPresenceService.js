'use strict'

/**
 * DiscordPresenceService
 *
 * Updates the user's Discord Rich Presence to show what they're currently
 * listening to on Last.fm. Connects to the local Discord desktop client
 * via IPC using the discord-rpc package.
 *
 * Usage:
 *   const service = new DiscordPresenceService(clientId, lastfmClient, username)
 *   await service.start()
 *   // ...
 *   service.stop()
 */

const RPC = require('discord-rpc')

const POLL_INTERVAL_MS = 15000 // check Last.fm every 15 seconds

class DiscordPresenceService {
  constructor (clientId, lastfmClient, lastfmUsername) {
    if (!clientId) throw new Error('Discord client ID is required for Rich Presence')
    if (!lastfmClient) throw new Error('LastFM client instance is required')
    if (!lastfmUsername) throw new Error('Last.fm username is required')

    this._clientId = clientId
    this._lastfm = lastfmClient
    this._username = lastfmUsername
    this._rpc = null
    this._pollTimer = null
    this._currentTrackKey = null // track deduplication
    this._running = false
  }

  /**
   * Connect to Discord and start polling Last.fm.
   */
  async start () {
    if (this._running) return

    RPC.register(this._clientId)
    this._rpc = new RPC.Client({ transport: 'ipc' })

    this._rpc.on('ready', () => {
      console.log('[DiscordPresence] Connected to Discord client')
      this._poll()
      this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL_MS)
    })

    this._rpc.on('disconnected', () => {
      console.warn('[DiscordPresence] Disconnected from Discord')
      this._stopPolling()
    })

    try {
      await this._rpc.login({ clientId: this._clientId })
      this._running = true
    } catch (err) {
      console.error('[DiscordPresence] Failed to connect to Discord:', err.message)
      this._rpc = null
    }
  }

  /**
   * Stop polling and clear the Discord activity.
   */
  stop () {
    this._stopPolling()
    if (this._rpc) {
      this._rpc.clearActivity().catch(() => {})
      this._rpc.destroy().catch(() => {})
      this._rpc = null
    }
    this._running = false
    this._currentTrackKey = null
    console.log('[DiscordPresence] Stopped')
  }

  _stopPolling () {
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
  }

  /**
   * Poll Last.fm for the currently playing track and update Discord.
   */
  _poll () {
    this._lastfm.userGetRecentTracks(
      { user: this._username, limit: 1 },
      (err, data) => {
        if (err) {
          console.error('[DiscordPresence] Last.fm poll error:', err.message)
          return
        }

        const tracks = data && data.track
        if (!tracks || tracks.length === 0) {
          this._clearIfChanged(null)
          return
        }

        const latest = Array.isArray(tracks) ? tracks[0] : tracks
        const isNowPlaying = latest['@attr'] && latest['@attr'].nowplaying === 'true'

        if (!isNowPlaying) {
          this._clearIfChanged(null)
          return
        }

        const track = {
          name: latest.name,
          artist: latest.artist && (latest.artist['#text'] || latest.artist),
          album: latest.album && (latest.album['#text'] || latest.album),
          url: latest.url,
          imageUrl: this._getBestImage(latest.image)
        }

        this._updatePresence(track)
      }
    )
  }

  _getBestImage (images) {
    if (!Array.isArray(images)) return null
    const order = ['extralarge', 'large', 'medium', 'small']
    for (const size of order) {
      const img = images.find(i => i.size === size)
      if (img && img['#text']) return img['#text']
    }
    return null
  }

  _trackKey (track) {
    return track ? `${track.artist}::${track.name}` : null
  }

  _clearIfChanged (track) {
    const key = this._trackKey(track)
    if (this._currentTrackKey !== key) {
      this._currentTrackKey = key
      if (this._rpc) {
        this._rpc.clearActivity().catch(err =>
          console.error('[DiscordPresence] clearActivity error:', err.message)
        )
      }
    }
  }

  _updatePresence (track) {
    const key = this._trackKey(track)
    if (!this._rpc) return

    const activity = {
      details: track.name.length > 128 ? track.name.slice(0, 125) + '...' : track.name,
      state: `by ${track.artist}`.slice(0, 128),
      largeImageKey: 'lastfm_logo',
      largeImageText: track.album || track.artist,
      instance: false
    }

    if (track.url) {
      activity.buttons = [{ label: 'View on Last.fm', url: track.url }]
    }

    this._rpc.setActivity(activity).then(() => {
      if (this._currentTrackKey !== key) {
        this._currentTrackKey = key
        console.log(`[DiscordPresence] Now playing: ${track.artist} – ${track.name}`)
      }
    }).catch(err => {
      console.error('[DiscordPresence] setActivity error:', err.message)
    })
  }
}

module.exports = DiscordPresenceService
