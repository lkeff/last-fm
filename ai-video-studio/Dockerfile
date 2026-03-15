# Build stage
FROM node:18-alpine AS builder

# Install Python and build tools for node-gyp
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies including gRPC deps
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    git \
    # gRPC dependencies
    protobuf \
    grpc

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Rebuild grpc with the correct bindings
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env* ./

# Set environment variables
ENV NODE_ENV=production
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV TF_FORCE_GPU_ALLOW_GROWTH=true

# Expose the app port
EXPOSE 4000

# Start the application
CMD ["node", "dist/index.js"]