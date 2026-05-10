// Load environment variables from .env file
require('dotenv/config')
const express = require('express')
const path = require('path')
const LastFM = require('./index.js')
const axios = require('axios')
const fs = require('fs')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const cors = require('cors')
const compression = require('compression')
const morgan = require('morgan')
const NodeCache = require('node-cache')
const { getStudioRig, getEquipmentCount } = require('./rigs/studio-rig.js')
const { getAllChains, getRoutingDiagram } = require('./rigs/effects-chain-manager.js')
const { spawnSync } = require('child_process')
const { decodeWavBuffer, encodeWavBuffer, pcm16leToFloat32Channels, float32ChannelsToPcm16le } = require('./utils/audio-dsp/wav.js')
const { pipeDecompressed } = require('./utils/zip-stream.js')
const { AutoUpdater } = require('./utils/auto-updater.js')
const { processAudio, createAudioProcessor } = require('./utils/audio-dsp/pedalboard.js')
const { parsePlaylist, generatePlaylist, lastfmTracksToPlaylist } = require('./utils/playlist.js')
const { lastfmNetworkClient } = require('./utils/network.js')
const {
  getLyreRig, getLyrePlayerCount, getLyrePrincipals, getLyreInstruments, getLyreRepertoire
} = require('./rigs/lyre.js')
const {
  getBagpipesRig, getBagpipesPlayerCount, getBagpipesPrincipals, getBagpipesInstruments, getBagpipesRepertoire
} = require('./rigs/bagpipes.js')
const {
  getSynthStringsRig, getSynthUnitsCount, getSynthInstruments, getSynthPatchPresets, getSynthMidiZones
} = require('./rigs/synth-strings.js')
const {
  getBalkanOrchestra, getBalkanMusicianCount, getBalkanPrincipals, getBalkanInstruments, getBalkanRhythmReference, getBalkanRepertoire
} = require('./rigs/balkan-orchestra.js')
const {
  getGamelanRig, getGamelanPlayerCount, getGamelanPrincipals, getGamelanInstruments, getGamelanTuningSystem, getGamelanRepertoire
} = require('./rigs/gamelan.js')
const {
  getSitarRig, getSitarMusicianCount, getSitarPrincipals, getSitarInstruments, getSitarRagas, getSitarGharanas
} = require('./rigs/sitar.js')
const {
  getTablaRig, getTablaDrums, getTablaGharanas, getTablaTaals, getTablaBols
} = require('./rigs/tabla.js')
const {
  getAboriginalAustralianRig, getAboriginalAustralianMusicianCount, getAboriginalAustralianPrincipals, getAboriginalAustralianInstruments, getAboriginalAustralianRegions
} = require('./rigs/aboriginal-australian.js')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware - Security and Performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:', 'https://p.scdn.co'],
      connectSrc: ["'self'", 'https://www.last.fm', 'https://freesound.org', 'https://api.spotify.com', 'https://accounts.spotify.com']
    }
  }
}))
app.use(cors({
  origin: process.env.NODE_ENV !== 'production',
  credentials: true
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.static('.'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/flac', 'audio/ogg']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'))
    }
  }
})

app.use(express.json({ limit: '10mb' }))

// API Keys
const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

// Initialize LastFM
const lastfm = new LastFM(LASTFM_API_KEY)

// Initialize cache for API responses
const cache = new NodeCache({ stdTTL: 300 }) // 5 minutes cache

// Spotify token cache
let spotifyToken = null
let spotifyTokenExpiry = 0

// 24/7 auto-updater: re-reads brass_samples.json and recomputes normalizations
// In Docker the data volume is mounted at /app/data; fall back to cwd for local dev
const SAMPLES_PATH = process.env.SAMPLES_PATH ||
  (fs.existsSync('/app/data') ? '/app/data/brass_samples.json' : './brass_samples.json')
function _readSamplesForUpdater () {
  if (!fs.existsSync(SAMPLES_PATH)) return []
  try {
    const raw = fs.readFileSync(SAMPLES_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : (parsed.samples || [])
  } catch (_) {
    return []
  }
}

const dbAutoUpdater = new AutoUpdater({
  readDB: _readSamplesForUpdater,
  intervalMs: parseInt(process.env.AUTOUPDATE_INTERVAL_MS) || 60_000
})

let _latestNormState = null
const _sseClients = new Set()

dbAutoUpdater.on('update', (data) => {
  _latestNormState = data
  const payload = JSON.stringify({ event: 'update', data })
  _sseClients.forEach(res => {
    try { res.write(`data: ${payload}\n\n`) } catch (_) { }
  })
})

dbAutoUpdater.on('error', (err) => {
  console.error('[auto-updater] error:', err.message)
})

async function getSpotifyToken () {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken
  }
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured')
  }
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const response = await axios.post('https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  spotifyToken = response.data.access_token
  spotifyTokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000
  return spotifyToken
}

// Freesound API configuration
const FREESOUND_BASE_URL = 'https://freesound.org/apiv2'

// Helper function for Freesound API calls
async function fetchFreesound (endpoint, params = {}) {
  try {
    const url = new URL(`${FREESOUND_BASE_URL}${endpoint}`)
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Token ${FREESOUND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    return response.data
  } catch (error) {
    console.error('Freesound API error:', error.response?.status, error.response?.data || error.message)
    throw error
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Last.fm Desktop - Web Version</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .search-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            input[type="text"] { padding: 10px; width: 300px; margin-right: 10px; }
            button { padding: 10px 20px; background: #007cba; color: white; border: none; cursor: pointer; }
            .results { margin-top: 20px; }
            .result-item { padding: 10px; border: 1px solid #eee; margin: 5px 0; }
            .status { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>Last.fm Desktop - Web Version</h1>
        
        <div class="search-section">
            <h2>Search Artists</h2>
            <input type="text" id="artistQuery" placeholder="Enter artist name">
            <button onclick="searchArtist()">Search</button>
            <div id="artistResults" class="results"></div>
        </div>
        
        <div class="search-section">
            <h2>Search Tracks</h2>
            <input type="text" id="trackQuery" placeholder="Enter track name">
            <button onclick="searchTrack()">Search</button>
            <div id="trackResults" class="results"></div>
        </div>
        
        <div class="search-section">
            <h2>Top Tracks Chart</h2>
            <button onclick="getTopTracks()">Get Top Tracks</button>
            <div id="topTracksResults" class="results"></div>
        </div>
        
        <div class="search-section">
            <h2>🎺 Brass Stabs - Freesound Search</h2>
            <input type="text" id="brassQuery" placeholder="Search for brass stabs...">
            <button onclick="searchBrassStabs()">Search Freesound</button>
            <div id="brassResults" class="results"></div>
        </div>
        
        <div class="search-section">
            <h2>🎵 Spotify Track Search (30s Previews)</h2>
            <input type="text" id="spotifyQuery" placeholder="Search for a track or artist">
            <button onclick="searchSpotify()">Search Spotify</button>
            <div id="spotifyResults" class="results"></div>
        </div>

        <div class="search-section">
            <h2>🎵 Last.fm Track Stream (Zip-Aware)</h2>
            <input type="text" id="lastfmStreamUrl" placeholder="Paste a last.fm audio URL" style="width:60%;margin-right:8px">
            <button onclick="playLastFmStream()">Play</button>
            <div id="lastfmStreamStatus" style="margin-top:8px"></div>
            <audio id="lastfmAudio" controls style="margin-top:8px;width:100%;display:none"></audio>
        </div>
        
        <div class="search-section">
            <h2>📁 Local Brass Samples</h2>
            <button onclick="getLocalSamples()">Load Local Samples</button>
            <div style="margin: 10px 0;">
                <input type="file" id="audioFile" accept="audio/*" style="margin-right: 10px;">
                <button onclick="uploadAudio()">Upload Audio</button>
            </div>
            <div id="localSamplesResults" class="results"></div>
        </div>
        
        <div class="status">
            <p>Last.fm API Key: ${LASTFM_API_KEY ? '✓ Configured' : '✗ Not configured'}</p>
            <p>Freesound API Key: ${FREESOUND_API_KEY && FREESOUND_API_KEY !== 'YOUR_FREESOUND_API_KEY' ? '✓ Configured' : '✗ Not configured'}</p>
            <p>Spotify: ${SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET ? '✓ Configured' : '✗ Not configured — add SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET to .env.production'}</p>
        </div>
        
        <script>
            function searchArtist() {
                const query = document.getElementById('artistQuery').value;
                if (!query) return;
                
                document.getElementById('artistResults').innerHTML = '<p>Searching...</p>';
                
                fetch('/api/search/artist?q=' + encodeURIComponent(query))
                    .then(response => response.json())
                    .then(data => {
                        displayResults('artistResults', data);
                    })
                    .catch(error => {
                        document.getElementById('artistResults').innerHTML = '<p>Error: ' + error.message + '</p>';
                    });
            }
            
            function searchTrack() {
                const query = document.getElementById('trackQuery').value;
                if (!query) return;
                
                document.getElementById('trackResults').innerHTML = '<p>Searching...</p>';
                
                fetch('/api/search/track?q=' + encodeURIComponent(query))
                    .then(response => response.json())
                    .then(data => {
                        displayResults('trackResults', data);
                    })
                    .catch(error => {
                        document.getElementById('trackResults').innerHTML = '<p>Error: ' + error.message + '</p>';
                    });
            }
            
            function getTopTracks() {
                document.getElementById('topTracksResults').innerHTML = '<p>Loading...</p>';
                
                fetch('/api/top-tracks')
                    .then(response => response.json())
                    .then(data => {
                        displayResults('topTracksResults', data);
                    })
                    .catch(error => {
                        document.getElementById('topTracksResults').innerHTML = '<p>Error: ' + error.message + '</p>';
                    });
            }
            
            function searchBrassStabs() {
                const query = document.getElementById('brassQuery').value || 'brass stab';
                document.getElementById('brassResults').innerHTML = '<p>Searching Freesound...</p>';
                
                fetch('/api/freesound/search?q=' + encodeURIComponent(query))
                    .then(response => response.json())
                    .then(data => {
                        displayFreesoundResults('brassResults', data);
                    })
                    .catch(error => {
                        document.getElementById('brassResults').innerHTML = '<p>Error: ' + error.message + '</p>';
                    });
            }
            
            function getLocalSamples() {
                document.getElementById('localSamplesResults').innerHTML = '<p>Loading local samples...</p>';
                
                fetch('/api/local-samples')
                    .then(response => response.json())
                    .then(data => {
                        displayLocalSamples('localSamplesResults', data);
                    })
                    .catch(error => {
                        document.getElementById('localSamplesResults').innerHTML = '<p>Error: ' + error.message + '</p>';
                    });
            }
            
            function playLastFmStream() {
                const url = document.getElementById('lastfmStreamUrl').value.trim();
                const status = document.getElementById('lastfmStreamStatus');
                const audio = document.getElementById('lastfmAudio');
                if (!url) { status.innerHTML = '<p style="color:red">Please enter a URL</p>'; return; }
                const proxyUrl = '/api/lastfm/stream?url=' + encodeURIComponent(url);
                status.innerHTML = '<p>Loading stream (decompressing if needed)...</p>';
                audio.src = proxyUrl;
                audio.style.display = 'block';
                audio.load();
                audio.oncanplay = function() { status.innerHTML = '<p style="color:green">Stream ready</p>'; };
                audio.onerror = function() { status.innerHTML = '<p style="color:red">Stream error — check URL or server logs</p>'; };
                audio.play().catch(() => {});
            }

            function uploadAudio() {
                const fileInput = document.getElementById('audioFile');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Please select an audio file to upload');
                    return;
                }
                
                const formData = new FormData();
                formData.append('audio', file);
                
                document.getElementById('localSamplesResults').innerHTML = '<p>Uploading audio...</p>';
                
                fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Audio uploaded successfully!');
                        fileInput.value = '';
                        getLocalSamples(); // Refresh the list
                    } else {
                        alert('Upload failed: ' + data.error);
                    }
                })
                .catch(error => {
                    alert('Upload error: ' + error.message);
                });
            }
            
            function displayResults(elementId, data) {
                const container = document.getElementById(elementId);
                
                if (data.error) {
                    container.innerHTML = '<p>Error: ' + data.error + '</p>';
                    return;
                }
                
                if (!data.results || data.results.length === 0) {
                    container.innerHTML = '<p>No results found</p>';
                    return;
                }
                
                let html = '<h3>Results (' + data.results.length + ')</h3>';
                data.results.forEach(item => {
                    html += '<div class="result-item">';
                    if (item.name) html += '<strong>' + item.name + '</strong><br>';
                    if (item.artist) html += 'Artist: ' + item.artist + '<br>';
                    if (item.listeners) html += 'Listeners: ' + item.listeners.toLocaleString() + '<br>';
                    if (item.playcount) html += 'Play Count: ' + item.playcount.toLocaleString() + '<br>';
                    if (item.url) html += '<a href="' + item.url + '" target="_blank">View on Last.fm</a><br>';
                    html += '</div>';
                });
                
                container.innerHTML = html;
            }
            
            function displayFreesoundResults(elementId, data) {
                const container = document.getElementById(elementId);
                
                if (data.error) {
                    container.innerHTML = '<p>Error: ' + data.error + '</p>';
                    return;
                }
                
                if (!data.results || data.results.length === 0) {
                    container.innerHTML = '<p>No Freesound results found</p>';
                    return;
                }
                
                let html = '<h3>Freesound Results (' + data.results.length + ')</h3>';
                data.results.forEach(sound => {
                    html += '<div class="result-item">';
                    html += '<strong>' + sound.name + '</strong><br>';
                    html += 'Duration: ' + sound.duration + 's<br>';
                    html += 'Downloads: ' + (sound.download || 'N/A') + '<br>';
                    if (sound.preview_url) {
                        html += '<audio controls style="width: 100%; margin-top: 5px;">';
                        html += '<source src="' + sound.preview_url + '" type="audio/mpeg">';
                        html += 'Your browser does not support the audio element.';
                        html += '</audio><br>';
                    }
                    if (sound.url) {
                        html += '<a href="' + sound.url + '" target="_blank">View on Freesound</a><br>';
                    }
                    html += '</div>';
                });
                
                container.innerHTML = html;
            }
            
            function searchSpotify() {
                const query = document.getElementById('spotifyQuery').value;
                if (!query) return;
                document.getElementById('spotifyResults').innerHTML = '<p>Searching Spotify...</p>';
                fetch('/api/spotify/search?q=' + encodeURIComponent(query))
                    .then(r => r.json())
                    .then(data => displaySpotifyResults('spotifyResults', data))
                    .catch(err => {
                        document.getElementById('spotifyResults').innerHTML = '<p>Error: ' + err.message + '</p>';
                    });
            }

            function displaySpotifyResults(elementId, data) {
                const container = document.getElementById(elementId);
                if (data.error) {
                    container.innerHTML = '<p style="color:red;">Error: ' + data.error + '</p>';
                    return;
                }
                if (!data.results || data.results.length === 0) {
                    container.innerHTML = '<p>No results found</p>';
                    return;
                }
                let html = '<h3>Spotify Results (' + data.results.length + ')</h3>';
                data.results.forEach(track => {
                    html += '<div class="result-item" style="display:flex;align-items:center;gap:12px;">';
                    if (track.image) html += '<img src="' + track.image + '" width="56" height="56" style="border-radius:4px;flex-shrink:0;">';
                    html += '<div style="flex:1;min-width:0;">';
                    html += '<strong>' + track.name + '</strong><br>';
                    html += track.artist + ' — <em>' + track.album + '</em><br>';
                    if (track.preview_url) {
                        html += '<audio controls style="width:100%;margin-top:4px;">';
                        html += '<source src="' + track.preview_url + '" type="audio/mpeg">';
                        html += '</audio>';
                    } else {
                        html += '<span style="color:#999;font-size:0.85em;">No preview available</span>';
                    }
                    html += '<br><a href="' + track.spotify_url + '" target="_blank" style="font-size:0.85em;">Open in Spotify</a>';
                    html += '</div></div>';
                });
                container.innerHTML = html;
            }

            function displayLocalSamples(elementId, data) {
                const container = document.getElementById(elementId);
                
                if (data.error) {
                    container.innerHTML = '<p>Error: ' + data.error + '</p>';
                    return;
                }
                
                if (!data.samples || data.samples.length === 0) {
                    container.innerHTML = '<p>No local samples found. Add some brass samples to get started!</p>';
                    return;
                }
                
                let html = '<h3>Local Samples (' + data.samples.length + ')</h3>';
                data.samples.forEach(sample => {
                    html += '<div class="result-item">';
                    html += '<strong>' + sample.name + '</strong><br>';
                    if (sample.tags) html += 'Tags: ' + sample.tags.join(', ') + '<br>';
                    if (sample.description) html += 'Description: ' + sample.description + '<br>';
                    if (sample.duration) html += 'Duration: ' + sample.duration + 's<br>';
                    if (sample.filename) html += '<audio controls style="width: 100%; margin-top: 5px;"><source src="/uploads/' + sample.filename + '" type="' + sample.mimetype + '">Your browser does not support the audio element.</audio><br>';
                    html += '</div>';
                });
                
                container.innerHTML = html;
            }
        </script>
    </body>
    </html>
  `)
})

// Combined Search Endpoint - NEW OPTIMIZATION
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) {
      return res.json({ error: 'Query parameter is required' })
    }

    // Check cache first
    const cacheKey = `search_${query}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    // Use Last.fm combined search for efficiency
    lastfm.search({
      q: query,
      artistsLimit: 5,
      tracksLimit: 5,
      albumsLimit: 5
    }, (err, data) => {
      if (err) {
        return res.json({ error: err.message })
      }

      const result = {
        query,
        artists: data.artists || [],
        tracks: data.tracks || [],
        albums: data.albums || [],
        meta: data.meta || {}
      }

      // Cache the result
      cache.set(cacheKey, result)
      res.json(result)
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Freesound Sound Details Endpoint - NEW FEATURE
app.get('/api/freesound/sound/:id', async (req, res) => {
  try {
    const soundId = req.params.id

    // Check cache first
    const cacheKey = `freesound_sound_${soundId}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const data = await fetchFreesound(`/sounds/${soundId}/`, {
      fields: 'id,name,duration,description,tags,license,username,previews,download'
    })

    // Cache the result
    cache.set(cacheKey, data)
    res.json(data)
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Music Discovery Endpoint - NEW FEATURE
app.get('/api/recommendations/:artist', async (req, res) => {
  try {
    const artistName = req.params.artist

    // Check cache first
    const cacheKey = `recommendations_${artistName}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    lastfm.artistSimilar({ name: artistName, limit: 10 }, (err, data) => {
      if (err) {
        return res.json({ error: err.message })
      }

      // Cache the result
      cache.set(cacheKey, data)
      res.json(data)
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// API Endpoints
app.get('/api/search/artist', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) {
      return res.json({ error: 'Query parameter required' })
    }

    lastfm.artistSearch({ q: query, limit: 10 }, (err, data) => {
      if (err) {
        return res.json({ error: err.message })
      }

      res.json({
        results: data ? (data.result || []) : [],
        query
      })
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

app.get('/api/search/track', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) {
      return res.json({ error: 'Query parameter required' })
    }

    lastfm.trackSearch({ q: query, limit: 10 }, (err, data) => {
      if (err) {
        return res.json({ error: err.message })
      }

      res.json({
        results: data ? (data.result || []) : [],
        query
      })
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

app.get('/api/top-tracks', async (req, res) => {
  try {
    lastfm.chartTopTracks({ limit: 20 }, (err, data) => {
      if (err) {
        return res.json({ error: err.message })
      }

      res.json({
        results: data ? (data.result || []) : []
      })
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

app.get('/api/freesound/search', async (req, res) => {
  try {
    const query = req.query.q || 'brass stab'
    const limit = parseInt(req.query.limit) || 10

    // Check if API key is configured
    if (!FREESOUND_API_KEY || FREESOUND_API_KEY.includes('demo_key') || FREESOUND_API_KEY.includes('YOUR_FREESOUND_API_KEY')) {
      // Return demo data for testing
      return res.json({
        results: [
          {
            id: 123456,
            name: 'Brass Stab Demo 1',
            duration: 2.5,
            download: 1234,
            preview_url: null,
            url: 'https://freesound.org/s/123456/',
            tags: ['brass', 'stab', 'trumpet']
          },
          {
            id: 123457,
            name: 'Horn Hit Demo',
            duration: 1.8,
            download: 892,
            preview_url: null,
            url: 'https://freesound.org/s/123457/',
            tags: ['horn', 'hit', 'brass']
          }
        ],
        query,
        demo: true,
        message: 'Using demo data - configure FREESOUND_API_KEY for real data'
      })
    }

    console.log('Attempting Freesound API call with key:', FREESOUND_API_KEY.substring(0, 20) + '...')

    const data = await fetchFreesound('/search/text/', {
      query,
      filter: 'duration:[0.1 TO 10.0]',
      fields: 'id,name,duration,download,url,tags,previews',
      page_size: limit
    })

    const results = data.results.map(sound => ({
      id: sound.id,
      name: sound.name,
      duration: sound.duration,
      download: sound.download,
      preview_url: sound.previews ? sound.previews['preview-hq-mp3'] : null,
      url: sound.url,
      tags: sound.tags
    }))

    res.json({ results, query, count: results.length })
  } catch (error) {
    console.error('Freesound API error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    // Return demo data as fallback
    res.json({
      results: [
        {
          id: 123456,
          name: 'Brass Stab Demo 1',
          duration: 2.5,
          download: 1234,
          preview_url: null,
          url: 'https://freesound.org/s/123456/',
          tags: ['brass', 'stab', 'trumpet']
        }
      ],
      query: req.query.q || 'brass stab',
      demo: true,
      error: 'API call failed, using demo data',
      api_error: error.message
    })
  }
})

// Local Samples API
app.get('/api/local-samples', async (req, res) => {
  try {
    const samplesPath = './brass_samples.json'

    if (!fs.existsSync(samplesPath)) {
      // Create demo samples file
      const demoSamples = {
        samples: [
          {
            id: 1,
            name: 'Demo Trumpet Stab',
            tags: ['trumpet', 'brass', 'stab'],
            description: 'A bright trumpet stab sound',
            duration: 1.2,
            filepath: '/demo/trumpet_stab.wav',
            added_date: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Demo Horn Hit',
            tags: ['horn', 'brass', 'orchestral'],
            description: 'Orchestral horn hit',
            duration: 2.1,
            filepath: '/demo/horn_hit.wav',
            added_date: new Date().toISOString()
          }
        ]
      }

      fs.writeFileSync(samplesPath, JSON.stringify(demoSamples, null, 2))
      return res.json(demoSamples)
    }

    const samplesData = JSON.parse(fs.readFileSync(samplesPath, 'utf8'))
    res.json(samplesData)
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Audio Upload Endpoint
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, error: 'No file uploaded' })
    }

    // Read existing samples
    const samplesPath = './brass_samples.json'
    let samplesData = { samples: [] }

    if (fs.existsSync(samplesPath)) {
      samplesData = JSON.parse(fs.readFileSync(samplesPath, 'utf8'))
    }

    // Create new sample entry
    const newSample = {
      id: Date.now(),
      name: req.file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
      tags: ['uploaded', 'audio', path.extname(req.file.originalname).substring(1)],
      description: `Uploaded audio file: ${req.file.originalname}`,
      duration: 'Unknown', // Could be extracted with audio analysis library
      filepath: req.file.path,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      added_date: new Date().toISOString()
    }

    samplesData.samples.push(newSample)

    // Save updated samples
    fs.writeFileSync(samplesPath, JSON.stringify(samplesData, null, 2))

    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      sample: newSample
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.json({ success: false, error: error.message })
  }
})
app.post('/api/audio/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const pedals = req.body && req.body.pedals ? JSON.parse(req.body.pedals) : []
    const cabSim = req.body && req.body.cabSim ? JSON.parse(req.body.cabSim) : { enabled: false }

    const inputPath = req.file.path
    let wavPath = inputPath

    const ext = path.extname(req.file.originalname || '').toLowerCase()
    if (ext !== '.wav' && ext !== '.wave') {
      const converted = inputPath + '.wav'
      const ff = spawnSync('ffmpeg', ['-y', '-i', inputPath, '-ac', '2', '-ar', '44100', '-f', 'wav', converted], { encoding: 'utf8' })
      if (ff.status !== 0) {
        const msg = (ff.stderr || ff.stdout || 'ffmpeg failed').toString().slice(0, 4000)
        return res.status(500).json({ error: msg })
      }
      wavPath = converted
    }

    const wavBuf = fs.readFileSync(wavPath)
    const decoded = await decodeWavBuffer(wavBuf)
    const processed = await processAudio({
      sampleRate: decoded.sampleRate,
      channelData: decoded.channelData,
      pedals,
      cabSim
    })
    const outWav = await encodeWavBuffer(processed)
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Content-Disposition', 'attachment; filename="processed.wav"')
    res.status(200).send(outWav)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
const audioSessions = new Map()
const AUDIO_SESSION_TTL_MS = 10 * 60 * 1000

function stableJson (v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(stableJson).join(',') + ']'
  const keys = Object.keys(v).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableJson(v[k])).join(',') + '}'
}

function cleanupAudioSessions () {
  const now = Date.now()
  for (const [sid, sess] of audioSessions.entries()) {
    if (!sess || !sess.updatedAt || now - sess.updatedAt > AUDIO_SESSION_TTL_MS) {
      audioSessions.delete(sid)
    }
  }
}
app.post('/api/audio/process-chunk', async (req, res) => {
  try {
    cleanupAudioSessions()
    const body = req.body || {}
    const sessionId = body.sessionId || String(Date.now())
    const channels = body.channels || 2
    const sampleRate = body.sampleRate || 44100
    const pedals = body.pedals || []
    const cabSim = body.cabSim || { enabled: false }
    if (!body.pcm16leBase64) return res.status(400).json({ error: 'pcm16leBase64 required' })

    const pcmBuf = Buffer.from(body.pcm16leBase64, 'base64')
    const channelData = pcm16leToFloat32Channels(pcmBuf, channels)

    const configKey = stableJson({ channels, sampleRate, pedals, cabSim })
    const existing = audioSessions.get(sessionId)
    let processor = existing && existing.configKey === configKey ? existing.processor : null
    if (!processor) {
      processor = createAudioProcessor({ sampleRate, pedals, cabSim })
    }

    const processed = await processor.processChannels(channelData)
    const outPcm = float32ChannelsToPcm16le(processed.channelData)

    audioSessions.set(sessionId, { updatedAt: Date.now(), configKey, processor })

    res.json({
      sessionId,
      pcm16leBase64: outPcm.toString('base64')
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Serve uploaded audio files
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(__dirname, 'uploads', filename)

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath)
  } else {
    res.status(404).json({ error: 'File not found' })
  }
})

// Studio Rig Information Endpoint - NEW FEATURE
app.get('/api/studio/rig', (req, res) => {
  try {
    const studioRig = getStudioRig()
    const equipmentCount = getEquipmentCount()

    res.json({
      rig: studioRig,
      counts: equipmentCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Effects Chains Endpoint - NEW FEATURE
app.get('/api/studio/chains', (req, res) => {
  try {
    const chains = getAllChains()
    const routing = getRoutingDiagram()

    res.json({
      chains,
      routing,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// MIDI Automation Endpoint - NEW FEATURE
app.get('/api/studio/midi', (req, res) => {
  try {
    const studioRig = getStudioRig()
    const midiControllers = studioRig.instruments?.synthesizers?.midiControllers || {}
    const midiInterfaces = studioRig.instruments?.synthesizers?.midiInterface || {}

    res.json({
      controllers: midiControllers,
      interfaces: midiInterfaces,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ─── Lyre endpoints ────────────────────────────────────────────────────────

app.get('/api/studio/lyre', (req, res) => {
  try {
    res.json({ rig: getLyreRig(), players: getLyrePlayerCount(), principals: getLyrePrincipals(), instruments: getLyreInstruments(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/lyre/repertoire', (req, res) => {
  try {
    res.json({ repertoire: getLyreRepertoire(req.query.style || null), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Bagpipes endpoints ────────────────────────────────────────────────────

app.get('/api/studio/bagpipes', (req, res) => {
  try {
    res.json({ rig: getBagpipesRig(), players: getBagpipesPlayerCount(), principals: getBagpipesPrincipals(), instruments: getBagpipesInstruments(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/bagpipes/repertoire', (req, res) => {
  try {
    res.json({ repertoire: getBagpipesRepertoire(req.query.region || null), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Synth strings endpoints ───────────────────────────────────────────────

app.get('/api/studio/synth-strings', (req, res) => {
  try {
    res.json({ rig: getSynthStringsRig(), units: getSynthUnitsCount(), instruments: getSynthInstruments(), presets: getSynthPatchPresets(), midiZones: getSynthMidiZones(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Balkan orchestra endpoints ────────────────────────────────────────────

app.get('/api/studio/balkan-orchestra', (req, res) => {
  try {
    res.json({ rig: getBalkanOrchestra(), musicians: getBalkanMusicianCount(), principals: getBalkanPrincipals(), instruments: getBalkanInstruments(), rhythmReference: getBalkanRhythmReference(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/balkan-orchestra/repertoire', (req, res) => {
  try {
    res.json({ repertoire: getBalkanRepertoire(req.query.region || null), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/gamelan', (req, res) => {
  try {
    const rig = getGamelanRig()
    res.json({ type: rig.type, totalMusicians: rig.totalMusicians, playerCount: getGamelanPlayerCount(), principals: getGamelanPrincipals(), instruments: getGamelanInstruments(), tuning: getGamelanTuningSystem(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/gamelan/repertoire', (req, res) => {
  try {
    res.json({ repertoire: getGamelanRepertoire(req.query.style || null), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/sitar', (req, res) => {
  try {
    const rig = getSitarRig()
    res.json({ type: rig.type, totalMusicians: rig.totalMusicians, musicianCount: getSitarMusicianCount(), principals: getSitarPrincipals(), instruments: getSitarInstruments(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/sitar/ragas', (req, res) => {
  try {
    res.json({ ragas: getSitarRagas(), gharanas: getSitarGharanas(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/tabla', (req, res) => {
  try {
    const rig = getTablaRig()
    res.json({ type: rig.type, drums: getTablaDrums(), bols: getTablaBols(), taals: getTablaTaals(), gharanas: getTablaGharanas(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/aboriginal-australian', (req, res) => {
  try {
    const rig = getAboriginalAustralianRig()
    res.json({ type: rig.type, totalMusicians: rig.totalMusicians, musicianCount: getAboriginalAustralianMusicianCount(), principals: getAboriginalAustralianPrincipals(), instruments: getAboriginalAustralianInstruments(), regions: getAboriginalAustralianRegions(), timestamp: new Date().toISOString() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Monster Cable Inventory Endpoint - NEW FEATURE
app.get('/api/studio/cables', (req, res) => {
  try {
    const studioRig = getStudioRig()
    const monsterCables = studioRig.instruments?.synthesizers?.patchwork?.monsterCable || {}
    const cableManagement = studioRig.instruments?.synthesizers?.patchwork?.cableManagement || {}

    res.json({
      monsterCables,
      cableManagement,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Spotify Track Search Endpoint
app.get('/api/spotify/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) {
      return res.json({ error: 'Query parameter required' })
    }
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.json({ error: 'Spotify credentials not configured — add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.production' })
    }

    const cacheKey = `spotify_${query}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const token = await getSpotifyToken()
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'track', limit: 10 },
      headers: { Authorization: `Bearer ${token}` }
    })

    const tracks = response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      preview_url: track.preview_url,
      spotify_url: track.external_urls.spotify,
      image: track.album.images[1]?.url || track.album.images[0]?.url || null,
      duration_ms: track.duration_ms
    }))

    const result = { results: tracks, query }
    cache.set(cacheKey, result)
    res.json(result)
  } catch (error) {
    console.error('Spotify API error:', error.response?.status, error.response?.data || error.message)
    res.json({ error: error.message })
  }
})

// Video Capture Profile Endpoint - NEW FEATURE
app.get('/api/studio/video-capture', (req, res) => {
  try {
    const studioRig = getStudioRig()
    const videoCapture = studioRig.videoCapture || {}

    res.json({
      videoCapture,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// Last.fm zip-aware audio stream proxy
app.get('/api/lastfm/stream', async (req, res) => {
  const trackUrl = req.query.url
  if (!trackUrl) {
    return res.status(400).json({ error: 'url query param required' })
  }

  let parsed
  try {
    parsed = new URL(trackUrl)
  } catch (_) {
    return res.status(400).json({ error: 'invalid url' })
  }

  const allowedHosts = ['www.last.fm', 'last.fm', 'ws.audioscrobbler.com', 'cdn.last.fm']
  if (!allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
    return res.status(403).json({ error: 'only last.fm URLs are permitted' })
  }

  try {
    const response = await axios.get(trackUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'LastFM-Desktop/1.0',
        Accept: 'audio/*, application/zip, application/octet-stream'
      },
      validateStatus: status => status < 500
    })

    if (response.status !== 200) {
      return res.status(response.status).json({ error: 'upstream returned ' + response.status })
    }

    const contentEncoding = response.headers['content-encoding'] || ''
    const contentType = response.headers['content-type'] || 'audio/mpeg'
    const audioType = contentType.split(';')[0].trim()

    res.setHeader('Content-Type', /^audio\//.test(audioType) ? audioType : 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Zip-Aware', 'true')

    const decompressed = pipeDecompressed(response.data, contentEncoding)
    decompressed.on('error', err => {
      console.error('[zip-stream] decompression error:', err.message)
      if (!res.headersSent) res.status(500).json({ error: err.message })
      else res.destroy()
    })
    decompressed.pipe(res)
  } catch (error) {
    console.error('[lastfm/stream] error:', error.message)
    if (!res.headersSent) res.status(500).json({ error: error.message })
  }
})

// ─── Playlist endpoints ────────────────────────────────────────────────────

/**
 * GET /api/playlist/export
 * Export a Last.fm user's recent or top tracks as a playlist file.
 *
 * Query params:
 *   user    (required) — Last.fm username
 *   type    — 'recent' | 'top' | 'loved'  (default: recent)
 *   period  — 'overall' | '7day' | '1month' | '3month' | '6month' | '12month'
 *   limit   — number of tracks (default: 50, max: 200)
 *   format  — 'pls' | 'm3u' | 'xspf'  (default: m3u)
 *   title   — playlist title (default: "<user>'s Last.fm tracks")
 */
app.get('/api/playlist/export', async (req, res) => {
  const { user, type = 'recent', period = 'overall', format = 'm3u', title } = req.query
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200)

  if (!user) return res.status(400).json({ error: 'user param is required' })
  if (!LASTFM_API_KEY) return res.status(503).json({ error: 'Last.fm API key not configured' })

  try {
    let tracks
    await new Promise((resolve, reject) => {
      const opts = { user, limit, period }
      const handler = (err, data) => {
        if (err) return reject(err)
        tracks = data.result
        resolve()
      }
      if (type === 'top') lastfm.userTopTracks(opts, handler)
      else if (type === 'loved') lastfm.userLovedTracks(opts, handler)
      else lastfm.userRecentTracks(opts, handler)
    })

    const playlistTracks = lastfmTracksToPlaylist(tracks)
    const playlistTitle = title || `${user}'s Last.fm ${type} tracks`
    const { content, contentType, ext } = generatePlaylist(playlistTracks, { format, title: playlistTitle })

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${user}-${type}.${ext}"`)
    res.send(content)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/playlist/import
 * Parse an uploaded playlist file (PLS, M3U, M3U8, XSPF) and return JSON.
 *
 * Body: multipart/form-data with field 'playlist' (file upload)
 *   OR application/x-www-form-urlencoded with field 'content' (raw text) + optional 'format'
 */
const playlistUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB max for playlist files
  fileFilter: (req, file, cb) => {
    const allowed = ['.pls', '.m3u', '.m3u8', '.xspf', '.xml']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  }
})

app.post('/api/playlist/import', playlistUpload.single('playlist'), (req, res) => {
  try {
    let text, filename
    if (req.file) {
      text = req.file.buffer.toString('utf8')
      filename = req.file.originalname
    } else if (req.body && req.body.content) {
      text = req.body.content
      filename = req.body.filename || ''
    } else {
      return res.status(400).json({ error: 'No playlist data provided. Use multipart field "playlist" or body field "content".' })
    }

    const tracks = parsePlaylist(text, { filename, format: req.body && req.body.format })
    res.json({ count: tracks.length, tracks })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ─── Network stats endpoint ────────────────────────────────────────────────

/** GET /api/network/stats — live circuit-breaker and request metrics */
app.get('/api/network/stats', (req, res) => {
  res.json(lastfmNetworkClient.stats())
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lastfm-desktop-web',
    network: lastfmNetworkClient.stats().circuitBreaker
  })
})

// Normalization status endpoint — last refresh time, run count, interval
app.get('/api/normalization/status', (req, res) => {
  res.json({
    ...dbAutoUpdater.status(),
    sampleCount: _latestNormState ? _latestNormState.samples.length : null,
    fields: _latestNormState ? _latestNormState.fields : null
  })
})

// SSE endpoint — streams real-time normalization updates to any browser tab
app.get('/api/normalization/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send current state immediately on connect
  if (_latestNormState) {
    res.write(`data: ${JSON.stringify({ event: 'update', data: _latestNormState })}\n\n`)
  }

  _sseClients.add(res)

  req.on('close', () => {
    _sseClients.delete(res)
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Last.fm Desktop Web Server running on http://localhost:${PORT}`)
  console.log('Open your browser to access the application')
  dbAutoUpdater.start()
  console.log(`[auto-updater] started — interval ${dbAutoUpdater.status().intervalMs}ms`)
})
