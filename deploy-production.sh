#!/bin/bash

# Production Deployment Script for Last.fm Desktop
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
PROJECT_NAME="lastfm"
BACKUP_DIR="/opt/backups/${PROJECT_NAME}"
LOG_FILE="/var/log/${PROJECT_NAME}-deploy.log"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed"
    exit 1
fi

# Create backup directory
create_backup() {
    log "Creating backup..."
    
    mkdir -p "${BACKUP_DIR}"
    BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}"
    
    # Backup current running containers
    if docker-compose ps | grep -q "Up"; then
        docker-compose exec -T lastfm tar -czf /tmp/data_backup.tar.gz /app/uploads /app/logs 2>/dev/null || true
        docker cp $(docker-compose ps -q lastfm):/tmp/data_backup.tar.gz "${BACKUP_PATH}/" 2>/dev/null || true
    fi
    
    # Backup environment files
    cp .env.production "${BACKUP_PATH}/" 2>/dev/null || warning "No .env.production found"
    cp docker-compose.production.yml "${BACKUP_PATH}/" 2>/dev/null || warning "No docker-compose.production.yml found"
    
    success "Backup created at ${BACKUP_PATH}"
}

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check required files
    local required_files=(
        ".env.production"
        "docker-compose.production.yml"
        "Dockerfile"
        "nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Required file $file not found"
            exit 1
        fi
    done
    
    # Check environment variables
    if ! grep -q "LASTFM_API_KEY=" .env.production || grep -q "your_production_lastfm_api_key_here" .env.production; then
        error "LASTFM_API_KEY not properly configured in .env.production"
        exit 1
    fi
    
    if ! grep -q "FREESOUND_API_KEY=" .env.production || grep -q "your_production_freesound_api_key_here" .env.production; then
        error "FREESOUND_API_KEY not properly configured in .env.production"
        exit 1
    fi
    
    success "Environment validation passed"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.production.yml down || true
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f docker-compose.production.yml pull
    
    # Build application image
    log "Building application image..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Start services
    log "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check if main service is running
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            success "Main service is healthy"
            
            # Check API endpoints
            if curl -f -s "http://localhost:3000/api/search?q=test" > /dev/null 2>&1; then
                success "API search endpoint is healthy"
            else
                warning "API search endpoint not responding"
            fi
            
            if curl -f -s "http://localhost:3000/api/studio/rig" > /dev/null 2>&1; then
                success "Studio rig endpoint is healthy"
            else
                warning "Studio rig endpoint not responding"
            fi
            
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health check failed after $max_attempts attempts"
            docker-compose -f docker-compose.production.yml logs lastfm
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused networks
    docker network prune -f
    
    success "Cleanup completed"
}

# Show status
show_status() {
    log "Deployment status:"
    echo
    docker-compose -f docker-compose.production.yml ps
    echo
    log "Service URLs:"
    echo "  Main Application: http://localhost:3000"
    echo "  Nginx (if enabled): http://localhost"
    echo "  Redis: localhost:6379"
    echo "  Grafana (if enabled): http://localhost:3001"
    echo "  Prometheus (if enabled): http://localhost:9090"
}

# Main deployment flow
main() {
    log "Starting production deployment for Last.fm Desktop..."
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Execute deployment steps
    validate_environment
    create_backup
    deploy
    health_check
    cleanup
    show_status
    
    success "🎉 Production deployment completed successfully!"
    log "Deployment logged to $LOG_FILE"
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@" | tee -a "$LOG_FILE"
