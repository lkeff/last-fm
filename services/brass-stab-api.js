/**
 * Brass Stab Finder API
 * Express REST API for brass stab detection service
 * Runs internally in dockered environment with comprehensive auditing
 *
 * @module services/brass-stab-api
 * @version 1.0.0
 */

const express = require('express');
const BrassStabFinder = require('./brass-stab-finder');
const path = require('path');
const fs = require('fs');

/**
 * Create and configure brass stab API
 * @param {Object} options - Configuration options
 * @returns {Object} Express app and service instance
 */
function createBrassStabAPI(options = {}) {
  const app = express();
  const finder = new BrassStabFinder(options);

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      finder.audit('info', `${req.method} ${req.path}`, {
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    });
    next();
  });

  // Error handling middleware
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // ============================================================================
  // HEALTH & STATUS ENDPOINTS
  // ============================================================================

  /**
   * Health check endpoint
   */
  app.get('/health', (req, res) => {
    const health = finder.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  /**
   * Service statistics
   */
  app.get('/stats', (req, res) => {
    res.json({
      stats: finder.getStats(),
      health: finder.getHealth(),
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Service information
   */
  app.get('/info', (req, res) => {
    res.json({
      name: 'Brass Stab Finder Service',
      version: '1.0.0',
      description: 'Professional audio analysis and brass stab detection',
      features: [
        'Real-time brass stab detection',
        'Frequency analysis',
        'Transient detection',
        'Spectral analysis',
        'Batch processing',
        'Directory scanning',
        'Result caching',
        'Comprehensive auditing'
      ],
      endpoints: {
        health: 'GET /health',
        stats: 'GET /stats',
        info: 'GET /info',
        analyze: 'POST /api/analyze',
        batch: 'POST /api/batch',
        search: 'POST /api/search',
        cache: 'GET /api/cache, DELETE /api/cache',
        audit: 'GET /api/audit'
      },
      timestamp: new Date().toISOString()
    });
  });

  // ============================================================================
  // ANALYSIS ENDPOINTS
  // ============================================================================

  /**
   * Analyze single audio file
   * POST /api/analyze
   * Body: { filePath: string, options?: Object }
   */
  app.post('/api/analyze', asyncHandler(async (req, res) => {
    const { filePath, options } = req.body;

    if (!filePath) {
      return res.status(400).json({
        error: 'Missing required field: filePath'
      });
    }

    try {
      const result = await finder.analyzeFile(filePath, options);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  /**
   * Batch analyze multiple files
   * POST /api/batch
   * Body: { filePaths: string[], options?: Object }
   */
  app.post('/api/batch', asyncHandler(async (req, res) => {
    const { filePaths, options } = req.body;

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid field: filePaths (must be non-empty array)'
      });
    }

    try {
      const result = await finder.analyzeBatch(filePaths, options);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  /**
   * Search directory for brass stabs
   * POST /api/search
   * Body: { dirPath: string, options?: Object }
   */
  app.post('/api/search', asyncHandler(async (req, res) => {
    const { dirPath, options } = req.body;

    if (!dirPath) {
      return res.status(400).json({
        error: 'Missing required field: dirPath'
      });
    }

    try {
      const result = await finder.searchDirectory(dirPath, options);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ============================================================================
  // CACHE ENDPOINTS
  // ============================================================================

  /**
   * Get cache statistics
   * GET /api/cache
   */
  app.get('/api/cache', (req, res) => {
    const stats = finder.getStats();
    res.json({
      cacheSize: stats.cacheSize,
      cacheHits: stats.cacheHits,
      cacheEnabled: finder.config.cacheEnabled,
      cacheDir: finder.config.cacheDir,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Clear cache
   * DELETE /api/cache
   */
  app.delete('/api/cache', asyncHandler(async (req, res) => {
    try {
      const result = await finder.clearCache();
      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }));

  // ============================================================================
  // AUDIT ENDPOINTS
  // ============================================================================

  /**
   * Get audit log
   * GET /api/audit?limit=100
   */
  app.get('/api/audit', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const auditLog = finder.getAuditLog(limit);
    
    res.json({
      entries: auditLog,
      count: auditLog.length,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get audit summary
   * GET /api/audit/summary
   */
  app.get('/api/audit/summary', (req, res) => {
    const auditLog = finder.getAuditLog(1000);
    
    const summary = {
      totalEntries: auditLog.length,
      byLevel: {
        debug: auditLog.filter(e => e.level === 'debug').length,
        info: auditLog.filter(e => e.level === 'info').length,
        warn: auditLog.filter(e => e.level === 'warn').length,
        error: auditLog.filter(e => e.level === 'error').length
      },
      byMessage: {},
      recentErrors: auditLog.filter(e => e.level === 'error').slice(-10)
    };

    // Count by message
    for (const entry of auditLog) {
      summary.byMessage[entry.message] = (summary.byMessage[entry.message] || 0) + 1;
    }

    res.json({
      summary,
      timestamp: new Date().toISOString()
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * 404 handler
   */
  app.use((req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Global error handler
   */
  app.use((err, req, res, next) => {
    finder.audit('error', 'Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });

  return { app, finder };
}

/**
 * Start brass stab finder service
 * @param {Object} options - Configuration options
 */
async function startBrassStabService(options = {}) {
  const port = options.port || 3002;
  const { app, finder } = createBrassStabAPI(options);

  try {
    // Start finder service
    await finder.start();

    // Start Express server
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`[Brass Stab Finder] Service running on port ${port}`);
      finder.audit('info', 'Express server started', { port });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Brass Stab Finder] SIGTERM received, shutting down gracefully...');
      finder.audit('info', 'SIGTERM received');
      
      server.close(async () => {
        await finder.stop();
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('[Brass Stab Finder] Forced shutdown');
        process.exit(1);
      }, 30000);
    });

    process.on('SIGINT', async () => {
      console.log('[Brass Stab Finder] SIGINT received, shutting down gracefully...');
      finder.audit('info', 'SIGINT received');
      
      server.close(async () => {
        await finder.stop();
        process.exit(0);
      });
    });

    return { app, finder, server };
  } catch (error) {
    console.error('[Brass Stab Finder] Failed to start service:', error.message);
    process.exit(1);
  }
}

module.exports = {
  createBrassStabAPI,
  startBrassStabService,
  BrassStabFinder
};
