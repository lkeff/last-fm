# Last.fm Node.js Application — Production Ready with SA Orchestra & Claude Thinking
# syntax=docker/dockerfile:1
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# ─── pnpm injection via corepack (no npm install -g) ─────────────────────────
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# Set working directory
WORKDIR /app

# Copy package files first for layer-caching
COPY package.json pnpm-lock.yaml ./

# Install production dependencies
# --no-frozen-lockfile because @anthropic-ai/sdk and discord.js were added
# and pnpm-lock.yaml may not yet reflect the new deps in CI.
# Switch back to --frozen-lockfile after running `pnpm install` locally.
RUN pnpm install --prod --no-frozen-lockfile && pnpm store prune

# Copy application code with all enhancements
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app/uploads /app/logs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose application port
EXPOSE 3000

# Enhanced health check with multiple endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start application with dumb-init and production optimizations
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "web-server.js"]
