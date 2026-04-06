# Production Deployment Checklist

Use this checklist before deploying to production to ensure security and reliability.

## 🔐 Security

### API Keys & Secrets
- [ ] Generated new production API keys (not reusing development keys)
- [ ] Stored API keys in secure environment variables (not in .env files)
- [ ] Verified `.env` files are in `.gitignore`
- [ ] Confirmed no secrets in git history (`git log --all --full-history -- .env`)
- [ ] Revoked any previously exposed API keys
- [ ] Set up secrets rotation schedule (every 90 days)

### Docker Security
- [ ] Verified `.dockerignore` excludes `.env` files
- [ ] Confirmed Dockerfile doesn't copy `.env` files
- [ ] Container runs as non-root user (appuser)
- [ ] Security options enabled (`no-new-privileges`, `cap_drop`)
- [ ] Read-only root filesystem configured
- [ ] Resource limits set (CPU, memory)
- [ ] Scanned image for vulnerabilities (`docker scan` or Trivy)

### Network Security
- [ ] Ports bound to localhost only (127.0.0.1)
- [ ] Reverse proxy configured (Nginx/Traefik)
- [ ] HTTPS/TLS enabled with valid certificates
- [ ] SSL/TLS configuration tested (SSL Labs)
- [ ] CORS configured with specific origins (not `*`)
- [ ] Rate limiting enabled
- [ ] Firewall rules configured

### Application Security
- [ ] Security headers enabled (Helmet.js)
- [ ] Content Security Policy (CSP) configured
- [ ] Input validation implemented
- [ ] SQL injection protection (if using database)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled (if applicable)
- [ ] Dependencies updated (`npm audit fix`)
- [ ] No known vulnerabilities (`npm audit`)

## 🚀 Deployment

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Linting checks passing
- [ ] Build successful locally
- [ ] Docker image builds successfully
- [ ] Environment variables documented
- [ ] Deployment plan documented

### Infrastructure
- [ ] Server/VM provisioned with adequate resources
- [ ] Docker and Docker Compose installed
- [ ] Persistent volumes configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Monitoring tools installed
- [ ] Logging configured

### Configuration
- [ ] Production environment variables set
- [ ] `NODE_ENV=production` configured
- [ ] Log level set appropriately
- [ ] Cache configuration optimized
- [ ] Database connection configured (if applicable)
- [ ] External services configured

### Deployment Process
- [ ] Deployment script tested
- [ ] Rollback plan prepared
- [ ] Maintenance window scheduled (if needed)
- [ ] Stakeholders notified
- [ ] Deployment executed
- [ ] Health checks passing
- [ ] Smoke tests completed

## 📊 Monitoring & Logging

### Monitoring
- [ ] Health check endpoint configured
- [ ] Uptime monitoring enabled (UptimeRobot, Pingdom, etc.)
- [ ] Performance monitoring configured (New Relic, Datadog, etc.)
- [ ] Error tracking enabled (Sentry, Rollbar, etc.)
- [ ] Resource usage monitoring (CPU, memory, disk)
- [ ] Alert thresholds configured
- [ ] On-call rotation established

### Logging
- [ ] Application logs configured
- [ ] Log rotation enabled
- [ ] Log aggregation configured (ELK, Splunk, etc.)
- [ ] Sensitive data scrubbed from logs
- [ ] Log retention policy set
- [ ] Log backup configured

## 🔄 Operational

### Documentation
- [ ] README updated with production instructions
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Troubleshooting guide available
- [ ] Architecture diagrams updated
- [ ] Runbook created

### Backup & Recovery
- [ ] Backup schedule configured
- [ ] Backup verification tested
- [ ] Restore procedure documented
- [ ] Restore procedure tested
- [ ] Backup retention policy set
- [ ] Off-site backup configured

### Performance
- [ ] Load testing completed
- [ ] Performance benchmarks established
- [ ] Caching strategy implemented
- [ ] CDN configured (if applicable)
- [ ] Database indexes optimized (if applicable)
- [ ] Auto-scaling configured (if applicable)

## ✅ Post-Deployment

### Verification
- [ ] Application accessible via production URL
- [ ] All features working as expected
- [ ] API endpoints responding correctly
- [ ] Database connections working (if applicable)
- [ ] External integrations working
- [ ] SSL certificate valid and trusted
- [ ] Performance acceptable

### Monitoring
- [ ] Metrics being collected
- [ ] Logs being generated
- [ ] Alerts configured and tested
- [ ] Health checks passing
- [ ] No error spikes in logs
- [ ] Resource usage normal

### Communication
- [ ] Deployment completion announced
- [ ] Documentation links shared
- [ ] Support team briefed
- [ ] Users notified (if applicable)
- [ ] Post-deployment report created

## 🔧 Maintenance

### Regular Tasks
- [ ] Weekly dependency updates scheduled
- [ ] Monthly security audits scheduled
- [ ] Quarterly disaster recovery drills scheduled
- [ ] API key rotation scheduled (every 90 days)
- [ ] SSL certificate renewal scheduled
- [ ] Backup verification scheduled

### Continuous Improvement
- [ ] Performance metrics reviewed monthly
- [ ] Security posture reviewed quarterly
- [ ] Incident post-mortems conducted
- [ ] Documentation updated regularly
- [ ] Team training scheduled

---

## Quick Reference Commands

### Deploy
```bash
# Set environment variables
export LASTFM_API_KEY=your_key
export FREESOUND_API_KEY=your_key

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Verify
```bash
# Check container status
docker ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:3000/health
```

### Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## Emergency Contacts

- **On-Call Engineer:** [Your contact info]
- **Security Team:** security@traycer.ai
- **Infrastructure Team:** [Your contact info]
- **Last.fm API Support:** https://www.last.fm/api

---

**Last Updated:** April 6, 2026  
**Next Review:** [Schedule next review date]
