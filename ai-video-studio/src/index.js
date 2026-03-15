require('dotenv').config()
const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const http = require('http')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')
const tf = require('@tensorflow/tfjs-node')
const bodyPix = require('@tensorflow-models/body-pix')

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic)

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.static('public'))

// AI Video Processing State
let bodyPixModel

// Initialize AI models
async function loadModels () {
  console.log('Loading AI models...')
  try {
    bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    })
    console.log('AI models loaded successfully')
  } catch (error) {
    console.error('Error loading AI models:', error)
    process.exit(1)
  }
}

// WebSocket for real-time video processing
wss.on('connection', (ws) => {
  console.log('New video processing client connected')

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message)

      if (data.type === 'processVideo') {
        // Process video frames using AI
        const processedFrames = await processVideoFrames(data.frames, data.options)
        ws.send(JSON.stringify({
          type: 'processedFrames',
          frames: processedFrames,
          requestId: data.requestId
        }))
      }
    } catch (error) {
      console.error('Error processing video:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }))
    }
  })

  ws.on('close', () => {
    console.log('Video processing client disconnected')
  })
})

// Process video frames with AI
async function processVideoFrames (frames, options = {}) {
  const processedFrames = []

  for (const frame of frames) {
    // Convert base64 to tensor
    const imageTensor = tf.node.decodeImage(Buffer.from(frame, 'base64'))

    // Process with BodyPix
    const segmentation = await bodyPixModel.segmentPerson(imageTensor, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7
    })

    // Convert back to base64
    const processedTensor = await tf.node.encodeJpeg(
      tf.node.toPixels(segmentation.data, 3).data
    )

    processedFrames.push(processedTensor.toString('base64'))

    // Clean up tensors to prevent memory leaks
    imageTensor.dispose()
    segmentation.data.dispose()
  }

  return processedFrames
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'ai-video-studio',
    connectedClients: wss.clients.size,
    aiModels: {
      bodyPix: !!bodyPixModel
    }
  })
})

// Start server
const PORT = process.env.PORT || 4002
server.listen(PORT, async () => {
  console.log(`AI Video Processing Studio running on port ${PORT}`)
  await loadModels()
})

module.exports = { app, server, wss }
