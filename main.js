const { app, BrowserWindow, ipcMain, dialog, shell, session, powerMonitor } = require('electron');
const path = require('path');
const crypto = require('crypto');
const LastFM = require('./index.js');
const axios = require('axios');
const fs = require('fs');

// Import security modules
const security = require('./utils/security.js');
const { createAFKGuard } = require('./utils/afk-guard.js');

// Load environment variables
require('dotenv').config();

// API keys from environment variables with fallbacks
const API_KEY = process.env.LASTFM_API_KEY || 'YOUR_LAST_FM_API_KEY';
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY || 'YOUR_FREESOUND_API_KEY';

// Enhanced secure logging utility with data protection
function safeLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const securityContext = {
    process: 'main',
    pid: process.pid,
    version: app.getVersion(),
    platform: process.platform
  };
  
  let sanitizedData = null;
  if (data) {
    try {
      // Scrub sensitive data from logs
      sanitizedData = security.scrubLogData(data);
    } catch (error) {
      sanitizedData = { error: 'Failed to sanitize log data', originalType: typeof data };
    }
  }
  
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    data: sanitizedData,
    security: securityContext
  };
  
  // Use structured logging
  console.log(JSON.stringify(logEntry));
}

// Legacy log function for backward compatibility (redirects to safeLog)
function log(level, message, data = null) {
  safeLog(level, message, data);
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
  safeLog('info', 'Last.fm client initialized successfully');
} catch (error) {
  safeLog('error', 'Failed to initialize Last.fm client', { error: error.message });
  lastfm = null;
}

// Initialize AFK Guard
let afkGuard;
try {
  afkGuard = createAFKGuard({
    activity: {
      timeout: parseInt(process.env.AFK_TIMEOUT_MINUTES) * 60 * 1000 || 10 * 60 * 1000,
      warningTime: parseInt(process.env.AFK_WARNING_MINUTES) * 60 * 1000 || 2 * 60 * 1000,
      sensitivity: process.env.AFK_SENSITIVITY || 'normal'
    },
    session: {
      unlockMethod: process.env.AFK_UNLOCK_METHOD || 'click'
    },
    enabled: process.env.AFK_ENABLED !== 'false'
  });
  safeLog('info', 'AFK Guard initialized successfully');
} catch (error) {
  safeLog('error', 'Failed to initialize AFK Guard', { error: error.message });
  afkGuard = null;
}

// Local database for brass stabs samples with encryption
const localSamplesPath = path.join(app.getPath('userData'), 'brass_samples.json');
const encryptedSamplesPath = path.join(app.getPath('userData'), 'brass_samples.enc');
let encryptionKey = null;

// Initialize encryption key
try {
  encryptionKey = security.deriveKeyFromMachine();
  safeLog('info', 'Encryption key derived successfully');
} catch (error) {
  safeLog('error', 'Failed to derive encryption key', { error: error.message });
}

// Initialize local samples database with encryption support
function initLocalSamplesDB() {
  try {
    const useEncryption = process.env.ENCRYPT_LOCAL_DATA !== 'false' && encryptionKey;
    
    // Check for encrypted database first
    if (useEncryption && fs.existsSync(encryptedSamplesPath)) {
      try {
        const encryptedData = fs.readFileSync(encryptedSamplesPath);
        const parsedEncrypted = JSON.parse(encryptedData.toString());
        const decryptedData = security.decryptData(parsedEncrypted, encryptionKey);
        JSON.parse(decryptedData); // Validate JSON
        safeLog('info', 'Encrypted brass samples database loaded successfully');
        return;
      } catch (decryptError) {
        safeLog('warn', 'Failed to load encrypted database, checking for unencrypted fallback', { error: decryptError.message });
      }
    }
    
    // Check for unencrypted database
    if (fs.existsSync(localSamplesPath)) {
      try {
        const data = fs.readFileSync(localSamplesPath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Migrate to encrypted storage if encryption is enabled
        if (useEncryption) {
          const encrypted = security.encryptData(data, encryptionKey);
          fs.writeFileSync(encryptedSamplesPath, JSON.stringify(encrypted, null, 2));
          
          // Create backup of unencrypted file before removal
          const backupPath = `${localSamplesPath}.backup.${Date.now()}`;
          fs.copyFileSync(localSamplesPath, backupPath);
          fs.unlinkSync(localSamplesPath);
          
          safeLog('info', 'Migrated database to encrypted storage', { backupPath });
        } else {
          safeLog('info', 'Unencrypted brass samples database loaded successfully');
        }
        return;
      } catch (parseError) {
        safeLog('error', 'Failed to parse existing database', { error: parseError.message });
      }
    }
    
    // Create new database
    const initialData = [];
    const dataString = JSON.stringify(initialData, null, 2);
    
    if (useEncryption) {
      const encrypted = security.encryptData(dataString, encryptionKey);
      fs.writeFileSync(encryptedSamplesPath, JSON.stringify(encrypted, null, 2));
      safeLog('info', 'Created new encrypted brass samples database');
    } else {
      fs.writeFileSync(localSamplesPath, dataString);
      safeLog('info', 'Created new brass samples database');
    }
    
  } catch (error) {
    safeLog('error', 'Failed to initialize brass samples database', { error: error.message });
    
    // Create backup of any existing files
    [localSamplesPath, encryptedSamplesPath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        try {
          fs.copyFileSync(filePath, backupPath);
          safeLog('info', 'Created backup of corrupted database', { backupPath });
        } catch (backupError) {
          safeLog('error', 'Failed to create backup', { error: backupError.message });
        }
      }
    });
    
    // Reinitialize with minimal data
    const fallbackData = JSON.stringify([], null, 2);
    fs.writeFileSync(localSamplesPath, fallbackData);
    safeLog('info', 'Reinitialized database with fallback data');
  }
}

// Helper function to read samples database
function readSamplesDB() {
  const useEncryption = process.env.ENCRYPT_LOCAL_DATA !== 'false' && encryptionKey;
  
  if (useEncryption && fs.existsSync(encryptedSamplesPath)) {
    const encryptedData = fs.readFileSync(encryptedSamplesPath);
    const parsedEncrypted = JSON.parse(encryptedData.toString());
    const decryptedData = security.decryptData(parsedEncrypted, encryptionKey);
    return JSON.parse(decryptedData);
  } else if (fs.existsSync(localSamplesPath)) {
    const data = fs.readFileSync(localSamplesPath, 'utf8');
    return JSON.parse(data);
  } else {
    return [];
  }
}

// Helper function to write samples database
function writeSamplesDB(data) {
  const useEncryption = process.env.ENCRYPT_LOCAL_DATA !== 'false' && encryptionKey;
  const dataString = JSON.stringify(data, null, 2);
  
  if (useEncryption) {
    const encrypted = security.encryptData(dataString, encryptionKey);
    fs.writeFileSync(encryptedSamplesPath, JSON.stringify(encrypted, null, 2));
    
    // Remove unencrypted file if it exists
    if (fs.existsSync(localSamplesPath)) {
      fs.unlinkSync(localSamplesPath);
    }
  } else {
    fs.writeFileSync(localSamplesPath, dataString);
  }
}

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window with enhanced security
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional icon
    show: false // Don't show until ready
  });

  // Set up Content Security Policy
  setupCSP();
  
  // Set up navigation security
  setupNavigationSecurity();
  
  // Load the index.html file
  mainWindow.loadFile('index.html').then(() => {
    mainWindow.show();
    safeLog('info', 'Main window loaded and displayed');
    
    // Start AFK guard if enabled
    if (afkGuard) {
      afkGuard.start();
      safeLog('info', 'AFK Guard started');
    }
  }).catch(error => {
    safeLog('error', 'Failed to load main window', { error: error.message });
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    if (afkGuard) {
      afkGuard.stop();
    }
    mainWindow = null;
    safeLog('info', 'Main window closed');
  });
}

// Set up Content Security Policy
function setupCSP() {
  const cspHeader = process.env.STRICT_CSP === 'true' 
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://ws.audioscrobbler.com https://freesound.org; object-src 'none'; base-uri 'self'; form-action 'self';"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://ws.audioscrobbler.com https://freesound.org;";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeader],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin']
      }
    });
  });
  
  safeLog('info', 'Content Security Policy configured', { strict: process.env.STRICT_CSP === 'true' });
}

// Set up navigation security
function setupNavigationSecurity() {
  // Prevent unauthorized navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const validation = security.validateExternalLink(navigationUrl);
    
    if (!validation.safe) {
      event.preventDefault();
      safeLog('warn', 'Blocked unauthorized navigation attempt', { 
        url: security.hashSensitiveData(navigationUrl),
        reasons: validation.reasons 
      });
      
      // Show warning to user
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Navigation Blocked',
        message: 'Navigation to this URL has been blocked for security reasons.',
        detail: `Reasons: ${validation.reasons.join(', ')}`,
        buttons: ['OK']
      });
    }
  });
  
  // Control new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const validation = security.validateExternalLink(url);
    
    if (!validation.safe) {
      safeLog('warn', 'Blocked popup window creation', { 
        url: security.hashSensitiveData(url),
        reasons: validation.reasons 
      });
      return { action: 'deny' };
    }
    
    // Allow trusted domains to open in external browser
    if (validation.trusted) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'deny' };
  });
  
  safeLog('info', 'Navigation security configured');
}

// Create window when Electron is ready
app.whenReady().then(() => {
  initLocalSamplesDB();
  setupSecurityHandlers();
  createWindow();

  app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Set up security-related IPC handlers
function setupSecurityHandlers() {
  // Secure external link handler
  ipcMain.handle('open-external-safe', async (event, url) => {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
      }
      
      const validation = security.validateExternalLink(url);
      safeLog('info', 'External link validation requested', { 
        urlHash: security.hashSensitiveData(url),
        safe: validation.safe,
        trusted: validation.trusted,
        suspicious: validation.suspicious
      });
      
      if (validation.safe && validation.trusted) {
        // Trusted domain - open directly
        await shell.openExternal(url);
        return { success: true, opened: true, trusted: true };
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
        });
        
        if (response.response === 0) {
          await shell.openExternal(url);
          return { success: true, opened: true, trusted: false, confirmed: true };
        } else {
          return { success: true, opened: false, canceled: true };
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
        });
        
        if (response.response === 0) {
          await shell.openExternal(url);
          safeLog('warn', 'User opened suspicious link after warning', { 
            urlHash: security.hashSensitiveData(url),
            reasons: validation.reasons 
          });
          return { success: true, opened: true, trusted: false, suspicious: true, confirmed: true };
        } else {
          return { success: true, opened: false, suspicious: true, canceled: true };
        }
      }
    } catch (error) {
      safeLog('error', 'Error handling external link', { error: error.message });
      return { success: false, error: error.message };
    }
  });
  
  // AFK Guard handlers
  ipcMain.handle('user-activity', async (event) => {
    if (afkGuard && afkGuard.activityTracker) {
      afkGuard.activityTracker.handleActivity({ type: 'renderer-reported' });
    }
    return { success: true };
  });
  
  ipcMain.handle('afk-lock', async (event) => {
    if (afkGuard && afkGuard.sessionManager) {
      afkGuard.sessionManager.lockSession();
      return { success: true, locked: true };
    }
    return { success: false, error: 'AFK Guard not available' };
  });
  
  ipcMain.handle('afk-unlock', async (event, credentials) => {
    if (afkGuard && afkGuard.sessionManager) {
      const unlocked = await afkGuard.sessionManager.unlockSession(credentials);
      return { success: true, unlocked };
    }
    return { success: false, error: 'AFK Guard not available' };
  });
  
  ipcMain.handle('afk-status', async (event) => {
    if (afkGuard) {
      return { success: true, status: afkGuard.getStatus() };
    }
    return { success: false, error: 'AFK Guard not available' };
  });
  
  // System-level inactivity detection
  if (powerMonitor) {
    powerMonitor.on('suspend', () => {
      safeLog('info', 'System suspend detected');
      if (afkGuard && afkGuard.sessionManager) {
        afkGuard.sessionManager.lockSession();
      }
    });
    
    powerMonitor.on('lock-screen', () => {
      safeLog('info', 'Screen lock detected');
      if (afkGuard && afkGuard.sessionManager) {
        afkGuard.sessionManager.lockSession();
      }
    });
  }
  
  safeLog('info', 'Security handlers configured');
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Security cleanup on app exit
app.on('before-quit', () => {
  safeLog('info', 'Application shutting down, performing security cleanup');
  
  // Stop AFK guard
  if (afkGuard) {
    try {
      afkGuard.stop();
      safeLog('info', 'AFK Guard stopped');
    } catch (error) {
      safeLog('error', 'Error stopping AFK Guard', { error: error.message });
    }
  }
  
  // Clear sensitive data from memory
  if (encryptionKey) {
    encryptionKey.fill(0);
    encryptionKey = null;
  }
  
  // Clear logs if configured
  if (process.env.CLEAR_LOGS_ON_EXIT === 'true') {
    try {
      // This would clear application logs - implementation depends on logging setup
      safeLog('info', 'Log clearing requested but not implemented');
    } catch (error) {
      safeLog('error', 'Error clearing logs', { error: error.message });
    }
  }
  
  safeLog('info', 'Security cleanup completed');
});

// Handle uncaught exceptions securely
process.on('uncaughtException', (error) => {
  safeLog('error', 'Uncaught exception occurred', { error: error.message, stack: error.stack });
  
  // Perform emergency cleanup
  if (afkGuard && afkGuard.sessionManager) {
    try {
      afkGuard.sessionManager.lockSession();
    } catch (lockError) {
      safeLog('error', 'Failed to lock session during emergency cleanup', { error: lockError.message });
    }
  }
  
  // Exit gracefully
  process.exit(1);
});

// Handle unhandled promise rejections securely
process.on('unhandledRejection', (reason, promise) => {
  safeLog('error', 'Unhandled promise rejection', { reason: reason?.toString(), promise: promise?.toString() });
});

// IPC handlers for Last.fm API with enhanced security
ipcMain.handle('search-lastfm', async (event, query) => {
  try {
    if (!lastfm) {
      throw new Error('Last.fm client not initialized. Please check your API key configuration.');
    }
    
    const validatedQuery = validateSearchQuery(query);
    safeLog('info', 'Searching Last.fm', { query: validatedQuery });
    
    return new Promise((resolve, reject) => {
      lastfm.search({ q: validatedQuery, limit: 10 }, (err, data) => {
        if (err) {
          safeLog('error', 'Last.fm search failed', { error: err.message });
          reject(new Error(`Last.fm search failed: ${err.message}`));
        } else {
          safeLog('info', 'Last.fm search completed', { resultsCount: data?.result ? Object.keys(data.result).length : 0 });
          
          // Sanitize API response before processing
          let sanitizedData;
          try {
            sanitizedData = { ...data };
            if (data?.result) {
              // Sanitize each result type
              ['artist', 'track', 'album'].forEach(type => {
                if (data.result[type] && Array.isArray(data.result[type])) {
                  sanitizedData.result[type] = security.sanitizeSearchResults(data.result[type]);
                }
              });
            }
          } catch (sanitizeError) {
            safeLog('warn', 'Failed to sanitize Last.fm results, using original data', { error: sanitizeError.message });
            sanitizedData = data;
          }
          
          // Apply normalization to sanitized Last.fm results
          const normalizedData = { ...sanitizedData };
          const fieldsToNormalize = ['listeners', 'playcount'];
          
          if (sanitizedData?.result) {
            // Normalize artists
            if (sanitizedData.result.artist && Array.isArray(sanitizedData.result.artist)) {
              const artistNormalization = computeNormalization(sanitizedData.result.artist, fieldsToNormalize, 'percent');
              normalizedData.result.artist = artistNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.artist = artistNormalization.metadata;
            }
            
            // Normalize tracks
            if (sanitizedData.result.track && Array.isArray(sanitizedData.result.track)) {
              const trackNormalization = computeNormalization(sanitizedData.result.track, fieldsToNormalize, 'percent');
              normalizedData.result.track = trackNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.track = trackNormalization.metadata;
            }
            
            // Normalize albums
            if (sanitizedData.result.album && Array.isArray(sanitizedData.result.album)) {
              const albumNormalization = computeNormalization(sanitizedData.result.album, fieldsToNormalize, 'percent');
              normalizedData.result.album = albumNormalization.data;
              normalizedData.normalization = normalizedData.normalization || {};
              normalizedData.normalization.album = albumNormalization.metadata;
            }
          }
          
          safeLog('info', 'Last.fm search normalization completed');
          resolve(normalizedData);
        }
      });
    });
  } catch (error) {
    safeLog('error', 'Last.fm search error', { error: error.message });
    throw error;
  }
});

// Search for brass stabs in local database with enhanced security
ipcMain.handle('search-local-brass', async (event, query) => {
  try {
    const validatedQuery = validateSearchQuery(query);
    safeLog('info', 'Searching local brass samples', { query: validatedQuery });
    
    let samples;
    try {
      samples = readSamplesDB();
    } catch (dbError) {
      safeLog('warn', 'Failed to read samples database', { error: dbError.message });
      return { results: [], normalization: null, error: 'Database unavailable' };
    }
    
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
    
    // Sanitize results before normalization
    let sanitizedResults;
    try {
      sanitizedResults = security.sanitizeSearchResults(results);
    } catch (sanitizeError) {
      safeLog('warn', 'Failed to sanitize local results, using original data', { error: sanitizeError.message });
      sanitizedResults = results;
    }
    
    // Apply normalization to sanitized local brass samples
    const fieldsToNormalize = ['duration', 'filesize'];
    const normalization = computeNormalization(sanitizedResults, fieldsToNormalize, 'percent');
    
    safeLog('info', 'Local brass search completed', { 
      resultsCount: sanitizedResults.length,
      normalizedFields: fieldsToNormalize 
    });
    
    return {
      results: normalization.data,
      normalization: normalization.metadata,
      query: validatedQuery
    };
  } catch (error) {
    safeLog('error', 'Error searching local brass samples', { error: error.message });
    return { results: [], normalization: null, error: error.message };
  }
});

// Search for brass stabs online (Freesound API) with enhanced security
ipcMain.handle('search-online-brass', async (event, query) => {
  try {
    validateApiKey(FREESOUND_API_KEY, 'Freesound');
    const validatedQuery = validateSearchQuery(query);
    safeLog('info', 'Searching online brass samples', { query: validatedQuery });
    
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
      safeLog('warn', 'Invalid response from Freesound API');
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
    
    // Sanitize API response
    let sanitizedResults;
    try {
      sanitizedResults = security.sanitizeSearchResults(results);
    } catch (sanitizeError) {
      safeLog('warn', 'Failed to sanitize Freesound results, using original data', { error: sanitizeError.message });
      sanitizedResults = results;
    }
    
    // Apply normalization to sanitized Freesound results
    const fieldsToNormalize = ['duration', 'filesize', 'downloads'];
    const normalization = computeNormalization(sanitizedResults, fieldsToNormalize, 'percent');
    
    safeLog('info', 'Online brass search completed', { 
      resultsCount: sanitizedResults.length,
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
      safeLog('error', 'Freesound API error', {
        status: error.response.status,
        message: error.response.data?.detail || error.message
      });
      
      if (error.response.status === 401) {
        throw new Error('Invalid Freesound API key. Please check your configuration.');
      } else if (error.response.status === 429) {
        throw new Error('Freesound API rate limit exceeded. Please try again later.');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      safeLog('error', 'Network error connecting to Freesound', { error: error.message });
      throw new Error('Unable to connect to Freesound. Please check your internet connection.');
    } else {
      safeLog('error', 'Error searching online brass samples', { error: error.message });
    }
    
    return { results: [], normalization: null, error: error.message };
  }
});

// Add a new brass sample to local database with enhanced security
ipcMain.handle('add-brass-sample', async (event, sample) => {
  try {
    if (!sample || typeof sample !== 'object') {
      throw new Error('Invalid sample data provided');
    }
    
    if (!sample.name || typeof sample.name !== 'string') {
      throw new Error('Sample name is required and must be a string');
    }
    
    safeLog('info', 'Adding brass sample to database', { name: sample.name });
    
    let samples;
    try {
      samples = readSamplesDB();
    } catch (dbError) {
      safeLog('error', 'Failed to read samples database for adding sample', { error: dbError.message });
      return { success: false, error: 'Database unavailable' };
    }
    
    // Check for duplicates
    const existingSample = samples.find(s => 
      s.name === sample.name && s.path === sample.path
    );
    
    if (existingSample) {
      safeLog('warn', 'Duplicate sample detected', { name: sample.name });
      return { success: false, error: 'Sample already exists in database' };
    }
    
    // Sanitize sample data
    let sanitizedSample;
    try {
      const sampleArray = [sample];
      const sanitizedArray = security.sanitizeSearchResults(sampleArray);
      sanitizedSample = sanitizedArray[0];
    } catch (sanitizeError) {
      safeLog('warn', 'Failed to sanitize sample data, using original', { error: sanitizeError.message });
      sanitizedSample = sample;
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
    };
    
    samples.push(newSample);
    
    try {
      writeSamplesDB(samples);
    } catch (writeError) {
      safeLog('error', 'Failed to write samples database', { error: writeError.message });
      return { success: false, error: 'Failed to save to database' };
    }
    
    safeLog('info', 'Brass sample added successfully', { id: newSample.id, name: newSample.name });
    return { success: true, sample: newSample };
  } catch (error) {
    safeLog('error', 'Error adding brass sample', { error: error.message });
    return { success: false, error: error.message };
  }
});

// File dialog for selecting brass sample files with enhanced security
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
    
    safeLog('info', 'Files selected', { count: files.length });
    return { success: true, files };
  } catch (error) {
    safeLog('error', 'Error selecting files', { error: error.message });
    return { success: false, error: error.message };
  }
});

// Open Electron Fiddle with a template (using secure external link handler)
ipcMain.handle('open-fiddle', async (event, template) => {
  try {
    if (!template || typeof template !== 'object') {
      throw new Error('Invalid template data provided');
    }
    
    safeLog('info', 'Opening Electron Fiddle', { templateName: template.name || 'unnamed' });
    
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
      // Method 1: Try the custom protocol using secure handler
      const protocolResult = await ipcMain.handle('open-external-safe', event, fiddleUrl);
      if (protocolResult.success && protocolResult.opened) {
        safeLog('info', 'Opened with Electron Fiddle protocol');
        return { success: true, method: 'protocol', path: tempFiddlePath };
      }
    } catch (protocolError) {
      safeLog('warn', 'Protocol method failed, trying alternatives', { error: protocolError.message });
    }
    
    try {
      // Method 2: Try to open the JSON file directly (user can import manually)
      await shell.showItemInFolder(tempFiddlePath);
      safeLog('info', 'Showed fiddle file in folder');
      return { 
        success: true, 
        method: 'file', 
        path: tempFiddlePath,
        message: 'Fiddle file created. Import it manually in Electron Fiddle.' 
      };
    } catch (fileError) {
      safeLog('warn', 'File method failed, providing download option', { error: fileError.message });
      
      // Method 3: Return the file content for manual use
      return {
        success: true,
        method: 'content',
        path: tempFiddlePath,
        content: fiddle,
        message: 'Electron Fiddle not found. Use the provided content to create a fiddle manually.'
      };
    }
  } catch (error) {
    safeLog('error', 'Error opening Electron Fiddle', { error: error.message });
    return { success: false, error: error.message };
  }
});

// Get available fiddle templates with enhanced security
ipcMain.handle('get-fiddle-templates', async (event) => {
  try {
    const templatesDir = path.join(__dirname, 'fiddle-templates');
    
    if (!fs.existsSync(templatesDir)) {
      safeLog('warn', 'Fiddle templates directory not found');
      return [];
    }
    
    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
    const templates = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const template = JSON.parse(content);
        
        // Sanitize template content
        let sanitizedTemplate;
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
          };
        } catch (sanitizeError) {
          safeLog('warn', 'Failed to sanitize template, using original', { file, error: sanitizeError.message });
          sanitizedTemplate = {
            filename: file,
            name: template.name || path.basename(file, '.json'),
            description: template.description || 'No description available',
            ...template
          };
        }
        
        templates.push(sanitizedTemplate);
      } catch (parseError) {
        safeLog('warn', 'Failed to parse template file', { file, error: parseError.message });
      }
    }
    
    safeLog('info', 'Loaded fiddle templates', { count: templates.length });
    return templates;
  } catch (error) {
    safeLog('error', 'Error loading fiddle templates', { error: error.message });
    return [];
  }
});
