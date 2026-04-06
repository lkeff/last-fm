#!/bin/bash

# Production Deployment Script for Last.fm Application
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
IMAGE_NAME="last-fm:${ENVIRONMENT}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Last.fm Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_info "✓ Docker and Docker Compose are installed"

# Check environment variables
print_info "Checking environment variables..."

if [ -z "$LASTFM_API_KEY" ]; then
    print_error "LASTFM_API_KEY environment variable is not set!"
    echo ""
    echo "Please set your API key:"
    echo "  export LASTFM_API_KEY=your_api_key_here"
    echo ""
    echo "Get an API key at: https://www.last.fm/api/account/create"
    exit 1
fi

print_info "✓ LASTFM_API_KEY is set"

if [ -z "$FREESOUND_API_KEY" ]; then
    print_warning "FREESOUND_API_KEY is not set (optional)"
else
    print_info "✓ FREESOUND_API_KEY is set"
fi

# Security check: Ensure .env is not in the image
print_info "Running security checks..."

if [ -f ".env" ]; then
    print_warning ".env file exists in the project directory"
    print_warning "Make sure it's in .gitignore and .dockerignore"
fi

# Check .dockerignore
if grep -q "^\.env$" .dockerignore 2>/dev/null; then
    print_info "✓ .env is excluded in .dockerignore"
else
    print_error ".env is NOT excluded in .dockerignore!"
    exit 1
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    print_info "✓ .env is excluded in .gitignore"
else
    print_warning ".env might not be excluded in .gitignore"
fi

# Create necessary directories
print_info "Creating data directories..."
mkdir -p data logs
chmod 755 data logs
print_info "✓ Directories created"

# Build the Docker image
print_info "Building Docker image..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

if [ $? -eq 0 ]; then
    print_info "✓ Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Verify security in built image
print_info "Verifying security in Docker image..."

# Build a temporary container to check
TEMP_CONTAINER=$(docker create "$IMAGE_NAME")

# Check for .env in image
if docker export "$TEMP_CONTAINER" | tar -t | grep -q "^\.env$"; then
    print_error "SECURITY ISSUE: .env file found in Docker image!"
    docker rm "$TEMP_CONTAINER"
    exit 1
else
    print_info "✓ No .env file in Docker image"
fi

docker rm "$TEMP_CONTAINER" > /dev/null

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Start the application
print_info "Starting application..."
docker-compose -f "$COMPOSE_FILE" up -d

if [ $? -eq 0 ]; then
    print_info "✓ Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Wait for health check
print_info "Waiting for health check..."
sleep 10

# Check container status
CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' last-fm-prod 2>/dev/null)

if [ "$CONTAINER_STATUS" == "running" ]; then
    print_info "✓ Container is running"
else
    print_error "Container is not running (status: $CONTAINER_STATUS)"
    print_info "Showing logs:"
    docker-compose -f "$COMPOSE_FILE" logs
    exit 1
fi

# Verify non-root user
CONTAINER_USER=$(docker exec last-fm-prod whoami 2>/dev/null)
if [ "$CONTAINER_USER" == "appuser" ]; then
    print_info "✓ Container is running as non-root user (appuser)"
else
    print_warning "Container might be running as root (user: $CONTAINER_USER)"
fi

# Display status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Container Status:"
docker-compose -f "$COMPOSE_FILE" ps
echo ""
echo "Useful Commands:"
echo "  View logs:      docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop app:       docker-compose -f $COMPOSE_FILE down"
echo "  Restart app:    docker-compose -f $COMPOSE_FILE restart"
echo "  Check health:   docker inspect --format='{{.State.Health.Status}}' last-fm-prod"
echo ""
echo -e "${GREEN}Application is now running!${NC}"
echo ""

# Optional: Run smoke tests
read -p "Run smoke tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running smoke tests..."
    
    # Test 1: Container is running
    if docker ps | grep -q last-fm-prod; then
        print_info "✓ Container is running"
    else
        print_error "✗ Container is not running"
    fi
    
    # Test 2: Health check
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' last-fm-prod 2>/dev/null)
    if [ "$HEALTH_STATUS" == "healthy" ] || [ "$HEALTH_STATUS" == "starting" ]; then
        print_info "✓ Health check: $HEALTH_STATUS"
    else
        print_warning "⚠ Health check: $HEALTH_STATUS"
    fi
    
    # Test 3: No errors in logs
    if docker-compose -f "$COMPOSE_FILE" logs | grep -i error | grep -v "0 errors"; then
        print_warning "⚠ Errors found in logs"
    else
        print_info "✓ No errors in logs"
    fi
    
    echo ""
    print_info "Smoke tests complete!"
fi

echo ""
print_info "For production checklist, see: PRODUCTION_CHECKLIST.md"
print_info "For deployment guide, see: DEPLOYMENT.md"
print_info "For security guide, see: SECURITY_PRODUCTION.md"
echo ""
