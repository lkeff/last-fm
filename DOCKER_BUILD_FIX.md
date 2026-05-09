# Docker Build Fix - Working Directory Issue

**Light Control Rig & Brass Stab Finder - Docker Build Path Resolution**
**Status: ✅ Fixable - Follow Steps Below**

---

## Problem Identified

The Docker build is failing because:
1. ✅ Git commit succeeded (4cf9e87)
2. ❌ Docker build failed - can't find Dockerfile

**Root Cause:** Working directory context is not set correctly when running docker build from WSL

---

## Solution

### Option 1: Use Full Path in Docker Build (Recommended)

```bash
# Navigate to the repository first
cd /mnt/c/Users/Administrator/Documents/GitHub/last-fm

# Then run docker build with full context
wsl docker build -f /mnt/c/Users/Administrator/Documents/GitHub/last-fm/Dockerfile.light-control -t light-control:1.0.0 /mnt/c/Users/Administrator/Documents/GitHub/last-fm

# Or use relative path from within WSL
wsl bash -c "cd /mnt/c/Users/Administrator/Documents/GitHub/last-fm && docker build -f Dockerfile.light-control -t light-control:1.0.0 ."
```

### Option 2: Use PowerShell Script (Simpler)

```powershell
# Use the PowerShell script instead - it handles paths correctly
cd C:\Users\Administrator\Documents\GitHub\last-fm
.\deploy-and-commit.ps1
```

### Option 3: Manual Docker Build with Correct Path

```bash
# In PowerShell, navigate to repo and build
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Build Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# Deploy Light Control
docker-compose -f docker-compose.light-control.yml up -d

# Deploy Brass Stab
docker-compose -f docker-compose.brass-stab.yml up -d
```

---

## Immediate Fix - Complete Deployment

### Step 1: Navigate to Repository
```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
```

### Step 2: Build Light Control Rig
```powershell
docker build -f Dockerfile.light-control -t light-control:1.0.0 .
```

**Expected Output:**
```
[+] Building 30.0s (15/15) FINISHED
 => [internal] load build definition from Dockerfile.light-control
 => => transferring dockerfile: 74B
 ...
Successfully built abc123def456
Successfully tagged light-control:1.0.0
```

### Step 3: Deploy Light Control Rig
```powershell
docker-compose -f docker-compose.light-control.yml up -d
```

**Expected Output:**
```
Creating network "light-control-network" with driver "bridge"
Creating light-control-service ... done
Creating light-control-nginx ... done
Creating light-control-prometheus ... done
```

### Step 4: Wait for Startup
```powershell
Start-Sleep -Seconds 10
```

### Step 5: Verify Light Control Health
```powershell
curl http://localhost:3001/health
```

### Step 6: Build Brass Stab Finder
```powershell
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

### Step 7: Deploy Brass Stab Finder
```powershell
docker-compose -f docker-compose.brass-stab.yml up -d
```

### Step 8: Wait for Startup
```powershell
Start-Sleep -Seconds 10
```

### Step 9: Verify Brass Stab Health
```powershell
curl http://localhost:3002/health
```

### Step 10: Verify All Services
```powershell
docker ps | findstr -E "light-control|brass-stab"
```

### Step 11: Push to Git
```powershell
git push origin main
```

---

## Why This Happened

**WSL Path Issue:**
- WSL runs in a different filesystem context
- When running `docker build` from WSL without proper path, Docker can't find files
- PowerShell/Windows paths work correctly with Docker Desktop

**Solution:**
- Use PowerShell to run docker commands (Windows native)
- Or use full WSL paths: `/mnt/c/Users/...`
- Or navigate to directory first in WSL

---

## Recommended Approach Going Forward

### Use PowerShell Script (Easiest)
```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
.\deploy-and-commit.ps1
```

### Or Manual PowerShell Commands (Most Control)
```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Build and deploy Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .
docker-compose -f docker-compose.light-control.yml up -d

# Build and deploy Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
docker-compose -f docker-compose.brass-stab.yml up -d

# Verify
docker ps
curl http://localhost:3001/health
curl http://localhost:3002/health

# Push to git
git push origin main
```

---

## Quick Recovery Commands

**Execute in PowerShell (Windows native):**

```powershell
# Navigate to repo
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Build Light Control
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Deploy Light Control
docker-compose -f docker-compose.light-control.yml up -d

# Wait
Start-Sleep -Seconds 10

# Build Brass Stab
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# Deploy Brass Stab
docker-compose -f docker-compose.brass-stab.yml up -d

# Wait
Start-Sleep -Seconds 10

# Verify
docker ps
curl http://localhost:3001/health
curl http://localhost:3002/health

# Push to git
git push origin main
```

---

## Verification

### Check Services Running
```powershell
docker ps | findstr -E "light-control|brass-stab"
```

**Expected:**
```
light-control-service      Up
brass-stab-finder-service  Up
```

### Check Health
```powershell
curl http://localhost:3001/health
curl http://localhost:3002/health
```

**Expected:**
```json
{"status":"healthy","running":true,...}
```

### Check Git
```powershell
git log --oneline -1
git status
```

**Expected:**
```
4cf9e87 feat: Deploy Light Control Rig and Brass Stab Finder to production
working tree clean
```

---

## Summary

**Current Status:** Git commit successful ✅, Docker build needs path fix ⚠️

**Solution:** Use PowerShell native commands instead of WSL for Docker

**Next Steps:**
1. Open PowerShell (Windows native)
2. Navigate to repository
3. Run docker build commands
4. Deploy services
5. Verify health
6. Push to git

**Estimated Time:** 20-30 minutes

---

**Ready to complete deployment? Follow the Quick Recovery Commands above!**

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Fix Ready
