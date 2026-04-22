#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3002}"

echo "[1/7] Checking /health"
health_code=$(curl -sS -o /tmp/lastfm-health.json -w '%{http_code}' "$BASE_URL/health")
[[ "$health_code" == "200" ]] || { echo "health failed: $health_code"; exit 1; }

echo "[2/7] Checking /api/studio/rig"
rig_code=$(curl -sS -o /tmp/lastfm-rig.json -w '%{http_code}' "$BASE_URL/api/studio/rig")
[[ "$rig_code" == "200" ]] || { echo "studio rig failed: $rig_code"; exit 1; }

echo "[3/7] Checking /api/studio/video-capture"
video_capture_code=$(curl -sS -o /tmp/lastfm-video-capture.json -w '%{http_code}' "$BASE_URL/api/studio/video-capture")
[[ "$video_capture_code" == "200" ]] || { echo "video capture failed: $video_capture_code"; exit 1; }
python3 - <<'PY'
import json
with open('/tmp/lastfm-video-capture.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)
model = payload.get('videoCapture', {}).get('primaryCamera', {}).get('model')
if model != 'EOS 5D Mark IV':
    raise SystemExit(f'unexpected camera model: {model!r}')
PY

echo "[4/7] Checking /api/lastfm/stream (zip-aware endpoint contract)"
stream_no_url=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/lastfm/stream")
[[ "$stream_no_url" == "400" ]] || { echo "stream missing-url expected 400, got: $stream_no_url"; exit 1; }
stream_bad_host=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/api/lastfm/stream?url=https%3A%2F%2Fevil.com%2Faudio.mp3")
[[ "$stream_bad_host" == "403" ]] || { echo "stream bad-host expected 403, got: $stream_bad_host"; exit 1; }

echo "[5/7] Generating WAV fixture"
python3 - <<'PY'
import math, wave, struct
sr=44100
secs=0.5
freq=440.0
n=int(sr*secs)
with wave.open('/tmp/lastfm-smoke.wav','wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(sr)
    for i in range(n):
        s=int(0.2*32767*math.sin(2*math.pi*freq*i/sr))
        w.writeframesraw(struct.pack('<hh', s, s))
PY

echo "[6/7] Checking /api/audio/process"
audio_code=$(curl -sS -o /tmp/lastfm-audio-out.wav -w '%{http_code}' -X POST "$BASE_URL/api/audio/process" \
  -F 'audio=@/tmp/lastfm-smoke.wav;type=audio/wav' \
  -F 'pedals=[]' \
  -F 'cabSim={"enabled":false}')
[[ "$audio_code" == "200" ]] || { echo "audio process failed: $audio_code"; exit 1; }

if [[ ! -s /tmp/lastfm-audio-out.wav ]]; then
  echo "audio output file is empty"
  exit 1
fi

echo "[7/7] Checking /api/audio/process-chunk"
python3 - <<'PY' >/tmp/lastfm-chunk-input.json
import base64, struct, json
pcm=b''.join(struct.pack('<hh',0,0) for _ in range(256))
payload={
  'sessionId': 'smoke-script-session',
  'channels': 2,
  'sampleRate': 44100,
  'pedals': [],
  'cabSim': {'enabled': False},
  'pcm16leBase64': base64.b64encode(pcm).decode('ascii')
}
print(json.dumps(payload))
PY
chunk_code=$(curl -sS -o /tmp/lastfm-chunk.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  --data @/tmp/lastfm-chunk-input.json \
  "$BASE_URL/api/audio/process-chunk")
[[ "$chunk_code" == "200" ]] || { echo "audio chunk failed: $chunk_code"; exit 1; }

echo "Smoke test passed"
echo "- /health: $health_code"
echo "- /api/studio/rig: $rig_code"
echo "- /api/studio/video-capture: $video_capture_code"
echo "- /api/lastfm/stream (no-url): $stream_no_url"
echo "- /api/lastfm/stream (bad-host): $stream_bad_host"
echo "- /api/audio/process: $audio_code"
echo "- /api/audio/process-chunk: $chunk_code"
echo "- output bytes: $(wc -c </tmp/lastfm-audio-out.wav)"
