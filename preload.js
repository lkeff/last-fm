// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron')

// Import security utilities (these will be available in the main process)
// We'll create client-side versions and proxy calls to main process for sensitive operations

/**
 * Security utilities for client-side operations
 */
const securityUtils = {
  /**
   * Client-side HTML escaping for immediate use
   * @param {string} string - The string to escape
   * @returns {string} HTML-escaped string
   */
  escapeHtml: (string) => {
    if (typeof string !== 'string') return ''

    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return string.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  },

  /**
   * Basic client-side URL validation
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL appears valid
   */
  isValidUrl: (url) => {
    if (typeof url !== 'string' || !url.trim()) return false

    try {
      const urlObj = new URL(url)
      return ['https:', 'http:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  },

  /**
   * Rate limiting utility for sensitive operations
   */
  rateLimiter: (() => {
    const limits = new Map()

    return {
      check: (key, maxCalls = 10, windowMs = 60000) => {
        const now = Date.now()
        const windowStart = now - windowMs

        if (!limits.has(key)) {
          limits.set(key, [])
        }

        const calls = limits.get(key)
        // Remove old calls outside the window
        const recentCalls = calls.filter(time => time > windowStart)

        if (recentCalls.length >= maxCalls) {
          return false // Rate limit exceeded
        }

        recentCalls.push(now)
        limits.set(key, recentCalls)
        return true
      },

      reset: (key) => {
        limits.delete(key)
      }
    }
  })(),

  /**
   * Sanitize input for logging (client-side basic version)
   * @param {any} data - Data to sanitize
   * @returns {any} Sanitized data
   */
  sanitizeForLogging: (data) => {
    if (typeof data === 'string') {
      // Basic pattern matching for sensitive data
      const sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /token/i,
        /password/i,
        /auth/i
      ]

      const lowerData = data.toLowerCase()
      if (sensitivePatterns.some(pattern => pattern.test(lowerData))) {
        return '[REDACTED]'
      }
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = {}
      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase()
        if (['api_key', 'secret', 'token', 'password', 'auth'].some(sensitive => keyLower.includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = securityUtils.sanitizeForLogging(value)
        }
      }
      return sanitized
    }

    return data
  }
}

/**
 * Validation helpers for the renderer process
 */
const validators = {
  /**
   * Validates a search query string
   * @param {string} query - The search query to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidQuery: (query) => {
    return typeof query === 'string' && query.trim().length > 0
  },

  /**
   * Validates a brass sample object
   * @param {Object} sample - The sample object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidSample: (sample) => {
    return sample &&
           typeof sample === 'object' &&
           typeof sample.name === 'string' &&
           sample.name.trim().length > 0
  },

  /**
   * Validates a fiddle template object
   * @param {Object} template - The template object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidTemplate: (template) => {
    return template && typeof template === 'object'
  },

  /**
   * Sanitizes a string for safe use with enhanced security
   * @param {string} str - The string to sanitize
   * @returns {string} The sanitized string
   */
  sanitizeString: (str) => {
    if (typeof str !== 'string') return ''
    // Enhanced sanitization with HTML escaping
    return securityUtils.escapeHtml(str.trim())
  },

  /**
   * Validates URL with security checks
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid and safe
   */
  isValidUrl: (url) => {
    return securityUtils.isValidUrl(url)
  },

  /**
   * Validates search query with security considerations
   * @param {string} query - Search query to validate
   * @returns {boolean} True if query is valid and safe
   */
  isValidSecureQuery: (query) => {
    if (!validators.isValidQuery(query)) return false

    // Check for potential injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i
    ]

    return !dangerousPatterns.some(pattern => pattern.test(query))
  },

  /**
   * Validates file upload with security checks
   * @param {Object} file - File object to validate
   * @returns {boolean} True if file is safe to process
   */
  isValidSecureFile: (file) => {
    if (!file || typeof file !== 'object') return false

    const allowedExtensions = ['.wav', '.mp3', '.aiff', '.flac', '.ogg']
    const allowedMimeTypes = [
      'audio/wav', 'audio/mpeg', 'audio/aiff',
      'audio/flac', 'audio/ogg', 'audio/x-wav'
    ]

    const hasValidExtension = allowedExtensions.some(ext =>
      file.name && file.name.toLowerCase().endsWith(ext)
    )

    const hasValidMimeType = allowedMimeTypes.includes(file.type)

    return hasValidExtension && hasValidMimeType && file.size <= 50 * 1024 * 1024 // 50MB limit
  }
}

/**
 * Utility functions for the renderer process
 */
const utils = {
  /**
   * Formats file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Formats duration in human readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration: (seconds) => {
    if (!seconds || seconds === 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },

  /**
   * Debounces a function call
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: (func, wait) => {
    let timeout
    return function executedFunction (...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  /**
   * Creates a safe error object for display
   * @param {Error|string} error - The error to format
   * @returns {Object} Safe error object
   */
  formatError: (error) => {
    if (typeof error === 'string') {
      return { message: error, type: 'error' }
    }
    return {
      message: error?.message || 'An unknown error occurred',
      type: 'error',
      code: error?.code || null
    }
  },

  /**
   * Data Normalization Utilities
   */

  /**
   * Performs linear scaling of a value between min and max to a target range
   * @param {number} value - The value to scale
   * @param {number} min - Minimum value in the original range
   * @param {number} max - Maximum value in the original range
   * @param {number} targetMin - Minimum value in the target range (default: 0)
   * @param {number} targetMax - Maximum value in the target range (default: 1)
   * @returns {number} Scaled value
   */
  scaleLinear: (value, min, max, targetMin = 0, targetMax = 1) => {
    if (typeof value !== 'number' || isNaN(value)) return targetMin
    if (min === max) return targetMin
    if (value <= min) return targetMin
    if (value >= max) return targetMax

    const ratio = (value - min) / (max - min)
    return targetMin + ratio * (targetMax - targetMin)
  },

  /**
   * Normalizes a value to unit range (0-1)
   * @param {number} value - The value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Normalized value between 0 and 1
   */
  normalizeToUnit: (value, min, max) => {
    return utils.scaleLinear(value, min, max, 0, 1)
  },

  /**
   * Normalizes a value to percentage range (0-100)
   * @param {number} value - The value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Normalized value between 0 and 100
   */
  normalizeToPercent: (value, min, max) => {
    return utils.scaleLinear(value, min, max, 0, 100)
  },

  /**
   * Computes min and max values from a dataset for specified fields
   * @param {Array} dataset - Array of objects to analyze
   * @param {Array<string>} fields - Field names to compute min/max for
   * @returns {Object} Object with min/max values for each field
   */
  computeMinMax: (dataset, fields) => {
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return fields.reduce((acc, field) => {
        acc[field] = { min: 0, max: 1 }
        return acc
      }, {})
    }

    const result = {}

    fields.forEach(field => {
      const values = dataset
        .map(item => item[field])
        .filter(val => typeof val === 'number' && !isNaN(val))

      if (values.length === 0) {
        result[field] = { min: 0, max: 1 }
      } else if (values.length === 1) {
        result[field] = { min: 0, max: values[0] || 1 }
      } else {
        result[field] = {
          min: Math.min(...values),
          max: Math.max(...values)
        }
      }
    })

    return result
  },

  /**
   * Normalizes an entire dataset for specified fields
   * @param {Array} dataset - Array of objects to normalize
   * @param {Array<string>} fields - Field names to normalize
   * @param {string} mode - Normalization mode: 'unit' (0-1) or 'percent' (0-100)
   * @returns {Object} Object with normalized dataset and metadata
   */
  normalizeDataset: (dataset, fields, mode = 'unit') => {
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return {
        data: [],
        metadata: {
          fields,
          mode,
          ranges: {}
        }
      }
    }

    const ranges = utils.computeMinMax(dataset, fields)
    const normalizeFunc = mode === 'percent' ? utils.normalizeToPercent : utils.normalizeToUnit

    const normalizedData = dataset.map(item => {
      const normalized = { ...item }

      fields.forEach(field => {
        const originalValue = item[field]
        if (typeof originalValue === 'number' && !isNaN(originalValue)) {
          const { min, max } = ranges[field]
          normalized[`${field}_normalized`] = normalizeFunc(originalValue, min, max)
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
        count: dataset.length
      }
    }
  },

  /**
   * Handles edge cases in normalization
   * @param {Array} values - Array of values to check
   * @returns {Object} Information about edge cases
   */
  checkNormalizationEdgeCases: (values) => {
    if (!Array.isArray(values)) {
      return { hasEdgeCases: true, type: 'invalid_input' }
    }

    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val))

    if (numericValues.length === 0) {
      return { hasEdgeCases: true, type: 'no_numeric_values' }
    }

    if (numericValues.length === 1) {
      return { hasEdgeCases: true, type: 'single_value' }
    }

    const min = Math.min(...numericValues)
    const max = Math.max(...numericValues)

    if (min === max) {
      return { hasEdgeCases: true, type: 'uniform_values' }
    }

    return { hasEdgeCases: false, type: 'normal' }
  },

  /**
   * Creates a normalization context for a dataset
   * @param {Array} dataset - Dataset to create context for
   * @param {Array<string>} fields - Fields to include in context
   * @returns {Object} Normalization context with statistics
   */
  createNormalizationContext: (dataset, fields) => {
    const ranges = utils.computeMinMax(dataset, fields)
    const context = {
      totalItems: dataset.length,
      fields: {},
      timestamp: Date.now()
    }

    fields.forEach(field => {
      const values = dataset
        .map(item => item[field])
        .filter(val => typeof val === 'number' && !isNaN(val))

      const edgeCases = utils.checkNormalizationEdgeCases(values)

      context.fields[field] = {
        ...ranges[field],
        count: values.length,
        edgeCases,
        mean: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      }
    })

    return context
  }
}

/**
 * Enhanced API wrapper with comprehensive security and error handling
 * @param {string} channel - IPC channel name
 * @param {Function} validator - Validation function for arguments
 * @param {Object} options - Additional options for security
 * @returns {Function} Wrapped API function
 */
function createSecureApiWrapper (channel, validator = null, options = {}) {
  const {
    requiresAuth = false,
    rateLimitKey = null,
    maxCalls = 10,
    windowMs = 60000,
    sanitizeArgs = true
  } = options

  return async (...args) => {
    try {
      // Rate limiting check
      if (rateLimitKey && !securityUtils.rateLimiter.check(rateLimitKey, maxCalls, windowMs)) {
        throw new Error(`Rate limit exceeded for ${channel}`)
      }

      // Sanitize arguments if enabled
      let sanitizedArgs = args
      if (sanitizeArgs) {
        sanitizedArgs = args.map(arg => {
          if (typeof arg === 'string') {
            return validators.sanitizeString(arg)
          }
          return arg
        })
      }

      // Validate arguments if validator provided
      if (validator && !validator(...sanitizedArgs)) {
        throw new Error(`Invalid arguments provided to ${channel}`)
      }

      const result = await ipcRenderer.invoke(channel, ...sanitizedArgs)
      return { success: true, data: result }
    } catch (error) {
      // Secure error logging - don't expose sensitive details
      const sanitizedError = {
        message: error?.message || 'An unknown error occurred',
        type: 'error',
        code: error?.code || null,
        channel
      }

      // Log to secure logging system instead of console
      if (window.api && window.api.secureLog) {
        window.api.secureLog('error', `API Error [${channel}]`, sanitizedError)
      }

      return {
        success: false,
        error: sanitizedError,
        channel
      }
    }
  }
}

/**
 * Legacy API wrapper for backward compatibility
 */
function createApiWrapper (channel, validator = null) {
  return createSecureApiWrapper(channel, validator)
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  /**
   * Security API Methods
   */
  security: {
    /**
     * Sanitize HTML content using main process security utilities
     * @param {string} htmlString - HTML string to sanitize
     * @returns {Promise<Object>} Sanitized HTML or error
     */
    sanitizeHtml: createSecureApiWrapper('security-sanitize-html',
      (html) => typeof html === 'string',
      { rateLimitKey: 'sanitize', maxCalls: 50, windowMs: 60000 }
    ),

    /**
     * Sanitize search results array
     * @param {Array} results - Search results to sanitize
     * @returns {Promise<Object>} Sanitized results or error
     */
    sanitizeSearchResults: createSecureApiWrapper('security-sanitize-results',
      (results) => Array.isArray(results),
      { rateLimitKey: 'sanitize', maxCalls: 20, windowMs: 60000 }
    ),

    /**
     * Validate external URL for safety
     * @param {string} url - URL to validate
     * @returns {Promise<Object>} Validation result or error
     */
    validateUrl: createSecureApiWrapper('security-validate-url',
      (url) => validators.isValidUrl(url),
      { rateLimitKey: 'validate', maxCalls: 30, windowMs: 60000 }
    ),

    /**
     * Client-side HTML escaping for immediate use
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml: securityUtils.escapeHtml,

    /**
     * Client-side input sanitization
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput: validators.sanitizeString
  },

  /**
   * Secure External Link API
   */

  /**
   * Open external URL with security validation
   * @param {string} url - URL to open
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Success status or error
   */
  openExternalSafe: createSecureApiWrapper('open-external-safe',
    (url) => validators.isValidUrl(url),
    { rateLimitKey: 'external-links', maxCalls: 10, windowMs: 60000 }
  ),

  /**
   * AFK Guard API
   */
  afkGuard: {
    /**
     * Report user activity to the AFK guard system
     * @param {Object} activityData - Activity information
     * @returns {Promise<Object>} Success status or error
     */
    reportActivity: createSecureApiWrapper('afk-report-activity',
      null,
      { rateLimitKey: 'activity', maxCalls: 100, windowMs: 60000, sanitizeArgs: false }
    ),

    /**
     * Check current session lock status
     * @returns {Promise<Object>} Lock status or error
     */
    checkLockStatus: createSecureApiWrapper('afk-check-lock-status',
      null,
      { rateLimitKey: 'status-check', maxCalls: 20, windowMs: 60000 }
    ),

    /**
     * Request session unlock
     * @param {Object} credentials - Unlock credentials
     * @returns {Promise<Object>} Unlock result or error
     */
    requestUnlock: createSecureApiWrapper('afk-request-unlock',
      null,
      { rateLimitKey: 'unlock', maxCalls: 5, windowMs: 60000 }
    ),

    /**
     * Get AFK guard configuration
     * @returns {Promise<Object>} Configuration or error
     */
    getConfig: createSecureApiWrapper('afk-get-config'),

    /**
     * Update AFK guard settings
     * @param {Object} settings - New settings
     * @returns {Promise<Object>} Success status or error
     */
    updateSettings: createSecureApiWrapper('afk-update-settings',
      (settings) => typeof settings === 'object' && settings !== null,
      { rateLimitKey: 'settings', maxCalls: 5, windowMs: 60000 }
    )
  },

  /**
   * Secure Logging Interface
   */

  /**
   * Secure logging that routes through main process
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Log message
   * @param {any} data - Additional data to log
   * @returns {Promise<Object>} Success status or error
   */
  secureLog: createSecureApiWrapper('secure-log',
    (level, message) => typeof level === 'string' && typeof message === 'string',
    { rateLimitKey: 'logging', maxCalls: 100, windowMs: 60000 }
  ),

  /**
   * Data Protection Utilities
   */
  dataProtection: {
    /**
     * Clear sensitive data from memory
     * @returns {Promise<Object>} Success status or error
     */
    clearSensitiveData: createSecureApiWrapper('data-clear-sensitive',
      null,
      { rateLimitKey: 'data-ops', maxCalls: 10, windowMs: 60000 }
    ),

    /**
     * Encrypt data for temporary storage
     * @param {string} data - Data to encrypt
     * @returns {Promise<Object>} Encrypted data or error
     */
    encryptTemporary: createSecureApiWrapper('data-encrypt-temp',
      (data) => typeof data === 'string',
      { rateLimitKey: 'encryption', maxCalls: 20, windowMs: 60000 }
    ),

    /**
     * Decrypt temporary data
     * @param {Object} encryptedData - Encrypted data object
     * @returns {Promise<Object>} Decrypted data or error
     */
    decryptTemporary: createSecureApiWrapper('data-decrypt-temp',
      (data) => typeof data === 'object' && data !== null,
      { rateLimitKey: 'encryption', maxCalls: 20, windowMs: 60000 }
    )
  },
  /**
   * Last.fm API Methods
   */

  /**
   * Search Last.fm for artists, tracks, or albums
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchLastFm: createSecureApiWrapper('search-lastfm',
    (query) => validators.isValidSecureQuery(query),
    { rateLimitKey: 'lastfm-search', maxCalls: 30, windowMs: 60000 }
  ),

  /**
   * Brass Stabs Management Methods
   */

  /**
   * Search local brass stabs database
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchLocalBrass: createSecureApiWrapper('search-local-brass',
    (query) => validators.isValidSecureQuery(query),
    { rateLimitKey: 'local-search', maxCalls: 50, windowMs: 60000 }
  ),

  /**
   * Search online brass stabs via Freesound API
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchOnlineBrass: createSecureApiWrapper('search-online-brass',
    (query) => validators.isValidSecureQuery(query),
    { rateLimitKey: 'freesound-search', maxCalls: 20, windowMs: 60000 }
  ),

  /**
   * Add a new brass sample to the local database
   * @param {Object} sample - Sample object with name, path, tags, etc.
   * @returns {Promise<Object>} Success status or error
   */
  addBrassSample: createSecureApiWrapper('add-brass-sample',
    (sample) => validators.isValidSample(sample),
    { rateLimitKey: 'add-sample', maxCalls: 10, windowMs: 60000 }
  ),

  /**
   * File Management Methods
   */

  /**
   * Open file dialog to select brass sample files
   * @returns {Promise<Object>} Selected files or error
   */
  selectBrassFile: createSecureApiWrapper('select-brass-file',
    null,
    { rateLimitKey: 'file-select', maxCalls: 20, windowMs: 60000 }
  ),

  /**
   * Electron Fiddle Integration Methods
   */

  /**
   * Open Electron Fiddle with a template
   * @param {Object} template - Fiddle template object
   * @returns {Promise<Object>} Success status or error
   */
  openFiddle: createSecureApiWrapper('open-fiddle',
    (template) => validators.isValidTemplate(template),
    { rateLimitKey: 'fiddle', maxCalls: 5, windowMs: 60000 }
  ),

  /**
   * Get available fiddle templates
   * @returns {Promise<Object>} Available templates or error
   */
  getFiddleTemplates: createSecureApiWrapper('get-fiddle-templates',
    null,
    { rateLimitKey: 'templates', maxCalls: 10, windowMs: 60000 }
  ),

  /**
   * Utility Methods
   */

  /**
   * Enhanced validation helpers for the renderer process
   */
  validators: {
    ...validators,

    /**
     * Validate with security context
     */
    validateWithSecurity: (data, type) => {
      switch (type) {
        case 'query':
          return validators.isValidSecureQuery(data)
        case 'url':
          return validators.isValidUrl(data)
        case 'file':
          return validators.isValidSecureFile(data)
        case 'sample':
          return validators.isValidSample(data)
        default:
          return false
      }
    }
  },

  /**
   * Enhanced utility functions for the renderer process
   */
  utils: {
    ...utils,

    /**
     * Enhanced error formatting with security context
     * @param {Error|string} error - The error to format
     * @param {string} context - Security context
     * @returns {Object} Safe error object
     */
    formatSecureError: (error, context = 'general') => {
      const baseError = utils.formatError(error)

      // Add security context without exposing sensitive details
      return {
        ...baseError,
        context,
        timestamp: Date.now(),
        // Remove potentially sensitive stack traces in production
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }
    },

    /**
     * Secure data clearing utility
     * @param {Object} obj - Object to clear sensitive data from
     * @returns {Object} Object with sensitive data cleared
     */
    clearSensitiveFields: (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj

      const sensitiveKeys = ['api_key', 'secret', 'token', 'password', 'auth', 'credential']
      const cleared = { ...obj }

      Object.keys(cleared).forEach(key => {
        const keyLower = key.toLowerCase()
        if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
          cleared[key] = '[CLEARED]'
        }
      })

      return cleared
    },

    /**
     * Memory cleanup utility
     */
    cleanupMemory: () => {
      // Clear any cached sensitive data
      if (window.searchCache) {
        window.searchCache.clear()
      }
      if (window.apiCache) {
        window.apiCache.clear()
      }

      // Force garbage collection if available
      if (window.gc) {
        window.gc()
      }
    }
  },

  /**
   * Constants and configuration with security settings
   */
  constants: {
    SUPPORTED_AUDIO_FORMATS: ['wav', 'mp3', 'aiff', 'flac', 'ogg'],
    MAX_SEARCH_RESULTS: 50,
    DEBOUNCE_DELAY: 300,
    FILE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB

    // Security constants
    SECURITY: {
      RATE_LIMITS: {
        SEARCH: { maxCalls: 30, windowMs: 60000 },
        API: { maxCalls: 50, windowMs: 60000 },
        EXTERNAL_LINKS: { maxCalls: 10, windowMs: 60000 },
        FILE_OPERATIONS: { maxCalls: 20, windowMs: 60000 }
      },

      TRUSTED_DOMAINS: [
        'last.fm', 'www.last.fm', 'ws.audioscrobbler.com',
        'freesound.org', 'www.freesound.org',
        'github.com', 'www.github.com',
        'nodejs.org', 'electronjs.org',
        'traycer.ai'
      ],

      DANGEROUS_PATTERNS: [
        /<script/i, /javascript:/i, /data:/i, /vbscript:/i, /on\w+\s*=/i
      ],

      AFK_SETTINGS: {
        DEFAULT_TIMEOUT: 10 * 60 * 1000, // 10 minutes
        WARNING_TIME: 2 * 60 * 1000, // 2 minutes
        SENSITIVITY_LEVELS: ['low', 'normal', 'high']
      }
    },

    // Normalization constants
    NORMALIZATION: {
      MODES: {
        UNIT: 'unit',
        PERCENT: 'percent'
      },
      RANGES: {
        UNIT: { min: 0, max: 1 },
        PERCENT: { min: 0, max: 100 }
      },
      DEFAULT_VALUES: {
        UNIT: 0,
        PERCENT: 0
      },
      FIELDS: {
        LASTFM: ['listeners', 'playcount'],
        FREESOUND: ['duration', 'filesize', 'downloads'],
        LOCAL: ['duration', 'filesize']
      }
    }
  },

  /**
   * Security utilities exposed to renderer
   */
  securityUtils: {
    escapeHtml: securityUtils.escapeHtml,
    isValidUrl: securityUtils.isValidUrl,
    sanitizeForLogging: securityUtils.sanitizeForLogging,
    rateLimiter: {
      check: securityUtils.rateLimiter.check,
      reset: securityUtils.rateLimiter.reset
    }
  }
});

// Initialize security features
(() => {
  // Set up activity reporting for AFK guard
  if (typeof document !== 'undefined') {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    const reportActivity = () => {
      if (window.api && window.api.afkGuard && window.api.afkGuard.reportActivity) {
        window.api.afkGuard.reportActivity({ timestamp: Date.now(), source: 'preload' })
      }
    }

    // Debounced activity reporting
    const debouncedReport = utils.debounce(reportActivity, 1000)

    activityEvents.forEach(event => {
      document.addEventListener(event, debouncedReport, { passive: true })
    })

    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        reportActivity()
      }
    })
  }

  // Set up secure error handling
  window.addEventListener('error', (event) => {
    if (window.api && window.api.secureLog) {
      const sanitizedError = securityUtils.sanitizeForLogging({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })

      window.api.secureLog('error', 'Renderer Error', sanitizedError)
    }
  })

  // Set up unhandled promise rejection handling
  window.addEventListener('unhandledrejection', (event) => {
    if (window.api && window.api.secureLog) {
      const sanitizedError = securityUtils.sanitizeForLogging({
        reason: event.reason?.message || 'Unknown rejection',
        stack: process.env.NODE_ENV === 'development' ? event.reason?.stack : undefined
      })

      window.api.secureLog('error', 'Unhandled Promise Rejection', sanitizedError)
    }
  })
})()

// Log successful preload initialization with security features
if (window.api && window.api.secureLog) {
  window.api.secureLog('info', 'Preload Initialization', {
    message: 'Brass Stabs Preload Script Loaded Successfully with Security Features',
    features: ['Security API', 'AFK Guard', 'Secure Logging', 'Rate Limiting', 'Input Validation'],
    timestamp: Date.now()
  })
} else {
  console.log('🎺 Brass Stabs Preload Script Loaded Successfully with Security Features')
}
