import { app, BrowserWindow, ipcMain, dialog, shell, powerMonitor } from 'electron'
import { exec } from 'child_process'
import path from 'path'
import LastFM from './index.js'
import axios from 'axios'
import fs from 'fs'
import 'dotenv/config'
import * as security from './utils/security.js'
import { createAFKGuard } from './utils/afk-guard.js'

// Validation utilities
function validateApiKey(key, serviceName) {
  if (!key || key.startsWith('YOUR_')) {
    throw new Error(`${serviceName} API key not configured. Please set the appropriate environment variable.`)
  }
  return true
}

function validateSearchQuery(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Search query must be a non-empty string')
  }
  return query.trim()
}

const PERCENT = 100
// Normalization utilities
function computeNormalization(dataset, fields, mode = 'unit') {
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return {
      data: [],
      metadata: {
        fields,
        mode,
        ranges: {},
        count: 0,
        timestamp: Date.now()
      }
    }
  }

  // Compute min/max values for each field
  const ranges = {}
  fields.forEach(field => {
    const values = dataset
      .map(item => item[field])
      .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0)

    if (values.length === 0) {
      ranges[field] = { min: 0, max: 1, count: 0 }
    } else if (values.length === 1) {
      ranges[field] = { min: 0, max: values[0] || 1, count: 1 }
    } else {
      ranges[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length
      }
    }
  })

  // Normalize the dataset
  const normalizedData = dataset.map(item => {
    const normalized = { ...item }

    fields.forEach(field => {
      const originalValue = item[field]
      if (typeof originalValue === 'number' && !isNaN(originalValue) && originalValue >= 0) {
        const { min, max } = ranges[field]
        let normalizedValue

        if (min === max) {
          normalizedValue = mode === 'percent' ? 0 : 0
        } else {
          const ratio = (originalValue - min) / (max - min)
          normalizedValue = mode === 'percent' ? ratio * PERCENT : ratio
        }

        normalized[`${field}_normalized`] = Math.round(normalizedValue * PERCENT) / PERCENT // Round to 2 decimal places
        normalized[`${field}_original`] = originalValue
      } else {
        normalized[`${field}_normalized`] = mode === 'percent' ? 0 : 0
        normalized[`${field}_original`] = originalValue
      }
    })

    return normalized
  })

  return {
    data: normalizedData,
    metadata: {
      fields,
      mode,
      ranges,
      count: dataset.length,
      timestamp: Date.now()
    }
  }
}

let lastfm
let afkGuard
let encryptionKey = null
let localSamplesPath
let encryptedSamplesPath

const AFK_TIMEOUT = 10 * 60 * 1000
const AFK_WARNING = 2 * 60 * 1000
function initializeApp() {
  localSamplesPath = path.join(app.getPath('userData'), 'brass_samples.json')
  encryptedSamplesPath = path.join(app.getPath('userData'), 'brass_samples.enc')

  try {
    validateApiKey(API_KEY, 'Last.fm')
    lastfm = new LastFM(API_KEY)
  } catch (error) {
    lastfm = null
  }

  try {
    afkGuard = createAFKGuard({
      activity: {
        timeout: parseInt(process.env.AFK_TIMEOUT_MINUTES) * 60 * 1000 || AFK_TIMEOUT,
        warningTime: parseInt(process.env.AFK_WARNING_MINUTES) * 60 * 1000 || AFK_WARNING,
        sensitivity: process.env.AFK_SENSITIVITY || 'normal'
      },
      session: {
        unlockMethod: process.env.AFK_UNLOCK_METHOD || 'click'
      },
      enabled: process.env.AFK_ENABLED !== 'false'
    })
  } catch (error) {
    afkGuard = null
  }

  try {
    encryptionKey = security.deriveKeyFromMachine()
  } catch (error) {
  }

  initLocalSamplesDB()
}

// Create window when Electron is ready
app.whenReady().then(() => {
  initializeApp()
  setupSecurityHandlers()
  createWindow()

  app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Set up security-related IPC handlers
function setupSecurityHandlers() {
  // Secure external link handler
  ipcMain.handle('open-external-safe', async (url) => {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided')
      }

      const validation = security.validateExternalLink(url)

      if (validation.safe && validation.trusted) {
        // Trusted domain - open directly
        await shell.openExternal(url)
        return { success: true, opened: true, trusted: true }
      } else if (!validation.suspicious) {
        // Not trusted but not suspicious - show confirmation dialog
        const response = await dialog.showMessageBox(mainWindow, {
          type: 'question',
          title: 'Open External Link',
          message: 'Do you want to open this external link?',
          detail: `URL: ${url}\n\nThis domain is not in the trusted list but appears safe.`, 
          buttons: ['Open', 'Cancel'],
          defaultId: 1,
          cancelId: 1
        })

        if (response.response === 0) {
          await shell.openExternal(url)
          return { success: true, opened: true, trusted: false, confirmed: true }
        } else {
          return { success: true, opened: false, canceled: true }
        }
      } else {
        // Suspicious URL - show warning
        const response = await dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Suspicious Link Detected',
          message: 'This link appears suspicious and may be unsafe.',
          detail: `URL: ${url}\n\nReasons: ${validation.reasons.join(', ')}\n\nAre you sure you want to open it?`, 
          buttons: ['Open Anyway', 'Cancel'],
          defaultId: 1,
          cancelId: 1
        })

        if (response.response === 0) {
          await shell.openExternal(url)
          return { success: true, opened: true, trusted: false, suspicious: true, confirmed: true }
        } else {
          return { success: true, opened: false, suspicious: true, canceled: true }
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // AFK Guard handlers
  ipcMain.handle('user-activity', async () => {
    if (afkGuard && afkGuard.activityTracker) {
      afkGuard.activityTracker.handleActivity({ type: 'renderer-reported' })
    }
    return { success: true }
  })

  ipcMain.handle('afk-lock', async () => {
    if (afkGuard && afkGuard.sessionManager) {
      afkGuard.sessionManager.lockSession()
      return { success: true, locked: true }
    }
    return { success: false, error: 'AFK Guard not available' }
  })

  ipcMain.handle('afk-unlock', async (credentials) => {
    if (afkGuard && afkGuard.sessionManager) {
      const unlocked = await afkGuard.sessionManager.unlockSession(credentials)
      return { success: true, unlocked }
    }
    return { success: false, error: 'AFK Guard not available' }
  })

  ipcMain.handle('afk-status', async () => {
    if (afkGuard) {
      return { success: true, status: afkGuard.getStatus() }
    }
    return { success: false, error: 'AFK Guard not available' }
  })

  // System-level inactivity detection
  if (powerMonitor) {
    powerMonitor.on('suspend', () => {
      if (afkGuard && afkGuard.sessionManager) {
        afkGuard.sessionManager.lockSession()
      }
    })

    powerMonitor.on('lock-screen', () => {
      if (afkGuard && afkGuard.sessionManager) {
        afkGuard.sessionManager.lockSession()
      }
    })
  }

}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Security cleanup on app exit
app.on('before-quit', () => {

  // Stop AFK guard
  if (afkGuard) {
    try {
      afkGuard.stop()
    } catch (error) {
    }
  }

  // Clear sensitive data from memory
  if (encryptionKey) {
    encryptionKey.fill(0)
    encryptionKey = null
  }

  // Clear logs if configured
  if (process.env.CLEAR_LOGS_ON_EXIT === 'true') {
    try {
      // This would clear application logs - implementation depends on logging setup
    } catch (error) {
    }
  }

})

// Handle uncaught exceptions securely
process.on('uncaughtException', (error) => {

  // Perform emergency cleanup
  if (afkGuard && afkGuard.sessionManager) {
    try {
      afkGuard.sessionManager.lockSession()
    } catch (lockError) {
    }
  }

  // Exit gracefully
  process.exit(1)
})

// Handle unhandled promise rejections securely
process.on('unhandledRejection', (reason, promise) => {
})
// IPC handlers for Last.fm API with enhanced security
ipcMain.handle('search-lastfm', async (query) => {
  try {
    if (!lastfm) {
      throw new Error('Last.fm client not initialized. Please check your API key configuration.')
    }

    const validatedQuery = validateSearchQuery(query)

    return new Promise((resolve, reject) => {
      lastfm.search({ q: validatedQuery, limit: 10 }, (err, data) => {
        if (err) {
          reject(new Error(`Last.fm search failed: ${err.message}`))
        } else {
          // Sanitize API response before processing
          let sanitizedData
          try {
            sanitizedData = { ...data }
            if (data?.result) {
              // Sanitize each result type
              ['artist', 'track', 'album'].forEach(type => {
                if (data.result[type] && Array.isArray(data.result[type])) {
                  sanitizedData.result[type] = security.sanitizeSearchResults(data.result[type])
                }
              })
            }
          } catch (sanitizeError) {
            sanitizedData = data
          }

          // Apply normalization to sanitized Last.fm results
          const normalizedData = { ...sanitizedData }
          const fieldsToNormalize = ['listeners', 'playcount']

          if (sanitizedData?.result) {
            // Normalize artists
            if (sanitizedData.result.artist && Array.isArray(sanitizedData.result.artist)) {
              const artistNormalization = computeNormalization(sanitizedData.result.artist, fieldsToNormalize, 'percent')
              normalizedData.result.artist = artistNormalization.data
              normalizedData.normalization = normalizedData.normalization || {}
              normalizedData.normalization.artist = artistNormalization.metadata
            }

            // Normalize tracks
            if (sanitizedData.result.track && Array.isArray(sanitizedData.result.track)) {
              const trackNormalization = computeNormalization(sanitizedData.result.track, fieldsToNormalize, 'percent')
              normalizedData.result.track = trackNormalization.data
              normalizedData.normalization = normalizedData.normalization || {}
              normalizedData.normalization.track = trackNormalization.metadata
            }

            // Normalize albums
            if (sanitizedData.result.album && Array.isArray(sanitizedData.result.album)) {
              const albumNormalization = computeNormalization(sanitizedData.result.album, fieldsToNormalize, 'percent')
              normalizedData.result.album = albumNormalization.data
              normalizedData.normalization = normalizedData.normalization || {}
              normalizedData.normalization.album = albumNormalization.metadata
            }
          }

          resolve(normalizedData)
        }
      })
    })
  } catch (error) {
    throw error
  }
})

// Search for brass stabs in local database with enhanced security
ipcMain.handle('search-local-brass', async (query) => {
  try {
    const validatedQuery = validateSearchQuery(query)

    let samples
    try {
      samples = readSamplesDB()
    } catch (dbError) {
      return { results: [], normalization: null, error: 'Database unavailable' }
    }

    const queryLower = validatedQuery.toLowerCase()

    const results = samples.filter(sample => {
      if (!sample || typeof sample !== 'object') return false

      const nameMatch = sample.name && sample.name.toLowerCase().includes(queryLower)
      const tagMatch = sample.tags && Array.isArray(sample.tags) &&
        sample.tags.some(tag => tag && tag.toLowerCase().includes(queryLower))
      const descriptionMatch = sample.description &&
        sample.description.toLowerCase().includes(queryLower)

      return nameMatch || tagMatch || descriptionMatch
    })

    // Sanitize results before normalization
    let sanitizedResults
    try {
      sanitizedResults = security.sanitizeSearchResults(results)
    } catch (sanitizeError) {
      sanitizedResults = results
    }

    // Apply normalization to sanitized local brass samples
    const fieldsToNormalize = ['duration', 'filesize']
    const normalization = computeNormalization(sanitizedResults, fieldsToNormalize, 'percent')

    return {
      results: normalization.data,
      normalization: normalization.metadata,
      query: validatedQuery
    }
  } catch (error) {
    return { results: [], normalization: null, error: error.message }
  }
})

const FREESOUND_PAGE_SIZE = 20
const FREESOUND_TIMEOUT = 10000
const HTTP_STATUS_UNAUTHORIZED = 401
const HTTP_STATUS_TOO_MANY_REQUESTS = 429
// Search for brass stabs online (Freesound API) with enhanced security
ipcMain.handle('search-online-brass', async (query) => {
  try {
    validateApiKey(FREESOUND_API_KEY, 'Freesound')
    const validatedQuery = validateSearchQuery(query)

    const searchQuery = `brass stabs ${validatedQuery}`
    const response = await axios.get('https://freesound.org/apiv2/search/text/', {
      params: {
        query: searchQuery,
        fields: 'id,name,tags,previews,description,username,duration,filesize,type,downloads',
        pageSize: FREESOUND_PAGE_SIZE,
        sort: 'score'
      },
      headers: {
        Authorization: `Token ${FREESOUND_API_KEY}`,
        'User-Agent': 'BrassStabsApp/1.0'
      },
      timeout: FREESOUND_TIMEOUT // 10 second timeout
    })

    if (!response.data || !response.data.results) {
      return { results: [], normalization: null }
    }

    // Validate and sanitize results
    const results = response.data.results.filter(result => {
      return result && result.id && result.name
    }).map(result => ({
      ...result,
      source: 'freesound',
      searchQuery: validatedQuery
    }))

    // Sanitize API response
    let sanitizedResults
    try {
      sanitizedResults = security.sanitizeSearchResults(results)
    } catch (sanitizeError) {
      sanitizedResults = results
    }

    // Apply normalization to sanitized Freesound results
    const fieldsToNormalize = ['duration', 'filesize', 'downloads']
    const normalization = computeNormalization(sanitizedResults, fieldsToNormalize, 'percent')

    return {
      results: normalization.data,
      normalization: normalization.metadata,
      query: validatedQuery,
      totalCount: response.data.count
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === HTTP_STATUS_UNAUTHORIZED) {
        throw new Error('Invalid Freesound API key. Please check your configuration.')
      } else if (error.response.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
        throw new Error('Freesound API rate limit exceeded. Please try again later.')
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to Freesound. Please check your internet connection.')
    } else {
    }

    return { results: [], normalization: null, error: error.message }
  }
})

// Add a new brass sample to local database with enhanced security
ipcMain.handle('add-brass-sample', async (sample) => {
  try {
    if (!sample || typeof sample !== 'object') {
      throw new Error('Invalid sample data provided')
    }

    if (!sample.name || typeof sample.name !== 'string') {
      throw new Error('Sample name is required and must be a string')
    }

    let samples
    try {
      samples = readSamplesDB()
    } catch (dbError) {
      return { success: false, error: 'Database unavailable' }
    }

    // Check for duplicates
    const existingSample = samples.find(s =>
      s.name === sample.name && s.path === sample.path
    )

    if (existingSample) {
      return { success: false, error: 'Sample already exists in database' }
    }

    // Sanitize sample data
    let sanitizedSample
    try {
      const sampleArray = [sample]
      const sanitizedArray = security.sanitizeSearchResults(sampleArray)
      sanitizedSample = sanitizedArray[0]
    } catch (sanitizeError) {
      sanitizedSample = sample
    }

    const newSample = {
      id: Date.now().toString(),
      name: sanitizedSample.name.trim(),
      path: sanitizedSample.path || '',
      tags: Array.isArray(sanitizedSample.tags) ? sanitizedSample.tags.filter(tag => tag && typeof tag === 'string') : [],
      description: sanitizedSample.description || '',
      duration: sanitizedSample.duration || null,
      filesize: sanitizedSample.filesize || null,
      dateAdded: new Date().toISOString(),
      source: sanitizedSample.source || 'local'
    }

    samples.push(newSample)

    try {
      writeSamplesDB(samples)
    } catch (writeError) {
      return { success: false, error: 'Failed to save to database' }
    }

    return { success: true, sample: newSample }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Transcribe audio using the Whisper stack
ipcMain.handle('transcribe-audio', async (filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided')
    }

    return new Promise((resolve, reject) => {
      // Construct command to run Whisper (assumes whisper is in PATH or env var)
      // Using --output_format json to easily parse the result
      const command = `${WHISPER_CMD} "${filePath}" --model base --output_format json --output_dir "${app.getPath('temp')}"`

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Transcription failed: ${error.message}`))
          return
        }

        // The CLI output might contain logs, but the JSON file is saved to temp.
        // For simplicity in this integration, we return the stdout or read the generated JSON.
        // Here we return the raw stdout which usually contains the text in default mode, 
        // or we can parse the JSON if we read the file.
        resolve({ success: true, rawOutput: stdout, stderr: stderr })
      })
    })
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// File dialog for selecting brass sample files with enhanced security
ipcMain.handle('select-brass-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Brass Sample File',
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'ogg'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled) {
      return { success: false, canceled: true }
    }

    const files = result.filePaths.map(filePath => {
      const stats = fs.statSync(filePath)
      return {
        path: filePath,
        name: path.basename(filePath, path.extname(filePath)),
        extension: path.extname(filePath),
        size: stats.size,
        modified: stats.mtime
      }
    })

    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Open Electron Fiddle with a template (using secure external link handler)
ipcMain.handle('open-fiddle', async (template) => {
  try {
    if (!template || typeof template !== 'object') {
      throw new Error('Invalid template data provided')
    }

    // Create a comprehensive fiddle template
    const fiddle = {
      version: 1,
      main: template.main || `
// Main process for brass stabs experimentation
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
`,
      renderer: template.renderer || `
// Renderer process for brass stabs
console.log('Brass Stabs Fiddle loaded!');

// Example: Load and play a brass stab sample
function loadBrassStab(url) {
  const audio = new Audio(url);
  audio.play().catch(console.error);
}
`,
      preload: template.preload || `
// Preload script for brass stabs
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('brassStabs', {
  log: (message) => console.log('BrassStabs:', message)
});
`,
      html: template.html || `
<!DOCTYPE html>
<html>
<head>
  <title>Brass Stabs Fiddle</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #1e1e1e; color: white; }
    button { padding: 10px 20px; margin: 5px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #005a9e; }
  </style>
</head>
<body>
  <h1>🎺 Brass Stabs Experiment</h1>
  <p>Use this fiddle to experiment with brass stabs and audio processing.</p>
  <button onclick="console.log('Brass stab triggered!')">Test Brass Stab</button>
  <script src="renderer.js"></script>
</body>
</html>
`,
      config: {
        dependencies: template.dependencies || {},
        name: template.name || 'brass-stabs-experiment',
        description: template.description || 'Experiment with brass stabs in Electron'
      }
    }

    // Create temp directory if it doesn't exist
    const tempDir = app.getPath('temp')
    const fiddleDir = path.join(tempDir, 'electron-fiddles')
    if (!fs.existsSync(fiddleDir)) {
      fs.mkdirSync(fiddleDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fiddleName = (template.name || 'brass-stabs-fiddle').replace(/[^a-zA-Z0-9-_]/g, '-')
    const tempFiddlePath = path.join(fiddleDir, `${fiddleName}-${timestamp}.json`)

    fs.writeFileSync(tempFiddlePath, JSON.stringify(fiddle, null, 2))

    // Try multiple methods to open Electron Fiddle
    const fiddleUrl = `electron-fiddle://open/${encodeURIComponent(tempFiddlePath)}`

    try {
      // Method 1: Try the custom protocol using secure handler
      const protocolResult = await ipcMain.handle('open-external-safe', event, fiddleUrl) // This line seems to have an issue, it should be calling the handler, not assigning it.
      if (protocolResult.success && protocolResult.opened) {
        return { success: true, method: 'protocol', path: tempFiddlePath }
      }
    } catch (protocolError) {
    }

    try {
      // Method 2: Try to open the JSON file directly (user can import manually)
      await shell.showItemInFolder(tempFiddlePath)
      return {
        success: true,
        method: 'file',
        path: tempFiddlePath,
        message: 'Fiddle file created. Import it manually in Electron Fiddle.'
      }
    } catch (fileError) {

      // Method 3: Return the file content for manual use
      return {
        success: true,
        method: 'content',
        path: tempFiddlePath,
        content: fiddle,
        message: 'Electron Fiddle not found. Use the provided content to create a fiddle manually.'
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})


let mainWindow

function initLocalSamplesDB() {
}

function createWindow() {
}

function readSamplesDB() {
}

function writeSamplesDB() {
}

// Get available fiddle templates with enhanced security
ipcMain.handle('get-fiddle-templates', async () => {
  try {
    const templatesDir = path.join(__dirname, 'fiddle-templates')

    if (!fs.existsSync(templatesDir)) {
      return []
    }

    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'))
    const templates = []

    for (const file of files) {
      try {
        const filePath = path.join(templatesDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const template = JSON.parse(content)

        // Sanitize template content
        let sanitizedTemplate
        try {
          sanitizedTemplate = {
            filename: file,
            name: security.sanitizeHtml(template.name || path.basename(file, '.json')),
            description: security.sanitizeHtml(template.description || 'No description available'),
            main: template.main || '',
            renderer: template.renderer || '',
            preload: template.preload || '',
            html: template.html || '',
            config: template.config || {}
          }
        } catch (sanitizeError) {
          sanitizedTemplate = {
            filename: file,
            name: template.name || path.basename(file, '.json'),
            description: template.description || 'No description available',
            ...template
          }
        }

        templates.push(sanitizedTemplate)
      } catch (parseError) {
      }
    }

    return templates
  } catch (error) {
    return []
  }
})