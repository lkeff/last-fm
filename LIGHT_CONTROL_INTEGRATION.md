# Light Control Rig - Live Rig Integration Guide

**Professional Integration of DMX Lighting Control with Live Audio Performance**

This guide demonstrates how to integrate the Professional Light Control Rig with the existing Live Performance Rig for synchronized audio-visual productions.

---

## Overview

The Light Control Rig extends the Live Performance Rig by adding professional lighting control capabilities. Together, they create a complete production environment for large-scale live events.

### Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                  Live Performance Event                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   Live Audio Rig     │         │ Light Control Rig    │  │
│  │                      │         │                      │  │
│  │ - FOH Console        │         │ - ETC Eos Console    │  │
│  │ - Monitor System     │         │ - DMX Universes (8)  │  │
│  │ - PA System          │         │ - 150+ Fixtures      │  │
│  │ - Wireless Mics      │         │ - Art-Net/sACN       │  │
│  │ - Recording          │         │ - RDM Devices        │  │
│  └──────────┬───────────┘         └──────────┬───────────┘  │
│             │                                 │              │
│             └─────────────────┬───────────────┘              │
│                               │                              │
│                   ┌───────────▼───────────┐                 │
│                   │  Synchronization      │                 │
│                   │  & Control System     │                 │
│                   │                       │                 │
│                   │ - Timecode Sync       │                 │
│                   │ - Cue Triggering      │                 │
│                   │ - Show Control        │                 │
│                   └───────────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### Complete Production Setup

```
STAGE
├── Audio System
│   ├── FOH Console (DiGiCo Quantum7)
│   ├── Monitor Console (DiGiCo SD12)
│   ├── PA System (L-Acoustics K Series)
│   ├── Monitor Wedges (L-Acoustics X15)
│   └── Wireless Microphones (Shure Axient)
│
├── Lighting System
│   ├── Lighting Console (ETC Eos Xt 40)
│   ├── DMX Interfaces (Enttec, Chauvet, Pathway)
│   ├── Moving Lights (Clay Paky, Martin, Chauvet)
│   ├── Fixed Lights (ETC, Chauvet)
│   └── Effects (Lasers, Hazers, Fog)
│
└── Infrastructure
    ├── Network (Dante + Art-Net/sACN)
    ├── Power Distribution (400A 3-phase)
    ├── Rigging (Truss, Motors, Cables)
    ├── Communication (Intercom, Talkback)
    └── Recording (Multitrack + Broadcast)

FOH POSITION
├── Audio Engineering
│   ├── FOH Engineer
│   ├── Monitor Engineer
│   └── System Tech
│
└── Lighting Engineering
    ├── Lighting Designer
    ├── Lighting Operator
    └── Lighting Tech

BROADCAST/RECORDING
├── Video Camera Control
├── Audio Recording (Multitrack)
├── Broadcast Feed
└── Archive Storage
```

---

## Integration Methods

### 1. Network-Based Integration (Recommended)

#### Setup
```
┌─────────────────────────────────────────────────────┐
│           Dante Network (Audio)                      │
│  DiGiCo Quantum7 ←→ L-Acoustics P1 ←→ Wireless     │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼──┐   ┌───▼───┐   ┌──▼────┐
    │Cisco  │   │Cisco  │   │Cisco  │
    │Switch │   │Switch │   │Switch │
    │(Audio)│   │(Light)│   │(Mgmt) │
    └───────┘   └───────┘   └───────┘
         │           │           │
    ┌────▼──┐   ┌───▼───┐   ┌──▼────┐
    │Audio  │   │Light  │   │Mgmt   │
    │VLAN10 │   │VLAN20 │   │VLAN30 │
    └───────┘   └───────┘   └───────┘
         │           │           │
    ┌────▼──────────▼───────────▼──┐
    │     Ethernet Backbone         │
    │  (Redundant, 10Gbps)          │
    └──────────────────────────────┘
```

#### Configuration

**Audio Network (VLAN 10)**
```json
{
  "protocol": "Dante",
  "vlan": 10,
  "bandwidth": "1Gbps",
  "devices": [
    "DiGiCo Quantum7",
    "L-Acoustics P1",
    "Shure Axient"
  ]
}
```

**Lighting Network (VLAN 20)**
```json
{
  "protocols": ["Art-Net", "sACN"],
  "vlan": 20,
  "bandwidth": "1Gbps",
  "devices": [
    "ETC Eos Xt 40",
    "Enttec DMX Interfaces",
    "Chauvet D-Fi Hub"
  ]
}
```

### 2. Timecode Synchronization

#### LTC (Linear Timecode) Sync

```javascript
// Audio Console → Timecode Generator
const timecodeSync = {
  source: 'DiGiCo Quantum7',
  format: 'LTC (Linear Timecode)',
  frameRate: 29.97, // NTSC
  distribution: [
    'ETC Eos Console',
    'Recording System',
    'Video Camera Control'
  ]
}

// Lighting responds to timecode
const lightingCues = [
  { timecode: '00:00:00:00', cue: 'Scene 1 - Intro' },
  { timecode: '00:05:30:15', cue: 'Scene 2 - Verse' },
  { timecode: '00:12:45:00', cue: 'Scene 3 - Chorus' }
]
```

#### SMPTE Timecode Distribution

```
Audio Console (Timecode Master)
         │
         ├─→ XLR Timecode Out
         │
    ┌────▼────────────────┐
    │ Timecode Distributor │
    └────┬────────────────┘
         │
    ┌────┴────────────────────┐
    │                          │
┌───▼──┐              ┌────────▼──┐
│Light │              │ Recording  │
│Rig   │              │ System     │
└───────┘              └────────────┘
```

### 3. Show Control Integration

#### Cue Triggering System

```javascript
// Master Show Control
const showControl = {
  type: 'GrandMA3 / ETC Eos Integration',
  
  cueSequence: [
    {
      cueNumber: 1,
      name: 'Scene 1 - Intro',
      audio: {
        console: 'DiGiCo Quantum7',
        cue: 'Intro Mix',
        fadeTime: 2000
      },
      lighting: {
        console: 'ETC Eos Xt 40',
        cue: 'Scene 1 - Intro',
        fadeTime: 2000
      },
      video: {
        cue: 'Intro Video',
        fadeTime: 2000
      },
      timing: {
        duration: 30000, // 30 seconds
        nextCue: 'auto'
      }
    },
    {
      cueNumber: 2,
      name: 'Scene 2 - Verse',
      audio: { /* ... */ },
      lighting: { /* ... */ },
      video: { /* ... */ }
    }
  ]
}
```

#### OSC (Open Sound Control) Integration

```javascript
// Send OSC messages from audio console to lighting
const oscConfig = {
  protocol: 'OSC',
  port: 9000,
  
  messages: [
    {
      address: '/lighting/cue/execute',
      args: [1, 'Scene 1 - Intro'],
      trigger: 'Audio cue 1 executed'
    },
    {
      address: '/lighting/fixture/intensity',
      args: ['moving-spot-1', 255],
      trigger: 'Audio channel 1 > -6dB'
    }
  ]
}
```

---

## Practical Integration Examples

### Example 1: Concert Performance

#### Setup
- **Venue**: 5,000 capacity arena
- **Duration**: 2-hour show
- **Complexity**: 50+ lighting cues, 30+ audio cues

#### Integration Flow

```javascript
const concertSetup = {
  name: 'Concert Performance',
  
  // Audio Setup
  audio: {
    fohConsole: 'DiGiCo Quantum7',
    monitorConsole: 'DiGiCo SD12',
    paSystem: 'L-Acoustics K Series',
    wirelessChannels: 32,
    recordingChannels: 128
  },
  
  // Lighting Setup
  lighting: {
    console: 'ETC Eos Xt 40',
    universes: 8,
    fixtures: 150,
    movingLights: 20,
    fixedLights: 64,
    effects: 10
  },
  
  // Synchronization
  sync: {
    timecodeSource: 'DiGiCo Quantum7',
    timecodeFormat: 'LTC',
    showControlProtocol: 'OSC',
    networkVlan: [
      { name: 'Audio', id: 10 },
      { name: 'Lighting', id: 20 },
      { name: 'Management', id: 30 }
    ]
  },
  
  // Cue Sequence
  cueSequence: [
    {
      cueNumber: 1,
      name: 'House Lights Down',
      duration: 5000,
      audio: { action: 'Fade to black' },
      lighting: { action: 'House lights to 0%' }
    },
    {
      cueNumber: 2,
      name: 'Opening Scene',
      duration: 30000,
      audio: { cue: 'Opening Music' },
      lighting: { cue: 'Opening Scene - Blue' }
    },
    // ... more cues
  ]
}
```

### Example 2: Theater Production

#### Setup
- **Venue**: 1,000 seat theater
- **Duration**: 2-hour play with intermission
- **Complexity**: 200+ lighting cues, 100+ audio cues

#### Integration Flow

```javascript
const theaterSetup = {
  name: 'Theater Production',
  
  // Lighting-Heavy Setup
  lighting: {
    console: 'ETC Eos Xt 40',
    universes: 8,
    fixtures: 200,
    followSpots: 4,
    effects: 15
  },
  
  // Audio Support
  audio: {
    console: 'DiGiCo SD12',
    channels: 96,
    purposes: [
      'Actor microphones',
      'Sound effects',
      'Background music',
      'Cue tones'
    ]
  },
  
  // Synchronization
  sync: {
    timecodeSource: 'Audio Console',
    showControlProtocol: 'GrandMA3 Link',
    cueTriggering: 'Manual + Timecode'
  },
  
  // Scene Structure
  scenes: [
    {
      name: 'Act 1, Scene 1',
      lightingCues: 50,
      audioCues: 30,
      duration: 1800000 // 30 minutes
    },
    {
      name: 'Intermission',
      lightingCues: 5,
      audioCues: 5,
      duration: 900000 // 15 minutes
    },
    {
      name: 'Act 2, Scene 1',
      lightingCues: 60,
      audioCues: 40,
      duration: 1800000 // 30 minutes
    }
  ]
}
```

### Example 3: Corporate Event

#### Setup
- **Venue**: 2,000 capacity conference center
- **Duration**: 4-hour event
- **Complexity**: 20+ lighting scenes, 15+ audio cues

#### Integration Flow

```javascript
const corporateSetup = {
  name: 'Corporate Event',
  
  // Balanced Setup
  audio: {
    console: 'Yamaha CL5',
    channels: 72,
    purposes: [
      'Presentations',
      'Video playback',
      'Audience microphones',
      'Background music'
    ]
  },
  
  lighting: {
    console: 'ETC Eos Xt 40',
    universes: 4,
    fixtures: 80,
    purposes: [
      'Stage lighting',
      'Audience lighting',
      'Video wall support',
      'Ambient effects'
    ]
  },
  
  // Synchronization
  sync: {
    timecodeSource: 'Video playback',
    showControlProtocol: 'OSC',
    networkIntegration: 'Full'
  },
  
  // Event Timeline
  timeline: [
    { time: '08:00', event: 'Setup & Testing' },
    { time: '09:00', event: 'Doors Open' },
    { time: '09:30', event: 'Welcome & Opening' },
    { time: '10:00', event: 'Presentation 1' },
    { time: '11:00', event: 'Break' },
    { time: '11:15', event: 'Presentation 2' },
    { time: '12:00', event: 'Lunch' },
    { time: '13:00', event: 'Keynote' },
    { time: '14:00', event: 'Closing' }
  ]
}
```

---

## Crew Coordination

### Combined Crew Structure

```
Production Team
├── Production Manager (1)
│   └── Oversees entire event
│
├── Audio Department (7)
│   ├── FOH Engineer (1)
│   ├── Monitor Engineer (1)
│   ├── System Tech (2)
│   ├── Stage Tech (2)
│   └── RF Tech (1)
│
├── Lighting Department (7)
│   ├── Lighting Designer (1)
│   ├── Lighting Operator (2)
│   ├── Lighting Tech (3)
│   └── RDM Tech (1)
│
├── Video Department (3)
│   ├── Video Director (1)
│   ├── Camera Operator (1)
│   └── Video Tech (1)
│
└── Stage Management (2)
    ├── Stage Manager (1)
    └── Assistant Stage Manager (1)

Total: 20+ crew members
```

### Communication Structure

```
Production Manager
├─→ Audio Lead (FOH Engineer)
│   ├─→ Monitor Engineer
│   ├─→ System Tech
│   └─→ Stage Tech
│
├─→ Lighting Lead (Lighting Designer)
│   ├─→ Lighting Operator
│   ├─→ Lighting Tech
│   └─→ RDM Tech
│
├─→ Video Lead (Video Director)
│   ├─→ Camera Operator
│   └─→ Video Tech
│
└─→ Stage Manager
    └─→ Assistant Stage Manager

Communication: Clear-Com Intercom System
```

---

## Pre-Show Checklist

### Audio System
- [ ] FOH console powered and tested
- [ ] Monitor console powered and tested
- [ ] PA system powered and tested
- [ ] Wireless microphones frequency coordinated
- [ ] All cables tested and connected
- [ ] Recording system armed
- [ ] Backup systems verified

### Lighting System
- [ ] Lighting console powered and tested
- [ ] All DMX universes verified
- [ ] Fixtures powered and responding
- [ ] RDM devices discovered and configured
- [ ] Cue stack loaded and tested
- [ ] Backup console ready
- [ ] All cables tested and connected

### Integration
- [ ] Timecode sync verified
- [ ] Network connectivity tested
- [ ] Show control system tested
- [ ] Intercom system tested
- [ ] Recording and monitoring feeds verified
- [ ] Backup systems ready
- [ ] Emergency procedures reviewed

### Final
- [ ] All crew briefed
- [ ] Safety procedures reviewed
- [ ] Emergency contacts posted
- [ ] Show notes distributed
- [ ] Contingency plans reviewed

---

## Troubleshooting Integration Issues

### Timecode Sync Problems

**Issue**: Lighting cues not triggering on timecode
```bash
# Check timecode signal
1. Verify LTC output from audio console
2. Check timecode cable connections
3. Verify timecode format (29.97 fps NTSC)
4. Test with oscilloscope if available
5. Check lighting console timecode input settings
```

### Network Connectivity

**Issue**: Art-Net/sACN not reaching fixtures
```bash
# Verify network
1. Check Ethernet cable connections
2. Verify VLAN configuration
3. Check firewall rules (ports 6454, 5568)
4. Verify IP addresses and subnets
5. Test with network monitoring tools
```

### DMX Signal Loss

**Issue**: Fixtures losing control intermittently
```bash
# Check DMX
1. Verify DMX cable connections
2. Check for cable damage or interference
3. Verify termination resistors
4. Check DMX interface power
5. Test with backup interface
```

---

## Best Practices

### Pre-Production
1. ✅ Create detailed system diagrams
2. ✅ Develop comprehensive cue sheets
3. ✅ Plan crew assignments and responsibilities
4. ✅ Establish communication protocols
5. ✅ Create contingency plans

### Setup
1. ✅ Test all systems independently first
2. ✅ Verify integration points
3. ✅ Conduct full system test
4. ✅ Document all settings and configurations
5. ✅ Brief all crew members

### Operation
1. ✅ Maintain clear communication
2. ✅ Monitor all systems continuously
3. ✅ Log all cue executions
4. ✅ Be ready to switch to backup systems
5. ✅ Document any issues

### Post-Production
1. ✅ Collect all show files and documentation
2. ✅ Review performance and issues
3. ✅ Archive recordings and logs
4. ✅ Conduct post-show meeting
5. ✅ Plan improvements for next event

---

## Resources

### Documentation
- Live Rig Configuration: `rigs/live-rig.js`
- Light Control Configuration: `rigs/light-control-rig.js`
- Light Control Service: `services/light-control-service.js`
- Security Audit: `LIGHT_CONTROL_SECURITY_AUDIT.md`

### External Resources
- [ETC Eos Documentation](https://www.etcconnect.com/)
- [Dante Networking](https://www.audinate.com/)
- [Art-Net Protocol](https://art-net.org.uk/)
- [sACN Standard](https://www.usitt.org/)

---

## Support

For integration assistance:
- **Email**: integration@traycer.ai
- **Phone**: +1-XXX-XXX-XXXX
- **Documentation**: See `/docs` directory

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
