# Last.fm Application Security Audit Report

**Generated:** April 6, 2026  
**Project:** Last.fm Desktop Application  
**Audit Type:** Docker Configuration, Security, and Fraud Prevention

---

## Executive Summary

This audit examined the Last.fm Desktop application's Docker configuration, codebase security practices, and potential fraud vulnerabilities. The application demonstrates **good security awareness** with multiple security features documented, but has **critical vulnerabilities** that require immediate attention.

### Overall Security Rating: ⭐⭐⭐ (3/5)

---

## 🚨 CRITICAL SECURITY ISSUES

### 1. **EXPOSED API KEY IN .ENV FILE** 

**Severity:** 🔴 CRITICAL  
**File:** `.env` line 1

```bash
LASTFM_API_KEY=48484f6b0b9137ede2457b2c42d5dd6e  # ❌ REAL API KEY EXPOSED
```

**Risk:** 
- API key is committed and visible in the repository
- Can be used to make unauthorized API calls
- May lead to rate limiting, quota exhaustion, or account suspension
- Potential for API abuse and fraud

**Impact:** HIGH - Immediate exploitation possible

**Recommendation:**
```bash
# IMMEDIATE ACTION REQUIRED:
1. Revoke this API key at https://www.last.fm/api/account
2. Generate a new API key
3. Remove .env from git history:
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
4. Update .env with new key (never commit)
```

---

### 2. **DOCKERFILE COPIES .ENV FILES**

**Severity:** 🔴 CRITICAL  
**File:** `Dockerfile` line 18

```dockerfile
COPY .env* ./  # ❌ Copies sensitive environment files into Docker image
```

**Risk:**
- API keys baked into Docker image layers
- Anyone with access to the image can extract secrets
- Image layers are permanent and difficult to remove
- Secrets exposed in Docker Hub or container registries

**Impact:** HIGH - Secrets permanently embedded in image

**Recommendation:**
```dockerfile
# Remove this line completely
# COPY .env* ./  # ❌ NEVER DO THIS

# Instead, use environment variables or Docker secrets:
# docker run -e LASTFM_API_KEY=$LASTFM_API_KEY last-fm:latest
```

---

### 3. **NO NON-ROOT USER IN DOCKERFILE**

**Severity:** 🟠 HIGH  
**File:** `Dockerfile`

**Current State:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
# ... no USER directive
CMD ["npm", "run", "start:node"]  # ❌ Runs as root
```

**Risk:**
- Container runs as root (UID 0)
- If compromised, attacker has root privileges
- Can escape container or damage host system
- Violates principle of least privilege

**Recommendation:**
```dockerfile
# Add before CMD:
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser
```

---

### 4. **EXPOSED PORTS WITHOUT LOCALHOST BINDING**

**Severity:** 🟠 HIGH  
**File:** `docker-compose.yml` line 20-21

```yaml
ports:
  - "3000:3000"  # ❌ Exposed to 0.0.0.0 (all interfaces)
```

**Risk:**
- Service accessible from external network
- No firewall protection at container level
- Potential for unauthorized access

**Recommendation:**
```yaml
ports:
  - "127.0.0.1:3000:3000"  # ✅ Localhost only
```

---

### 5. **MISSING CONTAINER SECURITY OPTIONS**

**Severity:** 🟠 HIGH  
**File:** `docker-compose.yml`

**Missing:**
- `security_opt: no-new-privileges`
- `cap_drop: ALL`
- `read_only: true`

**Recommendation:**
```yaml
services:
  last-fm:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
```

---

## ⚠️ HIGH PRIORITY ISSUES

### 6. **.DOCKERIGNORE DOESN'T EXCLUDE .ENV**

**Severity:** 🟡 MEDIUM  
**File:** `.dockerignore`

**Current State:**
```
.env.local
.env.example  # ❌ .env is NOT excluded!
```

**Risk:** .env file can still be copied into Docker image

**Recommendation:**
```
.env
.env.*
!.env.example
```

---

### 7. **HARDCODED API KEY FALLBACK**

**Severity:** 🟡 MEDIUM  
**File:** `bot.js` line 13

```javascript
const API_KEY = process.env.LASTFM_API_KEY || 'YOUR_LAST_FM_API_KEY'  # ❌ Fallback
```

**Risk:** Encourages hardcoding API keys

**Recommendation:**
```javascript
const API_KEY = process.env.LASTFM_API_KEY
if (!API_KEY) {
  console.error('ERROR: LASTFM_API_KEY environment variable is required')
  process.exit(1)
}
```

---

### 8. **NO INPUT VALIDATION IN BOT.JS**

**Severity:** 🟡 MEDIUM  
**File:** `bot.js` lines 64-78

**Current State:**
```javascript
rl.question('Enter artist name to search: ', (query) => {
  lastfm.artistSearch({ q: query, limit: 5 }, ...)  // ❌ No validation
})
```

**Risk:**
- Potential injection attacks
- Malformed queries causing errors
- No length limits

**Recommendation:**
```javascript
rl.question('Enter artist name to search: ', (query) => {
  // Validate input
  if (!query || query.trim().length === 0) {
    console.error('Error: Artist name cannot be empty')
    return showMenu()
  }
  if (query.length > 200) {
    console.error('Error: Artist name too long')
    return showMenu()
  }
  // Sanitize
  query = query.trim().replace(/[<>]/g, '')
  lastfm.artistSearch({ q: query, limit: 5 }, ...)
})
```

---

## ✅ Security Strengths

### Documented Security Features

The application claims several security features in README.md:

1. **Anti-Scam Protection:**
   - URL validation against trusted domains
   - HTML sanitization
   - Phishing pattern detection

2. **Hash Leak Protection:**
   - Secure logging with data scrubbing
   - SHA-256 hashing of sensitive strings
   - AES-256-GCM encryption for local storage

3. **AFK Guard:**
   - Inactivity detection (10-minute timeout)
   - Session locking
   - Authentication on unlock

4. **Good .gitignore:**
   - Comprehensive exclusions for sensitive files
   - Environment files properly excluded
   - Build artifacts ignored

5. **Security Dependencies:**
   - `helmet` for HTTP security headers
   - `dompurify` for HTML sanitization
   - `validator` for input validation
   - `eslint-plugin-security` for code analysis

6. **Security Scripts:**
   - `npm run test:security` - Security linting
   - `npm audit` integration
   - Snyk vulnerability scanning

---

## 🔍 Code Security Analysis

### Positive Findings

1. **No eval() or exec() usage** - Checked in main files
2. **Uses environment variables** - Proper configuration management
3. **HTTPS API calls** - Secure communication with Last.fm API
4. **Timeout configured** - 30-second timeout prevents hanging requests
5. **Error handling** - Proper error callbacks throughout
6. **Caching implemented** - TTL cache reduces API abuse
7. **User-Agent set** - Identifies application to API

### Security Dependencies Analysis

**Good:**
- `helmet@^7.0.0` - Latest version, HTTP security
- `dompurify@^3.2.7` - HTML sanitization
- `validator@^13.9.0` - Input validation
- `axios@^1.4.0` - Secure HTTP client

**Concerns:**
- `grpc@1.24.11` - Very old version (2019), known vulnerabilities
- `@tensorflow/tfjs-node@3.18.0` - Large attack surface, may not be needed
- `keytar@^7.9.0` - Native module, potential security risks

---

## 🛡️ Fraud Prevention Assessment

### Current Protections

1. **Rate Limiting:** TTL cache reduces API abuse
2. **API Key Required:** Authentication enforced
3. **Input Sanitization:** Claimed in README (needs verification)
4. **Logging:** Error logging implemented

### Fraud Risks

1. **API Key Exposure:** ❌ Key is exposed in .env
2. **No Rate Limiting:** ⚠️ No explicit rate limiting in code
3. **No Request Validation:** ⚠️ Minimal input validation
4. **No Audit Trail:** ⚠️ No comprehensive logging of API usage

### Recommendations

1. **Implement Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)
```

2. **Add Request Logging:**
```javascript
function logAPIRequest(method, params) {
  console.log({
    timestamp: new Date().toISOString(),
    method,
    params: sanitizeParams(params)
  })
}
```

3. **Implement Anomaly Detection:**
- Monitor for unusual query patterns
- Alert on excessive API usage
- Track failed authentication attempts

---

## 📋 Docker Security Checklist

| Security Control | Status | Notes |
|-----------------|--------|-------|
| Non-root user | ❌ | Container runs as root |
| Secrets management | ❌ | .env copied into image |
| Minimal base image | ✅ | Using node:20-alpine |
| .dockerignore | ⚠️ | Incomplete - missing .env |
| Health checks | ✅ | Implemented |
| Port binding | ❌ | Exposed to 0.0.0.0 |
| Security options | ❌ | No cap_drop or no-new-privileges |
| Read-only filesystem | ❌ | Not implemented |
| Resource limits | ❌ | No CPU/memory limits |
| Network isolation | ✅ | Bridge network configured |
| Multi-stage build | ❌ | Single-stage build |
| Vulnerability scanning | ⚠️ | Snyk installed but not in CI/CD |

---

## 🎯 Priority Action Items

### IMMEDIATE (Fix Today)

1. ✅ **Revoke exposed API key** - Last.fm dashboard
2. ✅ **Remove .env from git history** - git filter-branch
3. ✅ **Fix Dockerfile** - Remove COPY .env* line
4. ✅ **Add .env to .dockerignore**

### HIGH PRIORITY (Fix This Week)

5. ✅ **Add non-root user to Dockerfile**
6. ✅ **Bind ports to localhost**
7. ✅ **Add container security options**
8. ✅ **Implement input validation**

### MEDIUM PRIORITY (Fix This Month)

9. ✅ **Update vulnerable dependencies** (grpc)
10. ✅ **Add rate limiting**
11. ✅ **Implement comprehensive logging**
12. ✅ **Add resource limits to docker-compose**

---

## 📊 Risk Assessment

| Category | Risk Level | Impact | Likelihood |
|----------|-----------|--------|------------|
| API Key Exposure | 🔴 CRITICAL | Critical | High |
| Container Escape | 🟠 HIGH | High | Medium |
| Secrets in Image | 🔴 CRITICAL | Critical | High |
| Injection Attacks | 🟡 MEDIUM | Medium | Low |
| Resource Exhaustion | 🟡 MEDIUM | Medium | Medium |
| Dependency Vulnerabilities | 🟠 HIGH | High | Medium |

---

## 🔐 Recommended Security Architecture

### 1. Environment Variables (Development)

```bash
# .env (NEVER commit)
LASTFM_API_KEY=your_key_here
FREESOUND_API_KEY=your_key_here
NODE_ENV=development
```

### 2. Docker Secrets (Production)

```bash
# Create secrets
echo "your_lastfm_key" | docker secret create lastfm_api_key -
echo "your_freesound_key" | docker secret create freesound_api_key -

# Use in docker-compose.yml
services:
  last-fm:
    secrets:
      - lastfm_api_key
      - freesound_api_key
    environment:
      LASTFM_API_KEY_FILE: /run/secrets/lastfm_api_key
```

### 3. Secure Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/node_modules ./node_modules
COPY index.js get_top_music.js bot.js ./
COPY utils/ ./utils/
# ❌ DO NOT COPY .env files
RUN addgroup -S appuser && adduser -S appuser -G appuser
RUN chown -R appuser:appuser /app
USER appuser
ENV NODE_ENV=production
CMD ["node", "get_top_music.js"]
```

### 4. Hardened docker-compose.yml

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
    read_only: true
    tmpfs:
      - /tmp
    environment:
      NODE_ENV: production
      LASTFM_API_KEY_FILE: /run/secrets/lastfm_api_key
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - app-network
    ports:
      - "127.0.0.1:3000:3000"
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
        reservations:
          cpus: '0.5'
          memory: 256M
    secrets:
      - lastfm_api_key
      - freesound_api_key

networks:
  app-network:
    driver: bridge

secrets:
  lastfm_api_key:
    external: true
  freesound_api_key:
    external: true
```

---

## 🚀 Quick Remediation Script

```bash
#!/bin/bash
# Last.fm Security Remediation Script

echo "🔐 Last.fm Security Fixes"
echo "========================="

# 1. Backup current files
mkdir -p .security-backup
cp Dockerfile .security-backup/
cp docker-compose.yml .security-backup/
cp .dockerignore .security-backup/

# 2. Fix .dockerignore
cat >> .dockerignore << 'EOF'

# Security: Exclude all environment files
.env
.env.*
!.env.example
*.pem
*.key
secrets/
EOF

# 3. Remove .env from git (if in git)
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "⚠️  WARNING: .env file is tracked in git!"
  echo "Run these commands manually:"
  echo "  git rm --cached .env"
  echo "  git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' HEAD"
fi

# 4. Generate new API key reminder
echo ""
echo "✅ Fixes applied!"
echo ""
echo "CRITICAL: You MUST do these steps manually:"
echo "1. Go to https://www.last.fm/api/account"
echo "2. Revoke the exposed API key: 48484f6b0b9137ede2457b2c42d5dd6e"
echo "3. Generate a new API key"
echo "4. Update .env with new key (DO NOT COMMIT)"
echo ""
```

---

## 📚 Compliance & Standards

### CIS Docker Benchmark

| Control | Status | Score |
|---------|--------|-------|
| 4.1 - Non-root user | ❌ Fail | 0/10 |
| 4.5 - No secrets in images | ❌ Fail | 0/10 |
| 4.6 - Healthcheck configured | ✅ Pass | 10/10 |
| 5.9 - Host namespace not shared | ✅ Pass | 10/10 |
| 5.25 - Restrict container capabilities | ❌ Fail | 0/10 |
| **Overall Score** | | **30/50** |

### OWASP Top 10

| Risk | Status | Notes |
|------|--------|-------|
| A01 - Broken Access Control | ⚠️ | No authentication on endpoints |
| A02 - Cryptographic Failures | ❌ | API keys in plaintext |
| A03 - Injection | ⚠️ | Limited input validation |
| A05 - Security Misconfiguration | ❌ | Multiple misconfigurations |
| A06 - Vulnerable Components | ⚠️ | Old grpc version |
| A07 - Auth Failures | ⚠️ | No rate limiting |
| A09 - Security Logging Failures | ⚠️ | Limited logging |

---

## 📝 Audit Metadata

- **Auditor:** Cascade AI Security Agent
- **Date:** April 6, 2026
- **Scope:** Docker configuration, secrets management, code security
- **Methodology:** Static analysis, configuration review, best practices
- **Tools:** File analysis, pattern matching, security checklist validation

---

## 🎓 Recommendations for Development Team

### Immediate Actions

1. **Revoke exposed API key immediately**
2. **Remove secrets from git history**
3. **Fix Dockerfile to not copy .env files**
4. **Add non-root user to container**

### Short-term Improvements

5. **Implement proper secrets management**
6. **Add container security hardening**
7. **Update vulnerable dependencies**
8. **Add input validation throughout**

### Long-term Strategy

9. **Implement CI/CD security scanning**
10. **Add comprehensive logging and monitoring**
11. **Conduct regular security audits**
12. **Implement rate limiting and abuse prevention**

---

**Next Audit Recommended:** July 6, 2026 (90 days)

**CRITICAL: The exposed API key must be revoked immediately to prevent abuse.**
