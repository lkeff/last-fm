# AI Video Processing Studio

A real-time AI-powered video processing service for Last.fm integration, designed to work with studio-live-rigs and the remastering studio.

## Features

- Real-time video processing using TensorFlow.js and BodyPix
- WebSocket-based communication for low-latency processing
- Support for multiple video effects and AI-based enhancements
- Integration with Last.fm audio data for synchronized audio-visual experiences

## Prerequisites

- Docker and Docker Compose
- NVIDIA GPU (recommended for better performance)
- Node.js 18+
- Python 3.7+ (for some video processing tasks)

## Setup

1. Ensure you have NVIDIA Container Toolkit installed on your host machine
2. Clone the repository
3. Navigate to the project root
4. Run `docker-compose up --build`

## Services

- **AI Video Studio**: Runs on port 4002
  - WebSocket endpoint: `ws://localhost:4002`
  - HTTP API: `http://localhost:4002/api/status`

- **Video Processor**: Simulated video processing client

## API Endpoints

- `GET /api/status` - Get the status of the AI Video Studio

## Available AI Models

- BodyPix (for person segmentation)
- Background blur/removal
- Style transfer (coming soon)
- Object detection (coming soon)

## Environment Variables

- `PORT` - Port to run the service on (default: 4002)
- `NODE_ENV` - Environment (development/production)
- `GPU_ENABLED` - Set to 'true' to enable GPU acceleration

## License

MIT
