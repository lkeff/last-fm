# 🚨 CRITICAL SECURITY FIXES REQUIRED - Last.fm

**Date:** April 6, 2026  
**Status:** ⚠️ IMMEDIATE ACTION REQUIRED

---

## ⚡ STOP AND READ THIS FIRST

Your Last.fm application has **CRITICAL security vulnerabilities** that must be fixed immediately.

### 🔴 EXPOSED API KEY DETECTED

```
File: .env
Line: 1
API Key: 48484f6b0b9137ede2457b2c42d5dd6e
```

**This API key is visible in your repository and can be abused by anyone.**

---

## 🚨 IMMEDIATE ACTIONS (Do This NOW)

### 1. Revoke the Exposed API Key

```bash
# Go to Last.fm API dashboard
https://www.last.fm/api/account

# Find this key: 48484f6b0b9137ede2457b2c42d5dd6e
# Click "Revoke" or "Delete"
```

### 2. Generate a New API Key

```bash
# In the same dashboard, create a new API key
# Copy the new key (you'll need it in step 4)
```

### 3. Remove .env from Git History

```bash
# WARNING: This rewrites git history
# Backup your repo first!

# Remove .env from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if using remote)
git push origin --force --all
```

### 4. Update .env with New Key

```bash
# Edit .env file
nano .env

# Replace with your NEW API key
LASTFM_API_KEY=your_new_key_here
FREESOUND_API_KEY=your_freesound_api_key_here

# NEVER commit this file!
```

### 5. Fix .dockerignore

Add to `.dockerignore`:

```
# Security: Exclude all environment files
.env
.env.*
!.env.example
*.pem
*.key
secrets/
```

### 6. Fix Dockerfile

**Remove this line:**

```dockerfile
COPY .env* ./  # ❌ DELETE THIS LINE
```

**Add these lines before CMD:**

```dockerfile
# Add non-root user
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser
```

---

## 🔧 HIGH PRIORITY FIXES (This Week)

### 7. Fix docker-compose.yml

Replace the entire file with this secure version:

```yaml
version: '3.9'

services:
  last-fm:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: last-fm
    image: last-fm:latest
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    environment:
      NODE_ENV: production
      # Read from environment, not .env file
      LASTFM_API_KEY: ${LASTFM_API_KEY}
      FREESOUND_API_KEY: ${FREESOUND_API_KEY}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - app-network
    ports:
      - "127.0.0.1:3000:3000"  # ✅ Localhost only
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

networks:
  app-network:
    driver: bridge
```

### 8. Run with Environment Variables

```bash
# Instead of using .env file in Docker:
export LASTFM_API_KEY=your_new_key_here
export FREESOUND_API_KEY=your_freesound_key_here

# Then run:
docker-compose up -d
```

---

## ✅ Verification Steps

After applying fixes, verify:

### 1. Check Git Status

```bash
git status | grep .env
# Should return nothing
```

### 2. Check Dockerfile

```bash
grep "COPY .env" Dockerfile
# Should return nothing
```

### 3. Check Docker Image

```bash
# Build image
docker build -t last-fm:test .

# Check for .env in image
docker run --rm last-fm:test ls -la | grep .env
# Should return nothing
```

### 4. Verify Non-Root User

```bash
docker run --rm last-fm:test whoami
# Should output: appuser (not root)
```

### 5. Test API Key

```bash
# Run the app
docker-compose up

# Should work with new API key
# Check logs for errors
```

---

## 📋 Complete Security Checklist

- [ ] **CRITICAL:** Revoked exposed API key (48484f6b0b9137ede2457b2c42d5dd6e)
- [ ] **CRITICAL:** Generated new API key
- [ ] **CRITICAL:** Removed .env from git history
- [ ] **CRITICAL:** Updated .env with new key (not committed)
- [ ] **CRITICAL:** Fixed .dockerignore to exclude .env
- [ ] **CRITICAL:** Removed COPY .env* from Dockerfile
- [ ] **HIGH:** Added non-root user to Dockerfile
- [ ] **HIGH:** Bound ports to localhost (127.0.0.1)
- [ ] **HIGH:** Added security_opt and cap_drop
- [ ] **MEDIUM:** Updated vulnerable dependencies
- [ ] **MEDIUM:** Added input validation
- [ ] **MEDIUM:** Implemented rate limiting

---

## 🆘 If You Need Help

### The API Key Was Already Abused

1. Check Last.fm dashboard for unusual activity
2. Review API usage logs
3. Contact Last.fm support if needed
4. Monitor for quota exhaustion

### Can't Remove from Git History

If you can't rewrite history (shared repo):

1. Revoke the key immediately (most important)
2. Add .env to .gitignore
3. Commit: "chore: add .env to gitignore"
4. Document the incident
5. Rotate all other secrets as precaution

### Docker Build Fails

If the app fails after removing .env:

```bash
# Use environment variables instead
docker run -e LASTFM_API_KEY=$LASTFM_API_KEY last-fm:latest

# Or use .env file outside Docker:
source .env
docker run -e LASTFM_API_KEY=$LASTFM_API_KEY last-fm:latest
```

---

## 📊 Risk Summary

| Issue | Severity | Fixed? |
|-------|----------|--------|
| Exposed API Key | 🔴 CRITICAL | ⏳ Pending |
| Secrets in Docker Image | 🔴 CRITICAL | ⏳ Pending |
| No Non-Root User | 🟠 HIGH | ⏳ Pending |
| Exposed Ports | 🟠 HIGH | ⏳ Pending |
| Missing Security Options | 🟠 HIGH | ⏳ Pending |
| Incomplete .dockerignore | 🟡 MEDIUM | ⏳ Pending |

---

## 🎯 Timeline

### Today (Next 1 Hour)
- [ ] Revoke API key
- [ ] Generate new key
- [ ] Fix .dockerignore
- [ ] Fix Dockerfile

### This Week
- [ ] Remove from git history
- [ ] Update docker-compose.yml
- [ ] Add security options
- [ ] Test all changes

### This Month
- [ ] Update dependencies
- [ ] Add monitoring
- [ ] Implement rate limiting
- [ ] Security audit review

---

## 📞 Support

- **Security Issues:** Report to security@traycer.ai
- **Last.fm API:** https://www.last.fm/api/account
- **Docker Security:** https://docs.docker.com/engine/security/

---

## ⚠️ FINAL WARNING

**DO NOT ignore these security issues.**

The exposed API key can be used by anyone to:
- Make API calls on your behalf
- Exhaust your rate limits
- Get your API access suspended
- Potentially access user data

**Fix these issues immediately before continuing development.**

---

**Last Updated:** April 6, 2026  
**Next Review:** After fixes are applied
