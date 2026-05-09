# Deployment Recovery Guide

**Light Control Rig & Brass Stab Finder - Troubleshooting & Recovery**
**Status: ✅ Recoverable - Follow Steps Below**

---

## Issues Detected

### Issue 1: Git Configuration Missing ⚠️
**Error:** `Author identity unknown`

**Solution:**
```bash
# Configure git user (run in WSL)
wsl git config --global user.email "your-email@example.com"
wsl git config --global user.name "Your Name"

# Or configure for this repository only
wsl git config user.email "your-email@example.com"
wsl git config user.name "Your Name"
```

**Example:**
```bash
wsl git config --global user.email "admin@example.com"
wsl git config --global user.name "Administrator"
```

### Issue 2: Docker Build Failed ⚠️
**Error:** `Failed to build Light Control Rig image`

**Need to see:** The actual Docker build error

---

## Recovery Steps

### Step 1: Configure Git Identity
```bash
# Set git user globally
wsl git config --global user.email "admin@example.com"
wsl git config --global user.name "Administrator"

# Verify configuration
wsl git config --global --list
```

### Step 2: Reset Git Changes
```bash
# Reset the failed commit
wsl git reset --soft HEAD~1

# Verify status
wsl git status
```

### Step 3: Check Docker Build Error
```bash
# Try building Light Control Rig manually to see the error
wsl docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# This will show the actual error message
```

### Step 4: Address Docker Build Error

**Common Docker Build Errors:**

#### Error: "Cannot find module"
```bash
# Ensure package.json dependencies are installed
wsl npm install
```

#### Error: "Base image not found"
```bash
# Pull the base image
wsl docker pull node:18-alpine
```

#### Error: "Permission denied"
```bash
# Ensure Docker daemon is running
docker ps

# If not running, start Docker Desktop
```

#### Error: "Disk space"
```bash
# Check available disk space
wsl df -h

# Clean up Docker
wsl docker system prune -a
```

### Step 5: Retry Deployment

Once issues are fixed:

```bash
# Re-run the deployment script
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

---

## Detailed Troubleshooting

### For Git Configuration Error

```bash
# 1. Check current git configuration
wsl git config --global --list

# 2. Set user email
wsl git config --global user.email "admin@example.com"

# 3. Set user name
wsl git config --global user.name "Administrator"

# 4. Verify configuration
wsl git config --global user.email
wsl git config --global user.name

# 5. Reset failed commit
wsl git reset --soft HEAD~1

# 6. Check git status
wsl git status
```

### For Docker Build Error

```bash
# 1. Check Docker is running
docker ps

# 2. Try building with verbose output
wsl docker build -f Dockerfile.light-control --progress=plain -t light-control:1.0.0 .

# 3. Check Docker logs
docker logs

# 4. Check available resources
docker system df

# 5. Clean up if needed
docker system prune -a
```

### For Node.js Dependencies

```bash
# 1. Check if node_modules exists
wsl ls -la node_modules

# 2. Install dependencies
wsl npm install

# 3. Verify installation
wsl npm list

# 4. Check package.json
wsl cat package.json | head -20
```

---

## Quick Recovery Commands

### Option 1: Configure Git and Retry
```bash
# Configure git
wsl git config --global user.email "admin@example.com"
wsl git config --global user.name "Administrator"

# Reset failed commit
wsl git reset --soft HEAD~1

# Retry deployment
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

### Option 2: Manual Step-by-Step Recovery
```bash
# 1. Configure git
wsl git config --global user.email "admin@example.com"
wsl git config --global user.name "Administrator"

# 2. Reset git
wsl git reset --soft HEAD~1

# 3. Check Docker
docker ps

# 4. Build Light Control manually
wsl docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# 5. If build succeeds, continue with deployment
wsl docker-compose -f docker-compose.light-control.yml up -d

# 6. Build Brass Stab
wsl docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# 7. Deploy Brass Stab
wsl docker-compose -f docker-compose.brass-stab.yml up -d
```

### Option 3: Use PowerShell Script Instead
```powershell
# If WSL continues to have issues, use PowerShell
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Configure git first
git config --global user.email "admin@example.com"
git config --global user.name "Administrator"

# Reset failed commit
git reset --soft HEAD~1

# Run PowerShell deployment script
.\deploy-and-commit.ps1
```

---

## Verification After Recovery

### Check Git Configuration
```bash
wsl git config --global --list | grep user
# Expected output:
# user.email=admin@example.com
# user.name=Administrator
```

### Check Docker Build
```bash
# Verify Light Control image
wsl docker images | grep light-control

# Verify Brass Stab image
wsl docker images | grep brass-stab
```

### Check Services Running
```bash
# List running containers
docker ps

# Expected: light-control and brass-stab containers running
```

### Health Checks
```bash
# Light Control health
curl http://localhost:3001/health

# Brass Stab health
curl http://localhost:3002/health
```

---

## Prevention for Future Deployments

### Pre-Deployment Checklist
- [ ] Git user configured: `git config --global user.email`
- [ ] Git user configured: `git config --global user.name`
- [ ] Docker daemon running: `docker ps`
- [ ] Sufficient disk space: `docker system df`
- [ ] Node.js dependencies installed: `npm install`

### Configure Git Before Deployment
```bash
# Always configure git first
wsl git config --global user.email "admin@example.com"
wsl git config --global user.name "Administrator"

# Then run deployment
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

---

## Next Steps

### Immediate Actions
1. **Configure Git Identity**
   ```bash
   wsl git config --global user.email "admin@example.com"
   wsl git config --global user.name "Administrator"
   ```

2. **Reset Failed Commit**
   ```bash
   wsl git reset --soft HEAD~1
   ```

3. **Check Docker Build Error**
   ```bash
   wsl docker build -f Dockerfile.light-control -t light-control:1.0.0 .
   ```

4. **Retry Deployment**
   ```bash
   wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
   ```

### If Issues Persist
1. Review Docker build error output
2. Check available disk space
3. Verify Docker daemon is running
4. Try PowerShell script instead
5. Contact support with error messages

---

## Support Information

### Git Configuration Help
- **Email:** Use your actual email address
- **Name:** Use your actual name or "Administrator"
- **Global vs Local:** Use `--global` for all repositories, omit for this repo only

### Docker Build Help
- **Check logs:** `docker logs <container-id>`
- **Check resources:** `docker system df`
- **Clean up:** `docker system prune -a`
- **Restart Docker:** Close and reopen Docker Desktop

### WSL Help
- **Check WSL version:** `wsl --list --verbose`
- **Update WSL:** `wsl --update`
- **Restart WSL:** `wsl --shutdown`

---

## Summary

**Current Status:** Deployment partially completed, recoverable

**Issues Found:**
1. Git user not configured
2. Docker build failed (need to see actual error)

**Recovery Actions:**
1. Configure git user identity
2. Reset failed commit
3. Check Docker build error
4. Retry deployment

**Estimated Recovery Time:** 10-15 minutes

---

**Ready to recover? Follow the Quick Recovery Commands above!**

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Recovery Guide Ready
