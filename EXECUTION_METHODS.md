# Execution Methods - Choose Your Approach

**Three Ways to Execute Production Deployment**

---

## Overview

You have three options to execute the production deployment. Choose the one that best fits your environment.

---

## Method 1: WSL/Git Bash (Linux-like Environment)

### Prerequisites
- Windows Subsystem for Linux (WSL) installed, OR
- Git Bash installed

### Execution

#### Using WSL:
```powershell
# Open PowerShell and run:
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

#### Using Git Bash:
```powershell
# Open PowerShell and run:
& "C:\Program Files\Git\bin\bash.exe" "C:\Users\Administrator\Documents\GitHub\last-fm\deploy-and-commit.sh"
```

### Advantages
✅ Uses native bash script
✅ Exact same script as Linux/Mac
✅ Full feature support
✅ Colored output
✅ Complete audit logging

### Disadvantages
❌ Requires WSL or Git Bash installation
❌ Slightly slower on Windows
❌ May have path conversion issues

### Timeline
- Execution: 30 minutes
- Total with verification: 1-2 hours

---

## Method 2: PowerShell Native (Windows-Only)

### Prerequisites
- PowerShell 5.0+ (built-in on Windows 10+)
- Docker Desktop for Windows
- Git for Windows

### Execution

```powershell
# Open PowerShell as Administrator and run:
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Run the PowerShell script
.\deploy-and-commit.ps1

# Or with options:
.\deploy-and-commit.ps1 -SkipHealthCheck
.\deploy-and-commit.ps1 -DryRun  # Preview without executing
```

### Advantages
✅ Native Windows execution
✅ No additional tools needed
✅ Faster performance
✅ Better Windows integration
✅ Colored output
✅ Complete audit logging

### Disadvantages
❌ PowerShell-specific syntax
❌ Slightly different behavior than bash

### Timeline
- Execution: 30 minutes
- Total with verification: 1-2 hours

---

## Method 3: Manual Step-by-Step (Full Control)

### Prerequisites
- PowerShell or Command Prompt
- Docker Desktop for Windows
- Git for Windows
- curl (built-in on Windows 10+)

### Execution

```powershell
# Open PowerShell and follow the steps in:
# MANUAL_EXECUTION_STEPS.md

# Or execute commands one by one:
cd C:\Users\Administrator\Documents\GitHub\last-fm
docker --version
docker-compose --version
git status
git add -A
# ... and so on
```

### Advantages
✅ Full control over each step
✅ Can pause and review
✅ Easy to troubleshoot
✅ No script dependencies
✅ Can skip steps if needed
✅ Best for learning

### Disadvantages
❌ Manual execution required
❌ More time-consuming
❌ Higher error risk
❌ No automated audit logging

### Timeline
- Execution: 1-2 hours
- Total with verification: 2-3 hours

---

## Comparison Table

| Feature | WSL/Git Bash | PowerShell | Manual |
|---------|--------------|-----------|--------|
| **Execution Time** | 30 min | 30 min | 60-90 min |
| **Ease of Use** | Easy | Easy | Medium |
| **Control** | Low | Medium | High |
| **Error Recovery** | Auto | Auto | Manual |
| **Learning Value** | Low | Low | High |
| **Automation** | Full | Full | None |
| **Audit Logging** | Yes | Yes | Manual |
| **Windows Native** | No | Yes | Yes |
| **Prerequisites** | WSL/Git Bash | PowerShell | None |

---

## Recommendation by Scenario

### Scenario 1: Quick Deployment
**Recommended: PowerShell Native (Method 2)**
- Fastest on Windows
- No additional tools needed
- Full automation
- Audit logging included

```powershell
.\deploy-and-commit.ps1
```

### Scenario 2: Learning & Understanding
**Recommended: Manual Steps (Method 3)**
- See each step executed
- Understand the process
- Easy to troubleshoot
- Can pause and review

See: `MANUAL_EXECUTION_STEPS.md`

### Scenario 3: Linux/Mac Compatibility
**Recommended: WSL/Git Bash (Method 1)**
- Same script across platforms
- Familiar bash environment
- Full feature support

```bash
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

### Scenario 4: Dry Run / Preview
**Recommended: PowerShell with -DryRun**
- See what would happen
- No actual deployment
- Safe to test

```powershell
.\deploy-and-commit.ps1 -DryRun
```

---

## Step-by-Step Decision Guide

### Question 1: Do you have WSL or Git Bash installed?
- **Yes** → Use Method 1 (WSL/Git Bash)
- **No** → Continue to Question 2

### Question 2: Do you want full automation?
- **Yes** → Use Method 2 (PowerShell)
- **No** → Use Method 3 (Manual)

### Question 3: Do you want to learn the process?
- **Yes** → Use Method 3 (Manual)
- **No** → Use Method 2 (PowerShell)

---

## Execution Checklist

### Before Execution
- [ ] Read the appropriate guide
- [ ] Verify prerequisites
- [ ] Backup current state (optional)
- [ ] Notify team
- [ ] Have rollback plan ready

### During Execution
- [ ] Monitor output
- [ ] Watch for errors
- [ ] Note any warnings
- [ ] Keep audit log

### After Execution
- [ ] Verify services running
- [ ] Test API endpoints
- [ ] Review audit log
- [ ] Collect metrics
- [ ] Notify team

---

## Quick Start Commands

### Method 1: WSL
```bash
wsl bash /mnt/c/Users/Administrator/Documents/GitHub/last-fm/deploy-and-commit.sh
```

### Method 2: PowerShell
```powershell
cd C:\Users\Administrator\Documents\GitHub\last-fm
.\deploy-and-commit.ps1
```

### Method 3: Manual
```powershell
# See MANUAL_EXECUTION_STEPS.md for detailed steps
cd C:\Users\Administrator\Documents\GitHub\last-fm
git status
# ... continue with manual steps
```

---

## Troubleshooting by Method

### Method 1 (WSL/Git Bash) Issues

**Issue: WSL not found**
```powershell
# Install WSL
wsl --install
```

**Issue: Git Bash path wrong**
```powershell
# Find Git Bash location
where git
# Use the path to bash.exe
```

### Method 2 (PowerShell) Issues

**Issue: Script execution policy**
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Issue: Script not found**
```powershell
# Verify file exists
ls .\deploy-and-commit.ps1

# Use full path if needed
& "C:\Users\Administrator\Documents\GitHub\last-fm\deploy-and-commit.ps1"
```

### Method 3 (Manual) Issues

**Issue: Command not found**
```powershell
# Verify Docker is running
docker ps

# Verify Git is installed
git --version

# Verify curl is available
curl --version
```

---

## Performance Comparison

| Method | Build Time | Deploy Time | Verify Time | Total |
|--------|-----------|-------------|-------------|-------|
| **WSL** | 10 min | 10 min | 10 min | 30 min |
| **PowerShell** | 10 min | 10 min | 10 min | 30 min |
| **Manual** | 15 min | 20 min | 25 min | 60 min |

---

## Success Indicators

### All Methods Should Result In:
✅ Light Control Rig running on port 3001
✅ Brass Stab Finder running on port 3002
✅ Both services responding to health checks
✅ Git commit created and pushed
✅ Audit log generated
✅ No critical errors in logs

---

## Documentation References

- **WSL/Git Bash:** Use native bash script (`deploy-and-commit.sh`)
- **PowerShell:** Use PowerShell script (`deploy-and-commit.ps1`)
- **Manual:** Follow step-by-step guide (`MANUAL_EXECUTION_STEPS.md`)

---

## Next Steps After Execution

Regardless of which method you use:

1. **Verify Deployment**
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

## Support

### If You Choose Method 1 (WSL/Git Bash)
- See: `deploy-and-commit.sh`
- Docs: `EXECUTION_PLAN.md`

### If You Choose Method 2 (PowerShell)
- See: `deploy-and-commit.ps1`
- Docs: `EXECUTION_PLAN.md`

### If You Choose Method 3 (Manual)
- See: `MANUAL_EXECUTION_STEPS.md`
- Docs: `EXECUTION_PLAN.md`

---

## Summary

You have three proven methods to execute the production deployment:

1. **WSL/Git Bash** - For Linux-like environment
2. **PowerShell** - For Windows native execution (Recommended)
3. **Manual** - For full control and learning

Choose the method that best fits your needs and environment.

**Recommended: Method 2 (PowerShell) for fastest, easiest Windows deployment**

---

**Ready to execute? Choose your method and begin deployment!**
