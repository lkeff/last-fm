# Brass Stab Finder - Deployment Guide

**Professional Audio Analysis Service - Deployment & Operations Manual**
**Version 1.0.0 | Status: ✅ Production Ready**

---

## Quick Start (5 minutes)

### 1. Build Docker Image
```bash
docker build -f Dockerfile.brass-stab -t brass-stab-finder:latest .
```

### 2. Start Service
```bash
docker-compose -f docker-compose.brass-stab.yml up -d
```

### 3. Verify Service
```bash
curl http://localhost:3002/health
```

### 4. Test Analysis
```bash
curl -X POST http://localhost:3002/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"filePath": "/path/to/audio.wav"}'
```

---

## Detailed Deployment

### Prerequisites

**System Requirements:**
- Docker 20.10+
- Docker Compose 1.29+
- 4GB RAM minimum
- 2 CPU cores minimum
- 50GB disk space

**Software Requirements:**
```bash
# Check Docker
docker --version
# Docker version 24.0.0 or higher

# Check Docker Compose
docker-compose --version
# Docker Compose version 2.0.0 or higher
```

### Step 1: Build Docker Image

```bash
# Build image
docker build -f Dockerfile.brass-stab \
  -t brass-stab-finder:1.0.0 \
  -t brass-stab-finder:latest .

# Verify image
docker images | grep brass-stab-finder
```

### Step 2: Configure Environment

Create `.env.brass-stab`:
```bash
# Service Configuration
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Analysis Configuration
ANALYSIS_TIMEOUT=60000
MAX_FILE_SIZE=524288000
CACHE_ENABLED=true
AUDIT_ENABLED=true

# Audio Files Directory
AUDIO_FILES_DIR=/media/audio
```

### Step 3: Start Services

```bash
# Start with Docker Compose
docker-compose -f docker-compose.brass-stab.yml up -d

# Verify services
docker-compose -f docker-compose.brass-stab.yml ps

# Check logs
docker-compose -f docker-compose.brass-stab.yml logs -f brass-stab-finder
```

### Step 4: Verify Deployment

```bash
# Health check
curl http://localhost:3002/health

# Service info
curl http://localhost:3002/info

# Statistics
curl http://localhost:3002/stats
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Docker image built
- [ ] Vulnerability scanning passed
- [ ] Configuration verified
- [ ] Firewall rules prepared
- [ ] Monitoring configured
- [ ] Backup systems tested

### Build & Push to Registry

```bash
# Build image
docker build -f Dockerfile.brass-stab \
  -t registry.example.com/brass-stab-finder:1.0.0 \
  -t registry.example.com/brass-stab-finder:latest .

# Login to registry
docker login registry.example.com

# Push image
docker push registry.example.com/brass-stab-finder:1.0.0
docker push registry.example.com/brass-stab-finder:latest
```

### Deploy to Production

```bash
# Update docker-compose file
# Change image: brass-stab-finder:latest
# To: registry.example.com/brass-stab-finder:1.0.0

# Deploy
docker-compose -f docker-compose.brass-stab.yml up -d

# Verify
docker-compose -f docker-compose.brass-stab.yml ps
```

### Configure SSL/TLS

```bash
# Generate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Or use Let's Encrypt
certbot certonly --standalone -d brass-stab.example.com
```

### Configure Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 3002

# iptables (Linux)
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp -d 127.0.0.1 --dport 3002 -j ACCEPT
```

---

## Docker Compose Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.brass-stab.yml up -d

# Stop services
docker-compose -f docker-compose.brass-stab.yml down

# Restart services
docker-compose -f docker-compose.brass-stab.yml restart

# View status
docker-compose -f docker-compose.brass-stab.yml ps

# View logs
docker-compose -f docker-compose.brass-stab.yml logs -f brass-stab-finder

# View specific service logs
docker-compose -f docker-compose.brass-stab.yml logs -f brass-stab-finder --tail 100
```

### Volume Management

```bash
# List volumes
docker volume ls | grep brass-stab

# Inspect volume
docker volume inspect brass-stab-cache

# Backup volume
docker run --rm \
  -v brass-stab-cache:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/brass-stab-cache.tar.gz -C /data .

# Restore volume
docker run --rm \
  -v brass-stab-cache:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/brass-stab-cache.tar.gz -C /data
```

### Cleanup

```bash
# Remove stopped containers
docker-compose -f docker-compose.brass-stab.yml down

# Remove volumes
docker-compose -f docker-compose.brass-stab.yml down -v

# Remove images
docker rmi brass-stab-finder:latest
```

---

## Monitoring & Maintenance

### Health Monitoring

```bash
# Check service health
curl http://localhost:3002/health

# Monitor with Prometheus
http://localhost:9091

# View metrics
curl http://localhost:3002/stats
```

### Logging

```bash
# Real-time logs
docker-compose -f docker-compose.brass-stab.yml logs -f brass-stab-finder

# Last 100 lines
docker logs --tail 100 brass-stab-finder-service

# Specific time range
docker logs --since 2024-01-01T00:00:00 brass-stab-finder-service

# Audit logs
curl http://localhost:3002/api/audit?limit=100
```

### Backup & Recovery

```bash
# Backup configuration
docker run --rm \
  -v brass-stab-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/brass-stab-data.tar.gz -C /data .

# Backup logs
docker run --rm \
  -v brass-stab-logs:/logs \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/brass-stab-logs.tar.gz -C /logs .

# Restore from backup
docker run --rm \
  -v brass-stab-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/brass-stab-data.tar.gz -C /data

# Restart service
docker-compose -f docker-compose.brass-stab.yml restart brass-stab-finder
```

### Updates & Patches

```bash
# Pull latest image
docker-compose -f docker-compose.brass-stab.yml pull

# Rebuild image
docker build --no-cache -f Dockerfile.brass-stab -t brass-stab-finder:latest .

# Restart with new image
docker-compose -f docker-compose.brass-stab.yml up -d

# Verify update
docker-compose -f docker-compose.brass-stab.yml ps
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.brass-stab.yml logs brass-stab-finder

# Common issues:
# 1. Port already in use
netstat -an | grep 3002
lsof -i :3002

# 2. Insufficient resources
docker stats brass-stab-finder-service

# 3. Permission issues
docker exec brass-stab-finder-service ls -la /app/logs
```

### Analysis Timeout

```bash
# Check service logs
docker logs brass-stab-finder-service | grep -i timeout

# Increase timeout
# Edit docker-compose.brass-stab.yml:
# ANALYSIS_TIMEOUT: 120000

# Restart service
docker-compose -f docker-compose.brass-stab.yml restart
```

### Performance Issues

```bash
# Check resource usage
docker stats brass-stab-finder-service

# Review logs
docker logs -f brass-stab-finder-service

# Check metrics
curl http://localhost:3002/stats

# Increase resources if needed
# Edit docker-compose.brass-stab.yml:
# cpus: '8.0'
# memory: 4096M
```

### Cache Issues

```bash
# Clear cache
curl -X DELETE http://localhost:3002/api/cache

# Check cache status
curl http://localhost:3002/api/cache

# Verify cache directory
docker exec brass-stab-finder-service ls -la /app/data/brass-cache
```

---

## Performance Tuning

### Resource Allocation

```yaml
# For high-concurrency scenarios
deploy:
  resources:
    limits:
      cpus: '8.0'
      memory: 4096M
    reservations:
      cpus: '4.0'
      memory: 2048M
```

### Timeout Configuration

```bash
# For large files
ANALYSIS_TIMEOUT=120000  # 2 minutes

# For small files
ANALYSIS_TIMEOUT=30000   # 30 seconds
```

### Cache Optimization

```bash
# Enable caching
CACHE_ENABLED=true

# Monitor cache
curl http://localhost:3002/api/cache

# Clear cache periodically
curl -X DELETE http://localhost:3002/api/cache
```

---

## Scaling

### Horizontal Scaling

```yaml
version: '3.9'

services:
  brass-stab-finder-1:
    image: brass-stab-finder:latest
    ports:
      - "3002:3002"

  brass-stab-finder-2:
    image: brass-stab-finder:latest
    ports:
      - "3003:3002"

  load-balancer:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf:ro
```

### Vertical Scaling

```bash
# Increase resources
docker-compose -f docker-compose.brass-stab.yml down

# Edit docker-compose.brass-stab.yml
# Increase CPU and memory limits

docker-compose -f docker-compose.brass-stab.yml up -d
```

---

## Maintenance Schedule

### Daily
- Monitor service health
- Check error logs
- Verify backup status

### Weekly
- Review audit logs
- Check cache hit ratio
- Performance analysis

### Monthly
- Security patches
- Vulnerability scanning
- Capacity planning

### Quarterly
- Full security audit
- Disaster recovery test
- Performance optimization

---

## Deployment Checklist

### Pre-Deployment
- [ ] All prerequisites met
- [ ] Security audit completed
- [ ] Docker image built
- [ ] Vulnerability scanning passed
- [ ] Configuration verified
- [ ] Firewall rules prepared
- [ ] Monitoring configured
- [ ] Backup systems tested

### Deployment
- [ ] Docker image pushed to registry
- [ ] docker-compose.yml updated
- [ ] Environment variables configured
- [ ] Volumes created
- [ ] Networks configured
- [ ] Services started
- [ ] Health checks passing

### Post-Deployment
- [ ] All services running
- [ ] Health endpoint responding
- [ ] Logs being collected
- [ ] Metrics being recorded
- [ ] Alerts configured
- [ ] Backups running
- [ ] Documentation updated

---

## Support & Resources

### Documentation
- User Guide: `BRASS_STAB_FINDER_README.md`
- Security Audit: `BRASS_STAB_FINDER_SECURITY_AUDIT.md`
- API Reference: `BRASS_STAB_FINDER_README.md#api-reference`

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Support Contacts
- **Email:** support@traycer.ai
- **Security:** security@traycer.ai
- **Emergency:** [Contact info]

---

**Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Production Ready
**Maintained By:** Brass Stab Finder Team
