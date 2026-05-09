# WSL Execution Guide - Production Deployment

**Light Control Rig & Brass Stab Finder - WSL/Linux Execution**
**Status: ✅ Ready to Execute**

---

## Quick Start

### Step 1: Open PowerShell
```powershell
# Open Windows PowerShell as Administrator
# Press Win+X, then select "Windows PowerShell (Admin)"
```

### Step 2: Execute Deployment Script via WSL
```powershell
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

### Step 3: Monitor Execution
The script will display:
- ✅ Pre-deployment checks
- ✅ Git staging
- ✅ Git commit creation
- ✅ Light Control Rig deployment
- ✅ Brass Stab Finder deployment
- ✅ Verification results

### Step 4: Review Results
```powershell
# View audit log
cat deployment-commit-audit-*.log

# Verify services
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## Prerequisites Check

### Verify WSL Installation
```powershell
# Check if WSL is installed
wsl --list --verbose

# Expected output:
# NAME            STATE           VERSION
# Ubuntu          Running         2
```

### If WSL Not Installed

#### Option A: Install WSL via PowerShell
```powershell
# Open PowerShell as Administrator
wsl --install

# This will install WSL 2 with Ubuntu
# Restart your computer when prompted
```

#### Option B: Install WSL via Windows Store
1. Open Microsoft Store
2. Search for "Windows Subsystem for Linux"
3. Click "Install"
4. Restart computer

#### Option C: Manual WSL Installation
See: https://docs.microsoft.com/en-us/windows/wsl/install-manual

### Verify Docker in WSL
```powershell
# Check if Docker is accessible from WSL
wsl docker --version

# Expected: Docker version 20.10+
```

### Verify Git in WSL
```powershell
# Check if Git is accessible from WSL
wsl git --version

# Expected: git version 2.0+
```

---

## Full Execution Steps

### Step 1: Open PowerShell as Administrator
```powershell
# Press Win+X
# Select "Windows PowerShell (Admin)"
# Or search for "PowerShell" and run as Administrator
```

### Step 2: Navigate to Repository (Optional)
```powershell
# This is optional - WSL will use the correct path
cd C:\Users\Administrator\Documents\GitHub\last-fm
```

### Step 3: Execute Deployment Script
```powershell
# Execute the bash script via WSL
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

**Expected Output:**
```
[INFO] Production Deployment & Git Commit Audit
[INFO] Deployment Date: 2024-01-15 10:30:00
[INFO] Deployment ID: 20240115_103000

[INFO] ========================================
[INFO] PHASE 1: PRE-DEPLOYMENT CHECKS
[INFO] ========================================
[INFO] Checking git repository...
[INFO] ✓ Git repository found
[INFO] ✓ Docker installed: Docker version 24.0.0
[INFO] ✓ Docker Compose installed: Docker Compose version 2.0.0
[INFO] ✓ All required files present
[INFO] ✓ Docker daemon is running

[INFO] ========================================
[INFO] PHASE 2: GIT STAGING
[INFO] ========================================
[INFO] Found XX changed files
[INFO] ✓ All changes staged

[INFO] ========================================
[INFO] PHASE 3: GIT COMMIT
[INFO] ========================================
[INFO] ✓ Commit created successfully
[INFO] Commit hash: abc123def456...

[INFO] ========================================
[INFO] PHASE 4: DEPLOYMENT - LIGHT CONTROL RIG
[INFO] ========================================
[INFO] ✓ Light Control Rig image built successfully
[INFO] ✓ Light Control Rig services started
[INFO] ✓ Light Control Rig health check passed

[INFO] ========================================
[INFO] PHASE 5: DEPLOYMENT - BRASS STAB FINDER
[INFO] ========================================
[INFO] ✓ Brass Stab Finder image built successfully
[INFO] ✓ Brass Stab Finder services started
[INFO] ✓ Brass Stab Finder health check passed

[INFO] ========================================
[INFO] PHASE 6: VERIFICATION
[INFO] ========================================
[INFO] ✓ Light Control Rig is running
[INFO] ✓ Brass Stab Finder is running

[INFO] ========================================
[INFO] DEPLOYMENT & COMMIT COMPLETE
[INFO] ========================================
[INFO] ✓ Production deployment completed successfully!
```

### Step 4: Wait for Completion
- **Total Time:** 30-45 minutes
- **Build Time:** 15-20 minutes
- **Deploy Time:** 10-15 minutes
- **Verification Time:** 5-10 minutes

### Step 5: Verify Deployment
```powershell
# Check services are running
docker ps | findstr -E "light-control|brass-stab"

# Expected: Both containers listed as "Up"
```

### Step 6: Health Checks
```powershell
# Light Control Rig
curl http://localhost:3001/health

# Brass Stab Finder
curl http://localhost:3002/health

# Expected: JSON response with "status":"healthy"
```

### Step 7: Review Audit Log
```powershell
# Find the audit log
ls deployment-commit-audit-*.log

# View the audit log
cat deployment-commit-audit-YYYYMMDD_HHMMSS.log

# Or use PowerShell
Get-Content deployment-commit-audit-*.log
```

### Step 8: Push to Git
```powershell
# Push the commit to remote
git push origin main

# Expected: Shows "main -> main"
```

---

## Monitoring Execution

### Real-Time Logs
```powershell
# Watch Light Control Rig logs
docker-compose -f docker-compose.light-control.yml logs -f

# Watch Brass Stab Finder logs
docker-compose -f docker-compose.brass-stab.yml logs -f

# Press Ctrl+C to stop watching
```

### Check Progress
```powershell
# List running containers
docker ps

# Check container status
docker-compose -f docker-compose.light-control.yml ps
docker-compose -f docker-compose.brass-stab.yml ps

# Check resource usage
docker stats
```

---

## Troubleshooting

### Issue: WSL Not Found
```powershell
# Check WSL installation
wsl --list --verbose

# If not installed, install WSL
wsl --install

# Restart computer
Restart-Computer
```

### Issue: Docker Not Accessible from WSL
```powershell
# Check Docker daemon
docker ps

# If Docker not running, start it
# Open Docker Desktop application

# Verify Docker in WSL
wsl docker ps
```

### Issue: Script Permission Denied
```powershell
# Make script executable
wsl chmod +x /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh

# Try again
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

### Issue: Path Not Found
```powershell
# Verify file exists
wsl ls /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh

# If not found, check Windows path
dir C:\Users\Administrator\Documents\GitHub\last-fm\deploy-and-commit.sh
```

### Issue: Git Not Found in WSL
```powershell
# Install Git in WSL
wsl sudo apt-get update
wsl sudo apt-get install git

# Verify installation
wsl git --version
```

### Issue: Docker Compose Not Found in WSL
```powershell
# Install Docker Compose in WSL
wsl sudo apt-get install docker-compose

# Verify installation
wsl docker-compose --version
```

---

## Post-Execution Tasks

### Immediate (Same Day)
1. **Verify Services**
   ```powershell
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   ```

2. **Review Audit Log**
   ```powershell
   cat deployment-commit-audit-*.log
   ```

3. **Monitor Logs**
   ```powershell
   docker-compose -f docker-compose.light-control.yml logs --tail 50
   docker-compose -f docker-compose.brass-stab.yml logs --tail 50
   ```

4. **Push to Git**
   ```powershell
   git push origin main
   ```

### Within 24 Hours
1. Configure firewall rules
2. Set up monitoring and alerts
3. Schedule daily backups
4. Document baseline metrics

### Within 1 Week
1. Team training (6 hours)
2. SSL/TLS configuration
3. Performance optimization
4. Security hardening review

---

## Success Indicators

### Deployment Success ✅
- [x] Script executes without errors
- [x] All phases complete
- [x] Services start successfully
- [x] Health checks pass
- [x] Audit log generated
- [x] Git commit created

### Service Status ✅
- [x] Light Control Rig running on port 3001
- [x] Brass Stab Finder running on port 3002
- [x] Both services responding to health checks
- [x] API endpoints accessible

### Git Status ✅
- [x] Commit created with comprehensive message
- [x] Commit pushed to remote
- [x] Git status clean

---

## Rollback Procedure

If deployment fails:

```powershell
# 1. Stop services
docker-compose -f docker-compose.light-control.yml down
docker-compose -f docker-compose.brass-stab.yml down

# 2. Remove images
docker rmi light-control:latest
docker rmi brass-stab-finder:latest

# 3. Reset git
git reset --soft HEAD~1
git restore --staged .

# 4. Verify rollback
git status
docker ps
```

---

## Performance Expectations

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-deployment checks | 2 min | ✅ |
| Git staging & commit | 3 min | ✅ |
| Light Control build | 10 min | ✅ |
| Light Control deploy | 5 min | ✅ |
| Brass Stab build | 10 min | ✅ |
| Brass Stab deploy | 5 min | ✅ |
| Verification | 5 min | ✅ |
| **TOTAL** | **40 min** | ✅ |

---

## Common Commands

### Check Deployment Status
```powershell
# List running containers
docker ps

# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health

# View service logs
docker logs light-control-service
docker logs brass-stab-finder-service
```

### View Audit Log
```powershell
# Find audit log
ls deployment-commit-audit-*.log

# View full log
cat deployment-commit-audit-*.log

# View last 50 lines
tail -50 deployment-commit-audit-*.log
```

### Restart Services
```powershell
# Restart Light Control
docker-compose -f docker-compose.light-control.yml restart

# Restart Brass Stab
docker-compose -f docker-compose.brass-stab.yml restart
```

### Stop Services
```powershell
# Stop all services
docker-compose -f docker-compose.light-control.yml down
docker-compose -f docker-compose.brass-stab.yml down
```

---

## Support

### If Execution Fails
1. Check audit log: `cat deployment-commit-audit-*.log`
2. Review error messages
3. Check troubleshooting section above
4. Verify prerequisites are installed
5. Try rollback and retry

### If Services Won't Start
1. Check Docker daemon: `docker ps`
2. Check logs: `docker logs <container-name>`
3. Verify ports available: `netstat -ano | findstr 3001`
4. Restart Docker Desktop
5. Try rollback and retry

### If Git Commit Fails
1. Check git status: `git status`
2. Verify git configuration: `git config --list`
3. Check repository: `git rev-parse --git-dir`
4. Reset and retry: `git reset --soft HEAD~1`

---

## Summary

You are about to execute a comprehensive production deployment using WSL:

**Command:**
```powershell
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

**Expected Result:**
- ✅ Both services deployed
- ✅ Health checks passing
- ✅ Git commit created
- ✅ Audit log generated
- ✅ Services running in Docker

**Timeline:** 40 minutes

**Status:** ✅ READY TO EXECUTE

---

## Next Steps After Execution

1. **Verify Services**
   ```powershell
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   ```

2. **Review Audit Log**
   ```powershell
   cat deployment-commit-audit-*.log
   ```

3. **Push to Git**
   ```powershell
   git push origin main
   ```

4. **Configure Firewall**
   - Open ports 3001, 3002
   - Configure Art-Net (6454 UDP)
   - Configure sACN (5568 UDP)

5. **Set Up Monitoring**
   - Configure Prometheus
   - Create dashboards
   - Set up alerts

---

**Ready to execute? Run the command above in PowerShell!**

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Production Ready
