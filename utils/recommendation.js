'use strict'

const parallel = require('run-parallel')

const RECOMMENDATION_DEFAULTS = {
  TAG_WEIGHT: 0.7,
  POPULARITY_WEIGHT: 0.3,
  LIMIT: 20,
  MIN_LISTENERS: 0,
  SESSION_GAP_MINUTES: 30,
  MAX_SEED_ARTISTS: 10,
  MAX_SIMILAR_PER_SEED: 10,
  MAX_TAG_FETCH_CONCURRENCY: 5
}

/**
 * Build a weighted tag profile from a user's top artists.
 *
 * @param {Array} topArtists - result array from userTopArtists, each with { name, playcount }
 * @param {Object} artistTagsMap - { [artistName]: string[] }
 * @returns {Object} tagProfile
 */
function buildTagProfile (topArtists, artistTagsMap) {
  const tagWeights = {}
  const tagCounts = {}
  let totalPlaycount = 0

  for (const artist of topArtists) {
    const contribution = artist.playcount || 1
    totalPlaycount += contribution
    const tags = artistTagsMap[artist.name] || []
    for (const tag of tags) {
      const key = tag.toLowerCase()
      tagWeights[key] = (tagWeights[key] || 0) + contribution
      tagCounts[key] = (tagCounts[key] || 0) + 1
    }
  }

  const maxWeight = Math.max(...Object.values(tagWeights), 1)
  const tags = {}
  for (const tag of Object.keys(tagWeights)) {
    tags[tag] = {
      weight: tagWeights[tag],
      count: tagCounts[tag],
      normalizedWeight: tagWeights[tag] / maxWeight
    }
  }

  const topTags = Object.keys(tags)
    .sort((a, b) => tags[b].normalizedWeight - tags[a].normalizedWeight)
    .slice(0, 20)

  return {
    tags,
    totalArtists: topArtists.length,
    totalPlaycount,
    topTags
  }
}

/**
 * Score candidates by tag overlap with the user's tag profile.
 *
 * @param {Array} candidates - each item must have { name, tags: string[] }
 * @param {Object} tagProfile - result from buildTagProfile
 * @returns {Array} candidates sorted by tagScore descending, each extended with tagScore info
 */
function scoreByTags (candidates, tagProfile) {
  const profileTagCount = tagProfile.topTags.length || 1

  const scored = candidates.map(candidate => {
    const candidateTags = (candidate.tags || []).map(t => t.toLowerCase())
    let weightedSum = 0
    const matchedTags = []

    for (const tag of candidateTags) {
      if (tagProfile.tags[tag]) {
        weightedSum += tagProfile.tags[tag].normalizedWeight
        matchedTags.push(tag)
      }
    }

    const tagScore = Math.min(weightedSum / profileTagCount, 1)

    return {
      ...candidate,
      tagScore,
      matchedTags,
      tagScoreDetails: {
        matchCount: matchedTags.length,
        totalProfileTags: profileTagCount,
        weightedSum
      }
    }
  })

  return scored.sort((a, b) => b.tagScore - a.tagScore)
}

/**
 * Combine tag-based content score with a popularity signal.
 *
 * @param {Array} candidates - result from scoreByTags, each with tagScore and listeners
 * @param {Object} tagProfile - result from buildTagProfile
 * @param {Object} opts
 * @param {number} [opts.tagWeight=0.7]
 * @param {number} [opts.popularityWeight=0.3]
 * @param {number} [opts.minListeners=0]
 * @returns {Array} candidates sorted by hybridScore descending with rank assigned
 */
function hybridScore (candidates, tagProfile, opts) {
  const tagWeight = (opts && opts.tagWeight != null) ? opts.tagWeight : RECOMMENDATION_DEFAULTS.TAG_WEIGHT
  const popularityWeight = (opts && opts.popularityWeight != null) ? opts.popularityWeight : RECOMMENDATION_DEFAULTS.POPULARITY_WEIGHT
  const minListeners = (opts && opts.minListeners != null) ? opts.minListeners : RECOMMENDATION_DEFAULTS.MIN_LISTENERS

  const filtered = candidates.filter(c => (c.listeners || 0) >= minListeners)
  const maxListeners = Math.max(...filtered.map(c => c.listeners || 0), 1)

  const scored = filtered.map(candidate => {
    const popularityScore = (candidate.listeners || 0) / maxListeners
    const score = (tagWeight * (candidate.tagScore || 0)) + (popularityWeight * popularityScore)
    return {
      ...candidate,
      popularityScore,
      hybridScore: score
    }
  })

  return scored
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .map((item, i) => ({ ...item, rank: i + 1 }))
}

/**
 * Orchestrate the full recommendation pipeline.
 *
 * Fetches tags and similar artists for seed artists, builds a tag profile,
 * scores candidates, and returns a ranked recommendation list.
 *
 * @param {Object} userData
 * @param {Array} userData.topArtists - from userTopArtists result array
 * @param {Array} [userData.recentTracks] - from userRecentTracks result array
 * @param {Array} [userData.lovedTracks] - from userLovedTracks result array
 * @param {Object} lastfmClient - instance of LastFM from index.js
 * @param {Object} opts
 * @param {number} [opts.limit=20]
 * @param {number} [opts.tagWeight=0.7]
 * @param {number} [opts.popularityWeight=0.3]
 * @param {number} [opts.minListeners=0]
 * @param {boolean} [opts.excludeKnownArtists=true]
 * @param {Function} cb - cb(err, result)
 */
function getRecommendations (userData, lastfmClient, opts, cb) {
  const limit = (opts && opts.limit) || RECOMMENDATION_DEFAULTS.LIMIT
  const excludeKnown = (opts && opts.excludeKnownArtists != null) ? opts.excludeKnownArtists : true

  const topArtists = (userData.topArtists || [])
    .slice(0, RECOMMENDATION_DEFAULTS.MAX_SEED_ARTISTS)

  if (topArtists.length === 0) {
    return cb(null, {
      recommendations: [],
      tagProfile: buildTagProfile([], {}),
      sessions: [],
      meta: { totalCandidates: 0, excludedKnown: 0, generatedAt: Date.now() }
    })
  }

  const knownArtistNames = new Set(
    (userData.topArtists || []).map(a => a.name.toLowerCase())
  )

  // Step 1: Fetch tags for each seed artist (in batches of 5)
  _batchedParallel(topArtists, function (artist, done) {
    lastfmClient.artistTopTags({ name: artist.name }, function (err, data) {
      if (err) return done(null, { artist: artist.name, tags: [] })
      const tags = (data && data.tag) ? data.tag.map(t => t.name) : []
      done(null, { artist: artist.name, tags })
    })
  }, RECOMMENDATION_DEFAULTS.MAX_TAG_FETCH_CONCURRENCY, function (err, seedTagResults) {
    if (err) return cb(err)

    const artistTagsMap = {}
    for (const r of seedTagResults) {
      artistTagsMap[r.artist] = r.tags
    }

    const tagProfile = buildTagProfile(topArtists, artistTagsMap)

    // Step 2: Fetch similar artists for each seed
    _batchedParallel(topArtists, function (artist, done) {
      lastfmClient.artistSimilar({ name: artist.name, limit: RECOMMENDATION_DEFAULTS.MAX_SIMILAR_PER_SEED }, function (err, data) {
        if (err) return done(null, [])
        const similar = (data && data.artist) ? data.artist : []
        done(null, similar.map(a => ({
          type: 'artist',
          name: a.name,
          listeners: Number(a.listeners) || 0,
          images: a.image || [],
          tags: []
        })))
      })
    }, RECOMMENDATION_DEFAULTS.MAX_TAG_FETCH_CONCURRENCY, function (err, similarResults) {
      if (err) return cb(err)

      // Deduplicate candidates
      const seen = new Set()
      const candidates = []
      for (const group of similarResults) {
        for (const artist of group) {
          const key = artist.name.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            candidates.push(artist)
          }
        }
      }

      const totalCandidates = candidates.length

      // Optionally exclude known artists
      const filtered = excludeKnown
        ? candidates.filter(a => !knownArtistNames.has(a.name.toLowerCase()))
        : candidates

      const excludedKnown = totalCandidates - filtered.length

      // Step 3: Fetch tags for each candidate artist
      _batchedParallel(filtered, function (artist, done) {
        lastfmClient.artistTopTags({ name: artist.name }, function (err, data) {
          if (err) return done(null, { ...artist, tags: [] })
          const tags = (data && data.tag) ? data.tag.map(t => t.name) : []
          done(null, { ...artist, tags })
        })
      }, RECOMMENDATION_DEFAULTS.MAX_TAG_FETCH_CONCURRENCY, function (err, taggedCandidates) {
        if (err) return cb(err)

        const scored = scoreByTags(taggedCandidates, tagProfile)
        const ranked = hybridScore(scored, tagProfile, opts).slice(0, limit)

        // Compute sessions if recent tracks are available
        const sessions = userData.recentTracks
          ? segmentSessions(userData.recentTracks, opts)
          : []

        cb(null, {
          recommendations: ranked,
          tagProfile,
          sessions,
          meta: {
            totalCandidates,
            excludedKnown,
            generatedAt: Date.now()
          }
        })
      })
    })
  })
}

/**
 * Segment a user's recent tracks into listening sessions based on time gaps.
 *
 * @param {Array} recentTracks - from userRecentTracks result array, each with { date, name, artistName }
 * @param {Object} [opts]
 * @param {number} [opts.sessionGapMinutes=30]
 * @returns {Array} sessions sorted chronologically (oldest first)
 */
function segmentSessions (recentTracks, opts) {
  const gapSeconds = ((opts && opts.sessionGapMinutes) || RECOMMENDATION_DEFAULTS.SESSION_GAP_MINUTES) * 60

  // Filter out now-playing entries and entries without timestamps
  const timestamped = (recentTracks || [])
    .filter(t => !t.nowPlaying && t.date != null)
    .sort((a, b) => a.date - b.date)

  if (timestamped.length === 0) return []

  const sessions = []
  let current = [timestamped[0]]

  for (let i = 1; i < timestamped.length; i++) {
    const prev = timestamped[i - 1]
    const curr = timestamped[i]
    if (curr.date - prev.date > gapSeconds) {
      sessions.push(_buildSession(current))
      current = [curr]
    } else {
      current.push(curr)
    }
  }
  sessions.push(_buildSession(current))

  return sessions
}

// Build a session summary from an array of tracks
function _buildSession (tracks) {
  const startTime = tracks[0].date
  const endTime = tracks[tracks.length - 1].date

  const artistCounts = {}
  for (const t of tracks) {
    artistCounts[t.artistName] = (artistCounts[t.artistName] || 0) + 1
  }

  const topArtist = Object.keys(artistCounts)
    .sort((a, b) => artistCounts[b] - artistCounts[a])[0] || ''

  return {
    startTime,
    endTime,
    durationMinutes: Math.round((endTime - startTime) / 60),
    trackCount: tracks.length,
    tracks,
    artists: Object.keys(artistCounts),
    topArtist
  }
}

/**
 * Process an array of items in batches using run-parallel.
 * Limits the number of items processed concurrently.
 *
 * @param {Array} items
 * @param {Function} fn - fn(item, done)
 * @param {number} batchSize
 * @param {Function} cb - cb(err, results)
 */
function _batchedParallel (items, fn, batchSize, cb) {
  if (items.length === 0) return cb(null, [])

  const results = new Array(items.length)
  let i = 0

  function nextBatch () {
    const batch = items.slice(i, i + batchSize)
    if (batch.length === 0) return cb(null, results)

    const batchStart = i
    i += batchSize

    const tasks = batch.map((item, idx) => {
      return function (done) {
        fn(item, function (err, result) {
          if (err) return done(err)
          results[batchStart + idx] = result
          done(null, result)
        })
      }
    })

    parallel(tasks, function (err) {
      if (err) return cb(err)
      nextBatch()
    })
  }

  nextBatch()
}

module.exports = {
  buildTagProfile,
  scoreByTags,
  hybridScore,
  getRecommendations,
  segmentSessions,
  RECOMMENDATION_DEFAULTS
}
