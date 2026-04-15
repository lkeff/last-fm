/*! last-fm. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
const get = require('simple-get')
const querystring = require('querystring')
const parallel = require('run-parallel')
const { RAMDAC } = require('./utils/ramdac')

// Simple in-memory TTL cache for API responses
class TTLCache {
  constructor (defaultTtl) {
    this._defaultTtl = defaultTtl || 5 * 60 * 1000
    this._store = new Map()
  }

  set (key, value, ttl) {
    const expiresAt = Date.now() + (ttl || this._defaultTtl)
    this._store.set(key, { value, expiresAt })
  }

  get (key) {
    const entry = this._store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key)
      return undefined
    }
    return entry.value
  }

  has (key) {
    return this.get(key) !== undefined
  }

  delete (key) {
    this._store.delete(key)
  }

  clear () {
    this._store.clear()
  }

  purgeExpired () {
    const now = Date.now()
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) this._store.delete(key)
    }
  }
}

const IMAGE_WEIGHT = {
  '': 1, // missing size is ranked last
  small: 2,
  medium: 3,
  large: 4,
  extralarge: 5,
  mega: 6
}

class LastFM {
  constructor (key, opts) {
    if (!key) throw new Error('Missing required `key` argument')
    if (!opts) opts = {}
    this._key = key
    this._userAgent = opts.userAgent || 'last-fm (https://github.com/feross/last-fm)'
    this._minArtistListeners = opts.minArtistListeners || 0
    this._minTrackListeners = opts.minTrackListeners || 0
    const cacheOpts = opts.cache
    if (cacheOpts) {
      const ttl = (typeof cacheOpts === 'object' && cacheOpts.ttl) ? cacheOpts.ttl : 5 * 60 * 1000
      this._cache = new TTLCache(ttl)
    } else {
      this._cache = null
    }
  }

  _sendRequest (params, name, cb) {
    return this._sendRequestWithTtl(params, name, null, cb)
  }

  _sendRequestWithTtl (params, name, ttl, cb) {
    Object.assign(params, {
      api_key: this._key,
      format: 'json'
    })

    const urlBase = 'https://ws.audioscrobbler.com/2.0/'
    const queryStr = querystring.stringify(params)
    const cacheKey = name + ':' + queryStr

    if (this._cache) {
      const cached = this._cache.get(cacheKey)
      if (cached !== undefined) return cb(null, cached)
    }

    const opts = {
      url: urlBase + '?' + queryStr,
      headers: {
        'User-Agent': this._userAgent
      },
      timeout: 30 * 1000,
      json: true
    }

    const self = this
    get.concat(opts, function onResponse (err, res, data) {
      if (err) return cb(err)
      if (data.error) return cb(new Error(data.message))
      const result = data[name]
      if (self._cache) self._cache.set(cacheKey, result, ttl)
      cb(null, result)
    })
  }

  /**
   * PARSE COMMON RESPONSE PROPERTIES
   */

  _parseImages (image) {
    return image
      .sort((a, b) => IMAGE_WEIGHT[a.size] - IMAGE_WEIGHT[b.size])
      .filter(image => image.size !== '')
      .map(image => image['#text'])
      .filter(image => image && image.length > 0)
  }

  _parseMeta (data, query) {
    if (data['opensearch:totalResults']) {
      const total = Number(data['opensearch:totalResults'])
      const perPage = Number(data['opensearch:itemsPerPage'])
      const page = (Number(data['opensearch:startIndex']) / perPage) + 1
      const totalPages = Math.ceil(total / perPage)
      return { query, page, perPage, total, totalPages }
    } else {
      return {
        query,
        page: Number(data['@attr'].page),
        perPage: Number(data['@attr'].perPage),
        total: Number(data['@attr'].total),
        totalPages: Number(data['@attr'].totalPages)
      }
    }
  }

  _parseSummary (summary) {
    return summary.replace(/\s+?<a .*?>Read more on Last\.fm<\/a>.*$/, '')
  }

  /**
   * PARSE COMMON RESPONSE TYPES
   */

  _parseArtists (artists) {
    return artists
      .map(artist => {
        return {
          type: 'artist',
          name: artist.name,
          listeners: Number(artist.listeners),
          images: this._parseImages(artist.image)
        }
      })
      .filter(artist => artist.listeners == null || artist.listeners >= this._minArtistListeners)
  }

  _parseAlbums (albums) {
    return albums
      .map(album => {
        return {
          type: 'album',
          name: album.name,
          artistName: album.artist.name || album.artist,
          listeners: (
            (album.playcount && Number(album.playcount)) ||
            (album.listeners && Number(album.listeners))
          ), // optional
          images: this._parseImages(album.image)
        }
      })
  }

  _parseTags (tags) {
    return tags.tag.map(t => t.name)
  }

  _parseTracks (tracks) {
    return tracks
      .map(track => {
        const listeners = track.playcount || track.listeners
        return {
          type: 'track',
          name: track.name,
          artistName: track.artist.name || track.artist,
          duration: track.duration && Number(track.duration), // optional
          listeners: listeners && Number(listeners), // optional
          images: track.image && this._parseImages(track.image) // optional
        }
      })
      .filter(track => track.listeners == null || track.listeners >= this._minTrackListeners)
  }

  /**
   * CONVENIENCE API
   */

  search (opts, cb) {
    if (!opts.q) {
      return cb(new Error('Missing required param: q'))
    }
    parallel({
      artists: cb => {
        this.artistSearch({ q: opts.q, limit: opts.artistsLimit || opts.limit }, cb)
      },
      tracks: cb => {
        this.trackSearch({ q: opts.q, limit: opts.tracksLimit || opts.limit }, cb)
      },
      albums: cb => {
        this.albumSearch({ q: opts.q, limit: opts.albumsLimit || opts.limit }, cb)
      }
    }, (err, r) => {
      if (err) return cb(err)

      const page = r.artists.meta.page
      const total = r.artists.meta.total + r.tracks.meta.total + r.albums.meta.total
      const perPage = r.artists.meta.perPage * 3
      const totalPages = Math.ceil(total / perPage)

      const result = {
        meta: { query: opts, page, perPage, total, totalPages },
        result: {
          type: 'search',
          q: opts.q,
          artists: r.artists.result,
          tracks: r.tracks.result,
          albums: r.albums.result
        }
      }

      // Prefer an exact match
      const exactMatch = []
        .concat(result.result.artists, result.result.tracks, result.result.albums)
        .filter(result => result.name.toLowerCase() === opts.q)
        .sort((a, b) => (b.listeners || 0) - (a.listeners || 0))[0]

      // Otherwise, use most popular result by listener count. Albums don't have listener count.
      const top = []
        .concat(result.result.artists, result.result.tracks)
        .sort((a, b) => b.listeners - a.listeners)[0]

      result.result.top = exactMatch || top || null

      cb(null, result)
    })
  }

  /**
   * ALBUM API
   */

  albumInfo (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'album.getInfo',
      album: opts.name,
      artist: opts.artistName,
      autocorrect: 1
    }
    this._sendRequest(params, 'album', (err, album) => {
      if (err) return cb(err)
      cb(null, {
        type: 'album',
        name: album.name,
        artistName: album.artist,
        images: this._parseImages(album.image),
        listeners: Number(album.playcount) || Number(album.listeners),
        tracks: this._parseTracks(album.tracks.track),
        tags: this._parseTags(album.tags),
        summary: album.wiki && this._parseSummary(album.wiki.content)
      })
    })
  }

  albumTopTags (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'album.getTopTags',
      album: opts.name,
      artist: opts.artistName,
      autocorrect: 1
    }
    this._sendRequest(params, 'toptags', cb)
  }

  albumSearch (opts, cb) {
    if (!opts.q) {
      return cb(new Error('Missing required param: q'))
    }
    const params = {
      method: 'album.search',
      limit: opts.limit,
      page: opts.page,
      album: opts.q
    }
    this._sendRequest(params, 'results', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseAlbums(data.albummatches.album)
      })
    })
  }

  /**
   * ARTIST API
   */

  artistCorrection (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getCorrection',
      artist: opts.name
    }
    this._sendRequest(params, 'corrections', (err, data) => {
      if (err) return cb(err)
      const correction = data.correction
      cb(null, {
        name: correction.artist.name
      })
    })
  }

  artistInfo (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getInfo',
      artist: opts.name,
      autocorrect: 1
    }
    this._sendRequest(params, 'artist', (err, artist) => {
      if (err) return cb(err)
      const similar = artist.similar.artist.map(similarArtist => {
        return {
          type: 'artist',
          name: similarArtist.name,
          images: this._parseImages(similarArtist.image)
        }
      })
      cb(null, {
        type: 'artist',
        name: artist.name,
        listeners: Number(artist.stats.listeners),
        images: this._parseImages(artist.image),
        tags: this._parseTags(artist.tags),
        summary: this._parseSummary(artist.bio.content),
        similar
      })
    })
  }

  artistSimilar (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getSimilar',
      artist: opts.name,
      limit: opts.limit,
      autocorrect: 1
    }
    this._sendRequest(params, 'similarartists', cb)
  }

  artistTopAlbums (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getTopAlbums',
      artist: opts.name,
      limit: opts.limit,
      autocorrect: 1
    }
    this._sendRequest(params, 'topalbums', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseAlbums(data.album)
      })
    })
  }

  artistTopTags (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getTopTags',
      artist: opts.name,
      autocorrect: 1
    }
    this._sendRequest(params, 'toptags', cb)
  }

  artistTopTracks (opts, cb) {
    if (!opts.name) {
      return cb(new Error('Missing required param: name'))
    }
    const params = {
      method: 'artist.getTopTracks',
      artist: opts.name,
      limit: opts.limit,
      autocorrect: 1
    }
    this._sendRequest(params, 'toptracks', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseTracks(data.track)
      })
    })
  }

  artistSearch (opts, cb) {
    if (!opts.q) {
      return cb(new Error('Missing required param: q'))
    }
    const params = {
      method: 'artist.search',
      limit: opts.limit,
      page: opts.page,
      artist: opts.q
    }
    this._sendRequest(params, 'results', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseArtists(data.artistmatches.artist)
      })
    })
  }

  /**
   * CHART API
   */

  chartTopArtists (opts, cb) {
    const params = {
      method: 'chart.getTopArtists',
      limit: opts.limit,
      page: opts.page,
      autocorrect: 1
    }
    this._sendRequest(params, 'artists', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseArtists(data.artist)
      })
    })
  }

  chartTopTags (opts, cb) {
    const params = {
      method: 'chart.getTopTags',
      limit: opts.limit,
      page: opts.page,
      autocorrect: 1
    }
    this._sendRequest(params, 'tags', cb)
  }

  chartTopTracks (opts, cb) {
    const params = {
      method: 'chart.getTopTracks',
      limit: opts.limit,
      page: opts.page,
      autocorrect: 1
    }
    this._sendRequest(params, 'tracks', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseTracks(data.track)
      })
    })
  }

  /**
   * GEO API
   */

  geoTopArtists (opts, cb) {
    if (!opts.country) {
      return cb(new Error('Missing required param: country'))
    }
    const params = {
      method: 'geo.getTopArtists',
      country: opts.country,
      limit: opts.limit,
      page: opts.page,
      autocorrect: 1
    }
    this._sendRequest(params, 'topartists', cb)
  }

  geoTopTracks (opts, cb) {
    if (!opts.country) {
      return cb(new Error('Missing required param: country'))
    }
    const params = {
      method: 'geo.getTopTracks',
      country: opts.country,
      limit: opts.limit,
      page: opts.page,
      autocorrect: 1
    }
    this._sendRequest(params, 'tracks', cb)
  }

  /**
   * TAG API
   */

  tagInfo (opts, cb) {
    if (!opts.tag) {
      return cb(new Error('Missing required param: tag'))
    }
    const params = {
      method: 'tag.getInfo',
      tag: opts.tag
    }
    this._sendRequest(params, 'tag', cb)
  }

  tagSimilar (opts, cb) {
    if (!opts.tag) {
      return cb(new Error('Missing required param: tag'))
    }
    const params = {
      method: 'tag.getSimilar',
      tag: opts.tag
    }
    this._sendRequest(params, 'similartags', cb)
  }

  tagTopAlbums (opts, cb) {
    if (!opts.tag) {
      return cb(new Error('Missing required param: tag'))
    }
    const params = {
      method: 'tag.getTopAlbums',
      limit: opts.limit,
      page: opts.page,
      tag: opts.tag
    }
    this._sendRequest(params, 'albums', cb)
  }

  tagTopArtists (opts, cb) {
    if (!opts.tag) {
      return cb(new Error('Missing required param: tag'))
    }
    const params = {
      method: 'tag.getTopArtists',
      limit: opts.limit,
      page: opts.page,
      tag: opts.tag
    }
    this._sendRequest(params, 'topartists', cb)
  }

  tagTopTags (opts, cb) {
    const params = {
      method: 'tag.getTopTags'
    }
    this._sendRequest(params, 'toptags', cb)
  }

  tagTopTracks (opts, cb) {
    if (!opts.tag) {
      return cb(new Error('Missing required param: tag'))
    }
    const params = {
      method: 'tag.getTopTracks',
      limit: opts.limit,
      page: opts.page,
      tag: opts.tag
    }
    this._sendRequest(params, 'tracks', cb)
  }

  /**
   * TRACK API
   */

  trackCorrection (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'track.getCorrection',
      track: opts.name,
      artist: opts.artistName
    }
    this._sendRequest(params, 'corrections', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        name: data.correction.track.name,
        artistName: data.correction.track.artist.name
      })
    })
  }

  trackInfo (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'track.getInfo',
      track: opts.name,
      artist: opts.artistName,
      autocorrect: 1
    }
    this._sendRequest(params, 'track', (err, track) => {
      if (err) return cb(err)
      cb(null, {
        type: 'track',
        name: track.name,
        artistName: track.artist.name,
        albumName: track.album && track.album.title,
        listeners: Number(track.listeners),
        duration: Math.ceil(track.duration / 1000),
        images: track.album && this._parseImages(track.album.image),
        tags: this._parseTags(track.toptags)
      })
    })
  }

  trackSimilar (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'track.getSimilar',
      track: opts.name,
      artist: opts.artistName,
      limit: opts.limit,
      autocorrect: 1
    }
    this._sendRequest(params, 'similartracks', cb)
  }

  trackTopTags (opts, cb) {
    if (!opts.name || !opts.artistName) {
      return cb(new Error('Missing required params: name, artistName'))
    }
    const params = {
      method: 'track.getTopTags',
      track: opts.name,
      artist: opts.artistName,
      autocorrect: 1
    }
    this._sendRequest(params, 'toptags', cb)
  }

  trackSearch (opts, cb) {
    if (!opts.q) {
      return cb(new Error('Missing required param: q'))
    }
    const params = {
      method: 'track.search',
      limit: opts.limit,
      page: opts.page,
      track: opts.q,
      artist: opts.artist // narrow search by artist (optional)
    }
    this._sendRequest(params, 'results', (err, data) => {
      if (err) return cb(err)
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: this._parseTracks(data.trackmatches.track)
      })
    })
  }

  /**
   * USER API
   */

  userInfo (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getInfo',
      user: opts.user
    }
    this._sendRequestWithTtl(params, 'user', 10 * 60 * 1000, (err, user) => {
      if (err) return cb(err)
      cb(null, {
        type: 'user',
        name: user.name,
        realName: user.realname || '',
        country: user.country || '',
        age: Number(user.age) || 0,
        playcount: Number(user.playcount) || 0,
        playlists: Number(user.playlists) || 0,
        registered: Number(user.registered && user.registered.unixtime) || 0,
        images: this._parseImages(user.image || [])
      })
    })
  }

  userRecentTracks (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getRecentTracks',
      user: opts.user,
      limit: opts.limit,
      page: opts.page,
      from: opts.from,
      to: opts.to,
      extended: opts.extended
    }
    this._sendRequestWithTtl(params, 'recenttracks', 2 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const tracks = [].concat(data.track || []).map(track => {
        const nowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true'
        return {
          type: 'track',
          name: track.name,
          artistName: track.artist && (track.artist['#text'] || track.artist.name) || '',
          albumName: track.album && track.album['#text'] || null,
          images: track.image ? this._parseImages(track.image) : [],
          date: track.date ? Number(track.date.uts) : null,
          nowPlaying
        }
      })
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: tracks
      })
    })
  }

  userTopTracks (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getTopTracks',
      user: opts.user,
      period: opts.period,
      limit: opts.limit,
      page: opts.page
    }
    this._sendRequestWithTtl(params, 'toptracks', 10 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const tracks = [].concat(data.track || []).map(track => {
        return {
          type: 'track',
          name: track.name,
          artistName: track.artist && track.artist.name || '',
          playcount: Number(track.playcount) || 0,
          rank: Number(track['@attr'] && track['@attr'].rank) || 0,
          images: track.image ? this._parseImages(track.image) : []
        }
      })
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: tracks
      })
    })
  }

  userTopArtists (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getTopArtists',
      user: opts.user,
      period: opts.period,
      limit: opts.limit,
      page: opts.page
    }
    this._sendRequestWithTtl(params, 'topartists', 10 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const artists = [].concat(data.artist || []).map(artist => {
        return {
          type: 'artist',
          name: artist.name,
          playcount: Number(artist.playcount) || 0,
          rank: Number(artist['@attr'] && artist['@attr'].rank) || 0,
          listeners: Number(artist.listeners) || 0,
          images: artist.image ? this._parseImages(artist.image) : []
        }
      })
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: artists
      })
    })
  }

  userLovedTracks (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getLovedTracks',
      user: opts.user,
      limit: opts.limit,
      page: opts.page
    }
    this._sendRequestWithTtl(params, 'lovedtracks', 5 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const tracks = [].concat(data.track || []).map(track => {
        return {
          type: 'track',
          name: track.name,
          artistName: track.artist && track.artist.name || '',
          date: track.date ? Number(track.date.uts) : null,
          images: track.image ? this._parseImages(track.image) : []
        }
      })
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: tracks
      })
    })
  }

  userFriends (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getFriends',
      user: opts.user,
      recenttracks: opts.recenttracks,
      limit: opts.limit,
      page: opts.page
    }
    this._sendRequestWithTtl(params, 'friends', 10 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const users = [].concat(data.user || []).map(u => {
        return {
          type: 'user',
          name: u.name,
          realName: u.realname || '',
          country: u.country || '',
          images: u.image ? this._parseImages(u.image) : []
        }
      })
      cb(null, {
        meta: this._parseMeta(data, opts),
        result: users
      })
    })
  }

  userNeighbours (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getNeighbours',
      user: opts.user,
      limit: opts.limit
    }
    this._sendRequestWithTtl(params, 'neighbours', 10 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const users = [].concat(data.user || []).map(u => {
        return {
          type: 'user',
          name: u.name,
          match: Number(u.match) || 0
        }
      })
      cb(null, { result: users })
    })
  }

  userPersonalTags (opts, cb) {
    if (!opts.user || !opts.tag || !opts.taggingtype) {
      return cb(new Error('Missing required params: user, tag, taggingtype'))
    }
    const params = {
      method: 'user.getPersonalTags',
      user: opts.user,
      tag: opts.tag,
      taggingtype: opts.taggingtype,
      limit: opts.limit,
      page: opts.page
    }
    this._sendRequestWithTtl(params, 'taggings', 10 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      let result
      if (opts.taggingtype === 'artist') {
        result = this._parseArtists([].concat(data.artists && data.artists.artist || []))
      } else if (opts.taggingtype === 'album') {
        result = this._parseAlbums([].concat(data.albums && data.albums.album || []))
      } else {
        result = this._parseTracks([].concat(data.tracks && data.tracks.track || []))
      }
      cb(null, {
        meta: this._parseMeta(data, opts),
        result
      })
    })
  }

  userWeeklyAlbumChart (opts, cb) {
    if (!opts.user) {
      return cb(new Error('Missing required param: user'))
    }
    const params = {
      method: 'user.getWeeklyAlbumChart',
      user: opts.user,
      from: opts.from,
      to: opts.to
    }
    this._sendRequestWithTtl(params, 'weeklyalbumchart', 15 * 60 * 1000, (err, data) => {
      if (err) return cb(err)
      const albums = [].concat(data.album || []).map(album => {
        return {
          type: 'album',
          name: album.name,
          artistName: album.artist && (album.artist['#text'] || album.artist) || '',
          playcount: Number(album.playcount) || 0,
          rank: Number(album['@attr'] && album['@attr'].rank) || 0
        }
      })
      cb(null, { result: albums })
    })
  }
}

/**
 * Execute multiple LastFM API calls in parallel and atomically commit all
 * results into a RAMDAC front-buffer before returning.
 *
 * This prevents callers from observing a partially-completed batch (cuts);
 * they receive all results only after every request has resolved.
 *
 * @param {Array<{method: string, opts: object}>} calls  e.g. [{method:'artistInfo', opts:{...}}]
 * @returns {Promise<Map<string, *>>}  Map of method name → result
 */
LastFM.prototype.batchRequest = function batchRequest (calls) {
  const self = this
  const ramdac = new RAMDAC({ id: 'api-batch' })

  return new Promise((resolve, reject) => {
    const tasks = calls.map(({ method, opts }) => {
      return (done) => {
        if (typeof self[method] !== 'function') {
          return done(new Error(`LastFM.batchRequest: unknown method '${method}'`))
        }
        self[method](opts || {}, (err, result) => done(null, { method, err, result }))
      }
    })

    parallel(tasks, async (_, outcomes) => {
      const payload = Buffer.from(JSON.stringify(outcomes))

      try {
        await ramdac.loadAndCommit(payload, {
          format: 'raw',
          morph: buf => JSON.parse(buf.toString('utf8'))
        })
      } catch (commitErr) {
        return reject(commitErr)
      }

      const committed = ramdac.read()
      const resultMap = new Map()
      for (const { method, err, result } of committed) {
        resultMap.set(method, err ? { error: err.message } : result)
      }
      resolve(resultMap)
    })
  })
}

module.exports = LastFM
