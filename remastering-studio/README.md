# Remastering Studio

A real-time remastering studio service for Last.fm integration, designed to work with studio-live-rigs.

## Features

- WebSocket-based real-time communication
- REST API for status and control
- Integration with Last.fm API
- Scalable architecture for multiple studio rigs

## Prerequisites

- Docker and Docker Compose
- Node.js 18+

## Setup

1. Clone the repository
2. Navigate to the project root
3. Run `docker-compose up --build`

## Services

- **Remastering Studio**: Runs on port 4001
  - WebSocket endpoint: `ws://localhost:4001`
  - HTTP API: `http://localhost:4001/api/status`

- **Studio Rigs**: Simulated rigs that connect to the studio

## API Endpoints

- `GET /api/status` - Get the status of the remastering studio

## Development

```bash
# Install dependencies
cd remastering-studio
npm install

# Start development server
npm run dev
```

## Environment Variables

- `PORT` - Port to run the service on (default: 4001)
- `NODE_ENV` - Environment (development/production)

## License

MIT
