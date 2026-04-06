#!/bin/bash

# Last.fm Docker Deployment Script
# Production deployment with security best practices

set -e  # Exit on any error

echo "🚀 Starting Last.fm deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with LASTFM_API_KEY"
    exit 1
fi

# Check if API key is set
if ! grep -q "LASTFM_API_KEY=" .env || [ -z "$(grep "LASTFM_API_KEY=" .env | cut -d'=' -f2)" ]; then
    echo "❌ Error: LASTFM_API_KEY not properly configured in .env"
    echo ""
    echo "📝 To fix this issue:"
    echo "1. Get your API key from: https://www.last.fm/api/account/create"
    echo "2. Edit .env file and add your key after LASTFM_API_KEY="
    echo "3. Run this script again"
    echo ""
    echo "Example: LASTFM_API_KEY=abc123def456ghi789"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs config

# Build and start production container
echo "🔨 Building Docker image..."
docker-compose build --no-cache

echo "🚢 Starting production container..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for application to be healthy..."
timeout 60 bash -c 'until docker-compose exec lastfm node healthcheck.js; do sleep 2; done'

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful! Application is healthy."
    echo "🌐 Application available at: http://localhost:3000"
else
    echo "❌ Deployment failed - health check timeout"
    echo "📋 Checking logs..."
    docker-compose logs lastfm
    exit 1
fi

echo "🎉 Deployment complete!"
