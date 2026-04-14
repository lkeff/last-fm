# Professional Light Control Rig

**Enterprise-Grade DMX512/Art-Net/sACN Lighting Control System**

A comprehensive, production-ready lighting control system designed for professional live performances, theater productions, and large-scale events. Built with Node.js, Docker, and industry-standard protocols.

---

## Features

### 🎨 Multi-Protocol Support
- **DMX512-A**: ANSI/ESTA E1.11 compliant
- **Art-Net 4.0**: Professional networked DMX
- **sACN (E1.31)**: Multicast DMX distribution
- **RDM (E1.20)**: Remote Device Management

### 🎛️ Professional Console
- **ETC Eos Xt 40**: Primary console (40 faders, touchscreen)
- **Chauvet Obey 70**: Backup console
- **Web Interface**: Real-time control via browser
- **Cue Stack**: 10,000+ cue capacity

### 💡 Comprehensive Fixture Support
- **Moving Lights**: 20 units (spots + washes)
- **Fixed Lights**: 64 units (pars, LED bars, strobes)
- **Effects**: Lasers, hazers, fog machines
- **Total Channels**: 4,096 DMX channels (8 universes)
- **Total Fixtures**: 150+ fixtures

### 🔒 Enterprise Security
- **TLS 1.3 Encryption**: All connections encrypted
- **VLAN Isolation**: Network segmentation
- **Role-Based Access**: Admin, Operator, Viewer roles
- **Audit Logging**: Complete operation history
- **Compliance**: ANSI, OWASP, NIST standards

### 📦 Docker & Deployment
- **Containerized**: Alpine Linux, minimal footprint
- **Non-root User**: Enhanced security
- **Health Checks**: Automatic monitoring
- **Resource Limits**: CPU and memory constraints
- **Logging**: JSON-formatted logs with rotation

### 📊 Monitoring & Analytics
- **Prometheus Metrics**: Real-time system monitoring
- **Health Checks**: Automatic service verification
- **Audit Logs**: Comprehensive operation tracking
- **Performance Metrics**: DMX update rates, latency

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- 2GB RAM minimum
- 1 CPU core minimum

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/last-fm.git
cd last-fm
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start the service**
```bash
docker-compose -f docker-compose.light-control.yml up -d
```

4. **Verify health**
```bash
curl http://localhost:3001/health
```

5. **Access web interface**
```
http://localhost:3001
```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Light Control Rig                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Light Control Service (Node.js)          │   │
│  │  - DMX Universe Management                       │   │
│  │  - WebSocket Real-time Control                   │   │
│  │  - Fixture Registry & Control                    │   │
│  │  - Cue Stack Management                          │   │
│  │  - RDM Device Discovery                          │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                                │
│         ┌────────────────┼────────────────┐              │
│         │                │                │              │
│    ┌────▼────┐    ┌─────▼─────┐    ┌────▼────┐         │
│    │ Art-Net │    │   sACN    │    │ DMX512  │         │
│    │ (UDP)   │    │  (UDP)    │    │ (Serial)│         │
│    └────┬────┘    └─────┬─────┘    └────┬────┘         │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                                │
│         ┌────────────────▼────────────────┐              │
│         │    DMX Interfaces & Nodes       │              │
│         │  - Enttec ultraDMX Pro          │              │
│         │  - Chauvet D-Fi Hub             │              │
│         │  - Pathway Cognito Node         │              │
│         └────────────────┬────────────────┘              │
│                          │                                │
│         ┌────────────────▼────────────────┐              │
│         │      Lighting Fixtures          │              │
│         │  - Moving Lights (20)           │              │
│         │  - Fixed Lights (64)            │              │
│         │  - Effects (Lasers, Haze)       │              │
│         └─────────────────────────────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Network Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Internet                            │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │  Nginx Reverse Proxy  │
         │  (HTTPS, Port 443)    │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────────────────┐
         │   Docker Network (172.25.0.0/16)  │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │  Light Control Service       │ │
         │  │  (Port 3001)                 │ │
         │  └──────────────────────────────┘ │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │  Prometheus Monitoring       │ │
         │  │  (Port 9090)                 │ │
         │  └──────────────────────────────┘ │
         │                                    │
         └────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼──┐   ┌───▼───┐   ┌──▼────┐
    │ VLAN  │   │ VLAN  │   │ VLAN  │
    │  10   │   │  20   │   │  30   │
    │Light  │   │Mgmt   │   │Data   │
    └───────┘   └───────┘   └───────┘
```

---

## API Reference

### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600000,
  "universes": 8,
  "fixtures": 150,
  "rdmDevices": 45
}
```

### Get Universes
```bash
GET /api/universes
```

**Response:**
```json
[
  {
    "id": 0,
    "updateCount": 1234,
    "lastUpdate": 1704067200000,
    "protocol": "DMX512"
  }
]
```

### Update Universe
```bash
POST /api/universes/:id/update
Content-Type: application/json

{
  "channels": {
    "0": 255,
    "1": 128,
    "2": 0
  },
  "protocol": "Art-Net"
}
```

### Register Fixture
```bash
POST /api/fixtures/register
Content-Type: application/json

{
  "id": "moving-spot-1",
  "manufacturer": "Clay Paky",
  "model": "Sharpy Beam",
  "universe": 0,
  "dmxAddress": 1,
  "channels": 16,
  "dmxMode": "Standard 16ch"
}
```

### Control Fixture
```bash
POST /api/fixtures/:id/control
Content-Type: application/json

{
  "parameters": {
    "0": 255,
    "1": 128,
    "2": 64
  }
}
```

### Add Cue
```bash
POST /api/cues/add
Content-Type: application/json

{
  "name": "Scene 1 - Intro",
  "cueNumber": 1,
  "fadeTime": 2000,
  "effects": {
    "strobe": true,
    "color": "red"
  }
}
```

### Execute Cue
```bash
POST /api/cues/:id/execute
```

### RDM Discovery
```bash
POST /api/rdm/discover
Content-Type: application/json

{
  "universeId": 0
}
```

### Security Audit
```bash
GET /api/security/audit
```

---

## WebSocket Events

### Universe Update
```javascript
{
  "type": "universeUpdate",
  "universeId": 0,
  "channels": {
    "0": 255,
    "1": 128
  }
}
```

### Fixture Control
```javascript
{
  "type": "fixtureControl",
  "fixtureId": "moving-spot-1",
  "parameters": {
    "0": 255,
    "1": 128
  }
}
```

### Cue Executed
```javascript
{
  "type": "cueExecuted",
  "cueId": "uuid",
  "cueName": "Scene 1 - Intro"
}
```

### RDM Discovery
```javascript
{
  "type": "rdmDiscovery",
  "universeId": 0,
  "devices": [
    {
      "uid": "moving-spot-1",
      "manufacturer": "Clay Paky",
      "model": "Sharpy Beam",
      "dmxAddress": 1
    }
  ]
}
```

---

## Configuration

### Environment Variables

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
```

### Docker Compose Override

Create `docker-compose.override.yml`:

```yaml
version: '3.9'

services:
  light-control:
    environment:
      LOG_LEVEL: debug
      UNIVERSES: 4
    ports:
      - "127.0.0.1:3001:3001"
      - "127.0.0.1:9090:9090"
```

---

## Deployment

### Production Deployment

1. **Build Docker image**
```bash
docker build -f Dockerfile.light-control -t light-control:latest .
```

2. **Push to registry**
```bash
docker tag light-control:latest registry.example.com/light-control:latest
docker push registry.example.com/light-control:latest
```

3. **Deploy with Docker Compose**
```bash
docker-compose -f docker-compose.light-control.yml up -d
```

4. **Verify deployment**
```bash
docker-compose -f docker-compose.light-control.yml ps
docker-compose -f docker-compose.light-control.yml logs -f light-control
```

### Kubernetes Deployment

See `k8s/light-control-deployment.yaml` for Kubernetes manifests.

```bash
kubectl apply -f k8s/light-control-deployment.yaml
kubectl get pods -l app=light-control
```

---

## Monitoring

### Prometheus Metrics

Access Prometheus at `http://localhost:9090`

**Key Metrics:**
- `light_control_dmx_updates_total`: Total DMX updates
- `light_control_fixtures_registered`: Number of registered fixtures
- `light_control_cues_executed`: Number of executed cues
- `light_control_rdm_devices`: Number of RDM devices
- `light_control_uptime_seconds`: Service uptime

### Logs

View logs:
```bash
docker-compose -f docker-compose.light-control.yml logs -f light-control
```

Log files:
```bash
docker exec light-control-service tail -f /app/logs/light-control.log
```

---

## Security

### SSL/TLS Setup

1. **Generate certificates**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
```

2. **Configure Nginx**
Edit `nginx/light-control.conf` with certificate paths.

### Firewall Rules

```bash
# Allow Art-Net
sudo ufw allow 6454/udp

# Allow sACN
sudo ufw allow 5568/udp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow local API
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 3001
```

### User Authentication

Configure in environment:
```bash
REQUIRE_AUTH=true
AUTH_PROVIDER=ldap
LDAP_SERVER=ldap.example.com
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose -f docker-compose.light-control.yml logs light-control

# Verify ports are available
netstat -an | grep 3001
netstat -an | grep 6454
```

### DMX not updating
```bash
# Check universe status
curl http://localhost:3001/api/universes

# Verify fixtures registered
curl http://localhost:3001/api/fixtures

# Check network connectivity
ping <dmx-interface-ip>
```

### Performance issues
```bash
# Check resource usage
docker stats light-control-service

# Review logs for errors
docker logs --tail 100 light-control-service

# Check Prometheus metrics
curl http://localhost:9090/api/v1/query?query=light_control_dmx_updates_total
```

---

## Development

### Local Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start service**
```bash
node -e "const LightControlService = require('./services/light-control-service'); const service = new LightControlService(); service.start();"
```

3. **Run tests**
```bash
npm test
```

### Code Structure

```
light-control-rig/
├── rigs/
│   └── light-control-rig.js          # Rig configuration
├── services/
│   └── light-control-service.js      # Main service
├── docker-compose.light-control.yml  # Docker Compose
├── Dockerfile.light-control          # Docker image
├── LIGHT_CONTROL_README.md           # This file
└── LIGHT_CONTROL_SECURITY_AUDIT.md   # Security audit
```

---

## Support & Documentation

### Resources
- [DMX512 Standard](https://en.wikipedia.org/wiki/DMX512)
- [Art-Net Protocol](https://art-net.org.uk/)
- [sACN Standard](https://www.usitt.org/standards/dmx512)
- [Node.js DMX Library](https://github.com/node-dmx/dmx)

### Getting Help
- **Issues**: GitHub Issues
- **Security**: security@traycer.ai
- **Documentation**: See `/docs` directory

---

## License

MIT License - See LICENSE file

---

## Contributing

Contributions welcome! Please see CONTRIBUTING.md

---

## Version History

### v1.0.0 (2024)
- Initial release
- DMX512, Art-Net, sACN support
- Docker containerization
- Security audit completed
- Production-ready

---

**Last Updated:** 2024
**Maintained By:** Light Control Team
**Status:** Production Ready ✅
