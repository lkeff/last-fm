#!/usr/bin/env node

/**
 * Last.fm Web Server
 * Simple HTTP server for Last.fm API functionality
 */

const http = require('http')
const url = require('url')
const LastFM = require('./index.js')

// Initialize Last.fm client
const lastfm = new LastFM({
  apiKey: process.env.LASTFM_API_KEY || '',
  userAgent: 'Last.fm Docker App/1.0'
})

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = new url.URL(req.url, 'http://localhost')
  const path = parsedUrl.pathname

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Health check endpoint
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }))
    return
  }

  // Root endpoint
  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      name: 'Last.fm Docker App',
      status: 'running',
      endpoints: {
        health: '/health',
        search: '/search?q=artist',
        info: '/artist/:name'
      }
    }))
    return
  }

  // Search endpoint
  if (path.startsWith('/search')) {
    const query = parsedUrl.query.q
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing query parameter q' }))
      return
    }

    lastfm.artistSearch({ q: query, limit: 10 }, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        query,
        results: data.results || [],
        total: data.total || 0
      }))
    })
    return
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Last.fm server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔍 Search: http://localhost:${PORT}/search?q=artist`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
