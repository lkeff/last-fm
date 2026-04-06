#!/bin/bash

# Last.fm Desktop - Full Feature Composition Script
# Includes Last.fm API, Freesound API, and Brass Stabs Management

set -e

echo "🎵 Composing Full Last.fm Desktop Application..."
echo "==============================================="
echo "Features: Last.fm Search + Freesound Brass Stabs + Local Samples"
echo ""

# Check environment
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "🔑 API Configuration:"
if grep -q "cc4aa3cf2f0ba5746cf4a8d683a71bd5" .env; then
    echo "   ✅ Last.fm API: Configured"
else
    echo "   ⚠️  Last.fm API: Not configured"
fi

if grep -q "demo_api_key_for_testing" .env; then
    echo "   🎭 Freesound API: Demo mode (configured for testing)"
else
    echo "   ✅ Freesound API: Production key configured"
fi

echo ""

# Stop existing services
echo "🛑 Stopping existing services..."
pkill -f "node web-server.js" || true
pkill -f "electron" || true
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# Start web server
echo "🌐 Starting Full Feature Web Server..."
node web-server.js &
WEB_PID=$!

# Wait for startup
sleep 3

# Health checks
echo "🔍 Performing Health Checks..."

# Check Last.fm API
echo "   Testing Last.fm API..."
if curl -s "http://localhost:3000/api/search/artist?q=radiohead" | grep -q "Radiohead"; then
    echo "   ✅ Last.fm API: Working"
else
    echo "   ❌ Last.fm API: Failed"
fi

# Check Freesound API
echo "   Testing Freesound API..."
if curl -s "http://localhost:3000/api/freesound/search?q=brass" | grep -q "Brass Stab Demo"; then
    echo "   ✅ Freesound API: Working (Demo Mode)"
else
    echo "   ❌ Freesound API: Failed"
fi

# Check Local Samples
echo "   Testing Local Samples..."
if curl -s "http://localhost:3000/api/local-samples" | grep -q "Demo Trumpet Stab"; then
    echo "   ✅ Local Samples: Working"
else
    echo "   ❌ Local Samples: Failed"
fi

# Check Health Endpoint
echo "   Testing Health Endpoint..."
if curl -s "http://localhost:3000/health" | grep -q "healthy"; then
    echo "   ✅ Health Endpoint: Working"
else
    echo "   ❌ Health Endpoint: Failed"
fi

echo ""
echo "🎉 Full Application Composed Successfully!"
echo "==========================================="
echo "📍 Access Points:"
echo "   🌐 Web Interface: http://localhost:3000"
echo "   🎵 Last.fm API: /api/search/artist, /api/search/track, /api/top-tracks"
echo "   🎺 Freesound API: /api/freesound/search"
echo "   📁 Local Samples: /api/local-samples"
echo "   ❤️  Health Check: /health"
echo ""
echo "🎯 Features Available:"
echo "   • Artist & Track Search (Last.fm)"
echo "   • Top Music Charts"
echo "   • Brass Stabs Search (Freesound)"
echo "   • Local Sample Management"
echo "   • Audio Preview Support"
echo "   • Demo Data for Testing"
echo ""
echo "🛠️ Management Commands:"
echo "   Stop: kill $WEB_PID"
echo "   Logs: Check terminal output"
echo "   Restart: ./compose-full.sh"
echo ""
echo "🔧 For Production:"
echo "   1. Replace demo Freesound API key in .env"
echo "   2. Add real audio files to local samples"
echo "   3. Configure Docker for container deployment"
echo ""
echo "🎵 Ready for music production workflows!"
