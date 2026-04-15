# API Reference

This document describes the currently supported application API endpoints.

## Base URL

- Local Docker: `http://localhost:3002`

## Health

### `GET /health`

Returns service liveness status.

Example response:

```json
{
  "status": "healthy",
  "timestamp": "2026-04-15T16:48:53.289Z",
  "service": "lastfm-desktop-web"
}
```

## Core Music Endpoints

### `GET /api/search?q=<query>`

Combined Last.fm search results for artists, tracks, and albums.

### `GET /api/recommendations/:artist`

Returns similar artist recommendations.

### `GET /api/freesound/sound/:id`

Returns Freesound metadata for a sound ID.

## Studio Endpoints

### `GET /api/studio/rig`

Returns complete studio rig configuration and calculated equipment counts.

### `GET /api/studio/chains`

Returns configured effects chains and routing diagram details.

### `GET /api/studio/midi`

Returns MIDI controllers and interfaces from studio configuration.

### `GET /api/studio/cables`

Returns Monster Cable inventory details from studio configuration.

### `GET /api/studio/video-capture`

Returns video capture profiles from studio configuration.

Example response shape:

```json
{
  "videoCapture": {
    "primaryCamera": {
      "manufacturer": "Canon",
      "model": "EOS 5D Mark IV",
      "stillPhoto": {
        "maxResolution": "6720x4480",
        "megapixels": 30.4
      },
      "video": {
        "dci4k": {
          "resolution": "4096x2160",
          "maxFps": 30
        }
      }
    }
  },
  "timestamp": "2026-04-15T16:41:41.282Z"
}
```

## Audio Processing Endpoints

### `POST /api/audio/process`

Accepts multipart audio upload and pedal/cab settings. Returns processed WAV output.

### `POST /api/audio/process-chunk`

Accepts chunked base64 PCM payload and returns processed chunk payload.
