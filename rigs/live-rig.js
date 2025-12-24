/**
 * Live Rig Configuration
 * Full professional live performance setup with PA systems,
 * stage monitoring, FOH/Monitor mixing, and touring infrastructure.
 * 
 * @module rigs/live-rig
 */

const LIVE_RIG = {
    name: 'Professional Live Performance Rig',
    version: '1.0.0',
    type: 'live',
    venueCapacity: { min: 500, max: 20000 },

    /**
     * Front of House (FOH) System
     */
    foh: {
        console: {
            manufacturer: 'DiGiCo',
            model: 'Quantum7',
            channels: 170,
            busses: 48,
            features: [
                'Mustard processing',
                'Nodal processing',
                'Spice Rack plugins',
                'DMI card slots',
                'Redundant engines'
            ],
            stageBoxes: [
                { model: 'SD-Rack', inputs: 56, outputs: 24, quantity: 2 },
                { model: 'SD-MiNi Rack', inputs: 32, outputs: 8, quantity: 2 }
            ]
        },
        backupConsole: {
            manufacturer: 'Yamaha',
            model: 'CL5',
            channels: 72,
            purpose: 'Backup/Festival'
        },
        processing: {
            systemProcessor: {
                manufacturer: 'Lake',
                model: 'LM 44',
                quantity: 4,
                features: ['Mesa EQ', 'Linear phase crossovers', 'Limiters']
            },
            plugins: [
                { manufacturer: 'Waves', model: 'SuperRack', purpose: 'Plugin host' },
                { manufacturer: 'Universal Audio', model: 'Apollo x16', purpose: 'UAD processing' }
            ]
        },
        outboard: [
            { manufacturer: 'Empirical Labs', model: 'Distressor', quantity: 4 },
            { manufacturer: 'Tube-Tech', model: 'CL 1B', quantity: 2 },
            { manufacturer: 'Bricasti', model: 'M7', quantity: 2 },
            { manufacturer: 'Eventide', model: 'H3000', quantity: 1 }
        ]
    },

    /**
     * Main PA System
     */
    mainPA: {
        manufacturer: 'L-Acoustics',
        system: 'K Series',
        configuration: {
            mainHangs: {
                model: 'K2',
                perSide: 16,
                rigging: 'Bumper and pullback',
                coverage: '110° horizontal'
            },
            outfills: {
                model: 'K1-SB',
                perSide: 4,
                purpose: 'Extended horizontal coverage'
            },
            subs: {
                model: 'KS28',
                quantity: 24,
                configuration: 'Cardioid array (ground stacked)',
                arrangement: '6 stacks of 4'
            },
            frontfills: {
                model: 'Kara II',
                quantity: 8,
                placement: 'Stage lip'
            },
            delays: [
                { model: 'K2', quantity: 8, position: 'Delay tower 1 (50m)' },
                { model: 'K2', quantity: 8, position: 'Delay tower 2 (100m)' }
            ]
        },
        amplification: {
            manufacturer: 'L-Acoustics',
            model: 'LA12X',
            quantity: 48,
            rackConfiguration: 'LA-RAK II'
        },
        processing: {
            manufacturer: 'L-Acoustics',
            model: 'P1',
            quantity: 4,
            software: 'LA Network Manager'
        },
        coverage: {
            maxSPL: '150dB peak',
            frequencyResponse: '27Hz - 20kHz',
            throwDistance: '150m'
        }
    },

    /**
     * Monitor System
     */
    monitors: {
        console: {
            manufacturer: 'DiGiCo',
            model: 'SD12',
            channels: 96,
            busses: 24,
            stageBoxes: [
                { model: 'SD-Rack', inputs: 56, outputs: 24, quantity: 1 }
            ]
        },
        wedges: [
            {
                manufacturer: 'L-Acoustics',
                model: 'X15 HiQ',
                quantity: 16,
                power: 'LA4X amplification',
                usage: 'Primary floor monitors'
            },
            {
                manufacturer: 'L-Acoustics',
                model: 'X12',
                quantity: 8,
                usage: 'Secondary/drum fill'
            }
        ],
        sidefills: {
            manufacturer: 'L-Acoustics',
            model: 'A15',
            quantity: 4,
            subwoofer: { model: 'SB18', quantity: 4 }
        },
        drumfill: {
            manufacturer: 'L-Acoustics',
            model: 'SB28',
            quantity: 2,
            topBox: { model: 'A15 Focus', quantity: 2 }
        },
        inEarMonitors: {
            systems: [
                {
                    manufacturer: 'Shure',
                    model: 'PSM1000',
                    quantity: 16,
                    features: ['Diversity', 'Networked', 'Dante enabled']
                }
            ],
            earpieces: [
                { manufacturer: 'JH Audio', model: 'Roxanne', quantity: 12, type: 'Custom molded' },
                { manufacturer: 'Shure', model: 'SE846', quantity: 8, type: 'Universal' },
                { manufacturer: '64 Audio', model: 'A18t', quantity: 6, type: 'Custom molded' }
            ],
            antennaDistribution: {
                manufacturer: 'Shure',
                model: 'AD8000',
                zones: 4
            }
        }
    },

    /**
     * Wireless Systems
     */
    wireless: {
        microphones: {
            system: {
                manufacturer: 'Shure',
                model: 'Axient Digital',
                channels: 24,
                features: ['ShowLink', 'Quadversity', 'Interference detection']
            },
            handhelds: [
                { capsule: 'KSM9', quantity: 8 },
                { capsule: 'SM58', quantity: 4 },
                { capsule: 'Beta 87A', quantity: 4 }
            ],
            bodypacks: {
                quantity: 16,
                lavaliers: [
                    { manufacturer: 'DPA', model: '4061', quantity: 8 },
                    { manufacturer: 'Countryman', model: 'B3', quantity: 8 }
                ],
                headsets: [
                    { manufacturer: 'DPA', model: '4088', quantity: 4 },
                    { manufacturer: 'Shure', model: 'SM35', quantity: 4 }
                ]
            }
        },
        instruments: {
            system: {
                manufacturer: 'Shure',
                model: 'Axient Digital',
                channels: 8
            },
            transmitters: [
                { type: 'Guitar/Bass', quantity: 6 },
                { type: 'Instrument pack', quantity: 4 }
            ]
        },
        antennaSystem: {
            distribution: {
                manufacturer: 'Shure',
                model: 'AD8000',
                quantity: 2
            },
            antennas: [
                { manufacturer: 'Shure', model: 'UA874', type: 'Active directional', quantity: 8 },
                { manufacturer: 'RF Venue', model: 'Diversity Fin', quantity: 4 }
            ],
            combiners: {
                manufacturer: 'Shure',
                model: 'PA821B',
                quantity: 4
            }
        },
        frequencyCoordination: {
            software: 'Shure Wireless Workbench',
            spectrum: {
                analyzer: { manufacturer: 'RF Explorer', model: 'Pro Audio' },
                bands: ['470-608 MHz', '614-616 MHz', '941-960 MHz']
            }
        }
    },

    /**
     * Stage Microphones
     */
    stageMicrophones: {
        vocals: [
            { manufacturer: 'Shure', model: 'SM58', quantity: 8, type: 'Dynamic' },
            { manufacturer: 'Shure', model: 'Beta 58A', quantity: 4, type: 'Dynamic' },
            { manufacturer: 'Sennheiser', model: 'e935', quantity: 4, type: 'Dynamic' },
            { manufacturer: 'Telefunken', model: 'M80', quantity: 4, type: 'Dynamic' }
        ],
        drums: {
            kick: [
                { manufacturer: 'Shure', model: 'Beta 91A', quantity: 2, placement: 'Inside' },
                { manufacturer: 'Shure', model: 'Beta 52A', quantity: 2, placement: 'Outside' },
                { manufacturer: 'Audix', model: 'D6', quantity: 2, placement: 'Alternative' }
            ],
            snare: [
                { manufacturer: 'Shure', model: 'SM57', quantity: 4, placement: 'Top' },
                { manufacturer: 'Shure', model: 'Beta 57A', quantity: 2, placement: 'Bottom' }
            ],
            toms: [
                { manufacturer: 'Sennheiser', model: 'e604', quantity: 6 },
                { manufacturer: 'Sennheiser', model: 'MD 421-II', quantity: 4 }
            ],
            hiHat: [
                { manufacturer: 'AKG', model: 'C451 B', quantity: 2 }
            ],
            overheads: [
                { manufacturer: 'Neumann', model: 'KM 184', quantity: 4 },
                { manufacturer: 'AKG', model: 'C414 XLS', quantity: 4 }
            ]
        },
        guitars: [
            { manufacturer: 'Shure', model: 'SM57', quantity: 8 },
            { manufacturer: 'Sennheiser', model: 'e906', quantity: 4 },
            { manufacturer: 'Royer', model: 'R-121', quantity: 2 }
        ],
        bass: [
            { manufacturer: 'Radial', model: 'JDI', quantity: 4, type: 'DI' },
            { manufacturer: 'Countryman', model: 'Type 85', quantity: 4, type: 'DI' },
            { manufacturer: 'Sennheiser', model: 'e602-II', quantity: 2, type: 'Amp mic' }
        ],
        keys: [
            { manufacturer: 'Radial', model: 'ProD2', quantity: 8, type: 'Stereo DI' },
            { manufacturer: 'Radial', model: 'JDI', quantity: 4, type: 'Passive DI' }
        ],
        acoustic: [
            { manufacturer: 'DPA', model: '4099', quantity: 4, type: 'Clip-on' },
            { manufacturer: 'Neumann', model: 'KM 184', quantity: 4, type: 'Stand mount' }
        ]
    },

    /**
     * Stage Infrastructure
     */
    stage: {
        dimensions: {
            width: 20,
            depth: 15,
            height: 1.5,
            unit: 'meters'
        },
        risers: [
            { purpose: 'Drums', dimensions: '4m x 3m x 0.6m', quantity: 1 },
            { purpose: 'Keys', dimensions: '3m x 2m x 0.3m', quantity: 2 },
            { purpose: 'Backup vocals', dimensions: '2m x 1m x 0.3m', quantity: 3 }
        ],
        cabling: {
            multicore: [
                { type: 'Analog', channels: 48, length: '75m', quantity: 2 },
                { type: 'Digital (Cat6a)', runs: 8, length: '100m' }
            ],
            power: {
                distribution: '400A 3-phase',
                distros: [
                    { type: 'Stage left', capacity: '125A' },
                    { type: 'Stage right', capacity: '125A' },
                    { type: 'FOH', capacity: '63A' },
                    { type: 'Monitors', capacity: '63A' }
                ]
            }
        },
        communication: {
            intercom: {
                manufacturer: 'Clear-Com',
                model: 'FreeSpeak II',
                beltpacks: 12,
                baseStations: 2
            },
            talkback: {
                manufacturer: 'Shure',
                model: 'SM58',
                positions: ['FOH', 'Monitors', 'Stage Manager', 'Lighting']
            }
        }
    },

    /**
     * Recording/Broadcast
     */
    recording: {
        multitrack: {
            manufacturer: 'Waves',
            model: 'SuperRack LiveBox',
            channels: 128,
            format: 'WAV 48kHz/24-bit'
        },
        broadcast: {
            feeds: [
                { type: 'Stereo mix', format: 'AES3' },
                { type: 'Multitrack', format: 'Dante 64ch' },
                { type: 'Backup stereo', format: 'Analog XLR' }
            ],
            redundancy: {
                recorder: { manufacturer: 'Sound Devices', model: '888', quantity: 2 }
            }
        },
        virtualSoundcheck: {
            enabled: true,
            storage: 'NAS with 10TB capacity',
            protocol: 'Dante'
        }
    },

    /**
     * Network Infrastructure
     */
    network: {
        audioNetwork: {
            protocol: 'Dante',
            switches: [
                { manufacturer: 'Cisco', model: 'SG350-28', quantity: 4, location: 'Stage' },
                { manufacturer: 'Cisco', model: 'SG350-28', quantity: 2, location: 'FOH' }
            ],
            redundancy: 'Primary + Secondary network'
        },
        controlNetwork: {
            protocol: 'Ethernet',
            purpose: 'Console control, wireless management, system monitoring'
        },
        fiber: {
            type: 'OpticalCON QUAD',
            runs: [
                { from: 'Stage', to: 'FOH', length: '100m' },
                { from: 'Stage', to: 'Broadcast', length: '150m' }
            ]
        }
    },

    /**
     * Power Distribution
     */
    power: {
        mainSupply: {
            type: '400A 3-phase',
            voltage: '208V',
            generator: {
                backup: true,
                capacity: '500kVA',
                manufacturer: 'Caterpillar'
            }
        },
        distribution: {
            manufacturer: 'Motion Labs',
            model: 'Power Distro',
            units: [
                { location: 'Stage Left', capacity: '200A' },
                { location: 'Stage Right', capacity: '200A' },
                { location: 'FOH', capacity: '100A' },
                { location: 'Delay Towers', capacity: '60A each' }
            ]
        },
        conditioning: [
            { manufacturer: 'Furman', model: 'P-3600 AR G', quantity: 4 }
        ],
        ups: [
            { manufacturer: 'APC', model: 'Smart-UPS 3000', location: 'FOH consoles' },
            { manufacturer: 'APC', model: 'Smart-UPS 3000', location: 'Monitor consoles' }
        ]
    },

    /**
     * Rigging
     */
    rigging: {
        motors: [
            { manufacturer: 'CM', model: 'Lodestar 1T', quantity: 24 },
            { manufacturer: 'CM', model: 'Lodestar 2T', quantity: 8 }
        ],
        truss: [
            { type: 'Main PA', model: 'Thomas 20.5" box truss', length: '40m' },
            { type: 'Delay towers', model: 'Thomas 12" box truss', quantity: 4 }
        ],
        control: {
            manufacturer: 'SRS',
            model: 'Rigging System',
            features: ['Load monitoring', 'Remote control']
        }
    },

    /**
     * Cases and Transport
     */
    transport: {
        cases: {
            consoles: [
                { type: 'DiGiCo Quantum7', quantity: 1 },
                { type: 'DiGiCo SD12', quantity: 1 }
            ],
            racks: [
                { type: 'Amp racks', quantity: 12 },
                { type: 'Wireless racks', quantity: 4 },
                { type: 'Processing racks', quantity: 4 }
            ],
            speakers: [
                { type: 'K2 touring carts', quantity: 8 },
                { type: 'KS28 dollies', quantity: 12 },
                { type: 'Wedge carts', quantity: 4 }
            ]
        },
        trucks: {
            quantity: 3,
            type: '53ft trailer',
            loadingTime: '4 hours',
            unloadingTime: '6 hours'
        }
    },

    /**
     * Crew Requirements
     */
    crew: {
        audio: {
            fohEngineer: 1,
            monitorEngineer: 1,
            systemTech: 2,
            stageTech: 4,
            rfTech: 1
        },
        production: {
            productionManager: 1,
            stageManager: 1
        },
        local: {
            stagehands: 16,
            riggers: 8,
            loaders: 12
        }
    }
}

/**
 * Get the complete live rig configuration
 * @returns {Object} Full live rig configuration
 */
function getLiveRig() {
    return LIVE_RIG
}

/**
 * Get a specific section of the live rig
 * @param {string} section - Section name
 * @returns {Object|null} Section configuration or null if not found
 */
function getLiveSection(section) {
    return LIVE_RIG[section] || null
}

/**
 * Calculate total speaker count
 * @returns {Object} Speaker counts by type
 */
function getSpeakerCount() {
    const pa = LIVE_RIG.mainPA.configuration
    return {
        mainArrays: pa.mainHangs.perSide * 2,
        outfills: pa.outfills.perSide * 2,
        subs: pa.subs.quantity,
        frontfills: pa.frontfills.quantity,
        delays: pa.delays.reduce((sum, d) => sum + d.quantity, 0),
        wedges: LIVE_RIG.monitors.wedges.reduce((sum, w) => sum + w.quantity, 0),
        sidefills: LIVE_RIG.monitors.sidefills.quantity,
        total: function () {
            return this.mainArrays + this.outfills + this.subs +
                this.frontfills + this.delays + this.wedges + this.sidefills
        }
    }
}

/**
 * Calculate total wireless channel count
 * @returns {Object} Wireless channel counts
 */
function getWirelessCount() {
    return {
        microphoneChannels: LIVE_RIG.wireless.microphones.system.channels,
        instrumentChannels: LIVE_RIG.wireless.instruments.system.channels,
        iemChannels: LIVE_RIG.monitors.inEarMonitors.systems[0].quantity,
        total: LIVE_RIG.wireless.microphones.system.channels +
            LIVE_RIG.wireless.instruments.system.channels +
            LIVE_RIG.monitors.inEarMonitors.systems[0].quantity
    }
}

/**
 * Generate input list template
 * @returns {Array} Input list with channel assignments
 */
function generateInputList() {
    const inputs = []
    let channel = 1

    // Drums
    inputs.push({ channel: channel++, source: 'Kick In', mic: 'Beta 91A' })
    inputs.push({ channel: channel++, source: 'Kick Out', mic: 'Beta 52A' })
    inputs.push({ channel: channel++, source: 'Snare Top', mic: 'SM57' })
    inputs.push({ channel: channel++, source: 'Snare Bottom', mic: 'Beta 57A' })
    inputs.push({ channel: channel++, source: 'Hi-Hat', mic: 'C451 B' })
    inputs.push({ channel: channel++, source: 'Tom 1', mic: 'e604' })
    inputs.push({ channel: channel++, source: 'Tom 2', mic: 'e604' })
    inputs.push({ channel: channel++, source: 'Floor Tom', mic: 'e604' })
    inputs.push({ channel: channel++, source: 'OH L', mic: 'KM 184' })
    inputs.push({ channel: channel++, source: 'OH R', mic: 'KM 184' })

    // Bass
    inputs.push({ channel: channel++, source: 'Bass DI', mic: 'JDI' })
    inputs.push({ channel: channel++, source: 'Bass Amp', mic: 'e602-II' })

    // Guitars
    inputs.push({ channel: channel++, source: 'GTR 1', mic: 'SM57' })
    inputs.push({ channel: channel++, source: 'GTR 2', mic: 'SM57' })
    inputs.push({ channel: channel++, source: 'GTR 3', mic: 'e906' })
    inputs.push({ channel: channel++, source: 'Acoustic DI', mic: '4099' })

    // Keys
    inputs.push({ channel: channel++, source: 'Keys L', mic: 'ProD2' })
    inputs.push({ channel: channel++, source: 'Keys R', mic: 'ProD2' })
    inputs.push({ channel: channel++, source: 'Synth L', mic: 'ProD2' })
    inputs.push({ channel: channel++, source: 'Synth R', mic: 'ProD2' })

    // Vocals
    inputs.push({ channel: channel++, source: 'Lead Vox', mic: 'Axient/KSM9' })
    inputs.push({ channel: channel++, source: 'BV 1', mic: 'Axient/SM58' })
    inputs.push({ channel: channel++, source: 'BV 2', mic: 'Axient/SM58' })
    inputs.push({ channel: channel++, source: 'BV 3', mic: 'Axient/SM58' })

    return inputs
}

/**
 * Get power requirements summary
 * @returns {Object} Power requirements
 */
function getPowerRequirements() {
    return {
        totalAmps: 400,
        voltage: '208V 3-phase',
        stages: {
            stageLeft: '200A',
            stageRight: '200A',
            foh: '100A',
            delays: '120A'
        },
        generatorBackup: true,
        estimatedLoad: '320A typical'
    }
}

module.exports = {
    LIVE_RIG,
    getLiveRig,
    getLiveSection,
    getSpeakerCount,
    getWirelessCount,
    generateInputList,
    getPowerRequirements
}
