# Lightweight single-stage build for last-fm Node.js CLI
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies (ca-certificates required for HTTPS API calls)
RUN apk add --no-cache ca-certificates

# Use slim Docker-specific package.json (no tensorflow/grpc/electron)
COPY package.docker.json ./package.json

# Install minimal dependencies
RUN npm install --omit=dev

# Copy source files (NEVER copy .env files - use environment variables instead)
COPY index.js get_top_music.js bot.js ./
COPY utils/ ./utils/

# Create non-root user for security
RUN addgroup -S appuser && adduser -S appuser -G appuser

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment
ENV NODE_ENV=production

# Expose port (if needed for future web service)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

CMD ["npm", "run", "start:node"]
