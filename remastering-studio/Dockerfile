FROM node:18-slim

# Install FFmpeg and other dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Create temp directory for audio processing
RUN mkdir -p /app/temp

# Copy source code
COPY . .

# Expose the app port
EXPOSE 4001

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
