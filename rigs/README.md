# Audio Production Rigs

Comprehensive audio production rig configurations for the Last.fm Desktop application.

## Overview

This module provides detailed configurations for four professional audio setups:

| Rig | Description | Key Stats |
|-----|-------------|-----------|
| **Studio Rig** | Full professional recording studio | 64+ I/O channels, Dolby Atmos 7.1.4 |
| **Live Rig** | Concert/festival PA system | 20,000 capacity, L-Acoustics K2 |
| **Orchestra** | 89-person symphony orchestra | Full sections, traditional seating |
| **DJ Booth** | Professional club/festival DJ setup | 4x CDJ-3000, DJM-V10 |

## Installation

The rigs module is included in the last-fm package:

```javascript
const rigs = require('./rigs');

// Get all configurations
const allRigs = rigs.getAllRigs();

// Get specific rig
const studio = rigs.getRig('studio');
const live = rigs.getRig('live');
const orchestra = rigs.getRig('orchestra');
const djBooth = rigs.getRig('djBooth');
```

## Studio Rig

Professional recording studio setup with:

- **DAW**: Pro Tools Ultimate + Ableton Live Suite
- **Interface**: Avid MTRX II (64x64 channels)
- **Monitoring**: Genelec 8361A mains, Dolby Atmos 7.1.4
- **Console**: SSL Origin 32-channel
- **Microphones**: 60+ mics (Neumann, Schoeps, Royer, etc.)
- **Outboard**: Neve, API, Universal Audio, SSL

### Usage

```javascript
const { studioRig } = require('./rigs');

// Get equipment counts
const counts = studioRig.getEquipmentCount();
console.log(`Microphones: ${counts.microphones}`);
console.log(`Preamps: ${counts.preamps}`);

// Get signal flow
const flow = studioRig.getSignalFlow();
```

## Live Rig

Professional touring/festival PA system:

- **FOH Console**: DiGiCo Quantum7
- **Monitor Console**: DiGiCo SD12
- **Main PA**: L-Acoustics K2 (16 per side)
- **Subs**: 24x L-Acoustics KS28
- **Wireless**: Shure Axient Digital (24 channels)
- **IEM**: Shure PSM1000 (16 channels)

### Usage

```javascript
const { liveRig } = require('./rigs');

// Get speaker counts
const speakers = liveRig.getSpeakerCount();
console.log(`Total speakers: ${speakers.total()}`);

// Generate input list
const inputs = liveRig.generateInputList();

// Get power requirements
const power = liveRig.getPowerRequirements();
```

## Orchestra (89 Musicians)

Full symphony orchestra configuration:

### Section Breakdown

| Section | Musicians |
|---------|-----------|
| First Violins | 16 |
| Second Violins | 14 |
| Violas | 12 |
| Cellos | 10 |
| Double Basses | 8 |
| Woodwinds | 12 |
| Brass | 12 |
| Percussion | 5 |
| Keyboards/Harp | 3 |
| **Total** | **89** |

### Usage

```javascript
const { orchestra } = require('./rigs');

// Get musician counts
const counts = orchestra.getMusicianCount();

// Generate full roster
const roster = orchestra.generateRoster();

// Get seating chart with coordinates
const seating = orchestra.generateSeatingChart();

// Get principal players
const principals = orchestra.getPrincipals();
```

## DJ Booth

Professional club/festival DJ setup:

- **CDJs**: 4x Pioneer DJ CDJ-3000
- **Mixer**: Pioneer DJ DJM-V10 (6-channel)
- **Turntables**: 2x Technics SL-1200MK7
- **Effects**: RMX-1000, Eventide H9, Strymon BigSky
- **Monitoring**: Pioneer VM-80 booth monitors

### Usage

```javascript
const { djBooth } = require('./rigs');

// Get equipment list
const equipment = djBooth.getEquipmentList();

// Get technical rider
const rider = djBooth.getRider();

// Get setup checklist
const checklist = djBooth.getSetupChecklist();

// Get signal flow
const flow = djBooth.getSignalFlow();

// Get BPM ranges by genre
const bpmRanges = djBooth.getGenreBPMRanges();
```

## Combined Functions

```javascript
const rigs = require('./rigs');

// Get summary of all rigs
const summary = rigs.getRigsSummary();

// Search equipment across all rigs
const results = rigs.searchEquipment('Neumann');

// Get total I/O counts
const io = rigs.getTotalIOCount();

// Generate complete manifest
const manifest = rigs.generateManifest();

// Compare two rigs
const comparison = rigs.compareRigs('studio', 'live');
```

## File Structure

```
rigs/
├── index.js        # Main entry point
├── studio-rig.js   # Studio configuration
├── live-rig.js     # Live PA configuration
├── orchestra.js    # Orchestra configuration
├── dj-booth.js     # DJ booth configuration
└── README.md       # This file
```

## Configuration Details

### Studio Rig Sections
- `daw` - Digital Audio Workstation setup
- `audioInterface` - Primary and expansion interfaces
- `monitoring` - Speakers, headphones, controller
- `microphones` - Complete mic collection
- `preamps` - Standalone and channel strips
- `outboard` - Compressors, EQs, reverbs, delays
- `console` - Mixing console configuration
- `rooms` - Acoustic spaces
- `routing` - Patchbays and tie lines
- `instruments` - Studio instruments
- `power` - Power distribution
- `sync` - Clocking and sync

### Live Rig Sections
- `foh` - Front of House console and processing
- `mainPA` - Speaker arrays and amplification
- `monitors` - Wedges, sidefills, IEMs
- `wireless` - Microphones and instruments
- `stageMicrophones` - Wired stage mics
- `stage` - Infrastructure and cabling
- `recording` - Multitrack and broadcast
- `network` - Dante and control networks
- `power` - Distribution and backup
- `rigging` - Motors and truss
- `transport` - Cases and trucks
- `crew` - Personnel requirements

### Orchestra Sections
- `strings` - Violins, violas, cellos, basses
- `woodwinds` - Flutes, oboes, clarinets, bassoons
- `brass` - Horns, trumpets, trombones, tuba
- `percussion` - Timpani and auxiliary
- `keyboards` - Harp, piano, celesta
- `conductor` - Podium and equipment
- `roster` - Complete musician list
- `seatingChart` - Position coordinates
- `repertoire` - Period requirements
- `recording` - Microphone setup

### DJ Booth Sections
- `cdjs` - CDJ players
- `mixer` - DJ mixer
- `controllers` - Additional controllers
- `turntables` - Vinyl playback
- `effects` - External and software FX
- `monitoring` - Booth monitors and headphones
- `furniture` - Booth and stands
- `lighting` - Booth lighting control
- `connectivity` - Pro DJ Link and interfaces
- `power` - Distribution and UPS
- `recording` - Recording and streaming
- `software` - Music management
- `backup` - Redundancy systems
- `rider` - Technical requirements

## License

MIT © Feross Aboukhadijeh and contributors
