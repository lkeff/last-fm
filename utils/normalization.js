/**
 * Comprehensive Data Normalization Utilities
 * 
 * This module provides a complete set of normalization functions that can be used
 * across different processes in the Electron application. It handles various data
 * types, normalization strategies, and edge cases to ensure consistent data scaling
 * and comparison across different data sources (Last.fm, Freesound, local samples).
 * 
 * @module normalization
 * @version 1.0.0
 */

// Configuration constants
const NORMALIZATION_CONFIG = {
  // Normalization modes
  MODES: {
    UNIT: 'unit',           // 0-1 range
    PERCENT: 'percent',     // 0-100 range
    ZSCORE: 'zscore',       // Standard score normalization
    ROBUST: 'robust',       // Robust scaling using median and IQR
    MINMAX: 'minmax'        // Min-max scaling (alias for unit)
  },

  // Default ranges for different modes
  RANGES: {
    unit: { min: 0, max: 1 },
    percent: { min: 0, max: 100 },
    zscore: { min: -3, max: 3 },      // Typical range for z-scores
    robust: { min: -2, max: 2 },      // Typical range for robust scaling
    minmax: { min: 0, max: 1 }
  },

  // Default values for different modes
  DEFAULT_VALUES: {
    unit: 0,
    percent: 0,
    zscore: 0,
    robust: 0,
    minmax: 0
  },

  // Data type configurations
  DATA_TYPES: {
    INTEGER: 'integer',
    FLOAT: 'float',
    TIMESTAMP: 'timestamp',
    DURATION: 'duration',
    FILESIZE: 'filesize',
    COUNT: 'count'
  },

  // Outlier detection methods
  OUTLIER_METHODS: {
    IQR: 'iqr',           // Interquartile range method
    ZSCORE: 'zscore',     // Z-score method
    MODIFIED_ZSCORE: 'modified_zscore', // Modified z-score using median
    NONE: 'none'          // No outlier detection
  },

  // Statistical thresholds
  THRESHOLDS: {
    ZSCORE_OUTLIER: 3,           // Z-score threshold for outliers
    MODIFIED_ZSCORE_OUTLIER: 3.5, // Modified z-score threshold
    IQR_MULTIPLIER: 1.5          // IQR multiplier for outlier detection
  }
};

/**
 * Data type detection and validation utilities
 */
const DataTypeUtils = {
  /**
   * Detects the data type of a value
   * @param {*} value - Value to analyze
   * @returns {string} Detected data type
   */
  detectType: (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      // Check if it's a timestamp string
      if (DataTypeUtils.isTimestamp(value)) return NORMALIZATION_CONFIG.DATA_TYPES.TIMESTAMP;
      return 'string';
    }
    if (typeof value === 'number') {
      if (isNaN(value)) return 'nan';
      if (!isFinite(value)) return 'infinite';
      if (Number.isInteger(value)) return NORMALIZATION_CONFIG.DATA_TYPES.INTEGER;
      return NORMALIZATION_CONFIG.DATA_TYPES.FLOAT;
    }
    return 'unknown';
  },

  /**
   * Checks if a value represents a timestamp
   * @param {*} value - Value to check
   * @returns {boolean} True if value is a timestamp
   */
  isTimestamp: (value) => {
    if (typeof value === 'number') {
      // Unix timestamp (seconds or milliseconds)
      return value > 946684800 && value < 4102444800000; // Year 2000 to 2100
    }
    if (typeof value === 'string') {
      // ISO date string or other date formats
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  },

  /**
   * Validates if a value is numeric and finite
   * @param {*} value - Value to validate
   * @returns {boolean} True if value is valid for normalization
   */
  isValidNumeric: (value) => {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  },

  /**
   * Converts a value to a numeric type if possible
   * @param {*} value - Value to convert
   * @returns {number|null} Converted number or null if conversion fails
   */
  toNumeric: (value) => {
    if (DataTypeUtils.isValidNumeric(value)) return value;
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return DataTypeUtils.isValidNumeric(parsed) ? parsed : null;
    }
    
    if (DataTypeUtils.isTimestamp(value)) {
      const date = new Date(value);
      return date.getTime();
    }
    
    return null;
  },

  /**
   * Filters an array to only include valid numeric values
   * @param {Array} values - Array of values to filter
   * @returns {Array<number>} Array of valid numeric values
   */
  filterNumeric: (values) => {
    if (!Array.isArray(values)) return [];
    return values
      .map(DataTypeUtils.toNumeric)
      .filter(val => val !== null);
  }
};

/**
 * Statistical analysis utilities
 */
const StatisticalUtils = {
  /**
   * Calculates basic statistics for an array of values
   * @param {Array<number>} values - Array of numeric values
   * @returns {Object} Statistical measures
   */
  calculateStats: (values) => {
    const numericValues = DataTypeUtils.filterNumeric(values);
    
    if (numericValues.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 1,
        mean: 0,
        median: 0,
        std: 0,
        variance: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        range: 1
      };
    }

    if (numericValues.length === 1) {
      const value = numericValues[0];
      return {
        count: 1,
        min: 0,
        max: value || 1,
        mean: value,
        median: value,
        std: 0,
        variance: 0,
        q1: value,
        q3: value,
        iqr: 0,
        range: value || 1
      };
    }

    const sorted = [...numericValues].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const mean = sorted.reduce((sum, val) => sum + val, 0) / count;
    
    // Calculate median
    const median = count % 2 === 0
      ? (sorted[Math.floor(count / 2) - 1] + sorted[Math.floor(count / 2)]) / 2
      : sorted[Math.floor(count / 2)];
    
    // Calculate quartiles
    const q1Index = Math.floor(count * 0.25);
    const q3Index = Math.floor(count * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    // Calculate variance and standard deviation
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const std = Math.sqrt(variance);
    
    return {
      count,
      min,
      max,
      mean,
      median,
      std,
      variance,
      q1,
      q3,
      iqr,
      range: max - min
    };
  },

  /**
   * Detects outliers using various methods
   * @param {Array<number>} values - Array of numeric values
   * @param {string} method - Outlier detection method
   * @returns {Object} Outlier detection results
   */
  detectOutliers: (values, method = NORMALIZATION_CONFIG.OUTLIER_METHODS.IQR) => {
    const numericValues = DataTypeUtils.filterNumeric(values);
    
    if (numericValues.length < 3) {
      return {
        outliers: [],
        outlierIndices: [],
        cleanValues: numericValues,
        method: method
      };
    }

    const stats = StatisticalUtils.calculateStats(numericValues);
    let outliers = [];
    let outlierIndices = [];

    switch (method) {
      case NORMALIZATION_CONFIG.OUTLIER_METHODS.IQR:
        const lowerBound = stats.q1 - NORMALIZATION_CONFIG.THRESHOLDS.IQR_MULTIPLIER * stats.iqr;
        const upperBound = stats.q3 + NORMALIZATION_CONFIG.THRESHOLDS.IQR_MULTIPLIER * stats.iqr;
        
        numericValues.forEach((value, index) => {
          if (value < lowerBound || value > upperBound) {
            outliers.push(value);
            outlierIndices.push(index);
          }
        });
        break;

      case NORMALIZATION_CONFIG.OUTLIER_METHODS.ZSCORE:
        numericValues.forEach((value, index) => {
          const zscore = Math.abs((value - stats.mean) / stats.std);
          if (zscore > NORMALIZATION_CONFIG.THRESHOLDS.ZSCORE_OUTLIER) {
            outliers.push(value);
            outlierIndices.push(index);
          }
        });
        break;

      case NORMALIZATION_CONFIG.OUTLIER_METHODS.MODIFIED_ZSCORE:
        const medianAbsoluteDeviation = StatisticalUtils.calculateMAD(numericValues, stats.median);
        numericValues.forEach((value, index) => {
          const modifiedZScore = 0.6745 * (value - stats.median) / medianAbsoluteDeviation;
          if (Math.abs(modifiedZScore) > NORMALIZATION_CONFIG.THRESHOLDS.MODIFIED_ZSCORE_OUTLIER) {
            outliers.push(value);
            outlierIndices.push(index);
          }
        });
        break;

      default:
        // No outlier detection
        break;
    }

    const cleanValues = numericValues.filter((_, index) => !outlierIndices.includes(index));

    return {
      outliers,
      outlierIndices,
      cleanValues,
      method,
      stats
    };
  },

  /**
   * Calculates Median Absolute Deviation
   * @param {Array<number>} values - Array of numeric values
   * @param {number} median - Median value
   * @returns {number} Median absolute deviation
   */
  calculateMAD: (values, median) => {
    const deviations = values.map(value => Math.abs(value - median));
    deviations.sort((a, b) => a - b);
    const count = deviations.length;
    return count % 2 === 0
      ? (deviations[Math.floor(count / 2) - 1] + deviations[Math.floor(count / 2)]) / 2
      : deviations[Math.floor(count / 2)];
  }
};

/**
 * Core normalization functions
 */
const NormalizationCore = {
  /**
   * Min-Max normalization (linear scaling)
   * @param {number} value - Value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @param {number} targetMin - Target minimum value (default: 0)
   * @param {number} targetMax - Target maximum value (default: 1)
   * @returns {number} Normalized value
   */
  minMaxScale: (value, min, max, targetMin = 0, targetMax = 1) => {
    if (!DataTypeUtils.isValidNumeric(value)) return targetMin;
    if (min === max) return targetMin;
    if (value <= min) return targetMin;
    if (value >= max) return targetMax;
    
    const ratio = (value - min) / (max - min);
    return targetMin + ratio * (targetMax - targetMin);
  },

  /**
   * Z-score normalization (standardization)
   * @param {number} value - Value to normalize
   * @param {number} mean - Mean of the dataset
   * @param {number} std - Standard deviation of the dataset
   * @returns {number} Z-score normalized value
   */
  zScoreNormalize: (value, mean, std) => {
    if (!DataTypeUtils.isValidNumeric(value) || std === 0) return 0;
    return (value - mean) / std;
  },

  /**
   * Robust scaling using median and IQR
   * @param {number} value - Value to normalize
   * @param {number} median - Median of the dataset
   * @param {number} iqr - Interquartile range of the dataset
   * @returns {number} Robust scaled value
   */
  robustScale: (value, median, iqr) => {
    if (!DataTypeUtils.isValidNumeric(value) || iqr === 0) return 0;
    return (value - median) / iqr;
  },

  /**
   * Unit normalization (0-1 range)
   * @param {number} value - Value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Unit normalized value
   */
  normalizeToUnit: (value, min, max) => {
    return NormalizationCore.minMaxScale(value, min, max, 0, 1);
  },

  /**
   * Percentage normalization (0-100 range)
   * @param {number} value - Value to normalize
   * @param {number} min - Minimum value in the dataset
   * @param {number} max - Maximum value in the dataset
   * @returns {number} Percentage normalized value
   */
  normalizeToPercent: (value, min, max) => {
    return NormalizationCore.minMaxScale(value, min, max, 0, 100);
  }
};

/**
 * Batch processing utilities for datasets
 */
const BatchProcessor = {
  /**
   * Normalizes an entire dataset using the specified strategy
   * @param {Array} dataset - Array of objects to normalize
   * @param {Array<string>} fields - Field names to normalize
   * @param {string} mode - Normalization mode
   * @param {Object} options - Additional options
   * @returns {Object} Normalized dataset with metadata
   */
  normalizeDataset: (dataset, fields, mode = NORMALIZATION_CONFIG.MODES.UNIT, options = {}) => {
    const {
      outlierDetection = NORMALIZATION_CONFIG.OUTLIER_METHODS.NONE,
      preserveOriginal = true,
      roundDecimals = 2,
      handleMissing = 'default'
    } = options;

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return {
        data: [],
        metadata: {
          fields: fields,
          mode: mode,
          ranges: {},
          statistics: {},
          outliers: {},
          count: 0,
          timestamp: Date.now(),
          options: options
        }
      };
    }

    const metadata = {
      fields: fields,
      mode: mode,
      ranges: {},
      statistics: {},
      outliers: {},
      count: dataset.length,
      timestamp: Date.now(),
      options: options
    };

    // Process each field
    fields.forEach(field => {
      const values = dataset.map(item => item[field]);
      const numericValues = DataTypeUtils.filterNumeric(values);
      
      // Calculate statistics
      const stats = StatisticalUtils.calculateStats(numericValues);
      metadata.statistics[field] = stats;

      // Detect outliers if requested
      let cleanValues = numericValues;
      if (outlierDetection !== NORMALIZATION_CONFIG.OUTLIER_METHODS.NONE) {
        const outlierResult = StatisticalUtils.detectOutliers(numericValues, outlierDetection);
        metadata.outliers[field] = outlierResult;
        cleanValues = outlierResult.cleanValues;
      }

      // Recalculate stats for clean values if outliers were removed
      if (cleanValues.length !== numericValues.length && cleanValues.length > 0) {
        const cleanStats = StatisticalUtils.calculateStats(cleanValues);
        metadata.ranges[field] = cleanStats;
      } else {
        metadata.ranges[field] = stats;
      }
    });

    // Normalize the dataset
    const normalizedData = dataset.map(item => {
      const normalized = { ...item };
      
      fields.forEach(field => {
        const originalValue = item[field];
        const numericValue = DataTypeUtils.toNumeric(originalValue);
        
        if (numericValue !== null) {
          const range = metadata.ranges[field];
          let normalizedValue;

          switch (mode) {
            case NORMALIZATION_CONFIG.MODES.UNIT:
            case NORMALIZATION_CONFIG.MODES.MINMAX:
              normalizedValue = NormalizationCore.normalizeToUnit(numericValue, range.min, range.max);
              break;
            
            case NORMALIZATION_CONFIG.MODES.PERCENT:
              normalizedValue = NormalizationCore.normalizeToPercent(numericValue, range.min, range.max);
              break;
            
            case NORMALIZATION_CONFIG.MODES.ZSCORE:
              normalizedValue = NormalizationCore.zScoreNormalize(numericValue, range.mean, range.std);
              break;
            
            case NORMALIZATION_CONFIG.MODES.ROBUST:
              normalizedValue = NormalizationCore.robustScale(numericValue, range.median, range.iqr);
              break;
            
            default:
              normalizedValue = NormalizationCore.normalizeToUnit(numericValue, range.min, range.max);
          }

          // Round to specified decimal places
          if (roundDecimals >= 0) {
            normalizedValue = Math.round(normalizedValue * Math.pow(10, roundDecimals)) / Math.pow(10, roundDecimals);
          }

          normalized[`${field}_normalized`] = normalizedValue;
          
          if (preserveOriginal) {
            normalized[`${field}_original`] = originalValue;
          }
        } else {
          // Handle missing or invalid values
          const defaultValue = NORMALIZATION_CONFIG.DEFAULT_VALUES[mode] || 0;
          normalized[`${field}_normalized`] = defaultValue;
          
          if (preserveOriginal) {
            normalized[`${field}_original`] = originalValue;
          }
        }
      });
      
      return normalized;
    });

    return {
      data: normalizedData,
      metadata: metadata
    };
  },

  /**
   * Computes normalization ranges for multiple fields
   * @param {Array} dataset - Array of objects
   * @param {Array<string>} fields - Field names to analyze
   * @param {Object} options - Processing options
   * @returns {Object} Normalization ranges and statistics
   */
  computeRanges: (dataset, fields, options = {}) => {
    const {
      outlierDetection = NORMALIZATION_CONFIG.OUTLIER_METHODS.NONE
    } = options;

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return fields.reduce((acc, field) => {
        acc[field] = { min: 0, max: 1, count: 0 };
        return acc;
      }, {});
    }

    const ranges = {};
    
    fields.forEach(field => {
      const values = dataset.map(item => item[field]);
      const numericValues = DataTypeUtils.filterNumeric(values);
      
      if (numericValues.length === 0) {
        ranges[field] = { min: 0, max: 1, count: 0 };
      } else {
        let processedValues = numericValues;
        
        // Apply outlier detection if requested
        if (outlierDetection !== NORMALIZATION_CONFIG.OUTLIER_METHODS.NONE) {
          const outlierResult = StatisticalUtils.detectOutliers(numericValues, outlierDetection);
          processedValues = outlierResult.cleanValues;
        }
        
        const stats = StatisticalUtils.calculateStats(processedValues);
        ranges[field] = stats;
      }
    });

    return ranges;
  }
};

/**
 * Edge case handlers
 */
const EdgeCaseHandlers = {
  /**
   * Handles empty datasets
   * @param {Array} dataset - Dataset to check
   * @param {Array<string>} fields - Fields to process
   * @param {string} mode - Normalization mode
   * @returns {Object|null} Default result for empty dataset or null
   */
  handleEmptyDataset: (dataset, fields, mode) => {
    if (!Array.isArray(dataset) || dataset.length === 0) {
      return {
        data: [],
        metadata: {
          fields: fields,
          mode: mode,
          ranges: {},
          count: 0,
          isEmpty: true,
          timestamp: Date.now()
        }
      };
    }
    return null;
  },

  /**
   * Handles single value datasets
   * @param {Array} values - Array of values
   * @param {string} field - Field name
   * @param {string} mode - Normalization mode
   * @returns {Object|null} Special handling result or null
   */
  handleSingleValue: (values, field, mode) => {
    const numericValues = DataTypeUtils.filterNumeric(values);
    
    if (numericValues.length === 1) {
      const value = numericValues[0];
      return {
        min: 0,
        max: value || 1,
        isSingleValue: true,
        value: value
      };
    }
    return null;
  },

  /**
   * Handles uniform values (all values are the same)
   * @param {Array} values - Array of values
   * @param {string} field - Field name
   * @returns {Object|null} Special handling result or null
   */
  handleUniformValues: (values, field) => {
    const numericValues = DataTypeUtils.filterNumeric(values);
    
    if (numericValues.length > 1) {
      const firstValue = numericValues[0];
      const allSame = numericValues.every(val => val === firstValue);
      
      if (allSame) {
        return {
          min: firstValue,
          max: firstValue,
          isUniform: true,
          value: firstValue
        };
      }
    }
    return null;
  },

  /**
   * Validates normalization input
   * @param {Array} dataset - Dataset to validate
   * @param {Array<string>} fields - Fields to validate
   * @param {string} mode - Normalization mode to validate
   * @returns {Object} Validation result
   */
  validateInput: (dataset, fields, mode) => {
    const errors = [];
    const warnings = [];

    // Validate dataset
    if (!Array.isArray(dataset)) {
      errors.push('Dataset must be an array');
    } else if (dataset.length === 0) {
      warnings.push('Dataset is empty');
    }

    // Validate fields
    if (!Array.isArray(fields)) {
      errors.push('Fields must be an array');
    } else if (fields.length === 0) {
      warnings.push('No fields specified for normalization');
    }

    // Validate mode
    const validModes = Object.values(NORMALIZATION_CONFIG.MODES);
    if (!validModes.includes(mode)) {
      errors.push(`Invalid normalization mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
};

/**
 * Main normalization interface
 */
const Normalizer = {
  /**
   * Normalizes a dataset with comprehensive options and error handling
   * @param {Array} dataset - Dataset to normalize
   * @param {Array<string>} fields - Fields to normalize
   * @param {string} mode - Normalization mode
   * @param {Object} options - Normalization options
   * @returns {Object} Normalized dataset with metadata
   */
  normalize: (dataset, fields, mode = NORMALIZATION_CONFIG.MODES.UNIT, options = {}) => {
    // Validate input
    const validation = EdgeCaseHandlers.validateInput(dataset, fields, mode);
    if (!validation.isValid) {
      throw new Error(`Normalization validation failed: ${validation.errors.join(', ')}`);
    }

    // Handle empty dataset
    const emptyResult = EdgeCaseHandlers.handleEmptyDataset(dataset, fields, mode);
    if (emptyResult) {
      return emptyResult;
    }

    // Perform normalization
    return BatchProcessor.normalizeDataset(dataset, fields, mode, options);
  },

  /**
   * Quick normalization for simple use cases
   * @param {Array} values - Array of values to normalize
   * @param {string} mode - Normalization mode
   * @returns {Array<number>} Normalized values
   */
  normalizeValues: (values, mode = NORMALIZATION_CONFIG.MODES.UNIT) => {
    const numericValues = DataTypeUtils.filterNumeric(values);
    
    if (numericValues.length === 0) {
      return [];
    }

    const stats = StatisticalUtils.calculateStats(numericValues);
    
    return numericValues.map(value => {
      switch (mode) {
        case NORMALIZATION_CONFIG.MODES.UNIT:
        case NORMALIZATION_CONFIG.MODES.MINMAX:
          return NormalizationCore.normalizeToUnit(value, stats.min, stats.max);
        
        case NORMALIZATION_CONFIG.MODES.PERCENT:
          return NormalizationCore.normalizeToPercent(value, stats.min, stats.max);
        
        case NORMALIZATION_CONFIG.MODES.ZSCORE:
          return NormalizationCore.zScoreNormalize(value, stats.mean, stats.std);
        
        case NORMALIZATION_CONFIG.MODES.ROBUST:
          return NormalizationCore.robustScale(value, stats.median, stats.iqr);
        
        default:
          return NormalizationCore.normalizeToUnit(value, stats.min, stats.max);
      }
    });
  },

  /**
   * Creates a normalization context for reuse
   * @param {Array} dataset - Dataset to analyze
   * @param {Array<string>} fields - Fields to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} Normalization context
   */
  createContext: (dataset, fields, options = {}) => {
    const ranges = BatchProcessor.computeRanges(dataset, fields, options);
    
    return {
      ranges: ranges,
      fields: fields,
      count: dataset.length,
      timestamp: Date.now(),
      options: options,
      
      // Method to apply normalization using this context
      apply: (value, field, mode = NORMALIZATION_CONFIG.MODES.UNIT) => {
        const range = ranges[field];
        if (!range) {
          throw new Error(`Field '${field}' not found in normalization context`);
        }

        const numericValue = DataTypeUtils.toNumeric(value);
        if (numericValue === null) {
          return NORMALIZATION_CONFIG.DEFAULT_VALUES[mode] || 0;
        }

        switch (mode) {
          case NORMALIZATION_CONFIG.MODES.UNIT:
          case NORMALIZATION_CONFIG.MODES.MINMAX:
            return NormalizationCore.normalizeToUnit(numericValue, range.min, range.max);
          
          case NORMALIZATION_CONFIG.MODES.PERCENT:
            return NormalizationCore.normalizeToPercent(numericValue, range.min, range.max);
          
          case NORMALIZATION_CONFIG.MODES.ZSCORE:
            return NormalizationCore.zScoreNormalize(numericValue, range.mean, range.std);
          
          case NORMALIZATION_CONFIG.MODES.ROBUST:
            return NormalizationCore.robustScale(numericValue, range.median, range.iqr);
          
          default:
            return NormalizationCore.normalizeToUnit(numericValue, range.min, range.max);
        }
      }
    };
  }
};

// Export the complete normalization module
module.exports = {
  // Main interface
  Normalizer,
  
  // Core functions
  ...NormalizationCore,
  
  // Utilities
  DataTypeUtils,
  StatisticalUtils,
  BatchProcessor,
  EdgeCaseHandlers,
  
  // Configuration
  NORMALIZATION_CONFIG,
  
  // Convenience aliases for backward compatibility
  normalizeDataset: BatchProcessor.normalizeDataset,
  computeRanges: BatchProcessor.computeRanges,
  normalize: Normalizer.normalize,
  normalizeValues: Normalizer.normalizeValues,
  createContext: Normalizer.createContext,
  
  // Legacy function names for compatibility with existing code
  scaleLinear: NormalizationCore.minMaxScale,
  normalizeToUnit: NormalizationCore.normalizeToUnit,
  normalizeToPercent: NormalizationCore.normalizeToPercent,
  computeNormalization: (dataset, fields, mode = 'unit') => {
    return BatchProcessor.normalizeDataset(dataset, fields, mode);
  }
};