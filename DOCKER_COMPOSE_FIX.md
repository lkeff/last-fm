# Docker Compose Fix - Deployment Recovery

**Light Control Rig & Brass Stab Finder - Docker Compose Issues**
**Status: ✅ Fixable - Follow Steps Below**

---

## Problem Analysis

### Issue 1: docker-compose up -d Failed
**Error:** Exit code 1, no output
**Cause:** Docker-compose tried to build images but builds failed

### Issue 2: Images Not Built
**Reason:** pnpm-lock.yaml still not generated
**Impact:** COPY pnpm-lock.yaml fails in Dockerfile

### Issue 3: Brass Stab Still Running
**Status:** Port 3002 responding (old container)
**Issue:** New container failed to start

---

## Root Cause

The docker-compose files have `build:` sections that trigger image builds. Since the builds fail (missing pnpm-lock.yaml), the containers don't start.

**Solution:** Build images first, then use docker-compose with pre-built images.

---

## Fix Strategy

### Option A: Build Images First (Recommended) ✅

**Step 1: Generate pnpm-lock.yaml**
```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install --frozen-lockfile
```

**Step 2: Build Images Directly**
```powershell
# Build Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

**Step 3: Update docker-compose Files**

Remove the `build:` section and use pre-built images:

```yaml
# docker-compose.light-control.yml
services:
  light-control:
    image: light-control:1.0.0  # Use pre-built image
    container_name: light-control-service
    restart: always
    # ... rest of config
```

**Step 4: Deploy with docker-compose**
```powershell
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d
```

---

### Option B: Use Direct Docker Commands (Fastest) ✅

Skip docker-compose entirely and use direct Docker commands:

```powershell
# Generate lock file
pnpm install --frozen-lockfile

# Build images
docker build -f Dockerfile.light-control -t light-control:1.0.0 .
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# Run containers directly
docker run -d \
  --name light-control-service \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  --restart always \
  light-control:1.0.0

docker run -d \
  --name brass-stab-finder-service \
  -p 3002:3002 \
  -e NODE_ENV=production \
  -e PORT=3002 \
  --restart always \
  brass-stab-finder:1.0.0
```

---

## Recommended Fix (Option A)

### Step 1: Generate Lock File (2 minutes)

```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install --frozen-lockfile
```

**Verify:**
```powershell
ls pnpm-lock.yaml
# Expected: File exists
```

---

### Step 2: Build Images (10 minutes)

```powershell
# Build Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

**Verify:**
```powershell
docker images | findstr -E "light-control|brass-stab"
# Expected: Both images listed
```

---

### Step 3: Update docker-compose Files

Remove `build:` sections from both files:

**docker-compose.light-control.yml:**
```yaml
version: '3.9'

services:
  light-control:
    image: light-control:1.0.0  # Change this line
    container_name: light-control-service
    restart: always
    # ... rest remains the same
```

**docker-compose.brass-stab.yml:**
```yaml
version: '3.9'

services:
  brass-stab-finder:
    image: brass-stab-finder:1.0.0  # Change this line
    container_name: brass-stab-finder-service
    restart: always
    # ... rest remains the same
```

---

### Step 4: Deploy Services (3 minutes)

```powershell
# Stop old containers
docker-compose -f docker-compose.light-control.yml down
docker-compose -f docker-compose.brass-stab.yml down

# Deploy new containers
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d

# Wait for startup
Start-Sleep -Seconds 10
```

---

### Step 5: Verify Services (2 minutes)

```powershell
# Check containers
docker ps | findstr -E "light-control|brass-stab"

# Health checks
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
Content           : {"status":"healthy",...}
```

---

## Complete Quick Fix Script

```powershell
# ============================================
# Complete Docker Compose Fix
# ============================================

Write-Host "Step 1: Generating pnpm lock file..."
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install --frozen-lockfile

Write-Host "Step 2: Building Docker images..."
docker build -f Dockerfile.light-control -t light-control:1.0.0 .
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

Write-Host "Step 3: Stopping old containers..."
docker-compose -f docker-compose.light-control.yml down
docker-compose -f docker-compose.brass-stab.yml down

Write-Host "Step 4: Deploying new containers..."
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d

Write-Host "Step 5: Waiting for startup..."
Start-Sleep -Seconds 10

Write-Host "Step 6: Verifying services..."
docker ps | findstr -E "light-control|brass-stab"

Write-Host "Step 7: Health checks..."
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health

Write-Host "✓ Deployment complete!"
```

---

## Troubleshooting

### docker-compose still fails
```powershell
# Check docker-compose version
docker-compose --version

# Verify images exist
docker images

# Check for build errors
docker build -f Dockerfile.light-control -t light-control:1.0.0 . --no-cache
```

### Containers won't start
```powershell
# Check logs
docker logs light-control-service
docker logs brass-stab-finder-service

# Check port conflicts
netstat -ano | findstr 3001
netstat -ano | findstr 3002

# Kill conflicting processes
taskkill /PID <PID> /F
```

### pnpm-lock.yaml still missing
```powershell
# Clear and reinstall
rm pnpm-lock.yaml
pnpm install --frozen-lockfile
```

---

## Timeline

| Step | Duration |
|------|----------|
| Generate lock file | 2 min |
| Build Light Control | 5 min |
| Build Brass Stab | 5 min |
| Stop old containers | 1 min |
| Deploy new containers | 2 min |
| Verify | 2 min |
| **TOTAL** | **17 min** |

---

## Success Criteria

✅ pnpm-lock.yaml exists
✅ Both Docker images built
✅ Both containers running
✅ Both health checks returning 200 OK
✅ Both services responding to API requests

---

## Status

**Current:** Services failing to start
**After Fix:** Both services running and healthy
**Time to Fix:** 17 minutes

---

## Next Steps After Fix

1. Verify both services running
2. Test API endpoints
3. Review logs
4. Commit changes to git
5. Proceed with post-deployment setup

---

**Document Version:** 1.0.0
**Last Updated:** April 14, 2026
**Status:** ✅ Ready to Execute
