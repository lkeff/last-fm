#!/bin/bash

# Last.fm Desktop - Production Startup Script
# This script prepares and starts the application in production mode

set -e

echo "🚀 Starting Last.fm Desktop Application..."
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.example to .env and configure your API keys."
    exit 1
fi

# Check API keys
if ! grep -q "LASTFM_API_KEY=cc4aa3cf2f0ba5746cf4a8d683a71bd5" .env; then
    echo "⚠️  Warning: Last.fm API key may not be configured"
fi

if grep -q "FREESOUND_API_KEY=YOUR_FREESOUND_API_KEY" .env; then
    echo "⚠️  Warning: Freesound API key not configured"
fi

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node web-server.js" || true
pkill -f "electron" || true

# Check if Docker is available and running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "🐳 Docker detected - attempting container deployment..."
    
    # Try Docker Compose first
    if command -v docker-compose &> /dev/null; then
        echo "📦 Building and starting with Docker Compose..."
        docker-compose -f docker-compose.local.yml up -d --build || {
            echo "⚠️  Docker build failed, falling back to local deployment..."
            docker_available=false
        }
    else
        echo "⚠️  Docker Compose not found, using local deployment..."
        docker_available=false
    fi
else
    echo "🖥️  Docker not available, using local deployment..."
    docker_available=false
fi

# Local deployment fallback
if [ "$docker_available" = false ]; then
    echo "🖥️  Starting local web server..."
    
    # Install dependencies if needed
    if [ ! -d node_modules ]; then
        echo "📦 Installing dependencies..."
        pnpm install || npm install
    fi
    
    # Start the web server
    echo "🌐 Starting web server on port 3000..."
    node web-server.js &
    WEB_SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Health check
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Web server is healthy and running!"
        echo "🌐 Application available at: http://localhost:3000"
    else
        echo "❌ Web server failed to start properly"
        exit 1
    fi
fi

echo ""
echo "🎉 Last.fm Desktop Application is ready!"
echo "=========================================="
echo "📍 Access URLs:"
echo "   • Local: http://localhost:3000"
echo "   • Docker: http://localhost:3001 (if available)"
echo ""
echo "🔧 Features available:"
echo "   • Artist Search"
echo "   • Track Search" 
echo "   • Top Charts"
echo "   • Health Check: /health"
echo ""
echo "📝 To stop the application:"
if [ "$docker_available" = false ]; then
    echo "   kill $WEB_SERVER_PID"
else
    echo "   docker-compose -f docker-compose.local.yml down"
fi
echo ""
echo "🔍 Logs:"
if [ "$docker_available" = false ]; then
    echo "   Check the terminal output or logs/ directory"
else
    echo "   docker-compose -f docker-compose.local.yml logs -f"
fi
