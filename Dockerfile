# Lightweight single-stage build for last-fm Node.js CLI
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies (ca-certificates required for HTTPS API calls)
RUN apk add --no-cache ca-certificates

# Use slim Docker-specific package.json (no tensorflow/grpc/electron)
COPY package.docker.json ./package.json

# Install minimal dependencies
RUN npm install --omit=dev

# Copy source files
COPY index.js get_top_music.js bot.js ./
COPY utils/ ./utils/
COPY .env* ./

# Set environment
ENV NODE_ENV=production

CMD ["npm", "run", "start:node"]
