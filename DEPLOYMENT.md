# Production Deployment Guide

This guide covers deploying the Last.fm application to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Security Checklist](#security-checklist)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Docker** 20.10+ and Docker Compose 2.0+
- **Last.fm API Key** - Get one at https://www.last.fm/api/account/create
- **Server** with at least 512MB RAM and 1 CPU core

### Optional

- **Freesound API Key** - For audio sample features
- **Domain name** - For HTTPS access
- **SSL Certificate** - Let's Encrypt recommended
- **Reverse proxy** - Nginx or Traefik

---

## Security Checklist

Before deploying to production, ensure you've completed these security steps:

### ✅ Critical Security Steps

- [ ] **Revoke any exposed API keys** from git history
- [ ] **Generate new API keys** for production use
- [ ] **Never commit `.env` files** to version control
- [ ] **Use environment variables** instead of .env files in containers
- [ ] **Enable HTTPS** with valid SSL certificates
- [ ] **Bind ports to localhost** (127.0.0.1) and use reverse proxy
- [ ] **Run containers as non-root user** (already configured)
- [ ] **Enable security options** in docker-compose (already configured)
- [ ] **Set resource limits** to prevent DoS
- [ ] **Enable logging** and monitoring

### 🔐 API Key Management

**NEVER** do this:
```bash
# ❌ DON'T copy .env into Docker images
COPY .env ./

# ❌ DON'T commit .env to git
git add .env
```

**ALWAYS** do this:
```bash
# ✅ Use environment variables
export LASTFM_API_KEY=your_production_key
docker-compose up -d

# ✅ Or use Docker secrets (Swarm/Kubernetes)
docker secret create lastfm_api_key -
```

---

## Deployment Options

### 1. Docker Compose (Recommended for Single Server)

Best for: Small to medium deployments, single server

```bash
# Set environment variables
export LASTFM_API_KEY=your_api_key_here
export FREESOUND_API_KEY=your_freesound_key_here

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### 2. Docker Swarm

Best for: Multi-server deployments, high availability

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "your_api_key" | docker secret create lastfm_api_key -

# Deploy stack
docker stack deploy -c docker-compose.prod.yml last-fm

# Check services
docker service ls
```

### 3. Kubernetes

Best for: Large-scale deployments, auto-scaling

See [Kubernetes Deployment](#kubernetes-deployment) section below.

---

## Docker Deployment

### Step 1: Prepare Environment

```bash
# Clone repository
git clone https://github.com/feross/last-fm.git
cd last-fm

# Create data directories
mkdir -p data logs

# Set permissions
chmod 755 data logs
```

### Step 2: Configure Environment Variables

Create a shell script to set environment variables (don't commit this):

```bash
# production-env.sh (add to .gitignore)
export LASTFM_API_KEY=your_production_api_key
export FREESOUND_API_KEY=your_freesound_api_key
export PORT=3000
export LOG_LEVEL=info
export NODE_ENV=production
```

Load it before deployment:
```bash
source production-env.sh
```

### Step 3: Build and Deploy

```bash
# Build the image
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

### Step 4: Verify Security

```bash
# Check container is running as non-root
docker exec last-fm-prod whoami
# Should output: appuser

# Verify no .env in container
docker exec last-fm-prod ls -la | grep .env
# Should return nothing

# Check resource limits
docker stats last-fm-prod
```

### Step 5: Setup Reverse Proxy (Nginx)

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream last-fm {
        server last-fm:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://last-fm;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://last-fm;
        }
    }
}
```

---

## Kubernetes Deployment

### Create Kubernetes Manifests

**1. Secret for API Keys:**

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: last-fm-secrets
type: Opaque
stringData:
  LASTFM_API_KEY: your_api_key_here
  FREESOUND_API_KEY: your_freesound_key_here
```

**2. Deployment:**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: last-fm
  labels:
    app: last-fm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: last-fm
  template:
    metadata:
      labels:
        app: last-fm
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: last-fm
        image: ghcr.io/your-org/last-fm:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: last-fm-secrets
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "500m"
            memory: "256Mi"
        livenessProbe:
          exec:
            command:
            - node
            - -e
            - console.log('healthy')
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          exec:
            command:
            - node
            - -e
            - console.log('ready')
          initialDelaySeconds: 5
          periodSeconds: 10
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
```

**3. Service:**

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: last-fm
spec:
  selector:
    app: last-fm
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Deploy to Kubernetes:**

```bash
# Create namespace
kubectl create namespace last-fm

# Apply secrets (use sealed-secrets in production)
kubectl apply -f k8s/secret.yaml -n last-fm

# Deploy application
kubectl apply -f k8s/deployment.yaml -n last-fm
kubectl apply -f k8s/service.yaml -n last-fm

# Check status
kubectl get pods -n last-fm
kubectl logs -f deployment/last-fm -n last-fm
```

---

## Cloud Platforms

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker build -t last-fm .
docker tag last-fm:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/last-fm:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/last-fm:latest

# Create task definition and service via AWS Console or CLI
```

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/last-fm
gcloud run deploy last-fm \
  --image gcr.io/PROJECT-ID/last-fm \
  --platform managed \
  --region us-central1 \
  --set-env-vars LASTFM_API_KEY=your_key
```

### Azure Container Instances

```bash
# Create container instance
az container create \
  --resource-group myResourceGroup \
  --name last-fm \
  --image ghcr.io/your-org/last-fm:latest \
  --dns-name-label last-fm-app \
  --ports 3000 \
  --environment-variables LASTFM_API_KEY=your_key NODE_ENV=production
```

### Heroku

```bash
# Login and create app
heroku login
heroku create last-fm-app

# Set environment variables
heroku config:set LASTFM_API_KEY=your_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

---

## Monitoring & Logging

### Docker Logs

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Export logs
docker-compose -f docker-compose.prod.yml logs > logs/deployment.log
```

### Prometheus Metrics (Optional)

Add to your application:

```javascript
// Add prometheus client
const prometheus = require('prom-client');
const register = new prometheus.Registry();

// Collect default metrics
prometheus.collectDefaultMetrics({ register });

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Health Checks

The application includes built-in health checks:

```bash
# Check health
curl http://localhost:3000/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' last-fm-prod
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs last-fm-prod

# Common issues:
# 1. Missing API key
export LASTFM_API_KEY=your_key

# 2. Port already in use
docker-compose -f docker-compose.prod.yml down
lsof -i :3000

# 3. Permission issues
sudo chown -R 1000:1000 data logs
```

### API Key Not Working

```bash
# Verify environment variable is set
docker exec last-fm-prod printenv | grep LASTFM_API_KEY

# Test API key manually
curl "http://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=YOUR_KEY&format=json"
```

### Memory Issues

```bash
# Check memory usage
docker stats last-fm-prod

# Increase memory limit in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 1G
```

### Network Issues

```bash
# Check network connectivity
docker exec last-fm-prod ping -c 3 ws.audioscrobbler.com

# Verify DNS resolution
docker exec last-fm-prod nslookup ws.audioscrobbler.com
```

---

## Backup and Recovery

### Backup Data

```bash
# Backup volumes
docker run --rm \
  -v last-fm-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/data-$(date +%Y%m%d).tar.gz /data

# Backup logs
docker run --rm \
  -v last-fm-logs:/logs \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/logs-$(date +%Y%m%d).tar.gz /logs
```

### Restore Data

```bash
# Restore from backup
docker run --rm \
  -v last-fm-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/data-20260406.tar.gz -C /
```

---

## Performance Optimization

### Enable Caching

```bash
export ENABLE_CACHE=true
export CACHE_TTL=3600  # 1 hour
```

### Use CDN

Configure Cloudflare or similar CDN for static assets and API caching.

### Scale Horizontally

```bash
# Docker Compose
docker-compose -f docker-compose.prod.yml up -d --scale last-fm=3

# Kubernetes
kubectl scale deployment last-fm --replicas=5 -n last-fm
```

---

## Security Best Practices

1. **Rotate API Keys Regularly** - Every 90 days minimum
2. **Use Secrets Management** - AWS Secrets Manager, HashiCorp Vault, etc.
3. **Enable Rate Limiting** - Protect against abuse
4. **Monitor Access Logs** - Detect suspicious activity
5. **Keep Dependencies Updated** - Run `npm audit` regularly
6. **Use HTTPS Only** - No plain HTTP in production
7. **Implement CORS** - Restrict API access to known domains
8. **Enable Security Headers** - CSP, HSTS, X-Frame-Options, etc.

---

## Support

- **Issues:** https://github.com/feross/last-fm/issues
- **Security:** security@traycer.ai
- **Documentation:** https://github.com/feross/last-fm

---

**Last Updated:** April 6, 2026  
**Version:** 5.3.0
