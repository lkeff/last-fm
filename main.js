const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const LastFM = require('./index.js');
const axios = require('axios');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// API keys from environment variables with fallbacks
const API_KEY = process.env.LASTFM_API_KEY || 'YOUR_LAST_FM_API_KEY';
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || 'YOUR_FREESOUND_API_KEY';

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  console.log(logMessage);
  if (data) {
    console.log('Data:', data);
  }
}

// Validation utilities
function validateApiKey(key, serviceName) {
  if (!key || key.startsWith('YOUR_')) {
    throw new Error(`${serviceName} API key not configured. Please set the appropriate environment variable.`);
  }
  return true;
}

function validateSearchQuery(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Search query must be a non-empty string');
  }
  return query.trim();
}

// Normalization utilities
function computeNormalization(dataset, fields, mode = 'unit') {
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return {
      data: [],
      metadata: {
        fields: fields,
        mode: mode,
        ranges: {},
        count: 0,
        timestamp: Date.now()
      }
    };
  }

  // Compute min/max values for each field
  const ranges = {};
  fields.forEach(field => {
    const values = dataset
      .map(item => item[field])
      .filter(val => typeof val === 'number' && !isNaN(val) && val >= 0);
    
    if (values.length === 0) {
      ranges[field] = { min: 0, max: 1, count: 0 };
    } else if (values.length === 1) {
      ranges[field] = { min: 0, max: values[0] || 1, count: 1 };
    } else {
      ranges[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length
      };
    }
  });

  // Normalize the dataset
  const normalizedData = dataset.map(item => {
    const normalized = { ...item };
    
    fields.forEach(field => {
      const originalValue = item[field];
      if (typeof originalValue === 'number' && !isNaN(originalValue) && originalValue >= 0) {
        const { min, max } = ranges[field];
        let normalizedValue;
        
        if (min === max) {
          normalizedValue = mode === 'percent' ? 0 : 0;
        } else {
          const ratio = (originalValue - min) / (max - min);
          normalizedValue = mode === 'percent' ? ratio * 100 : ratio;
        }
        
        normalized[`${field}_normalized`] = Math.round(normalizedValue * 100) / 100; // Round to 2 decimal places
        normalized[`${field}_original`] = originalValue;
      } else {
        normalized[`${field}_normalized`] = mode === 'percent' ? 0 : 0;
        normalized[`${field}_original`] = originalValue;
      }
    });
    
    return normalized;
  });

  return {
    data: normalizedData,
    metadata: {
      fields: fields,
      mode: mode,
      ranges: ranges,
      count: dataset.length,
      timestamp: Date.now()
    }
  };
}

// Create a Last.fm client instance with validation
let lastfm;
try {
  validateApiKey(API_KEY, 'Last.fm');
  lastfm = new LastFM(API_KEY);
  log('info', 'Last.fm client initialized successfully');
} catch (error) {
  log('error', 'Failed to initialize Last.fm client', error.message);
  lastfm = null;
}

// Local database for brass stabs samples
const localSamplesPath = path.join(app.getPath('userData'), 'brass_samples.json');

// Initialize local samples database if it doesn't exist
function initLocalSamplesDB() {
  try {
    if (!fs.existsSync(localSamplesPath)) {
      const initialData = [];
      fs.writeFileSync(localSamplesPath, JSON.stringify(initialData, null, 2));
      log('info', 'Created new brass samples database', localSamplesPath);
    } else {
      // Validate existing database
      const data = fs.readFileSync(localSamplesPath, 'utf8');
      JSON.parse(data); // This will throw if invalid JSON
      log('info', 'Brass samples database loaded successfully');
    }
  } catch (error) {
    log('error', 'Failed to initialize brass samples database', error.message);
    // Create a backup and reinitialize
    if (fs.existsSync(localSamplesPath)) {
      const backupPath = `${localSamplesPath}.backup.${Date.now()}`;
      fs.copyFileSync(localSamplesPath, backupPath);
      log('info', 'Created backup of corrupted database', backupPath);
    }
    fs.writeFileSync(localSamplesPath, JSON.stringify([], null, 2));
  }
}

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional icon
    show: false // Don't show until ready
  });

  // Load the index.html file
  mainWindow.loadFile('index.html').then(() => {
    mainWindow.show();
    log('info', 'Main window loaded and displayed');
  }).catch(error => {
    log('error', 'Failed to load main window', error.message);
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    log('info', 'Main window closed');
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  initLocalSamplesDB();
  createWindow();

  app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for Last.fm API
ipcMain.handle('search-lastfm', async (event, query) => {
  try {
    if (!lastfm) {
      throw new Error('Last.fm client not initialized. Please check your API key configuration.');
    }
    
    const validatedQuery = validateSearchQuery(query);
    log('info', 'Searching Last.fm', { query: validatedQuery });
    
    return new Promise((resolve, reject) => {
      lastfm.search({ q: validatedQuery, limit: 10 }, (err, data) => {
        if (err) {
          log('error', 'Last.fm search failed', err.message);
          reject(new Error(`Last.fm search failed: ${err.message}`));
        } else {
          log('info', 'Last.fm search completed', { resultsCount: data?.result ? Object.keys(data.result).length : 0 });
          
          // Apply normalization to Last.fm results
          const normalizedData = { ...data };
          const fieldsToNormalize = ['listeners', 'playcount'];
          
          if (data?.result) {
            // Normalize artists
            if (data.result.artist && Array.isArray(data.result.artist)) {
              const artistNormalization = computeNormalization(data.result.artist, fieldsToNormalize, 'percent');
              normalizedData.result.artist = artistNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.artist = artistNormalization.metadata;
            }
            
            // Normalize tracks
            if (data.result.track && Array.isArray(data.result.track)) {
              const trackNormalization = computeNormalization(data.result.track, fieldsToNormalize, 'percent');
              normalizedData.result.track = trackNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.track = trackNormalization.metadata;
            }
            
            // Normalize albums
            if (data.result.album && Array.isArray(data.result.album)) {
              const albumNormalization = computeNormalization(data.result.album, fieldsToNormalize, 'percent');
              normalizedData.result.album = albumNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.album = albumNormalization.metadata;
            }
          }
          
          log('info', 'Last.fm search normalization completed');
          resolve(normalizedData);
        }
      });
    });
  } catch (error) {
    log('error', 'Last.fm search error', error.message);
    throw error;
  }
});

// Search for brass stabs in local database
ipcMain.handle('search-local-brass', async (event, query) => {
  try {
    const validatedQuery = validateSearchQuery(query);
    log('info', 'Searching local brass samples', { query: validatedQuery });
    
    if (!fs.existsSync(localSamplesPath)) {
      log('warn', 'Local brass samples database not found');
      return { results: [], normalization: null };
    }
    
    const samples = JSON.parse(fs.readFileSync(localSamplesPath, 'utf8'));
    const queryLower = validatedQuery.toLowerCase();
    
    const results = samples.filter(sample => {
      if (!sample || typeof sample !== 'object') return false;
      
      const nameMatch = sample.name && sample.name.toLowerCase().includes(queryLower);
      const tagMatch = sample.tags && Array.isArray(sample.tags) && 
        sample.tags.some(tag => tag && tag.toLowerCase().includes(queryLower));
      const descriptionMatch = sample.description && 
        sample.description.toLowerCase().includes(queryLower);
      
      return nameMatch || tagMatch || descriptionMatch;
    });
    
    // Apply normalization to local brass samples
    const fieldsToNormalize = ['duration', 'filesize'];
    const normalization = computeNormalization(results, fieldsToNormalize, 'percent');
    
    log('info', 'Local brass search completed', { 
      resultsCount: results.length,
      normalizedFields: fieldsToNormalize 
    });
    
    return {
      results: normalization.data,
      normalization: normalization.metadata,
      query: validatedQuery
    };
  } catch (error) {
    log('error', 'Error searching local brass samples', error.message);
    return { results: [], normalization: null, error: error.message };
  }
});

// Search for brass stabs online (Freesound API)
ipcMain.handle('search-online-brass', async (event, query) => {
  try {
    validateApiKey(FREESOUND_API_KEY, 'Freesound');
    const validatedQuery = validateSearchQuery(query);
    log('info', 'Searching online brass samples', { query: validatedQuery });
    
    const searchQuery = `brass stabs ${validatedQuery}`;
    const response = await axios.get('https://freesound.org/apiv2/search/text/', {
      params: {
        query: searchQuery,
        fields: 'id,name,tags,previews,description,username,duration,filesize,type,downloads',
        page_size: 20,
        sort: 'score'
      },
      headers: {
        Authorization: `Token ${FREESOUND_API_KEY}`,
        'User-Agent': 'BrassStabsApp/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data || !response.data.results) {
      log('warn', 'Invalid response from Freesound API');
      return { results: [], normalization: null };
    }
    
    // Validate and sanitize results
    const results = response.data.results.filter(result => {
      return result && result.id && result.name;
    }).map(result => ({
      ...result,
      source: 'freesound',
      searchQuery: validatedQuery
    }));
    
    // Apply normalization to Freesound results
    const fieldsToNormalize = ['duration', 'filesize', 'downloads'];
    const normalization = computeNormalization(results, fieldsToNormalize, 'percent');
    
    log('info', 'Online brass search completed', { 
      resultsCount: results.length,
      totalResults: response.data.count,
      normalizedFields: fieldsToNormalize
    });
    
    return {
      results: normalization.data,
      normalization: normalization.metadata,
      query: validatedQuery,
      totalCount: response.data.count
    };
  } catch (error) {
    if (error.response) {
      log('error', 'Freesound API error', {
        status: error.response.status,
        message: error.response.data?.detail || error.message
      });
      
      if (error.response.status === 401) {
        throw new Error('Invalid Freesound API key. Please check your configuration.');
      } else if (error.response.status === 429) {
        throw new Error('Freesound API rate limit exceeded. Please try again later.');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      log('error', 'Network error connecting to Freesound', error.message);
      throw new Error('Unable to connect to Freesound. Please check your internet connection.');
    } else {
      log('error', 'Error searching online brass samples', error.message);
    }
    
    return { results: [], normalization: null, error: error.message };
  }
});

// Add a new brass sample to local database
ipcMain.handle('add-brass-sample', async (event, sample) => {
  try {
    if (!sample || typeof sample !== 'object') {
      throw new Error('Invalid sample data provided');
    }
    
    if (!sample.name || typeof sample.name !== 'string') {
      throw new Error('Sample name is required and must be a string');
    }
    
    log('info', 'Adding brass sample to database', { name: sample.name });
    
    const samples = JSON.parse(fs.readFileSync(localSamplesPath, 'utf8'));
    
    // Check for duplicates
    const existingSample = samples.find(s => 
      s.name === sample.name && s.path === sample.path
    );
    
    if (existingSample) {
      log('warn', 'Duplicate sample detected', { name: sample.name });
      return { success: false, error: 'Sample already exists in database' };
    }
    
    const newSample = {
      id: Date.now().toString(),
      name: sample.name.trim(),
      path: sample.path || '',
      tags: Array.isArray(sample.tags) ? sample.tags.filter(tag => tag && typeof tag === 'string') : [],
      description: sample.description || '',
      duration: sample.duration || null,
      filesize: sample.filesize || null,
      dateAdded: new Date().toISOString(),
      source: sample.source || 'local'
    };
    
    samples.push(newSample);
    fs.writeFileSync(localSamplesPath, JSON.stringify(samples, null, 2));
    
    log('info', 'Brass sample added successfully', { id: newSample.id, name: newSample.name });
    return { success: true, sample: newSample };
  } catch (error) {
    log('error', 'Error adding brass sample', error.message);
    return { success: false, error: error.message };
  }
});

// File dialog for selecting brass sample files
ipcMain.handle('select-brass-file', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Brass Sample File',
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'ogg'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    const files = result.filePaths.map(filePath => {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath, path.extname(filePath)),
        extension: path.extname(filePath),
        size: stats.size,
        modified: stats.mtime
      };
    });
    
    log('info', 'Files selected', { count: files.length });
    return { success: true, files };
  } catch (error) {
    log('error', 'Error selecting files', error.message);
    return { success: false, error: error.message };
  }
});

// Open Electron Fiddle with a template
ipcMain.handle('open-fiddle', async (event, template) => {
  try {
    const { shell } = require('electron');
    
    if (!template || typeof template !== 'object') {
      throw new Error('Invalid template data provided');
    }
    
    log('info', 'Opening Electron Fiddle', { templateName: template.name || 'unnamed' });
    
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
    };
    
    // Create temp directory if it doesn't exist
    const tempDir = app.getPath('temp');
    const fiddleDir = path.join(tempDir, 'electron-fiddles');
    if (!fs.existsSync(fiddleDir)) {
      fs.mkdirSync(fiddleDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const fiddleName = (template.name || 'brass-stabs-fiddle').replace(/[^a-zA-Z0-9-_]/g, '-');
    const tempFiddlePath = path.join(fiddleDir, `${fiddleName}-${timestamp}.json`);
    
    fs.writeFileSync(tempFiddlePath, JSON.stringify(fiddle, null, 2));
    log('info', 'Fiddle template created', { path: tempFiddlePath });
    
    // Try multiple methods to open Electron Fiddle
    const fiddleUrl = `electron-fiddle://open/${encodeURIComponent(tempFiddlePath)}`;
    
    try {
      // Method 1: Try the custom protocol
      await shell.openExternal(fiddleUrl);
      log('info', 'Opened with Electron Fiddle protocol');
      return { success: true, method: 'protocol', path: tempFiddlePath };
    } catch (protocolError) {
      log('warn', 'Protocol method failed, trying alternatives', protocolError.message);
      
      try {
        // Method 2: Try to open the JSON file directly (user can import manually)
        await shell.showItemInFolder(tempFiddlePath);
        log('info', 'Showed fiddle file in folder');
        return { 
          success: true, 
          method: 'file', 
          path: tempFiddlePath,
          message: 'Fiddle file created. Import it manually in Electron Fiddle.' 
        };
      } catch (fileError) {
        log('warn', 'File method failed, providing download option', fileError.message);
        
        // Method 3: Return the file content for manual use
        return {
          success: true,
          method: 'content',
          path: tempFiddlePath,
          content: fiddle,
          message: 'Electron Fiddle not found. Use the provided content to create a fiddle manually.'
        };
      }
    }
  } catch (error) {
    log('error', 'Error opening Electron Fiddle', error.message);
    return { success: false, error: error.message };
  }
});

// Get available fiddle templates
ipcMain.handle('get-fiddle-templates', async (event) => {
  try {
    const templatesDir = path.join(__dirname, 'fiddle-templates');
    
    if (!fs.existsSync(templatesDir)) {
      log('warn', 'Fiddle templates directory not found');
      return [];
    }
    
    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
    const templates = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        templates.push({
          filename: file,
          name: template.name || path.basename(file, '.json'),
          description: template.description || 'No description available',
          ...template
        });
      } catch (parseError) {
        log('warn', 'Failed to parse template file', { file, error: parseError.message });
      }
    }
    
    log('info', 'Loaded fiddle templates', { count: templates.length });
    return templates;
  } catch (error) {
    log('error', 'Error loading fiddle templates', error.message);
    return [];
  }
});
