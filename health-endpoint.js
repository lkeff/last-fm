// Health check endpoint for Docker
const express = require('express')
const app = express()

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'lastfm-desktop'
  })
})

app.listen(3000, () => {
  console.log('Health check server running on port 3000')
})
