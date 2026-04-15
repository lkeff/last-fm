// services/server.js
require('dotenv').config()
const path = require('path')
const express = require('express')
const { authenticateLastFm, getSessionKey } = require('./lastfmAuth')
const LastfmScrobbler = require('./lastfmScrobbler')
const LastfmDataProcessor = require('../utils/lastfmDataProcessor')
const { startRetentionSchedule } = require('../utils/retention')

const app = express()
const PORT = process.env.PORT || 3000
const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET
let LASTFM_SESSION_KEY = process.env.LASTFM_SESSION_KEY

// Initialize processors - they need API key and potentially session key
const dataProcessor = new LastfmDataProcessor(LASTFM_API_KEY)
let scrobbler = null

// Middleware to parse JSON request bodies
app.use(express.json())

// --- Authentication Endpoints ---

// Endpoint to initiate Last.fm authentication flow
app.get('/lastfm/authenticate', async (req, res) => {
  try {
    const requestToken = await authenticateLastFm()
    // In a real web app, you might redirect the user here.
    // For a CLI/service context, we provide the URL and tell the user what to do.
    res.status(200).json({
      message: 'Last.fm authentication initiated. Please open the provided URL in your browser to authorize.',
      authorizationUrl: `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&token=${requestToken}`,
      requestToken: requestToken,
      nextStep: 'Once authorized, call /lastfm/session with the requestToken to get the session key.'
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate Last.fm authentication', details: error.message })
  }
})

// Endpoint to exchange request token for a session key
app.post('/lastfm/session', async (req, res) => {
  const { requestToken } = req.body
  if (!requestToken) {
    return res.status(400).json({ error: 'requestToken is required in the request body.' })
  }

  try {
    const sessionKey = await getSessionKey(requestToken)
    LASTFM_SESSION_KEY = sessionKey // Store for immediate use by scrobbler
    scrobbler = new LastfmScrobbler(LASTFM_API_KEY, LASTFM_API_SECRET);
    scrobbler.init(LASTFM_SESSION_KEY);
    console.log('Session Key obtained and scrobbler initialized.')
    // In a production environment, this sessionKey should be securely stored (e.g., in a database, secrets manager)
    // and ideally not returned directly to the client if the client is public.
    res.status(200).json({ message: 'Last.fm session key obtained successfully.', sessionKey: sessionKey })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Last.fm session key', details: error.message })
  }
})

// --- Scrobbling Endpoints ---

// Middleware to ensure scrobbler is initialized
app.use('/lastfm/scrobble', (req, res, next) => {
  if (!scrobbler || !scrobbler.sessionKey) {
    return res.status(401).json({ error: 'Last.fm scrobbler not initialized. Please obtain a session key first.' })
  }
  next()
})

app.post('/lastfm/scrobble/nowplaying', async (req, res) => {
  const { artist, track, album } = req.body
  if (!artist || !track) {
    return res.status(400).json({ error: 'Artist and track are required for now playing update.' })
  }
  try {
    const response = await scrobbler.updateNowPlaying(artist, track, album)
    res.status(200).json({ message: 'Now playing updated successfully.', data: response })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update now playing.', details: error.message })
  }
})

app.post('/lastfm/scrobble/track', async (req, res) => {
  const { artist, track, timestamp, album } = req.body
  if (!artist || !track || !timestamp) {
    return res.status(400).json({ error: 'Artist, track, and timestamp are required for scrobbling.' })
  }
  try {
    const response = await scrobbler.scrobbleTrack(artist, track, timestamp, album)
    res.status(200).json({ message: 'Track scrobbled successfully.', data: response })
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrobble track.', details: error.message })
  }
})

app.post('/lastfm/scrobble/many', async (req, res) => {
  const { tracks } = req.body // Expects an array of track objects
  if (!Array.isArray(tracks) || tracks.some(t => !t.artist || !t.track || !t.timestamp)) {
    return res.status(400).json({ error: 'An array of tracks, each with artist, track, and timestamp, is required.' })
  }
  try {
    const responses = await scrobbler.scrobbleManyTracks(tracks)
    res.status(200).json({ message: 'Tracks scrobbled (batch) successfully.', data: responses })
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrobble multiple tracks.', details: error.message })
  }
})

// --- Metadata & AI/ML Data Endpoints ---

app.get('/lastfm/metadata/track', async (req, res) => {
  const { artist, track } = req.query
  if (!artist || !track) {
    return res.status(400).json({ error: 'Artist and track are required to get track metadata.' })
  }
  try {
    const rawData = await dataProcessor.getTrackDetails(artist, track)
    const processedData = dataProcessor.preprocessForAI(rawData) // Placeholder for AI preprocessing
    res.status(200).json({ message: 'Track metadata fetched and processed.', raw: rawData, processed: processedData })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get track metadata.', details: error.message })
  }
})

app.get('/lastfm/metadata/artist/tags', async (req, res) => {
  const { artist } = req.query
  if (!artist) {
    return res.status(400).json({ error: 'Artist name is required to get artist tags.' })
  }
  try {
    const rawData = await dataProcessor.getArtistTags(artist)
    const processedData = dataProcessor.preprocessForAI({ artist: { tags: rawData, name: artist } }) // Placeholder for AI preprocessing
    res.status(200).json({ message: 'Artist tags fetched and processed.', raw: rawData, processed: processedData })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get artist tags.', details: error.message })
  }
})

// Health check endpoint (required by Docker healthcheck)
app.get('/lastfm/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

// Start the Express server
app.listen(PORT, () => {
  console.log(`Last.fm integration service listening on port ${PORT}`)
  console.log(`API Key: ${LASTFM_API_KEY ? 'Set' : 'NOT SET'}`)
  console.log(`API Secret: ${LASTFM_API_SECRET ? 'Set' : 'NOT SET'}`)
  if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
    console.warn('WARNING: LASTFM_API_KEY or LASTFM_API_SECRET are not set. Some functionalities may not work.')
  }
  if (!LASTFM_SESSION_KEY) {
    console.warn('WARNING: LASTFM_SESSION_KEY is not set. Scrobbling and related functionalities will require authentication first.')
  }

  // Start 19-day data retention purge (runs every 6 h, non-blocking)
  const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../data')
  const logsDir = process.env.LOGS_DIR || path.resolve(__dirname, '../logs')
  startRetentionSchedule({
    ttlDays: Number(process.env.RETENTION_DAYS) || 19,
    dataDir,
    logsDir
  })
  console.log(`[retention] scheduled — TTL ${process.env.RETENTION_DAYS || 19} days, data=${dataDir}, logs=${logsDir}`)
})