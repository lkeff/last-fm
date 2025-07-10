// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

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
    return typeof query === 'string' && query.trim().length > 0;
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
           sample.name.trim().length > 0;
  },

  /**
   * Validates a fiddle template object
   * @param {Object} template - The template object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidTemplate: (template) => {
    return template && typeof template === 'object';
  },

  /**
   * Sanitizes a string for safe use
   * @param {string} str - The string to sanitize
   * @returns {string} The sanitized string
   */
  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  }
};

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
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Formats duration in human readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration: (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Debounces a function call
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Creates a safe error object for display
   * @param {Error|string} error - The error to format
   * @returns {Object} Safe error object
   */
  formatError: (error) => {
    if (typeof error === 'string') {
      return { message: error, type: 'error' };
    }
    return {
      message: error?.message || 'An unknown error occurred',
      type: 'error',
      code: error?.code || null
    };
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
    if (typeof value !== 'number' || isNaN(value)) return targetMin;
    if (min === max) return targetMin;
    if (value <= min) return targetMin;
    if (value >= max) return targetMax;
    
    const ratio = (value - min) / (max - min);
    return targetMin + ratio * (targetMax - targetMin);
  },

  /**
   * Normalizes a value to unit range (0-1)
   * @param {number} value - The value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Normalized value between 0 and 1
   */
  normalizeToUnit: (value, min, max) => {
    return utils.scaleLinear(value, min, max, 0, 1);
  },

  /**
   * Normalizes a value to percentage range (0-100)
   * @param {number} value - The value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Normalized value between 0 and 100
   */
  normalizeToPercent: (value, min, max) => {
    return utils.scaleLinear(value, min, max, 0, 100);
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
        acc[field] = { min: 0, max: 1 };
        return acc;
      }, {});
    }

    const result = {};
    
    fields.forEach(field => {
      const values = dataset
        .map(item => item[field])
        .filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length === 0) {
        result[field] = { min: 0, max: 1 };
      } else if (values.length === 1) {
        result[field] = { min: 0, max: values[0] || 1 };
      } else {
        result[field] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return result;
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
          fields: fields,
          mode: mode,
          ranges: {}
        }
      };
    }

    const ranges = utils.computeMinMax(dataset, fields);
    const normalizeFunc = mode === 'percent' ? utils.normalizeToPercent : utils.normalizeToUnit;
    
    const normalizedData = dataset.map(item => {
      const normalized = { ...item };
      
      fields.forEach(field => {
        const originalValue = item[field];
        if (typeof originalValue === 'number' && !isNaN(originalValue)) {
          const { min, max } = ranges[field];
          normalized[`${field}_normalized`] = normalizeFunc(originalValue, min, max);
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
        count: dataset.length
      }
    };
  },

  /**
   * Handles edge cases in normalization
   * @param {Array} values - Array of values to check
   * @returns {Object} Information about edge cases
   */
  checkNormalizationEdgeCases: (values) => {
    if (!Array.isArray(values)) {
      return { hasEdgeCases: true, type: 'invalid_input' };
    }

    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
    
    if (numericValues.length === 0) {
      return { hasEdgeCases: true, type: 'no_numeric_values' };
    }

    if (numericValues.length === 1) {
      return { hasEdgeCases: true, type: 'single_value' };
    }

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (min === max) {
      return { hasEdgeCases: true, type: 'uniform_values' };
    }

    return { hasEdgeCases: false, type: 'normal' };
  },

  /**
   * Creates a normalization context for a dataset
   * @param {Array} dataset - Dataset to create context for
   * @param {Array<string>} fields - Fields to include in context
   * @returns {Object} Normalization context with statistics
   */
  createNormalizationContext: (dataset, fields) => {
    const ranges = utils.computeMinMax(dataset, fields);
    const context = {
      totalItems: dataset.length,
      fields: {},
      timestamp: Date.now()
    };

    fields.forEach(field => {
      const values = dataset
        .map(item => item[field])
        .filter(val => typeof val === 'number' && !isNaN(val));
      
      const edgeCases = utils.checkNormalizationEdgeCases(values);
      
      context.fields[field] = {
        ...ranges[field],
        count: values.length,
        edgeCases: edgeCases,
        mean: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      };
    });

    return context;
  }
};

/**
 * Enhanced API wrapper with error handling
 * @param {string} channel - IPC channel name
 * @param {Function} validator - Validation function for arguments
 * @returns {Function} Wrapped API function
 */
function createApiWrapper(channel, validator = null) {
  return async (...args) => {
    try {
      // Validate arguments if validator provided
      if (validator && !validator(...args)) {
        throw new Error(`Invalid arguments provided to ${channel}`);
      }
      
      const result = await ipcRenderer.invoke(channel, ...args);
      return { success: true, data: result };
    } catch (error) {
      console.error(`API Error [${channel}]:`, error);
      return { 
        success: false, 
        error: utils.formatError(error),
        channel 
      };
    }
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  /**
   * Last.fm API Methods
   */
  
  /**
   * Search Last.fm for artists, tracks, or albums
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchLastFm: createApiWrapper('search-lastfm', (query) => validators.isValidQuery(query)),

  /**
   * Brass Stabs Management Methods
   */
  
  /**
   * Search local brass stabs database
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchLocalBrass: createApiWrapper('search-local-brass', (query) => validators.isValidQuery(query)),

  /**
   * Search online brass stabs via Freesound API
   * @param {string} query - Search query string
   * @returns {Promise<Object>} Search results or error
   */
  searchOnlineBrass: createApiWrapper('search-online-brass', (query) => validators.isValidQuery(query)),

  /**
   * Add a new brass sample to the local database
   * @param {Object} sample - Sample object with name, path, tags, etc.
   * @returns {Promise<Object>} Success status or error
   */
  addBrassSample: createApiWrapper('add-brass-sample', (sample) => validators.isValidSample(sample)),

  /**
   * File Management Methods
   */
  
  /**
   * Open file dialog to select brass sample files
   * @returns {Promise<Object>} Selected files or error
   */
  selectBrassFile: createApiWrapper('select-brass-file'),

  /**
   * Electron Fiddle Integration Methods
   */
  
  /**
   * Open Electron Fiddle with a template
   * @param {Object} template - Fiddle template object
   * @returns {Promise<Object>} Success status or error
   */
  openFiddle: createApiWrapper('open-fiddle', (template) => validators.isValidTemplate(template)),

  /**
   * Get available fiddle templates
   * @returns {Promise<Object>} Available templates or error
   */
  getFiddleTemplates: createApiWrapper('get-fiddle-templates'),

  /**
   * Utility Methods
   */
  
  /**
   * Validation helpers for the renderer process
   */
  validators,

  /**
   * Utility functions for the renderer process
   */
  utils,

  /**
   * Constants and configuration
   */
  constants: {
    SUPPORTED_AUDIO_FORMATS: ['wav', 'mp3', 'aiff', 'flac', 'ogg'],
    MAX_SEARCH_RESULTS: 50,
    DEBOUNCE_DELAY: 300,
    FILE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB
    
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
  }
});

// Log successful preload initialization
console.log('🎺 Brass Stabs Preload Script Loaded Successfully');
