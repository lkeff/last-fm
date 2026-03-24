# Multi-stage build for last-fm (Node.js)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy package files
COPY package*.json yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build (if needed)
RUN npm run build 2>/dev/null || true

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libx11 \
    libxrandr \
    libxinerama \
    libxcursor \
    libxi \
    mesa-gl \
    libxss \
    ca-certificates

# Copy package files
COPY package*.json yarn.lock* pnpm-lock.yaml* ./

# Install production dependencies
RUN npm install --prod

# Copy built artifacts
COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app .

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "start:node"]
