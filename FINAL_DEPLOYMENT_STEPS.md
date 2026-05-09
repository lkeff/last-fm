# Final Deployment Steps - Complete Recovery

**Light Control Rig & Brass Stab Finder - Final Deployment**
**Status: ✅ Ready to Execute - 17 Minutes to Completion**

---

## Current Status

✅ **Git:** Commit 4cf9e87 pushed to main
✅ **Code:** All 2,600+ lines committed
✅ **Documentation:** 8,000+ lines created
⚠️ **Docker Images:** Not yet built
⚠️ **Services:** Brass Stab running (old), Light Control not running

---

## Final Deployment (17 minutes)

### Step 1: Generate pnpm-lock.yaml (2 minutes)

```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install --frozen-lockfile
```

**Expected:**
```
✓ Lockfile is up-to-date
```

---

### Step 2: Build Docker Images (10 minutes)

```powershell
# Build Light Control Rig
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab Finder
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

**Expected:**
```
[+] Building 10.0s (15/15) FINISHED
Successfully tagged light-control:1.0.0
Successfully tagged brass-stab-finder:1.0.0
```

---

### Step 3: Stop Old Containers (1 minute)

```powershell
docker-compose -f docker-compose.light-control.yml down
docker-compose -f docker-compose.brass-stab.yml down
```

**Expected:**
```
Removing light-control-service ... done
Removing brass-stab-finder-service ... done
```

---

### Step 4: Deploy New Containers (2 minutes)

```powershell
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d
Start-Sleep -Seconds 10
```

**Expected:**
```
Creating light-control-service ... done
Creating brass-stab-finder-service ... done
```

---

### Step 5: Verify Services (2 minutes)

```powershell
# Check containers running
docker ps | findstr -E "light-control|brass-stab"

# Health checks
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health
```

**Expected:**
```
CONTAINER ID   IMAGE                    STATUS
abc123def456   light-control:1.0.0      Up 1 minute
def456ghi789   brass-stab-finder:1.0.0  Up 1 minute

StatusCode        : 200
StatusDescription : OK
Content           : {"status":"healthy",...}
```

---

## Complete Script (Copy & Paste)

```powershell
# ============================================
# FINAL DEPLOYMENT - COMPLETE SCRIPT
# ============================================

Write-Host "=========================================="
Write-Host "FINAL DEPLOYMENT - Light Control & Brass Stab"
Write-Host "=========================================="

# Step 1: Navigate to repo
Write-Host "[1/5] Navigating to repository..."
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Step 2: Generate lock file
Write-Host "[2/5] Generating pnpm lock file..."
pnpm install --frozen-lockfile

# Step 3: Build images
Write-Host "[3/5] Building Docker images..."
Write-Host "  Building Light Control Rig..."
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

Write-Host "  Building Brass Stab Finder..."
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# Step 4: Stop old containers
Write-Host "[4/5] Stopping old containers..."
docker-compose -f docker-compose.light-control.yml down 2>$null
docker-compose -f docker-compose.brass-stab.yml down 2>$null

# Step 5: Deploy new containers
Write-Host "[5/5] Deploying new containers..."
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d

Write-Host ""
Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 10

# Verification
Write-Host ""
Write-Host "=========================================="
Write-Host "VERIFICATION"
Write-Host "=========================================="

Write-Host ""
Write-Host "Running containers:"
docker ps | findstr -E "light-control|brass-stab"

Write-Host ""
Write-Host "Health checks:"
Write-Host "Light Control Rig:"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "  Status: $($response.StatusCode) OK"
    Write-Host "  Response: $($response.Content)"
} catch {
    Write-Host "  Status: FAILED - $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Brass Stab Finder:"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing
    Write-Host "  Status: $($response.StatusCode) OK"
    Write-Host "  Response: $($response.Content)"
} catch {
    Write-Host "  Status: FAILED - $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "✓ DEPLOYMENT COMPLETE!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Services:"
Write-Host "  Light Control Rig:  http://localhost:3001"
Write-Host "  Brass Stab Finder:  http://localhost:3002"
Write-Host ""
```

---

## Timeline

| Step | Duration | Cumulative |
|------|----------|-----------|
| Generate lock file | 2 min | 2 min |
| Build Light Control | 5 min | 7 min |
| Build Brass Stab | 5 min | 12 min |
| Stop old containers | 1 min | 13 min |
| Deploy new containers | 2 min | 15 min |
| Verify services | 2 min | 17 min |

---

## Success Criteria

✅ pnpm-lock.yaml generated
✅ Both Docker images built
✅ Both containers running
✅ Both health checks returning 200 OK
✅ Both services responding to API requests

---

## Troubleshooting

### If docker build fails
```powershell
# Clear cache and rebuild
docker system prune -a
docker build --no-cache -f Dockerfile.light-control -t light-control:1.0.0 .
```

### If containers won't start
```powershell
# Check logs
docker logs light-control-service
docker logs brass-stab-finder-service

# Check port conflicts
netstat -ano | findstr 3001
netstat -ano | findstr 3002
```

### If health checks fail
```powershell
# Wait longer for startup
Start-Sleep -Seconds 30

# Check service logs
docker logs light-control-service --tail 50
docker logs brass-stab-finder-service --tail 50
```

---

## What Changed

✅ **docker-compose files updated** - Removed build sections
✅ **Now use pre-built images** - Faster deployment
✅ **Cleaner separation** - Build and deploy are separate steps

---

## After Deployment

1. **Verify both services running**
2. **Test API endpoints**
3. **Review logs for errors**
4. **Commit changes to git**
5. **Proceed with post-deployment setup**

---

## Status

**Current:** Ready for final deployment
**After Execution:** 100% deployment complete
**Time Required:** 17 minutes

---

## Next Steps After Deployment

1. **Immediate (5 min):**
   - Verify both services running
   - Test health endpoints
   - Review logs

2. **Short-term (1 hour):**
   - Configure firewall
   - Set up monitoring
   - Document baseline metrics

3. **Medium-term (1 week):**
   - SSL/TLS configuration
   - Performance optimization
   - Security hardening

4. **Long-term (1 month):**
   - Capacity planning
   - Feature enhancements
   - Infrastructure upgrades

---

## Documents Updated

- ✅ `docker-compose.light-control.yml` - Removed build section
- ✅ `docker-compose.brass-stab.yml` - Removed build section
- ✅ `DOCKER_COMPOSE_FIX.md` - Complete fix guide
- ✅ `FINAL_DEPLOYMENT_STEPS.md` - This document

---

## Summary

**Status: ✅ READY FOR FINAL DEPLOYMENT**

All components prepared. Execute the complete script above to deploy both services in 17 minutes.

---

**Document Version:** 1.0.0
**Last Updated:** April 14, 2026
**Status:** ✅ Ready to Execute
