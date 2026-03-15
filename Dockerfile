# Production stage for Last.fm API library and scripts
FROM node:18-slim

WORKDIR /app

# Copy minimal package file for Docker (without heavy dependencies like grpc/tensorflow)
COPY package.docker.json package.json

# Install only the minimal dependencies needed for the Last.fm client
RUN npm install --omit=dev --no-package-lock

# Copy source files
COPY index.js ./
COPY bot.js ./
COPY get_top_music.js ./
COPY .env.example ./.env.example

# Set environment variables
ENV NODE_ENV=production

# Default command runs get_top_music.js
# Override with: docker run <image> node bot.js
CMD ["node", "get_top_music.js"]
