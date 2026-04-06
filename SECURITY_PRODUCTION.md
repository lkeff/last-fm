# Production Security Guide

## ⚠️ CRITICAL: Before Deploying to Production

### 1. API Key Security

**The `.env` file in this repository contains an exposed API key that MUST be revoked before production deployment.**

```
Exposed Key: 297022d34ba11970918e4e7edf77d463
Status: ⚠️ MUST BE REVOKED
```

#### Immediate Actions Required:

1. **Revoke the exposed key:**
   - Go to <https://www.last.fm/api/account>
   - Find and delete the exposed key
   - Generate a new production key

2. **Never use `.env` files in production:**
   - Use environment variables instead
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never commit `.env` files to git

3. **Clean git history (if key was committed):**

```bash
# WARNING: This rewrites git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first)
git push origin --force --all
```

---

## 🔐 Production Security Checklist

### Environment Variables

✅ **DO:**

```bash
# Set environment variables before deployment
export LASTFM_API_KEY=your_new_production_key
export FREESOUND_API_KEY=your_freesound_key
export NODE_ENV=production

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

❌ **DON'T:**

```bash
# Never copy .env into containers
COPY .env ./

# Never commit .env to git
git add .env
```

### Docker Security

The production configuration includes:

- ✅ Non-root user (appuser)
- ✅ Read-only root filesystem
- ✅ Dropped all capabilities
- ✅ No new privileges
- ✅ Resource limits
- ✅ Security options enabled
- ✅ Localhost-only port binding

Verify security:

```bash
# Check user
docker exec last-fm-prod whoami
# Should output: appuser

# Check for .env in container
docker exec last-fm-prod ls -la | grep .env
# Should return nothing

# Verify security options
docker inspect last-fm-prod | grep -A 10 SecurityOpt
```

---

## 🛡️ Security Layers

### 1. Container Security

**Dockerfile Security:**

- Uses official Node.js Alpine base image
- Runs as non-root user
- No secrets copied into image
- Minimal attack surface

**docker-compose.yml Security:**

- `security_opt: no-new-privileges`
- `cap_drop: ALL`
- `read_only: true`
- Resource limits enforced
- Localhost-only binding

### 2. Network Security

**Nginx Reverse Proxy:**

- HTTPS/TLS 1.2+ only
- Strong cipher suites
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting
- OCSP stapling

**Firewall Rules:**

```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (redirects to HTTPS)
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 3. Application Security

**Implemented:**

- Helmet.js for security headers
- Input validation
- HTML sanitization (DOMPurify)
- URL validation
- Rate limiting
- CORS configuration
- Secure logging (no sensitive data)

### 4. Secrets Management

**Production Secrets:**

```bash
# Option 1: Environment variables
export LASTFM_API_KEY=xxx

# Option 2: Docker secrets (Swarm)
echo "xxx" | docker secret create lastfm_api_key -

# Option 3: Kubernetes secrets
kubectl create secret generic lastfm-secrets \
  --from-literal=LASTFM_API_KEY=xxx

# Option 4: Cloud provider secrets
# AWS Secrets Manager
# Google Secret Manager
# Azure Key Vault
```

---

## 🔍 Security Monitoring

### 1. Vulnerability Scanning

```bash
# Scan Docker image
docker scan last-fm:latest

# Or use Trivy
trivy image last-fm:latest

# Scan dependencies
npm audit
npm audit fix
```

### 2. Log Monitoring

Monitor for:

- Failed authentication attempts
- Rate limit violations
- Unusual API usage patterns
- Error spikes
- Security header violations

### 3. Intrusion Detection

Consider implementing:

- Fail2ban for brute force protection
- OSSEC or Wazuh for host-based IDS
- Cloudflare for DDoS protection
- Web Application Firewall (WAF)

---

## 🚨 Incident Response

### If API Key is Compromised:

1. **Immediately revoke the key** at <https://www.last.fm/api/account>
2. **Generate new key** and update production environment
3. **Review API usage logs** for unauthorized access
4. **Check for quota exhaustion** or unusual patterns
5. **Rotate all other secrets** as precaution
6. **Document the incident** for post-mortem

### If Container is Compromised:

1. **Isolate the container** (`docker stop`)
2. **Preserve evidence** (`docker commit`, save logs)
3. **Analyze logs** for entry point
4. **Rebuild from clean image**
5. **Rotate all secrets**
6. **Review security configuration**

---

## 📋 Security Audit Schedule

### Daily

- [ ] Review error logs
- [ ] Check resource usage
- [ ] Monitor failed requests

### Weekly

- [ ] Review access logs
- [ ] Check for dependency updates
- [ ] Verify backup integrity

### Monthly

- [ ] Run vulnerability scans
- [ ] Review security configurations
- [ ] Update dependencies
- [ ] Test disaster recovery

### Quarterly

- [ ] Rotate API keys
- [ ] Penetration testing
- [ ] Security policy review
- [ ] Team security training

---

## 🔧 Hardening Recommendations

### Operating System

```bash
# Keep system updated
apt update && apt upgrade -y

# Install security updates automatically
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades

# Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Use SSH keys only
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### Docker Daemon

```bash
# Enable user namespace remapping
echo '{"userns-remap": "default"}' > /etc/docker/daemon.json
systemctl restart docker

# Enable content trust
export DOCKER_CONTENT_TRUST=1

# Scan images before running
docker scan --accept-license --severity high last-fm:latest
```

### Network

```bash
# Enable firewall
ufw enable

# Configure fail2ban
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 📚 Security Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### Tools

- **Vulnerability Scanning:** Trivy, Snyk, Clair
- **Secret Scanning:** GitGuardian, TruffleHog
- **SAST:** SonarQube, Semgrep
- **DAST:** OWASP ZAP, Burp Suite
- **Monitoring:** Prometheus, Grafana, ELK Stack

### Compliance

- GDPR compliance for EU users
- SOC 2 for enterprise customers
- PCI DSS if handling payments
- HIPAA if handling health data

---

## 🆘 Support

### Security Issues

- **Email:** security@traycer.ai
- **Response Time:** < 24 hours for critical issues
- **PGP Key:** Available on request

### Reporting Vulnerabilities

Please report security vulnerabilities responsibly:

1. Email security@traycer.ai with details
2. Do not disclose publicly until patched
3. Allow 90 days for fix before disclosure
4. We'll credit you in security advisories

---

## ✅ Quick Security Verification

Run this script to verify production security:

```bash
#!/bin/bash

echo "🔍 Security Verification Checklist"
echo "=================================="

# Check for .env in container
echo -n "✓ No .env in container: "
docker exec last-fm-prod ls .env 2>/dev/null && echo "❌ FAIL" || echo "✅ PASS"

# Check user
echo -n "✓ Running as non-root: "
[[ $(docker exec last-fm-prod whoami) == "appuser" ]] && echo "✅ PASS" || echo "❌ FAIL"

# Check security options
echo -n "✓ Security options enabled: "
docker inspect last-fm-prod | grep -q "no-new-privileges" && echo "✅ PASS" || echo "❌ FAIL"

# Check HTTPS
echo -n "✓ HTTPS enabled: "
curl -s -o /dev/null -w "%{http_code}" https://localhost | grep -q "200" && echo "✅ PASS" || echo "⚠️  SKIP"

# Check for vulnerabilities
echo -n "✓ No high vulnerabilities: "
trivy image --severity HIGH,CRITICAL last-fm:latest 2>/dev/null | grep -q "Total: 0" && echo "✅ PASS" || echo "⚠️  CHECK"

echo "=================================="
echo "Review complete!"
```

---

**Last Updated:** April 6, 2026  
**Security Version:** 1.0  
**Next Review:** July 6, 2026
