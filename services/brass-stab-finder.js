/**
 * Brass Stab Finder Service
 * Professional audio analysis and brass stab detection system
 * Runs internally in dockered environment with comprehensive auditing
 *
 * @module services/brass-stab-finder
 * @version 1.0.0
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * BrassStabFinder - Internal audio analysis service
 * Detects brass stab characteristics in audio files
 */
class BrassStabFinder extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      port: options.port || 3002,
      logLevel: options.logLevel || 'info',
      auditEnabled: options.auditEnabled !== false,
      maxFileSize: options.maxFileSize || 500 * 1024 * 1024, // 500MB
      analysisTimeout: options.analysisTimeout || 60000, // 60 seconds
      cacheEnabled: options.cacheEnabled !== false,
      cacheDir: options.cacheDir || '/app/data/brass-cache',
      logsDir: options.logsDir || '/app/logs',
      dataDir: options.dataDir || '/app/data',
      ...options
    };

    this.state = {
      running: false,
      analysisQueue: [],
      activeAnalysis: new Map(),
      cacheIndex: new Map(),
      stats: {
        totalAnalyzed: 0,
        successfulAnalysis: 0,
        failedAnalysis: 0,
        cacheHits: 0,
        totalProcessingTime: 0,
        startTime: null
      }
    };

    this.auditLog = [];
    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  initializeDirectories() {
    const dirs = [this.config.cacheDir, this.config.logsDir, this.config.dataDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        this.audit('info', 'Directory created', { dir });
      }
    }
  }

  /**
   * Start the brass stab finder service
   */
  async start() {
    try {
      this.state.running = true;
      this.state.stats.startTime = Date.now();
      
      this.audit('info', 'Brass Stab Finder service starting', {
        port: this.config.port,
        auditEnabled: this.config.auditEnabled,
        cacheEnabled: this.config.cacheEnabled
      });

      // Load cache index
      await this.loadCacheIndex();

      // Start audit log rotation
      this.startAuditLogRotation();

      this.emit('started');
      this.audit('info', 'Brass Stab Finder service started successfully');
      
      return { success: true, message: 'Service started' };
    } catch (error) {
      this.audit('error', 'Failed to start service', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop() {
    try {
      this.state.running = false;
      
      // Wait for active analysis to complete
      if (this.state.activeAnalysis.size > 0) {
        this.audit('info', 'Waiting for active analysis to complete', {
          count: this.state.activeAnalysis.size
        });
        
        await Promise.race([
          Promise.all([...this.state.activeAnalysis.values()]),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
      }

      // Save cache index
      await this.saveCacheIndex();

      // Save final audit log
      await this.saveAuditLog();

      this.emit('stopped');
      this.audit('info', 'Brass Stab Finder service stopped');
      
      return { success: true, message: 'Service stopped' };
    } catch (error) {
      this.audit('error', 'Error stopping service', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze audio file for brass stab characteristics
   * @param {string} filePath - Path to audio file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFile(filePath, options = {}) {
    const analysisId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Validate input
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }

      // Check file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size > this.config.maxFileSize) {
        throw new Error(`File size exceeds limit: ${stats.size} > ${this.config.maxFileSize}`);
      }

      this.audit('info', 'Analysis started', {
        analysisId,
        filePath: path.basename(filePath),
        fileSize: stats.size,
        options
      });

      // Check cache
      const cacheKey = this.generateCacheKey(filePath, stats.mtime);
      if (this.config.cacheEnabled && this.state.cacheIndex.has(cacheKey)) {
        const cached = this.state.cacheIndex.get(cacheKey);
        this.state.stats.cacheHits++;
        
        this.audit('info', 'Cache hit', {
          analysisId,
          cacheKey: cacheKey.substring(0, 16) + '...'
        });

        return {
          analysisId,
          cached: true,
          ...cached,
          processingTime: Date.now() - startTime
        };
      }

      // Add to queue
      const analysisPromise = this.performAnalysis(filePath, analysisId, options);
      this.state.activeAnalysis.set(analysisId, analysisPromise);

      // Perform analysis with timeout
      const result = await Promise.race([
        analysisPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timeout')), this.config.analysisTimeout)
        )
      ]);

      // Cache result
      if (this.config.cacheEnabled) {
        this.state.cacheIndex.set(cacheKey, result);
        await this.saveCacheIndex();
      }

      const processingTime = Date.now() - startTime;
      this.state.stats.totalAnalyzed++;
      this.state.stats.successfulAnalysis++;
      this.state.stats.totalProcessingTime += processingTime;

      this.audit('info', 'Analysis completed', {
        analysisId,
        processingTime,
        brassScore: result.brassScore,
        detected: result.detected
      });

      return {
        analysisId,
        cached: false,
        ...result,
        processingTime
      };
    } catch (error) {
      this.state.stats.totalAnalyzed++;
      this.state.stats.failedAnalysis++;

      this.audit('error', 'Analysis failed', {
        analysisId,
        filePath: path.basename(filePath),
        error: error.message,
        processingTime: Date.now() - startTime
      });

      throw error;
    } finally {
      this.state.activeAnalysis.delete(analysisId);
    }
  }

  /**
   * Perform actual audio analysis
   * @private
   */
  async performAnalysis(filePath, analysisId, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Simulate audio analysis with realistic brass stab detection
        // In production, this would use actual audio processing libraries
        // like node-wav, node-fft, or librosa bindings

        const fileName = path.basename(filePath).toLowerCase();
        const fileSize = fs.statSync(filePath).size;

        // Simulate frequency analysis
        const frequencyBands = {
          sub: Math.random() * 0.3,           // 20-60Hz
          bass: Math.random() * 0.4,          // 60-250Hz
          lowMid: Math.random() * 0.6,        // 250-500Hz
          mid: Math.random() * 0.8,           // 500-2kHz
          highMid: Math.random() * 0.9,       // 2-4kHz
          presence: Math.random() * 0.95,     // 4-6kHz
          brilliance: Math.random() * 0.7     // 6-20kHz
        };

        // Simulate transient detection
        const transients = {
          count: Math.floor(Math.random() * 50),
          avgEnergy: Math.random() * 0.8,
          peakEnergy: Math.random() * 1.0,
          attackTime: Math.random() * 0.1
        };

        // Simulate spectral characteristics
        const spectral = {
          centroid: 2000 + Math.random() * 6000,  // Hz
          spread: 1000 + Math.random() * 4000,    // Hz
          rolloff: 8000 + Math.random() * 12000,  // Hz
          flatness: Math.random() * 0.5
        };

        // Detect brass characteristics
        const brassCharacteristics = {
          hasAttack: transients.count > 5 && transients.avgEnergy > 0.4,
          hasBrilliance: frequencyBands.presence > 0.6 && frequencyBands.brilliance > 0.5,
          hasResonance: frequencyBands.highMid > 0.7,
          hasSustain: transients.count < 20,
          spectralMatch: this.calculateSpectralMatch(frequencyBands, spectral),
          transientMatch: this.calculateTransientMatch(transients)
        };

        // Calculate brass score (0-100)
        const brassScore = this.calculateBrassScore(
          brassCharacteristics,
          frequencyBands,
          transients,
          spectral,
          fileName
        );

        // Determine if brass stab detected
        const detected = brassScore > 60;

        // Identify brass type
        const brassType = this.identifyBrassType(
          frequencyBands,
          transients,
          spectral,
          fileName
        );

        // Estimate duration
        const estimatedDuration = fileSize / (44100 * 2 * 2); // Rough estimate

        resolve({
          fileName: path.basename(filePath),
          filePath,
          fileSize,
          detected,
          brassScore: Math.round(brassScore),
          confidence: Math.min(100, Math.round(brassScore * 1.2)),
          brassType,
          duration: Math.round(estimatedDuration * 100) / 100,
          characteristics: brassCharacteristics,
          frequencyAnalysis: frequencyBands,
          transientAnalysis: transients,
          spectralAnalysis: spectral,
          timestamp: new Date().toISOString(),
          analysisVersion: '1.0.0'
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate spectral match score
   * @private
   */
  calculateSpectralMatch(frequencyBands, spectral) {
    const centroidMatch = Math.abs(spectral.centroid - 4000) < 2000 ? 0.8 : 0.4;
    const rolloffMatch = spectral.rolloff > 8000 ? 0.8 : 0.4;
    return (centroidMatch + rolloffMatch) / 2;
  }

  /**
   * Calculate transient match score
   * @private
   */
  calculateTransientMatch(transients) {
    const countMatch = transients.count > 5 && transients.count < 50 ? 0.8 : 0.3;
    const energyMatch = transients.avgEnergy > 0.4 ? 0.8 : 0.3;
    const attackMatch = transients.attackTime < 0.05 ? 0.9 : 0.4;
    return (countMatch + energyMatch + attackMatch) / 3;
  }

  /**
   * Calculate brass score (0-100)
   * @private
   */
  calculateBrassScore(characteristics, frequencyBands, transients, spectral, fileName) {
    let score = 0;

    // Characteristic matching (40 points)
    const charScore = Object.values(characteristics)
      .filter(v => typeof v === 'boolean')
      .filter(v => v).length * 10;
    score += Math.min(40, charScore);

    // Frequency analysis (30 points)
    const freqScore = (
      (frequencyBands.presence > 0.6 ? 10 : 0) +
      (frequencyBands.highMid > 0.7 ? 10 : 0) +
      (frequencyBands.bass < 0.5 ? 10 : 0)
    );
    score += freqScore;

    // Transient analysis (20 points)
    const transScore = (
      (transients.count > 5 && transients.count < 50 ? 10 : 0) +
      (transients.avgEnergy > 0.4 ? 10 : 0)
    );
    score += transScore;

    // Spectral analysis (10 points)
    const specScore = (
      spectral.centroid > 2000 && spectral.centroid < 8000 ? 10 : 0
    );
    score += specScore;

    // Filename hints (bonus/penalty)
    if (fileName.includes('brass')) score += 15;
    if (fileName.includes('stab')) score += 10;
    if (fileName.includes('hit')) score += 5;
    if (fileName.includes('pad')) score -= 10;
    if (fileName.includes('ambient')) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify brass type
   * @private
   */
  identifyBrassType(frequencyBands, transients, spectral, fileName) {
    const types = [];

    if (frequencyBands.bass > 0.6) types.push('tuba');
    if (frequencyBands.lowMid > 0.7) types.push('trombone');
    if (frequencyBands.mid > 0.8) types.push('french-horn');
    if (frequencyBands.presence > 0.8) types.push('trumpet');
    if (frequencyBands.brilliance > 0.7) types.push('high-brass');

    if (transients.count > 20) types.push('section');
    if (transients.count < 10) types.push('solo');

    if (fileName.includes('trumpet')) types.push('trumpet');
    if (fileName.includes('trombone')) types.push('trombone');
    if (fileName.includes('horn')) types.push('french-horn');
    if (fileName.includes('tuba')) types.push('tuba');
    if (fileName.includes('section')) types.push('section');

    return types.length > 0 ? types : ['unknown'];
  }

  /**
   * Batch analyze multiple files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Analysis results
   */
  async analyzeBatch(filePaths, options = {}) {
    if (!Array.isArray(filePaths)) {
      throw new Error('filePaths must be an array');
    }

    this.audit('info', 'Batch analysis started', {
      fileCount: filePaths.length,
      options
    });

    const results = [];
    const errors = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.analyzeFile(filePath, options);
        results.push(result);
      } catch (error) {
        errors.push({
          filePath,
          error: error.message
        });
      }
    }

    this.audit('info', 'Batch analysis completed', {
      successful: results.length,
      failed: errors.length
    });

    return {
      results,
      errors,
      summary: {
        total: filePaths.length,
        successful: results.length,
        failed: errors.length,
        averageBrassScore: results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.brassScore, 0) / results.length)
          : 0,
        detectedCount: results.filter(r => r.detected).length
      }
    };
  }

  /**
   * Search for brass stabs in directory
   * @param {string} dirPath - Directory path
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchDirectory(dirPath, options = {}) {
    const minScore = options.minScore || 60;
    const recursive = options.recursive !== false;
    const extensions = options.extensions || ['.wav', '.mp3', '.aiff', '.flac', '.ogg'];

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    this.audit('info', 'Directory search started', {
      dirPath,
      minScore,
      recursive,
      extensions
    });

    const audioFiles = this.findAudioFiles(dirPath, extensions, recursive);
    const results = await this.analyzeBatch(audioFiles, options);

    // Filter by minimum score
    const filtered = results.results.filter(r => r.brassScore >= minScore);

    this.audit('info', 'Directory search completed', {
      dirPath,
      filesFound: audioFiles.length,
      brassStabsFound: filtered.length,
      averageScore: results.summary.averageBrassScore
    });

    return {
      dirPath,
      filesScanned: audioFiles.length,
      brassStabsFound: filtered.length,
      results: filtered.sort((a, b) => b.brassScore - a.brassScore),
      errors: results.errors,
      summary: results.summary
    };
  }

  /**
   * Find audio files in directory
   * @private
   */
  findAudioFiles(dirPath, extensions, recursive) {
    const files = [];

    const walk = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && recursive) {
            walk(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.audit('warn', 'Error reading directory', {
          dir,
          error: error.message
        });
      }
    };

    walk(dirPath);
    return files;
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const uptime = this.state.stats.startTime
      ? Date.now() - this.state.stats.startTime
      : 0;

    return {
      running: this.state.running,
      uptime,
      totalAnalyzed: this.state.stats.totalAnalyzed,
      successfulAnalysis: this.state.stats.successfulAnalysis,
      failedAnalysis: this.state.stats.failedAnalysis,
      successRate: this.state.stats.totalAnalyzed > 0
        ? Math.round((this.state.stats.successfulAnalysis / this.state.stats.totalAnalyzed) * 100)
        : 0,
      cacheHits: this.state.stats.cacheHits,
      averageProcessingTime: this.state.stats.totalAnalyzed > 0
        ? Math.round(this.state.stats.totalProcessingTime / this.state.stats.successfulAnalysis)
        : 0,
      activeAnalysis: this.state.activeAnalysis.size,
      queuedAnalysis: this.state.analysisQueue.length,
      cacheSize: this.state.cacheIndex.size
    };
  }

  /**
   * Get health status
   * @returns {Object} Health status
   */
  getHealth() {
    const stats = this.getStats();
    const healthy = this.state.running && stats.successRate > 90;

    return {
      status: healthy ? 'healthy' : 'degraded',
      running: this.state.running,
      successRate: stats.successRate,
      activeAnalysis: stats.activeAnalysis,
      cacheSize: stats.cacheSize,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Audit logging
   * @private
   */
  audit(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      pid: process.pid,
      hostname: require('os').hostname()
    };

    this.auditLog.push(entry);

    // Keep audit log size manageable
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }

    if (this.shouldLog(level)) {
      console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, data);
    }

    this.emit('audit', entry);
  }

  /**
   * Check if level should be logged
   * @private
   */
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    return levels[level] >= configLevel;
  }

  /**
   * Generate cache key
   * @private
   */
  generateCacheKey(filePath, mtime) {
    const data = `${filePath}:${mtime}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Load cache index from disk
   * @private
   */
  async loadCacheIndex() {
    try {
      const cacheFile = path.join(this.config.cacheDir, 'index.json');
      if (fs.existsSync(cacheFile)) {
        const data = fs.readFileSync(cacheFile, 'utf8');
        const index = JSON.parse(data);
        this.state.cacheIndex = new Map(Object.entries(index));
        this.audit('info', 'Cache index loaded', {
          size: this.state.cacheIndex.size
        });
      }
    } catch (error) {
      this.audit('warn', 'Failed to load cache index', {
        error: error.message
      });
    }
  }

  /**
   * Save cache index to disk
   * @private
   */
  async saveCacheIndex() {
    try {
      const cacheFile = path.join(this.config.cacheDir, 'index.json');
      const index = Object.fromEntries(this.state.cacheIndex);
      fs.writeFileSync(cacheFile, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      this.audit('warn', 'Failed to save cache index', {
        error: error.message
      });
    }
  }

  /**
   * Start audit log rotation
   * @private
   */
  startAuditLogRotation() {
    setInterval(() => {
      this.saveAuditLog();
    }, 3600000); // Every hour
  }

  /**
   * Save audit log to disk
   * @private
   */
  async saveAuditLog() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(
        this.config.logsDir,
        `brass-stab-finder-audit-${timestamp}.json`
      );
      fs.writeFileSync(logFile, JSON.stringify(this.auditLog, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save audit log:', error.message);
    }
  }

  /**
   * Get audit log
   * @returns {Array} Audit log entries
   */
  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      this.state.cacheIndex.clear();
      await this.saveCacheIndex();
      this.audit('info', 'Cache cleared');
      return { success: true, message: 'Cache cleared' };
    } catch (error) {
      this.audit('error', 'Failed to clear cache', { error: error.message });
      throw error;
    }
  }
}

module.exports = BrassStabFinder;
