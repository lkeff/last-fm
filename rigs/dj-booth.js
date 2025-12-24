/**
 * DJ Booth Configuration
 * Complete professional DJ booth setup with club-standard equipment,
 * controllers, mixers, effects, and monitoring systems.
 * 
 * @module rigs/dj-booth
 */

const DJ_BOOTH = {
    name: 'Professional DJ Booth',
    version: '1.0.0',
    type: 'dj-booth',
    venueType: 'Club/Festival',

    /**
     * Primary Playback System - CDJs
     */
    cdjs: {
        primary: {
            manufacturer: 'Pioneer DJ',
            model: 'CDJ-3000',
            quantity: 4,
            features: [
                '9-inch touchscreen',
                'MPE (Music Performance Engine)',
                'Pro DJ Link',
                'Bluetooth connectivity',
                'Key Sync',
                'Touch Preview',
                '8 Hot Cues',
                'Beat Jump',
                'Slip Mode',
                'Quantize'
            ],
            connectivity: {
                usb: 2,
                sdCard: 1,
                linkPorts: 2,
                digitalOut: 'AES/EBU, S/PDIF',
                analogOut: 'RCA'
            },
            formats: ['WAV', 'AIFF', 'MP3', 'AAC', 'FLAC', 'ALAC'],
            maxBitrate: '24-bit/96kHz'
        },
        backup: {
            manufacturer: 'Pioneer DJ',
            model: 'CDJ-2000NXS2',
            quantity: 2,
            purpose: 'Backup/Additional decks'
        }
    },

    /**
     * DJ Mixer
     */
    mixer: {
        primary: {
            manufacturer: 'Pioneer DJ',
            model: 'DJM-V10',
            channels: 6,
            features: [
                '6-channel mixer',
                '4-band EQ per channel',
                'Compressor per channel',
                'Send/Return effects',
                'Master Isolator',
                '6 Sound Color FX',
                '14 Beat FX',
                'Dual USB audio interface',
                'Pro DJ Link',
                'Dual Bluetooth input'
            ],
            eq: {
                type: '4-band',
                frequencies: ['Hi', 'Hi-Mid', 'Lo-Mid', 'Lo'],
                isolator: true
            },
            effects: {
                soundColorFX: [
                    'Space', 'Dub Echo', 'Sweep', 'Noise', 'Crush', 'Filter'
                ],
                beatFX: [
                    'Delay', 'Echo', 'Ping Pong', 'Spiral', 'Helix',
                    'Reverb', 'Trans', 'Flanger', 'Phaser', 'Filter',
                    'Slip Roll', 'Roll', 'Vinyl Brake', 'Pitch'
                ]
            },
            connectivity: {
                inputs: {
                    phono: 6,
                    line: 6,
                    digital: 2,
                    mic: 2
                },
                outputs: {
                    masterXLR: 2,
                    masterRCA: 1,
                    booth: 1,
                    rec: 1,
                    sendReturn: 2
                },
                usb: 2
            }
        },
        backup: {
            manufacturer: 'Pioneer DJ',
            model: 'DJM-900NXS2',
            channels: 4,
            purpose: 'Backup mixer'
        },
        rotaryOption: {
            manufacturer: 'Allen & Heath',
            model: 'Xone:96',
            channels: 6,
            purpose: 'Alternative for house/techno'
        }
    },

    /**
     * DJ Controllers
     */
    controllers: {
        standalone: {
            manufacturer: 'Pioneer DJ',
            model: 'XDJ-XZ',
            purpose: 'All-in-one backup/mobile setup',
            features: [
                '4-channel mixer',
                '2 full-size jog wheels',
                'rekordbox/Serato compatible',
                'USB playback'
            ]
        },
        padController: {
            manufacturer: 'Pioneer DJ',
            model: 'DDJ-XP2',
            quantity: 2,
            purpose: 'Additional performance pads',
            features: ['32 pads', 'Jog wheel strip', 'Key shift']
        },
        sampler: {
            manufacturer: 'Pioneer DJ',
            model: 'DJS-1000',
            quantity: 1,
            purpose: 'Standalone sampler/sequencer',
            features: ['16 pads', 'Touchscreen', 'Pro DJ Link']
        }
    },

    /**
     * Turntables
     */
    turntables: {
        primary: {
            manufacturer: 'Technics',
            model: 'SL-1200MK7',
            quantity: 2,
            features: [
                'Direct drive',
                'Coreless motor',
                'Reverse play',
                'Pitch range ±8/16%',
                'Digital outputs'
            ],
            cartridge: {
                manufacturer: 'Ortofon',
                model: 'Concorde DJ S',
                quantity: 4,
                type: 'DJ cartridge'
            }
        },
        backup: {
            manufacturer: 'Pioneer DJ',
            model: 'PLX-1000',
            quantity: 2
        }
    },

    /**
     * Effects Units
     */
    effects: {
        external: [
            {
                manufacturer: 'Pioneer DJ',
                model: 'RMX-1000',
                quantity: 1,
                type: 'Remix station',
                features: ['Scene FX', 'Isolate FX', 'X-Pad FX', 'Release FX']
            },
            {
                manufacturer: 'Eventide',
                model: 'H9 Max',
                quantity: 2,
                type: 'Multi-effects',
                purpose: 'Send/return effects'
            },
            {
                manufacturer: 'Strymon',
                model: 'BigSky',
                quantity: 1,
                type: 'Reverb',
                purpose: 'Premium reverb effects'
            },
            {
                manufacturer: 'Elektron',
                model: 'Analog Heat MKII',
                quantity: 1,
                type: 'Analog distortion/filter',
                purpose: 'Analog warmth and saturation'
            }
        ],
        software: [
            {
                name: 'rekordbox',
                version: '6.x',
                mode: 'Performance',
                features: ['Beat FX', 'Sound Color FX', 'Pad FX']
            },
            {
                name: 'Serato DJ Pro',
                version: '3.x',
                purpose: 'Alternative software'
            },
            {
                name: 'Traktor Pro',
                version: '3.x',
                purpose: 'Alternative software'
            }
        ]
    },

    /**
     * Booth Monitoring
     */
    monitoring: {
        boothMonitors: {
            manufacturer: 'Pioneer DJ',
            model: 'VM-80',
            quantity: 2,
            type: '8-inch active monitor',
            placement: 'Booth, angled toward DJ',
            features: ['DSP tuning', 'XLR/RCA inputs']
        },
        alternativeMonitors: {
            manufacturer: 'KRK',
            model: 'Rokit 8 G4',
            quantity: 2,
            purpose: 'Alternative booth monitors'
        },
        subwoofer: {
            manufacturer: 'Pioneer DJ',
            model: 'VM-50S',
            quantity: 1,
            purpose: 'Booth sub for low-end reference'
        },
        headphones: [
            {
                manufacturer: 'Pioneer DJ',
                model: 'HDJ-X10',
                quantity: 2,
                type: 'Flagship DJ headphones',
                features: ['50mm drivers', 'Swivel design', 'Detachable cable']
            },
            {
                manufacturer: 'Sennheiser',
                model: 'HD 25',
                quantity: 4,
                type: 'Industry standard',
                purpose: 'Backup/guest headphones'
            },
            {
                manufacturer: 'V-Moda',
                model: 'Crossfade M-100',
                quantity: 2,
                purpose: 'Alternative option'
            }
        ],
        headphoneAmps: {
            manufacturer: 'Behringer',
            model: 'HA400',
            quantity: 2,
            purpose: 'Multiple headphone outputs'
        }
    },

    /**
     * Booth Furniture
     */
    furniture: {
        djBooth: {
            type: 'Custom built-in',
            dimensions: {
                width: 2.4,
                depth: 0.8,
                height: 0.9,
                unit: 'meters'
            },
            features: [
                'Adjustable height sections',
                'Cable management',
                'Ventilation',
                'LED accent lighting',
                'Laptop stand integrated',
                'Drink holder'
            ],
            material: 'Matte black laminate with aluminum trim'
        },
        laptopStand: {
            manufacturer: 'Crane',
            model: 'Stand Plus',
            quantity: 2
        },
        flightCases: [
            { type: 'CDJ-3000 case', quantity: 4 },
            { type: 'DJM-V10 case', quantity: 1 },
            { type: 'Turntable case', quantity: 2 },
            { type: 'Accessory case', quantity: 2 }
        ]
    },

    /**
     * Lighting Control
     */
    lighting: {
        controller: {
            manufacturer: 'Pioneer DJ',
            model: 'RB-DMX1',
            purpose: 'rekordbox lighting mode',
            features: ['DMX output', 'Phrase analysis', 'Beat sync']
        },
        boothLighting: [
            {
                type: 'LED strip',
                color: 'RGB',
                placement: 'Under booth edge',
                control: 'DMX'
            },
            {
                type: 'Gooseneck lamp',
                manufacturer: 'Littlite',
                model: '18XR-LED',
                quantity: 2,
                purpose: 'Equipment illumination'
            }
        ]
    },

    /**
     * Connectivity & Networking
     */
    connectivity: {
        proDJLink: {
            enabled: true,
            switch: {
                manufacturer: 'Netgear',
                model: 'GS108',
                ports: 8
            },
            features: ['Track sharing', 'Beat sync', 'Phase sync']
        },
        audioInterface: {
            manufacturer: 'Pioneer DJ',
            model: 'Interface 2',
            purpose: 'DVS audio interface',
            features: ['2 stereo channels', 'USB-C', 'rekordbox DVS']
        },
        usbHub: {
            manufacturer: 'Anker',
            model: 'USB 3.0 Hub',
            ports: 10,
            powered: true
        },
        mediaStorage: {
            usb: [
                { manufacturer: 'SanDisk', model: 'Extreme Pro 256GB', quantity: 4 },
                { manufacturer: 'Samsung', model: 'T7 1TB SSD', quantity: 2 }
            ],
            sdCards: [
                { manufacturer: 'SanDisk', model: 'Extreme Pro 128GB', quantity: 4 }
            ]
        }
    },

    /**
     * Power Distribution
     */
    power: {
        distribution: {
            manufacturer: 'Furman',
            model: 'M-8x2',
            outlets: 9,
            features: ['Surge protection', 'EMI/RFI filtering']
        },
        ups: {
            manufacturer: 'APC',
            model: 'Back-UPS Pro 1500',
            purpose: 'Power backup for critical equipment'
        },
        requirements: {
            voltage: '120V/240V',
            amperage: '20A dedicated circuit',
            outlets: 12
        }
    },

    /**
     * Communication
     */
    communication: {
        intercom: {
            manufacturer: 'Clear-Com',
            model: 'FreeSpeak II',
            beltpack: 1,
            purpose: 'Communication with production'
        },
        talkback: {
            enabled: true,
            mic: {
                manufacturer: 'Shure',
                model: 'SM58',
                purpose: 'MC/announcements'
            }
        }
    },

    /**
     * Recording/Streaming
     */
    recording: {
        hardware: {
            manufacturer: 'Zoom',
            model: 'H6',
            purpose: 'Backup recording',
            format: 'WAV 24-bit/96kHz'
        },
        software: {
            primary: 'rekordbox recording',
            backup: 'Audacity/Ableton Live'
        },
        streaming: {
            encoder: {
                manufacturer: 'Blackmagic',
                model: 'Web Presenter',
                purpose: 'Audio/video streaming'
            },
            platforms: ['Twitch', 'YouTube', 'Mixcloud']
        }
    },

    /**
     * Software & Music Management
     */
    software: {
        musicManagement: {
            primary: {
                name: 'rekordbox',
                version: '6.x',
                subscription: 'Creative Plan',
                features: ['Cloud library', 'Lighting mode', 'Video']
            },
            backup: {
                name: 'Engine DJ',
                purpose: 'Denon compatibility'
            }
        },
        analysis: {
            beatgrid: 'rekordbox analysis',
            keyDetection: 'Mixed In Key',
            organization: 'Lexicon DJ'
        },
        plugins: [
            { name: 'Serato Pitch n Time DJ', purpose: 'Key lock quality' },
            { name: 'Serato Flip', purpose: 'Arrangement editing' },
            { name: 'Serato Play', purpose: 'Practice without hardware' }
        ]
    },

    /**
     * Backup Systems
     */
    backup: {
        equipment: {
            laptop: {
                manufacturer: 'Apple',
                model: 'MacBook Pro 16"',
                specs: 'M3 Max, 64GB RAM, 2TB SSD',
                purpose: 'Emergency DJ software backup'
            },
            controller: {
                manufacturer: 'Pioneer DJ',
                model: 'DDJ-1000',
                purpose: 'Emergency controller backup'
            }
        },
        music: {
            primary: 'USB drives (2x copies)',
            secondary: 'Laptop with full library',
            cloud: 'rekordbox Cloud (sync enabled)'
        },
        cables: {
            rca: 6,
            xlr: 4,
            usb: 8,
            ethernet: 4,
            power: 6
        }
    },

    /**
     * Rider Requirements
     */
    rider: {
        essential: [
            '4x Pioneer CDJ-3000 or CDJ-2000NXS2',
            '1x Pioneer DJM-V10 or DJM-900NXS2',
            'Pro DJ Link network setup',
            'Booth monitors (minimum 8")',
            'Booth subwoofer',
            'Dedicated 20A power circuit',
            'Stable table/booth at correct height',
            'Adequate lighting for equipment'
        ],
        preferred: [
            'Pioneer HDJ-X10 headphones',
            'Technics SL-1200MK7 turntables',
            'RMX-1000 effects unit',
            'rekordbox-compatible lighting'
        ],
        hospitality: [
            'Water (still, room temperature)',
            'Towel',
            'Secure storage for personal items'
        ]
    },

    /**
     * Setup Checklist
     */
    setupChecklist: [
        { step: 1, task: 'Verify power supply and grounding', category: 'Power' },
        { step: 2, task: 'Connect Pro DJ Link network', category: 'Network' },
        { step: 3, task: 'Set up CDJs and verify USB/SD access', category: 'Playback' },
        { step: 4, task: 'Connect mixer inputs and outputs', category: 'Audio' },
        { step: 5, task: 'Configure booth monitor levels', category: 'Monitoring' },
        { step: 6, task: 'Test headphone outputs', category: 'Monitoring' },
        { step: 7, task: 'Verify main PA connection', category: 'Audio' },
        { step: 8, task: 'Test all channels and effects', category: 'Mixer' },
        { step: 9, task: 'Configure rekordbox/software', category: 'Software' },
        { step: 10, task: 'Sound check with FOH engineer', category: 'Audio' },
        { step: 11, task: 'Set up recording if required', category: 'Recording' },
        { step: 12, task: 'Verify communication with production', category: 'Comms' }
    ]
}

/**
 * Get the complete DJ booth configuration
 * @returns {Object} Full DJ booth configuration
 */
function getDJBooth() {
    return DJ_BOOTH
}

/**
 * Get a specific section of the DJ booth
 * @param {string} section - Section name
 * @returns {Object|null} Section configuration or null if not found
 */
function getDJSection(section) {
    return DJ_BOOTH[section] || null
}

/**
 * Get equipment list for transport
 * @returns {Array} List of equipment with quantities
 */
function getEquipmentList() {
    const equipment = []

    // CDJs
    equipment.push({
        category: 'Playback',
        item: `${DJ_BOOTH.cdjs.primary.manufacturer} ${DJ_BOOTH.cdjs.primary.model}`,
        quantity: DJ_BOOTH.cdjs.primary.quantity
    })

    // Mixer
    equipment.push({
        category: 'Mixer',
        item: `${DJ_BOOTH.mixer.primary.manufacturer} ${DJ_BOOTH.mixer.primary.model}`,
        quantity: 1
    })

    // Turntables
    equipment.push({
        category: 'Turntables',
        item: `${DJ_BOOTH.turntables.primary.manufacturer} ${DJ_BOOTH.turntables.primary.model}`,
        quantity: DJ_BOOTH.turntables.primary.quantity
    })

    // Headphones
    DJ_BOOTH.monitoring.headphones.forEach(hp => {
        equipment.push({
            category: 'Monitoring',
            item: `${hp.manufacturer} ${hp.model}`,
            quantity: hp.quantity
        })
    })

    // Effects
    DJ_BOOTH.effects.external.forEach(fx => {
        equipment.push({
            category: 'Effects',
            item: `${fx.manufacturer} ${fx.model}`,
            quantity: fx.quantity
        })
    })

    return equipment
}

/**
 * Get technical rider summary
 * @returns {Object} Rider requirements
 */
function getRider() {
    return DJ_BOOTH.rider
}

/**
 * Get setup checklist
 * @returns {Array} Setup steps
 */
function getSetupChecklist() {
    return DJ_BOOTH.setupChecklist
}

/**
 * Calculate total channel count
 * @returns {Object} Channel information
 */
function getChannelCount() {
    return {
        mixerChannels: DJ_BOOTH.mixer.primary.channels,
        cdjCount: DJ_BOOTH.cdjs.primary.quantity,
        turntableCount: DJ_BOOTH.turntables.primary.quantity,
        totalInputs: DJ_BOOTH.mixer.primary.connectivity.inputs.phono +
            DJ_BOOTH.mixer.primary.connectivity.inputs.line
    }
}

/**
 * Get signal flow for DJ booth
 * @returns {Object} Signal flow diagram data
 */
function getSignalFlow() {
    return {
        nodes: [
            { id: 'cdj1', type: 'source', label: 'CDJ 1' },
            { id: 'cdj2', type: 'source', label: 'CDJ 2' },
            { id: 'cdj3', type: 'source', label: 'CDJ 3' },
            { id: 'cdj4', type: 'source', label: 'CDJ 4' },
            { id: 'tt1', type: 'source', label: 'Turntable 1' },
            { id: 'tt2', type: 'source', label: 'Turntable 2' },
            { id: 'mixer', type: 'process', label: 'DJM-V10 Mixer' },
            { id: 'effects', type: 'process', label: 'External Effects' },
            { id: 'booth', type: 'output', label: 'Booth Monitors' },
            { id: 'main', type: 'output', label: 'Main PA' },
            { id: 'record', type: 'output', label: 'Recording' }
        ],
        connections: [
            { from: 'cdj1', to: 'mixer', channel: 1 },
            { from: 'cdj2', to: 'mixer', channel: 2 },
            { from: 'cdj3', to: 'mixer', channel: 3 },
            { from: 'cdj4', to: 'mixer', channel: 4 },
            { from: 'tt1', to: 'mixer', channel: 5 },
            { from: 'tt2', to: 'mixer', channel: 6 },
            { from: 'mixer', to: 'effects', type: 'send' },
            { from: 'effects', to: 'mixer', type: 'return' },
            { from: 'mixer', to: 'booth', type: 'booth out' },
            { from: 'mixer', to: 'main', type: 'master out' },
            { from: 'mixer', to: 'record', type: 'rec out' }
        ]
    }
}

/**
 * Get BPM range recommendations by genre
 * @returns {Object} Genre BPM ranges
 */
function getGenreBPMRanges() {
    return {
        house: { min: 118, max: 130, typical: 124 },
        techno: { min: 125, max: 150, typical: 135 },
        trance: { min: 130, max: 150, typical: 140 },
        dubstep: { min: 140, max: 150, typical: 140, halfTime: 70 },
        drumAndBass: { min: 160, max: 180, typical: 174 },
        hiphop: { min: 85, max: 115, typical: 95 },
        disco: { min: 110, max: 130, typical: 120 },
        deepHouse: { min: 118, max: 125, typical: 122 },
        progressive: { min: 126, max: 132, typical: 128 },
        hardstyle: { min: 150, max: 160, typical: 150 }
    }
}

module.exports = {
    DJ_BOOTH,
    getDJBooth,
    getDJSection,
    getEquipmentList,
    getRider,
    getSetupChecklist,
    getChannelCount,
    getSignalFlow,
    getGenreBPMRanges
}
