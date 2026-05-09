# Last.fm — multi-stage production image
# syntax=docker/dockerfile:1.7
# ────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: install production dependencies via pnpm
# ────────────────────────────────────────────────────────────────────────────
FROM node:18.20-alpine3.19 AS deps

# pnpm via corepack (no npm install -g, no network fetch at build time)
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /build

# Copy manifests only — maximise layer-cache hits on code-only changes
COPY package.json pnpm-lock.yaml ./

# --frozen-lockfile ensures reproducible installs; --prod skips devDeps
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime: minimal image with only what the app needs
# ────────────────────────────────────────────────────────────────────────────
FROM node:18.20-alpine3.19 AS runtime

LABEL org.opencontainers.image.title="last-fm" \
      org.opencontainers.image.description="Last.fm desktop — web server with studio enhancements" \
      org.opencontainers.image.version="5.4.0" \
      org.opencontainers.image.licenses="MIT"

# Runtime-only system deps
RUN apk add --no-cache \
      dumb-init \
      curl \
      ffmpeg \
    && rm -rf /var/cache/apk/*

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NODE_ENV=production \
    PORT=3000 \
    # Configurable auto-update interval (ms)
    AUTOUPDATE_INTERVAL_MS=60000

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /build/node_modules ./node_modules

# Copy application source (excluding what's in .dockerignore)
COPY . .

# Non-root user for container security
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nodejs -u 1001 -G nodejs \
 && mkdir -p /app/uploads /app/logs /app/data \
 && chown -R nodejs:nodejs /app/uploads /app/logs /app/data /app

USER nodejs

# Persistent data volume (brass_samples.json survives restarts)
VOLUME ["/app/data"]

EXPOSE 3000

# Comprehensive health check — verifies app + circuit-breaker status
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e " \
        const h=require('http'); \
        h.get('http://localhost:3000/health',(r)=>{ \
          let d=''; \
          r.on('data',c=>d+=c); \
          r.on('end',()=>{ \
            const b=JSON.parse(d); \
            process.exit(r.statusCode===200 && b.status==='healthy' ? 0 : 1); \
          }); \
        }).on('error',()=>process.exit(1)); \
    "

# dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "web-server.js"]
