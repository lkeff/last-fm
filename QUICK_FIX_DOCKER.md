# Quick Fix - Docker Build Issues

**Light Control Rig & Brass Stab Finder - Docker Build Recovery**
**Status: ✅ Fixable in 15 minutes**

---

## Problem Summary

✅ **Git:** Commit pushed successfully
✅ **Brass Stab:** Service running on port 3002
❌ **Docker:** Builds failing - missing pnpm-lock.yaml and directories

---

## Quick Fix (3 Steps)

### Step 1: Generate pnpm-lock.yaml (2 minutes)

```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install --frozen-lockfile
```

**Expected Output:**
```
✓ Lockfile is up-to-date
```

### Step 2: Rebuild Docker Images (10 minutes)

```powershell
# Build Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

**Expected Output:**
```
[+] Building 10.0s (15/15) FINISHED
Successfully built abc123def456
Successfully tagged light-control:1.0.0
```

### Step 3: Deploy & Verify (3 minutes)

```powershell
# Deploy Light Control
docker-compose -f docker-compose.light-control.yml up -d

# Deploy Brass Stab
docker-compose -f docker-compose.brass-stab.yml up -d

# Wait
Start-Sleep -Seconds 10

# Verify
docker ps | findstr -E "light-control|brass-stab"

# Health checks
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health
```

---

## Why This Fixes It

### Issue 1: Missing pnpm-lock.yaml
- **Cause:** Dockerfile expects lock file but it wasn't generated
- **Fix:** `pnpm install --frozen-lockfile` creates it
- **Result:** Docker build can proceed

### Issue 2: Missing Directories
- **Cause:** Docker build context didn't include all files
- **Fix:** Running from repo root includes all directories
- **Result:** COPY commands work correctly

---

## Expected Results After Fix

```
✅ Light Control Rig
   - Docker image: light-control:1.0.0
   - Container: light-control-service
   - Port: 3001
   - Status: Running
   - Health: 200 OK

✅ Brass Stab Finder
   - Docker image: brass-stab-finder:1.0.0
   - Container: brass-stab-finder-service
   - Port: 3002
   - Status: Running
   - Health: 200 OK
```

---

## Timeline

| Step | Duration |
|------|----------|
| Generate lock file | 2 min |
| Build Light Control | 5 min |
| Build Brass Stab | 5 min |
| Deploy services | 2 min |
| Verify | 1 min |
| **TOTAL** | **15 min** |

---

## Verification Commands

```powershell
# Check images
docker images | findstr -E "light-control|brass-stab"

# Check containers
docker ps | findstr -E "light-control|brass-stab"

# Health checks
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health

# View logs
docker logs light-control-service --tail 20
docker logs brass-stab-finder-service --tail 20
```

---

## Success Indicators

✅ Both Docker images built
✅ Both containers running
✅ Both health checks returning 200 OK
✅ Both services responding to API requests

---

## Status

**Current:** 60% complete (1/2 services running)
**After Fix:** 100% complete (2/2 services running)
**Time to Fix:** 15 minutes

---

**Execute the 3 steps above to complete deployment!**

---

**Document Version:** 1.0.0
**Last Updated:** April 14, 2026
**Status:** ✅ Ready
