# Direct Deployment - Skip Docker, Run Services Directly

**Light Control Rig & Brass Stab Finder - Direct Node.js Execution**
**Status: ✅ Alternative Approach - Fastest Path to Working Services**

---

## Problem

Docker builds are failing due to network issues downloading npm dependencies. 

## Solution

Run services directly using Node.js instead of Docker. This is faster and avoids Docker build issues.

---

## Step 1: Install Dependencies

```powershell
# Navigate to repository
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Install npm dependencies
npm install
```

**Expected Output:**
```
added XXX packages in XXs
```

---

## Step 2: Start Light Control Rig Service

```powershell
# In a new PowerShell window, run:
cd C:\Users\Administrator\Documents\GitHub\last-fm
node -e "const service = require('./services/light-control-service'); service.startLightControlService({ port: 3001 });"
```

**Expected Output:**
```
[INFO] Light Control Service starting...
[INFO] ✓ Light Control Service listening on port 3001
[INFO] ✓ Health check endpoint: http://localhost:3001/health
```

---

## Step 3: Start Brass Stab Finder Service

```powershell
# In another new PowerShell window, run:
cd C:\Users\Administrator\Documents\GitHub\last-fm
node -e "const { startBrassStabService } = require('./services/brass-stab-api'); startBrassStabService({ port: 3002 });"
```

**Expected Output:**
```
[INFO] Brass Stab Finder Service starting...
[INFO] ✓ Brass Stab Finder Service listening on port 3002
[INFO] ✓ Health check endpoint: http://localhost:3002/health
```

---

## Step 4: Verify Services

```powershell
# In main PowerShell window, test endpoints:

# Light Control health
curl -UseBasicParsing http://localhost:3001/health

# Brass Stab health
curl -UseBasicParsing http://localhost:3002/health
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
Content           : {"status":"healthy",...}
```

---

## Step 5: Push to Git

```powershell
# Use WSL git to push
wsl git push origin main
```

**Or use full path to git.exe:**
```powershell
# Find git installation
where git.exe

# Use full path
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

---

## Complete Quick Start

Execute all at once:

```powershell
# Terminal 1: Install dependencies
cd C:\Users\Administrator\Documents\GitHub\last-fm
npm install

# Terminal 2: Start Light Control
cd C:\Users\Administrator\Documents\GitHub\last-fm
node -e "const service = require('./services/light-control-service'); service.startLightControlService({ port: 3001 });"

# Terminal 3: Start Brass Stab
cd C:\Users\Administrator\Documents\GitHub\last-fm
node -e "const { startBrassStabService } = require('./services/brass-stab-api'); startBrassStabService({ port: 3002 });"

# Terminal 1 (after services start): Verify and push
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health
wsl git push origin main
```

---

## Verification

### Check Services Running
```powershell
# List Node processes
Get-Process node

# Expected: Two node.exe processes running
```

### Test Endpoints
```powershell
# Light Control endpoints
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3001/info
curl -UseBasicParsing http://localhost:3001/stats

# Brass Stab endpoints
curl -UseBasicParsing http://localhost:3002/health
curl -UseBasicParsing http://localhost:3002/info
curl -UseBasicParsing http://localhost:3002/stats
```

### Check Git Status
```powershell
wsl git log --oneline -1
wsl git status
```

---

## Advantages of Direct Deployment

✅ No Docker build issues
✅ Faster startup (no image building)
✅ Easier debugging (direct Node.js output)
✅ Works on any system with Node.js
✅ No network dependency for Docker registry
✅ Services start immediately

---

## Timeline

| Step | Duration |
|------|----------|
| Install dependencies | 2-3 min |
| Start Light Control | 1 min |
| Start Brass Stab | 1 min |
| Verify services | 1 min |
| Push to git | 1 min |
| **TOTAL** | **6-7 min** |

---

## Next Steps

1. **Install dependencies:** `npm install`
2. **Start services:** Run in separate PowerShell windows
3. **Verify:** Test health endpoints
4. **Push:** `wsl git push origin main`

---

## Troubleshooting

### npm install fails
```powershell
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Port already in use
```powershell
# Find process using port 3001
netstat -ano | findstr 3001

# Kill process
taskkill /PID <PID> /F

# Or use different port
node -e "const service = require('./services/light-control-service'); service.startLightControlService({ port: 3003 });"
```

### Git not found
```powershell
# Use WSL git
wsl git push origin main

# Or find git.exe
where git.exe
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

---

## Status

**Current:** Git commit created ✅
**Next:** Install dependencies and start services
**Timeline:** 6-7 minutes to full deployment

---

**Ready to deploy? Start with `npm install`!**

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Direct Deployment Ready
