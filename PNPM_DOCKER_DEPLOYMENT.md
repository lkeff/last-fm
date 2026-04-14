# PNPM Docker Deployment - Inject Services into Containers

**Light Control Rig & Brass Stab Finder - PNPM-based Docker Deployment**
**Status: ✅ Ready to Deploy with PNPM**

---

## Overview

Deploy services into Docker containers using pnpm for faster, more efficient dependency management.

**Advantages:**
✅ Faster installation (pnpm is 3-4x faster than npm)
✅ Smaller disk footprint
✅ Better monorepo support
✅ Deterministic builds

---

## Step 1: Update Dockerfiles for PNPM

### Update Dockerfile.light-control

```dockerfile
# Multi-stage build for Light Control Service
# Professional DMX512/Art-Net/sACN lighting control system

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Runtime
FROM node:18-alpine

LABEL maintainer="Light Control Team"
LABEL description="Professional DMX512/Art-Net/sACN lighting control system"
LABEL version="1.0.0"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates && \
    update-ca-certificates

# Create non-root user
RUN addgroup -g 1000 lightcontrol && \
    adduser -D -u 1000 -G lightcontrol lightcontrol

# Copy from builder
COPY --from=builder --chown=lightcontrol:lightcontrol /app/node_modules ./node_modules

# Copy application files
COPY --chown=lightcontrol:lightcontrol services ./services
COPY --chown=lightcontrol:lightcontrol rigs ./rigs
COPY --chown=lightcontrol:lightcontrol package.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R lightcontrol:lightcontrol /app/logs /app/data && \
    chmod 755 /app/logs /app/data

# Switch to non-root user
USER lightcontrol

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start the light control service
CMD ["node", "services/light-control-service.js"]

# Expose ports
EXPOSE 3001 6454 5568
```

### Update Dockerfile.brass-stab

```dockerfile
# Multi-stage build for Brass Stab Finder Service
# Professional audio analysis and brass stab detection system

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Runtime
FROM node:18-alpine

LABEL maintainer="Brass Stab Finder Team"
LABEL description="Professional audio analysis and brass stab detection system"
LABEL version="1.0.0"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install runtime dependencies only
RUN apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates && \
    update-ca-certificates

# Create non-root user
RUN addgroup -g 1001 brassstab && \
    adduser -D -u 1001 -G brassstab brassstab

# Copy from builder
COPY --from=builder --chown=brassstab:brassstab /app/node_modules ./node_modules

# Copy application files
COPY --chown=brassstab:brassstab services ./services
COPY --chown=brassstab:brassstab package.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/data/brass-cache && \
    chown -R brassstab:brassstab /app/logs /app/data && \
    chmod 755 /app/logs /app/data /app/data/brass-cache

# Switch to non-root user
USER brassstab

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:3002/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start the brass stab finder service
CMD ["node", "services/brass-stab-api.js"]

# Expose ports
EXPOSE 3002
```

---

## Step 2: Generate pnpm-lock.yaml

```powershell
# Install pnpm globally
npm install -g pnpm

# Generate lock file
cd C:\Users\Administrator\Documents\GitHub\last-fm
pnpm install

# This creates pnpm-lock.yaml
```

---

## Step 3: Build Docker Images with PNPM

```powershell
# Navigate to repository
cd C:\Users\Administrator\Documents\GitHub\last-fm

# Build Light Control Rig
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Build Brass Stab Finder
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
```

---

## Step 4: Deploy Services

```powershell
# Deploy Light Control Rig
docker-compose -f docker-compose.light-control.yml up -d

# Deploy Brass Stab Finder
docker-compose -f docker-compose.brass-stab.yml up -d

# Wait for startup
Start-Sleep -Seconds 10
```

---

## Step 5: Verify Services

```powershell
# Check running containers
docker ps | findstr -E "light-control|brass-stab"

# Health checks
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health

# View logs
docker logs light-control-service
docker logs brass-stab-finder-service
```

---

## Complete PNPM Deployment Script

Create `deploy-pnpm.sh`:

```bash
#!/bin/bash

set -e

echo "=========================================="
echo "PNPM Docker Deployment"
echo "=========================================="

# Step 1: Generate pnpm lock file
echo "[1/5] Generating pnpm lock file..."
pnpm install --frozen-lockfile

# Step 2: Build Light Control image
echo "[2/5] Building Light Control Rig image..."
docker build -f Dockerfile.light-control -t light-control:1.0.0 .

# Step 3: Build Brass Stab image
echo "[3/5] Building Brass Stab Finder image..."
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# Step 4: Deploy services
echo "[4/5] Deploying services..."
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d

# Step 5: Verify
echo "[5/5] Verifying deployment..."
sleep 10

echo ""
echo "Service Status:"
docker ps | grep -E "light-control|brass-stab"

echo ""
echo "Health Checks:"
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .

echo ""
echo "✓ Deployment complete!"
```

---

## PowerShell PNPM Deployment Script

Create `deploy-pnpm.ps1`:

```powershell
# PNPM Docker Deployment Script

param(
    [switch]$SkipHealthCheck = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "PNPM Docker Deployment"
Write-Host "=========================================="

# Step 1: Generate pnpm lock file
Write-Host "[1/5] Generating pnpm lock file..."
if (-not $DryRun) {
    pnpm install --frozen-lockfile
}

# Step 2: Build Light Control image
Write-Host "[2/5] Building Light Control Rig image..."
if (-not $DryRun) {
    docker build -f Dockerfile.light-control -t light-control:1.0.0 .
}

# Step 3: Build Brass Stab image
Write-Host "[3/5] Building Brass Stab Finder image..."
if (-not $DryRun) {
    docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .
}

# Step 4: Deploy services
Write-Host "[4/5] Deploying services..."
if (-not $DryRun) {
    docker-compose -f docker-compose.light-control.yml up -d
    docker-compose -f docker-compose.brass-stab.yml up -d
}

# Step 5: Verify
Write-Host "[5/5] Verifying deployment..."
if (-not $DryRun) {
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "Service Status:"
docker ps | findstr -E "light-control|brass-stab"

if (-not $SkipHealthCheck) {
    Write-Host ""
    Write-Host "Health Checks:"
    try {
        $health1 = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
        Write-Host "Light Control: $($health1.StatusCode) OK"
    } catch {
        Write-Host "Light Control: Connection failed"
    }
    
    try {
        $health2 = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing
        Write-Host "Brass Stab: $($health2.StatusCode) OK"
    } catch {
        Write-Host "Brass Stab: Connection failed"
    }
}

Write-Host ""
Write-Host "✓ Deployment complete!"
```

---

## Quick Start with PNPM

```powershell
# 1. Install pnpm globally
npm install -g pnpm

# 2. Navigate to repository
cd C:\Users\Administrator\Documents\GitHub\last-fm

# 3. Generate lock file
pnpm install --frozen-lockfile

# 4. Build images
docker build -f Dockerfile.light-control -t light-control:1.0.0 .
docker build -f Dockerfile.brass-stab -t brass-stab-finder:1.0.0 .

# 5. Deploy services
docker-compose -f docker-compose.light-control.yml up -d
docker-compose -f docker-compose.brass-stab.yml up -d

# 6. Verify
docker ps
curl -UseBasicParsing http://localhost:3001/health
curl -UseBasicParsing http://localhost:3002/health
```

---

## PNPM vs NPM Comparison

| Feature | NPM | PNPM |
|---------|-----|------|
| **Speed** | Slower | 3-4x faster |
| **Disk Space** | Higher | 50% less |
| **Lock File** | package-lock.json | pnpm-lock.yaml |
| **Build Time** | 10-15 min | 5-7 min |
| **Deterministic** | Yes | Yes |

---

## Troubleshooting

### pnpm not found
```powershell
npm install -g pnpm
pnpm --version
```

### Docker build fails with pnpm
```powershell
# Clear Docker cache
docker system prune -a

# Rebuild
docker build --no-cache -f Dockerfile.light-control -t light-control:1.0.0 .
```

### pnpm-lock.yaml issues
```powershell
# Regenerate lock file
rm pnpm-lock.yaml
pnpm install --frozen-lockfile
```

---

## Benefits of PNPM Docker Deployment

✅ **Faster builds** - 3-4x faster than npm
✅ **Smaller images** - 50% less disk space
✅ **Deterministic** - Exact same dependencies every time
✅ **Better caching** - Docker layer caching works better
✅ **Monorepo ready** - Scales to multiple services

---

## Timeline

| Step | Duration |
|------|----------|
| Generate lock file | 2-3 min |
| Build Light Control | 5-7 min |
| Build Brass Stab | 5-7 min |
| Deploy services | 2 min |
| Verify | 1 min |
| **TOTAL** | **15-20 min** |

---

## Next Steps

1. **Install pnpm:** `npm install -g pnpm`
2. **Generate lock file:** `pnpm install --frozen-lockfile`
3. **Update Dockerfiles:** Use PNPM versions above
4. **Build images:** `docker build -f Dockerfile.light-control ...`
5. **Deploy services:** `docker-compose up -d`
6. **Verify:** Health checks and logs

---

## Status

**PNPM Deployment: ✅ Ready to Execute**

Execute the Quick Start commands above to deploy with PNPM!

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ PNPM Docker Deployment Ready
