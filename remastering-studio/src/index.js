require('dotenv').config()
const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const http = require('http')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Audio processing configuration
const audioConfig = {
  sampleRate: 44100,
  channels: 2,
  bitDepth: 16,
  // Default processing parameters
  processingParams: {
    normalize: {
      enabled: true,
      targetLevel: -1.0 // dBFS
    },
    compress: {
      enabled: true,
      threshold: -20, // dB
      ratio: 4, // 4:1
      attack: 5, // ms
      release: 100 // ms
    },
    reverb: {
      enabled: true,
      level: 0.2, // 0-1
      decay: 2.0, // seconds
      reverse: false
    },
    delay: {
      enabled: true,
      time: 250, // ms
      feedback: 0.5, // 0-1
      mix: 0.3 // 0-1
    },
    master: {
      enabled: true,
      limiterThreshold: -0.2, // dBFS
      makeUpGain: 1.5, // dB
      stereoEnhance: 1.1 // Stereo width (1.0 = normal)
    }
  }
}

// Create a temporary directory for audio processing
const tempDir = path.join(__dirname, '..', 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.static('public'))

// WebSocket for real-time communication with studio-rigs
wss.on('connection', (ws) => {
  console.log('New studio rig connected')

  // Send current processing parameters to the new client
  ws.send(JSON.stringify({
    type: 'processingParams',
    data: audioConfig.processingParams
  }))

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message)

      // Handle different message types
      switch (data.type) {
        case 'updateParams': {
          // Update processing parameters
          Object.assign(audioConfig.processingParams, data.params)
          // Broadcast updated parameters to all clients
          broadcast({
            type: 'processingParams',
            data: audioConfig.processingParams
          })
          break
        }

        case 'processAudio': {
          // Process audio data
          const processedAudio = await processAudio(data.audioData, data.params || {})
          ws.send(JSON.stringify({
            type: 'processedAudio',
            requestId: data.requestId,
            audioData: processedAudio
          }))
          break
        }

        default:
          console.log('Received message:', data)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }))
    }
  })

  ws.on('close', () => {
    console.log('Studio rig disconnected')
  })
})

// Broadcast message to all connected clients
function broadcast (message) {
  const messageString = typeof message === 'string' ? message : JSON.stringify(message)
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString)
    }
  })
}

// Process audio with FFmpeg based on current parameters
async function processAudio (audioData, params) {
  // Merge with default parameters
  const processingParams = { ...audioConfig.processingParams, ...params }

  // Create a unique filename for this processing job
  const inputFile = path.join(tempDir, `input_${Date.now()}.wav`)
  const outputFile = path.join(tempDir, `output_${Date.now()}.wav`)

  try {
    // Save the incoming audio data to a file
    fs.writeFileSync(inputFile, Buffer.from(audioData, 'base64'))

    // Build FFmpeg command based on processing parameters
    const ffmpegArgs = [
      '-i', inputFile,
      '-ar', audioConfig.sampleRate,
      '-ac', audioConfig.channels,
      '-sample_fmt', 's16',
      '-f', 'wav'
    ]

    // Add audio filters based on processing parameters
    const filters = []

    // Normalization
    if (processingParams.normalize.enabled) {
      filters.push(`loudnorm=I=${processingParams.normalize.targetLevel}`)
    }

    // Compression
    if (processingParams.compress.enabled) {
      filters.push(`acompressor=threshold=${processingParams.compress.threshold}dB:ratio=${processingParams.compress.ratio}:attack=${processingParams.compress.attack}:release=${processingParams.compress.release}`)
    }

    // Reverb
    if (processingParams.reverb.enabled) {
      filters.push(`aecho=1.0:1.0:${processingParams.reverb.decay * 1000}:${processingParams.reverb.level * 100}`)
    }

    // Delay
    if (processingParams.delay.enabled) {
      filters.push(`adelay=${processingParams.delay.time}|${processingParams.delay.time}`)
      filters.push('amix=inputs=2:duration=longest')
    }

    // Mastering (limiter + stereo enhancement)
    if (processingParams.master.enabled) {
      filters.push(`acompressor=threshold=${processingParams.master.limiterThreshold}dB:ratio=20:attack=1:release=200`)
      filters.push('stereotools=mode=ms>lr')
      filters.push('asplit[a][b];[a]pan=1c|c0=0.5*c0+0.5*c1[a1];[b]pan=1c|c0=0.5*c0-0.5*c1[b1];[a1][b1]join=inputs=2:channel_layout=stereo')
    }

    // Add filters to FFmpeg args if any
    if (filters.length > 0) {
      ffmpegArgs.push('-af', filters.join(','))
    }

    // Output file
    ffmpegArgs.push(outputFile)

    // Run FFmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs)

      ffmpeg.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`)
      })

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg process exited with code ${code}`))
        } else {
          resolve()
        }
      })
    })

    // Read the processed audio file
    const processedAudio = fs.readFileSync(outputFile)

    return processedAudio.toString('base64')
  } catch (error) {
    console.error('Error processing audio:', error)
    throw error
  } finally {
    // Clean up temporary files
    [inputFile, outputFile].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file)
        } catch (e) {
          console.error('Error cleaning up file:', e)
        }
      }
    })
  }
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    connectedRigs: wss.clients.size,
    service: 'remastering-studio',
    audioConfig
  })
})

// Get current processing parameters
app.get('/api/params', (req, res) => {
  res.json(audioConfig.processingParams)
})

// Update processing parameters
app.post('/api/params', (req, res) => {
  Object.assign(audioConfig.processingParams, req.body)

  // Broadcast updated parameters to all clients
  broadcast({
    type: 'processingParams',
    data: audioConfig.processingParams
  })

  res.json({ success: true })
})

// Start server
const PORT = process.env.PORT || 4001
server.listen(PORT, () => {
  console.log(`Remastering Studio Service running on port ${PORT}`)
  console.log('Audio processing features:')
  console.log('- Normalization')
  console.log('- Compression')
  console.log('- Reverb')
  console.log('- Delay')
  console.log('- Mastering (limiter + stereo enhancement)')
  console.log(`\nWebSocket server running on ws://localhost:${PORT}`)
})

module.exports = { app, server, wss, audioConfig }
