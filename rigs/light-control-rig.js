/**
 * Professional Light Control Rig
 * Comprehensive DMX512/Art-Net/sACN lighting system for live performances
 * Supports multiple universes, fixtures, effects, and real-time control
 *
 * @module rigs/light-control-rig
 */

const LIGHT_CONTROL_RIG = {
  name: 'Professional Light Control Rig',
  version: '1.0.0',
  type: 'lighting',
  description: 'Enterprise-grade DMX lighting control system with Art-Net and sACN support',
  certification: {
    standard: 'DMX512-A (ANSI/ESTA E1.11)',
    protocols: ['DMX512', 'Art-Net', 'sACN (ANSI E1.31)'],
    securityAudit: true,
    dockerized: true
  },

  /**
   * DMX Protocol Configuration
   */
  dmxProtocol: {
    standard: 'DMX512-A',
    universes: {
      quantity: 8,
      channelsPerUniverse: 512,
      totalChannels: 4096,
      refreshRate: 44, // Hz (minimum 25Hz, standard 44Hz)
      slotTime: 4, // microseconds
      breakTime: 88, // microseconds
      markAfterBreak: 8 // microseconds
    },
    artNet: {
      enabled: true,
      version: '4.0',
      protocol: 'UDP port 6454',
      features: [
        'Multiple universe support',
        'Bi-directional communication',
        'RDM (Remote Device Management)',
        'Diagnostics and monitoring'
      ]
    },
    sACN: {
      enabled: true,
      standard: 'ANSI E1.31',
      protocol: 'UDP multicast',
      features: [
        'Multicast distribution',
        'Priority levels',
        'Synchronization',
        'Redundancy support'
      ]
    }
  },

  /**
   * Lighting Console
   */
  console: {
    primary: {
      manufacturer: 'ETC',
      model: 'Eos Xt 40',
      features: [
        'Touchscreen interface',
        '40 physical faders',
        'Motorized faders',
        'Multi-universe support (8)',
        'Built-in networking',
        'Backup power (UPS)',
        'Show file management',
        'Real-time visualization'
      ],
      universes: 8,
      channels: 4096,
      recordingCapacity: '1000+ cues',
      connectivity: ['Ethernet', 'USB', 'Art-Net', 'sACN']
    },
    backup: {
      manufacturer: 'Chauvet',
      model: 'Chauvet Obey 70',
      features: [
        'Wireless control capable',
        'Compact design',
        'Multi-universe support',
        'DMX output'
      ],
      universes: 4,
      channels: 2048
    },
    control: {
      software: {
        primary: 'ETC Eos Family Software',
        backup: 'Open Lighting Architecture (OLA)',
        webInterface: true,
        remoteControl: true
      }
    }
  },

  /**
   * DMX Interfaces & Hardware
   */
  interfaces: {
    primary: {
      manufacturer: 'Enttec',
      model: 'DMXking ultraDMX Micro Pro',
      type: 'USB DMX Interface',
      universes: 2,
      protocol: 'USB 2.0 High-Speed',
      features: [
        'Dual universe output',
        'Galvanic isolation',
        'Hot-swappable',
        'Compact form factor'
      ],
      quantity: 4
    },
    artNetNode: {
      manufacturer: 'Chauvet',
      model: 'D-Fi Hub',
      type: 'Art-Net to DMX Converter',
      universes: 4,
      protocol: 'Ethernet Art-Net',
      features: [
        'Bi-directional conversion',
        'RDM support',
        'Wireless capable',
        'PoE powered'
      ],
      quantity: 2
    },
    sACNNode: {
      manufacturer: 'Pathway Connectivity',
      model: 'Cognito Node',
      type: 'sACN to DMX Converter',
      universes: 4,
      protocol: 'Ethernet sACN',
      features: [
        'Multicast support',
        'Priority handling',
        'Redundancy',
        'PoE powered'
      ],
      quantity: 2
    }
  },

  /**
   * Lighting Fixtures
   */
  fixtures: {
    movingLights: {
      spotlights: [
        {
          manufacturer: 'Clay Paky',
          model: 'Sharpy Beam',
          type: 'Moving Head Spot',
          quantity: 12,
          channels: 16,
          features: [
            '330W discharge lamp',
            'Motorized zoom',
            'Color wheel',
            'Gobo wheel',
            'Strobe',
            'Pan/Tilt'
          ],
          dmxMode: 'Standard 16ch'
        },
        {
          manufacturer: 'Martin',
          model: 'MAC Aura',
          type: 'Moving Head Wash',
          quantity: 8,
          channels: 14,
          features: [
            'LED RGB+W+A+UV',
            'Motorized zoom',
            'Pan/Tilt',
            'Dimmer',
            'Strobe'
          ],
          dmxMode: 'Standard 14ch'
        }
      ],
      washes: [
        {
          manufacturer: 'Chauvet',
          model: 'Maverick MK3 Wash',
          type: 'LED Moving Head Wash',
          quantity: 16,
          channels: 20,
          features: [
            'RGBW LED',
            'Motorized zoom',
            'Pan/Tilt',
            'Strobe',
            'Dimmer'
          ],
          dmxMode: 'Standard 20ch'
        }
      ]
    },
    fixedLights: {
      parCans: [
        {
          manufacturer: 'ETC',
          model: 'Source Four LED Series 3',
          type: 'LED Par Can',
          quantity: 32,
          channels: 6,
          features: [
            'RGBW LED',
            'Dimmer',
            'Strobe',
            'Color mixing'
          ],
          dmxMode: 'Standard 6ch'
        }
      ],
      ledBars: [
        {
          manufacturer: 'Chauvet',
          model: 'COLORado Batten',
          type: 'LED Bar',
          quantity: 24,
          channels: 4,
          features: [
            'RGBW LED',
            'Dimmer',
            'Strobe',
            'Pixel control'
          ],
          dmxMode: 'Standard 4ch'
        }
      ],
      strobes: [
        {
          manufacturer: 'Martin',
          model: 'Atomic 3000 LED',
          type: 'LED Strobe',
          quantity: 8,
          channels: 2,
          features: [
            'High-speed strobe',
            'Dimmer',
            'Intensity control'
          ],
          dmxMode: 'Standard 2ch'
        }
      ],
      followSpots: [
        {
          manufacturer: 'Robert Juliat',
          model: 'Cyberlight',
          type: 'Automated Follow Spot',
          quantity: 4,
          channels: 24,
          features: [
            'Motorized pan/tilt',
            'Zoom',
            'Focus',
            'Color wheel',
            'Gobo wheel',
            'Dimmer',
            'Strobe'
          ],
          dmxMode: 'Standard 24ch'
        }
      ]
    },
    effects: {
      lasers: [
        {
          manufacturer: 'Pangolin',
          model: 'FB4 Laser',
          type: 'RGB Laser',
          quantity: 2,
          channels: 8,
          features: [
            'RGB laser output',
            'Motorized pan/tilt',
            'Zoom',
            'Dimmer'
          ],
          dmxMode: 'Standard 8ch'
        }
      ],
      hazers: [
        {
          manufacturer: 'Chauvet',
          model: 'Hazzer Fluid',
          type: 'Haze Machine',
          quantity: 2,
          channels: 2,
          features: [
            'Fluid-based haze',
            'Intensity control',
            'Timer'
          ],
          dmxMode: 'Standard 2ch'
        }
      ],
      fogMachines: [
        {
          manufacturer: 'Martin',
          model: 'Magnum 2500 Hazer',
          type: 'Fog/Haze Machine',
          quantity: 2,
          channels: 3,
          features: [
            'Fog and haze modes',
            'Intensity control',
            'Timer',
            'Remote control'
          ],
          dmxMode: 'Standard 3ch'
        }
      ]
    }
  },

  /**
   * Lighting Positions & Rigging
   */
  positions: {
    mainRig: {
      trussType: 'Box truss 20.5"',
      height: 12,
      unit: 'meters',
      positions: [
        {
          name: 'Front truss',
          fixtures: ['Moving head spots', 'LED pars', 'Strobes'],
          quantity: 32
        },
        {
          name: 'Side truss left',
          fixtures: ['Moving head washes', 'LED bars'],
          quantity: 24
        },
        {
          name: 'Side truss right',
          fixtures: ['Moving head washes', 'LED bars'],
          quantity: 24
        },
        {
          name: 'Back truss',
          fixtures: ['Follow spots', 'Lasers'],
          quantity: 6
        }
      ]
    },
    stageFloor: {
      positions: [
        {
          name: 'Stage edge',
          fixtures: ['LED bars', 'Footlights'],
          quantity: 16
        },
        {
          name: 'Stage left wing',
          fixtures: ['Moving head washes'],
          quantity: 8
        },
        {
          name: 'Stage right wing',
          fixtures: ['Moving head washes'],
          quantity: 8
        }
      ]
    },
    frontOfHouse: {
      positions: [
        {
          name: 'FOH truss',
          fixtures: ['Moving head spots', 'LED pars'],
          quantity: 16
        }
      ]
    }
  },

  /**
   * Cabling & Distribution
   */
  cabling: {
    dmxCables: {
      type: 'XLR 5-pin (DMX512 standard)',
      lengths: [
        { length: '5m', quantity: 20 },
        { length: '10m', quantity: 16 },
        { length: '20m', quantity: 8 },
        { length: '50m', quantity: 4 }
      ],
      totalRuns: 48,
      shielding: 'Foil + braid shield'
    },
    ethernetCabling: {
      type: 'Cat6a (for Art-Net/sACN)',
      lengths: [
        { length: '10m', quantity: 12 },
        { length: '20m', quantity: 8 },
        { length: '50m', quantity: 4 }
      ],
      totalRuns: 24,
      poePowered: true
    },
    powerDistribution: {
      mainBreaker: '400A 3-phase',
      circuits: [
        { purpose: 'Moving lights', capacity: '100A' },
        { purpose: 'Fixed lights', capacity: '80A' },
        { purpose: 'Effects (lasers/haze)', capacity: '40A' },
        { purpose: 'Control systems', capacity: '20A' }
      ]
    }
  },

  /**
   * Network Infrastructure
   */
  network: {
    switches: {
      primary: {
        manufacturer: 'Cisco',
        model: 'SG350-28P',
        ports: 28,
        poePorts: 24,
        quantity: 2,
        purpose: 'Art-Net/sACN distribution'
      }
    },
    redundancy: {
      enabled: true,
      primaryNetwork: 'Main control network',
      backupNetwork: 'Wireless backup (2.4GHz)',
      failoverTime: '< 100ms'
    },
    security: {
      vlan: {
        enabled: true,
        lightingVlan: 'VLAN 10',
        controlVlan: 'VLAN 20',
        isolation: true
      },
      firewall: {
        enabled: true,
        dmxPorts: [6454, 5568],
        whitelistMode: true
      }
    }
  },

  /**
   * Control & Monitoring
   */
  monitoring: {
    rdm: {
      enabled: true,
      standard: 'ANSI E1.20',
      features: [
        'Device discovery',
        'Parameter adjustment',
        'Firmware updates',
        'Diagnostics'
      ]
    },
    visualization: {
      software: 'ETC Eos Visualizer',
      features: [
        '3D stage visualization',
        'Real-time preview',
        'Fixture positioning',
        'Effect preview'
      ]
    },
    logging: {
      enabled: true,
      logLevel: 'INFO',
      storage: 'Local + Cloud backup',
      retention: '90 days'
    }
  },

  /**
   * Cue & Scene Management
   */
  cueing: {
    cueStack: {
      maxCues: 10000,
      cueFormat: 'ETC Eos format',
      features: [
        'Crossfade timing',
        'Effect timing',
        'Fixture targeting',
        'Conditional logic'
      ]
    },
    effects: {
      available: [
        'Strobe patterns',
        'Color chases',
        'Pan/tilt movements',
        'Intensity ramps',
        'Gobo rotations',
        'Custom sequences'
      ]
    },
    presets: {
      colorPresets: 256,
      positionPresets: 512,
      effectPresets: 256
    }
  },

  /**
   * Power & UPS
   */
  power: {
    mainSupply: {
      type: '400A 3-phase',
      voltage: '208V',
      backup: {
        type: 'Generator',
        capacity: '500kVA',
        fuelType: 'Diesel',
        runtime: '8+ hours'
      }
    },
    ups: {
      console: {
        manufacturer: 'APC',
        model: 'Smart-UPS 3000',
        runtime: '30 minutes',
        quantity: 2
      },
      network: {
        manufacturer: 'APC',
        model: 'Smart-UPS 1500',
        runtime: '20 minutes',
        quantity: 2
      }
    }
  },

  /**
   * Crew & Training
   */
  crew: {
    lightingDesigner: 1,
    lightingOperator: 2,
    lightingTechnician: 3,
    rfTechnician: 1,
    totalCrew: 7
  }
}

/**
 * Get complete light control rig configuration
 * @returns {Object} Full light control rig configuration
 */
function getLightControlRig () {
  return LIGHT_CONTROL_RIG
}

/**
 * Get a specific section of the light control rig
 * @param {string} section - Section name
 * @returns {Object|null} Section configuration or null if not found
 */
function getLightSection (section) {
  return LIGHT_CONTROL_RIG[section] || null
}

/**
 * Calculate total fixture count
 * @returns {Object} Fixture counts by type
 */
function getFixtureCount () {
  const fixtures = LIGHT_CONTROL_RIG.fixtures
  return {
    movingSpots: fixtures.movingLights.spotlights.reduce((sum, f) => sum + f.quantity, 0),
    movingWashes: fixtures.movingLights.washes.reduce((sum, f) => sum + f.quantity, 0),
    parCans: fixtures.fixedLights.parCans.reduce((sum, f) => sum + f.quantity, 0),
    ledBars: fixtures.fixedLights.ledBars.reduce((sum, f) => sum + f.quantity, 0),
    strobes: fixtures.fixedLights.strobes.reduce((sum, f) => sum + f.quantity, 0),
    followSpots: fixtures.fixedLights.followSpots.reduce((sum, f) => sum + f.quantity, 0),
    lasers: fixtures.effects.lasers.reduce((sum, f) => sum + f.quantity, 0),
    hazers: fixtures.effects.hazers.reduce((sum, f) => sum + f.quantity, 0),
    fogMachines: fixtures.effects.fogMachines.reduce((sum, f) => sum + f.quantity, 0),
    total: function () {
      return this.movingSpots + this.movingWashes + this.parCans + this.ledBars +
             this.strobes + this.followSpots + this.lasers + this.hazers + this.fogMachines
    }
  }
}

/**
 * Calculate total DMX channel requirements
 * @returns {Object} Channel counts by universe
 */
function getDmxChannelCount () {
  const fixtures = LIGHT_CONTROL_RIG.fixtures
  let totalChannels = 0

  const countChannels = (fixtureArray) => {
    return fixtureArray.reduce((sum, f) => sum + (f.quantity * f.channels), 0)
  }

  totalChannels += countChannels(fixtures.movingLights.spotlights)
  totalChannels += countChannels(fixtures.movingLights.washes)
  totalChannels += countChannels(fixtures.fixedLights.parCans)
  totalChannels += countChannels(fixtures.fixedLights.ledBars)
  totalChannels += countChannels(fixtures.fixedLights.strobes)
  totalChannels += countChannels(fixtures.fixedLights.followSpots)
  totalChannels += countChannels(fixtures.effects.lasers)
  totalChannels += countChannels(fixtures.effects.hazers)
  totalChannels += countChannels(fixtures.effects.fogMachines)

  return {
    totalChannels,
    universesRequired: Math.ceil(totalChannels / 512),
    channelsPerUniverse: 512,
    utilizationPercent: ((totalChannels / (Math.ceil(totalChannels / 512) * 512)) * 100).toFixed(2)
  }
}

/**
 * Generate fixture inventory
 * @returns {Array} Complete fixture list with DMX addresses
 */
function generateFixtureInventory () {
  const inventory = []
  let dmxAddress = 1
  let universe = 1

  const addFixtures = (fixtureArray, category) => {
    fixtureArray.forEach(fixtureType => {
      for (let i = 0; i < fixtureType.quantity; i++) {
        if (dmxAddress + fixtureType.channels > 512) {
          universe++
          dmxAddress = 1
        }

        inventory.push({
          id: `${category}-${fixtureType.manufacturer}-${i + 1}`,
          manufacturer: fixtureType.manufacturer,
          model: fixtureType.model,
          type: fixtureType.type,
          universe,
          dmxAddress,
          channels: fixtureType.channels,
          dmxMode: fixtureType.dmxMode
        })

        dmxAddress += fixtureType.channels
      }
    })
  }

  const fixtures = LIGHT_CONTROL_RIG.fixtures
  addFixtures(fixtures.movingLights.spotlights, 'moving-spot')
  addFixtures(fixtures.movingLights.washes, 'moving-wash')
  addFixtures(fixtures.fixedLights.parCans, 'par-can')
  addFixtures(fixtures.fixedLights.ledBars, 'led-bar')
  addFixtures(fixtures.fixedLights.strobes, 'strobe')
  addFixtures(fixtures.fixedLights.followSpots, 'follow-spot')
  addFixtures(fixtures.effects.lasers, 'laser')
  addFixtures(fixtures.effects.hazers, 'hazer')
  addFixtures(fixtures.effects.fogMachines, 'fog-machine')

  return inventory
}

/**
 * Get power requirements summary
 * @returns {Object} Power requirements
 */
function getPowerRequirements () {
  return {
    totalAmps: 400,
    voltage: '208V 3-phase',
    circuits: {
      movingLights: '100A',
      fixedLights: '80A',
      effects: '40A',
      control: '20A'
    },
    generatorBackup: true,
    estimatedLoad: '320A typical',
    peakLoad: '380A'
  }
}

/**
 * Get security audit checklist
 * @returns {Object} Security audit items
 */
function getSecurityAuditChecklist () {
  return {
    networkSecurity: {
      vlanIsolation: 'ENABLED',
      firewallRules: 'CONFIGURED',
      whitelistMode: 'ACTIVE',
      encryptionTLS: 'REQUIRED',
      defaultCredentials: 'CHANGED'
    },
    dmxSecurity: {
      rdmEnabled: true,
      deviceAuthentication: true,
      firmwareVerification: true,
      unauthorizedDeviceDetection: true
    },
    accessControl: {
      consoleAuthentication: 'REQUIRED',
      roleBasedAccess: 'IMPLEMENTED',
      auditLogging: 'ENABLED',
      sessionTimeout: '15 minutes'
    },
    dataProtection: {
      showFileEncryption: 'AES-256',
      backupEncryption: 'AES-256',
      transportEncryption: 'TLS 1.3'
    },
    compliance: {
      dmx512Standard: 'ANSI/ESTA E1.11 COMPLIANT',
      rdmStandard: 'ANSI E1.20 COMPLIANT',
      saCnStandard: 'ANSI E1.31 COMPLIANT',
      artNetVersion: '4.0 COMPLIANT'
    }
  }
}

module.exports = {
  LIGHT_CONTROL_RIG,
  getLightControlRig,
  getLightSection,
  getFixtureCount,
  getDmxChannelCount,
  generateFixtureInventory,
  getPowerRequirements,
  getSecurityAuditChecklist
}
