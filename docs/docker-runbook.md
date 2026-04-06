# Docker Runbook (last-fm)

This runbook captures the stable local Docker flow for `last-fm`, including recovery steps when Compose image resolution fails.

## Canonical path
- Use: `/Users/kthlke/Documents/GitHub/last-fm`

## Normal startup
```bash
docker --context desktop-linux compose up -d --build lastfm
docker --context desktop-linux compose ps
```

Expected: `lastfm-app` shows `Up` and `healthy`, with `0.0.0.0:3002->3000/tcp`.

## Quick smoke test
```bash
./scripts/smoke-docker.sh
```

This validates:
- `GET /health`
- `GET /api/studio/rig`
- `POST /api/audio/process`
- `POST /api/audio/process-chunk`

## Cold-start validation
```bash
docker --context desktop-linux compose down --remove-orphans
docker --context desktop-linux compose up -d --no-build lastfm
docker --context desktop-linux compose ps
```

## Recovery sequence (Compose image mismatch)
Use this only if Compose fails with `No such image` while images exist.

1) Stop containers and stack:
```bash
docker --context desktop-linux rm -f lastfm-manual-app lastfm-app >/dev/null 2>&1 || true
docker --context desktop-linux compose down --remove-orphans
```

2) Prune Docker caches:
```bash
docker --context desktop-linux system prune -af
docker --context desktop-linux builder prune -af
```

3) Restart Docker Desktop:
```bash
osascript -e 'quit app "Docker"'
sleep 6
open -a Docker
```

4) Wait for daemon readiness:
```bash
for i in {1..90}; do
  docker --context desktop-linux info >/dev/null 2>&1 && break
  sleep 2
done
```

5) Rebuild image directly:
```bash
DOCKER_BUILDKIT=0 docker --context desktop-linux build -t last-fm-lastfm:latest .
```

6) Start with Compose again:
```bash
docker --context desktop-linux compose up -d --no-build lastfm
docker --context desktop-linux compose ps
```

7) Verify endpoints:
```bash
./scripts/smoke-docker.sh
```

## Emergency fallback (if Compose still broken)
```bash
docker --context desktop-linux run -d --name lastfm-manual-app \
  --env-file .env \
  -p 3002:3000 \
  -v /Users/kthlke/Documents/GitHub/last-fm/logs:/app/logs \
  -v /Users/kthlke/Documents/GitHub/last-fm/uploads:/app/uploads \
  -v /Users/kthlke/Documents/GitHub/last-fm/config:/app/config \
  last-fm-lastfm:latest
```

Then run:
```bash
./scripts/smoke-docker.sh
```
