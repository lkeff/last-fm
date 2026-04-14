# Light Control Rig - Deployment Guide

**Professional Deployment & Operations Manual**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)
7. [Scaling](#scaling)

---

## Prerequisites

### System Requirements

**Minimum:**
- 2GB RAM
- 1 CPU core
- 10GB disk space
- Docker 20.10+
- Docker Compose 1.29+

**Recommended:**
- 4GB RAM
- 2 CPU cores
- 50GB disk space
- Docker 24.0+
- Docker Compose 2.0+

### Software Requirements

```bash
# Check Docker installation
docker --version
# Docker version 24.0.0 or higher

# Check Docker Compose installation
docker-compose --version
# Docker Compose version 2.0.0 or higher

# Check Node.js (for development)
node --version
# Node.js v18.0.0 or higher
```

### Network Requirements

- Port 3001: HTTP API (Light Control Service)
- Port 6454: Art-Net (UDP)
- Port 5568: sACN (UDP)
- Port 443: HTTPS (Nginx)
- Port 9090: Prometheus (monitoring)

### Security Requirements

- SSL/TLS certificates (for HTTPS)
- Firewall rules configured
- Network segmentation (VLAN)
- User accounts and permissions

---

## Local Development

### Setup Development Environment

1. **Clone repository**
```bash
git clone https://github.com/your-org/last-fm.git
cd last-fm
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
# Edit .env with development settings
```

4. **Start service locally**
```bash
node -e "
const LightControlService = require('./services/light-control-service');
const service = new LightControlService({
  port: 3001,
  universes: 8,
  logLevel: 'debug'
});
service.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
"
```

5. **Verify service**
```bash
curl http://localhost:3001/health
```

### Development Workflow

```bash
# Start service with auto-reload
npm install -g nodemon
nodemon -e js -x "node -e \"const LightControlService = require('./services/light-control-service'); const service = new LightControlService(); service.start();\""

# Run tests
npm test

# Lint code
npm run lint

# Check security
npm run test:security
```

---

## Docker Deployment

### Build Docker Image

1. **Build image**
```bash
docker build -f Dockerfile.light-control -t light-control:latest .
```

2. **Verify image**
```bash
docker images | grep light-control
docker inspect light-control:latest
```

3. **Test image locally**
```bash
docker run -it --rm \
  -p 3001:3001 \
  -e NODE_ENV=development \
  -e LOG_LEVEL=debug \
  light-control:latest
```

### Docker Compose Deployment

1. **Start services**
```bash
docker-compose -f docker-compose.light-control.yml up -d
```

2. **Verify services**
```bash
docker-compose -f docker-compose.light-control.yml ps
```

3. **Check logs**
```bash
docker-compose -f docker-compose.light-control.yml logs -f light-control
```

4. **Stop services**
```bash
docker-compose -f docker-compose.light-control.yml down
```

### Environment Configuration

Create `.env.light-control`:

```bash
# Service Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# DMX Configuration
UNIVERSES=8
ENABLE_ARTNET=true
ENABLE_SACN=true
ENABLE_RDM=true

# Network Configuration
VLAN_ISOLATION=true
FIREWALL_MODE=whitelist

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Security
REQUIRE_AUTH=true
TLS_ENABLED=true
TLS_CERT=/etc/ssl/certs/cert.pem
TLS_KEY=/etc/ssl/private/key.pem
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Security audit completed
- [ ] All dependencies updated
- [ ] SSL/TLS certificates generated
- [ ] Firewall rules configured
- [ ] VLAN isolation verified
- [ ] Backup systems tested
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Crew trained
- [ ] Contingency plans prepared

### Build & Push to Registry

1. **Build image**
```bash
docker build -f Dockerfile.light-control \
  -t registry.example.com/light-control:1.0.0 \
  -t registry.example.com/light-control:latest \
  .
```

2. **Login to registry**
```bash
docker login registry.example.com
```

3. **Push image**
```bash
docker push registry.example.com/light-control:1.0.0
docker push registry.example.com/light-control:latest
```

### Deploy to Production

1. **Update docker-compose file**
```yaml
services:
  light-control:
    image: registry.example.com/light-control:1.0.0
    # ... rest of configuration
```

2. **Deploy**
```bash
docker-compose -f docker-compose.light-control.yml up -d
```

3. **Verify deployment**
```bash
# Check service status
docker-compose -f docker-compose.light-control.yml ps

# Check health
curl https://light-control.example.com/health

# Check logs
docker-compose -f docker-compose.light-control.yml logs -f light-control
```

### SSL/TLS Configuration

1. **Generate certificates**
```bash
# Self-signed (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem

# Let's Encrypt (production)
certbot certonly --standalone -d light-control.example.com
```

2. **Configure Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name light-control.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://light-control:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 443/tcp
sudo ufw allow 6454/udp
sudo ufw allow 5568/udp
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 3001

# iptables (Linux)
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 6454 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 5568 -j ACCEPT
sudo iptables -A INPUT -p tcp -d 127.0.0.1 --dport 3001 -j ACCEPT
```

---

## Monitoring & Maintenance

### Health Monitoring

1. **Check service health**
```bash
curl https://light-control.example.com/health
```

2. **Monitor with Prometheus**
```bash
# Access Prometheus
http://localhost:9090

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=light_control_dmx_updates_total'
```

3. **View logs**
```bash
# Real-time logs
docker-compose -f docker-compose.light-control.yml logs -f light-control

# Last 100 lines
docker logs --tail 100 light-control-service

# Specific time range
docker logs --since 2024-01-01T00:00:00 light-control-service
```

### Backup & Recovery

1. **Backup configuration**
```bash
# Backup volumes
docker run --rm \
  -v light-control-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/light-control-data.tar.gz -C /data .

# Backup logs
docker run --rm \
  -v light-control-logs:/logs \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/light-control-logs.tar.gz -C /logs .
```

2. **Restore from backup**
```bash
# Restore data
docker run --rm \
  -v light-control-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/light-control-data.tar.gz -C /data

# Restart service
docker-compose -f docker-compose.light-control.yml restart light-control
```

### Updates & Patches

1. **Update Docker image**
```bash
# Pull latest image
docker pull registry.example.com/light-control:latest

# Update docker-compose
docker-compose -f docker-compose.light-control.yml pull

# Restart service
docker-compose -f docker-compose.light-control.yml up -d
```

2. **Security patches**
```bash
# Check for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image light-control:latest

# Update base image
docker build --no-cache -f Dockerfile.light-control -t light-control:latest .
```

### Regular Maintenance

**Weekly:**
- Review logs for errors
- Check disk usage
- Verify backups
- Monitor metrics

**Monthly:**
- Security patches
- Vulnerability scan
- Performance review
- Capacity planning

**Quarterly:**
- Full system test
- Disaster recovery drill
- Security audit
- Documentation update

**Annually:**
- Complete security assessment
- Hardware evaluation
- Capacity upgrade planning
- Policy review

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.light-control.yml logs light-control

# Common issues:
# 1. Port already in use
netstat -an | grep 3001
lsof -i :3001

# 2. Insufficient resources
docker stats light-control-service

# 3. Permission issues
docker exec light-control-service ls -la /app/logs
```

### DMX Not Updating

```bash
# Check universe status
curl http://localhost:3001/api/universes

# Check fixtures
curl http://localhost:3001/api/fixtures

# Verify network
docker exec light-control-service ping <dmx-interface-ip>

# Check DMX cables
# - Verify XLR 5-pin connections
# - Check for cable damage
# - Test with backup interface
```

### Performance Issues

```bash
# Check resource usage
docker stats light-control-service

# Review logs
docker logs -f light-control-service

# Check metrics
curl 'http://localhost:9090/api/v1/query?query=light_control_dmx_updates_total'

# Increase resources if needed
# Edit docker-compose.light-control.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '4.0'
#       memory: 2048M
```

### Network Issues

```bash
# Check network connectivity
docker network inspect light-control-network

# Test DNS resolution
docker exec light-control-service nslookup light-control

# Check firewall rules
sudo ufw status
sudo iptables -L

# Verify VLAN configuration
# Check switch configuration
# Verify IP addresses
```

---

## Scaling

### Horizontal Scaling

For multiple venues or large installations:

```yaml
version: '3.9'

services:
  light-control-1:
    image: light-control:latest
    environment:
      INSTANCE_ID: 1
      UNIVERSES: 8
    ports:
      - "3001:3001"

  light-control-2:
    image: light-control:latest
    environment:
      INSTANCE_ID: 2
      UNIVERSES: 8
    ports:
      - "3002:3001"

  load-balancer:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf:ro
```

### Vertical Scaling

For increased capacity:

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 2048M
    reservations:
      cpus: '2.0'
      memory: 1024M
```

### Database Scaling

For persistent storage:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: light_control
      POSTGRES_USER: lightcontrol
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

---

## Advanced Configuration

### Custom Network Setup

```yaml
networks:
  light-control-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br-light
    ipam:
      config:
        - subnet: 172.25.0.0/16
          gateway: 172.25.0.1
```

### Volume Management

```yaml
volumes:
  light-control-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=nfs-server.example.com,vers=4,soft,timeo=180,bg,tcp,rw
      device: ":/export/light-control-data"
```

### Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
    labels: "light-control"
    tag: "{{.ImageName}}|{{.Name}}|{{.ImageID}}|{{.ContainerID}}"
```

---

## Support & Resources

### Documentation
- User Guide: `LIGHT_CONTROL_README.md`
- Integration Guide: `LIGHT_CONTROL_INTEGRATION.md`
- Security Audit: `LIGHT_CONTROL_SECURITY_AUDIT.md`

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ETC Eos Documentation](https://www.etcconnect.com/)
- [Art-Net Protocol](https://art-net.org.uk/)

### Support Contacts
- **Email:** support@traycer.ai
- **Security:** security@traycer.ai
- **Emergency:** +1-XXX-XXX-XXXX

---

## Deployment Checklist

### Pre-Deployment
- [ ] All prerequisites met
- [ ] Security audit completed
- [ ] SSL/TLS certificates ready
- [ ] Firewall rules prepared
- [ ] Backup systems tested
- [ ] Monitoring configured
- [ ] Documentation reviewed

### Deployment
- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] docker-compose.yml updated
- [ ] Environment variables configured
- [ ] Volumes created
- [ ] Networks configured
- [ ] Services started
- [ ] Health checks passing

### Post-Deployment
- [ ] All services responding
- [ ] Logs being collected
- [ ] Metrics being recorded
- [ ] Alerts configured
- [ ] Backups running
- [ ] Security monitoring enabled
- [ ] Crew trained
- [ ] Documentation updated

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
