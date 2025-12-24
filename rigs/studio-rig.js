/**
 * Studio Rig Configuration
 * Full professional recording studio setup with DAW integration,
 * audio routing, monitoring, and processing chains.
 * 
 * @module rigs/studio-rig
 */

const STUDIO_RIG = {
    name: 'Professional Studio Rig',
    version: '1.0.0',
    type: 'studio',

    /**
     * Digital Audio Workstation Configuration
     */
    daw: {
        primary: {
            name: 'Pro Tools Ultimate',
            version: '2024.6',
            sampleRate: 96000,
            bitDepth: 32,
            bufferSize: 256,
            ioChannels: {
                inputs: 64,
                outputs: 64,
                busses: 128
            }
        },
        secondary: {
            name: 'Ableton Live Suite',
            version: '12',
            purpose: 'Electronic production and live integration'
        },
        rewire: {
            enabled: true,
            syncMode: 'master'
        }
    },

    /**
     * Audio Interface Configuration
     */
    audioInterface: {
        primary: {
            manufacturer: 'Avid',
            model: 'Pro Tools | MTRX II',
            type: 'Dante/Pro Tools HDX',
            inputs: 64,
            outputs: 64,
            preamps: 8,
            sampleRates: [44100, 48000, 88200, 96000, 176400, 192000],
            adConversion: '32-bit/192kHz',
            daConversion: '32-bit/192kHz',
            dynamicRange: '129dB',
            thd: '-114dB'
        },
        expansion: [
            {
                manufacturer: 'Focusrite',
                model: 'RedNet A16R MkII',
                type: 'Dante',
                channels: 16,
                purpose: 'Additional I/O'
            },
            {
                manufacturer: 'Focusrite',
                model: 'RedNet MP8R',
                type: 'Dante',
                preamps: 8,
                purpose: 'Remote preamps'
            }
        ]
    },

    /**
     * Monitoring System
     */
    monitoring: {
        mainMonitors: {
            manufacturer: 'Genelec',
            model: '8361A',
            type: 'Coaxial 3-way',
            quantity: 2,
            placement: 'Soffit-mounted',
            frequencyResponse: '32Hz - 42kHz',
            maxSPL: '118dB'
        },
        nearfield: {
            manufacturer: 'Focal',
            model: 'Trio11 Be',
            type: '3-way',
            quantity: 2,
            placement: 'Desktop stands'
        },
        midfield: {
            manufacturer: 'ATC',
            model: 'SCM45A Pro',
            type: '3-way active',
            quantity: 2,
            placement: 'Floor stands'
        },
        subwoofer: {
            manufacturer: 'Genelec',
            model: '7380A',
            quantity: 2,
            placement: 'Front corners',
            frequencyResponse: '15Hz - 100Hz'
        },
        surroundSystem: {
            format: 'Dolby Atmos 7.1.4',
            speakers: [
                { position: 'L', model: 'Genelec 8351B' },
                { position: 'R', model: 'Genelec 8351B' },
                { position: 'C', model: 'Genelec 8351B' },
                { position: 'LFE', model: 'Genelec 7380A' },
                { position: 'Ls', model: 'Genelec 8341A' },
                { position: 'Rs', model: 'Genelec 8341A' },
                { position: 'Lrs', model: 'Genelec 8341A' },
                { position: 'Rrs', model: 'Genelec 8341A' },
                { position: 'Ltf', model: 'Genelec 8330A' },
                { position: 'Rtf', model: 'Genelec 8330A' },
                { position: 'Ltr', model: 'Genelec 8330A' },
                { position: 'Rtr', model: 'Genelec 8330A' }
            ]
        },
        monitorController: {
            manufacturer: 'Grace Design',
            model: 'm908',
            features: ['Atmos support', 'Talkback', 'Multiple sources', 'Room correction']
        },
        headphones: [
            { manufacturer: 'Sennheiser', model: 'HD 800 S', type: 'Open-back reference', quantity: 2 },
            { manufacturer: 'Audeze', model: 'LCD-X', type: 'Planar magnetic', quantity: 2 },
            { manufacturer: 'Sony', model: 'MDR-7506', type: 'Closed-back tracking', quantity: 8 },
            { manufacturer: 'Beyerdynamic', model: 'DT 1990 Pro', type: 'Open-back mixing', quantity: 4 }
        ],
        headphoneAmps: [
            { manufacturer: 'Grace Design', model: 'm920', channels: 2 },
            { manufacturer: 'Rupert Neve Designs', model: 'RNHP', channels: 1, quantity: 4 }
        ]
    },

    /**
     * Microphone Collection
     */
    microphones: {
        condenserLargeDiaphragm: [
            { manufacturer: 'Neumann', model: 'U 87 Ai', quantity: 4, pattern: 'Multi-pattern' },
            { manufacturer: 'Neumann', model: 'U 67', quantity: 2, pattern: 'Multi-pattern', notes: 'Vintage tube' },
            { manufacturer: 'AKG', model: 'C12 VR', quantity: 2, pattern: 'Multi-pattern' },
            { manufacturer: 'Sony', model: 'C-800G', quantity: 1, pattern: 'Cardioid', notes: 'Tube vocal' },
            { manufacturer: 'Telefunken', model: 'ELA M 251E', quantity: 2, pattern: 'Multi-pattern' },
            { manufacturer: 'Brauner', model: 'VM1', quantity: 2, pattern: 'Multi-pattern' }
        ],
        condenserSmallDiaphragm: [
            { manufacturer: 'Neumann', model: 'KM 184', quantity: 4, pattern: 'Cardioid' },
            { manufacturer: 'Schoeps', model: 'CMC 6 MK4', quantity: 4, pattern: 'Cardioid' },
            { manufacturer: 'DPA', model: '4011A', quantity: 4, pattern: 'Cardioid' },
            { manufacturer: 'Sennheiser', model: 'MKH 8040', quantity: 4, pattern: 'Cardioid' }
        ],
        dynamic: [
            { manufacturer: 'Shure', model: 'SM7B', quantity: 4, pattern: 'Cardioid' },
            { manufacturer: 'Shure', model: 'SM57', quantity: 8, pattern: 'Cardioid' },
            { manufacturer: 'Shure', model: 'SM58', quantity: 6, pattern: 'Cardioid' },
            { manufacturer: 'Sennheiser', model: 'MD 421-II', quantity: 4, pattern: 'Cardioid' },
            { manufacturer: 'Electro-Voice', model: 'RE20', quantity: 2, pattern: 'Cardioid' },
            { manufacturer: 'Beyerdynamic', model: 'M 88', quantity: 2, pattern: 'Hypercardioid' }
        ],
        ribbon: [
            { manufacturer: 'Royer', model: 'R-121', quantity: 4, pattern: 'Figure-8' },
            { manufacturer: 'Royer', model: 'R-122V', quantity: 2, pattern: 'Figure-8', notes: 'Active tube' },
            { manufacturer: 'AEA', model: 'R84', quantity: 2, pattern: 'Figure-8' },
            { manufacturer: 'Coles', model: '4038', quantity: 2, pattern: 'Figure-8' }
        ],
        stereoArrays: [
            { manufacturer: 'Neumann', model: 'USM 69i', quantity: 1, pattern: 'Stereo' },
            { manufacturer: 'Royer', model: 'SF-24V', quantity: 1, pattern: 'Stereo ribbon' }
        ],
        drumMics: {
            kick: [
                { manufacturer: 'AKG', model: 'D112 MkII', quantity: 2 },
                { manufacturer: 'Shure', model: 'Beta 91A', quantity: 2 },
                { manufacturer: 'Yamaha', model: 'SubKick', quantity: 1 }
            ],
            snare: [
                { manufacturer: 'Shure', model: 'SM57', quantity: 4 },
                { manufacturer: 'Beyerdynamic', model: 'M 201 TG', quantity: 2 }
            ],
            toms: [
                { manufacturer: 'Sennheiser', model: 'MD 421-II', quantity: 6 },
                { manufacturer: 'Sennheiser', model: 'e 604', quantity: 6 }
            ],
            hiHat: [
                { manufacturer: 'AKG', model: 'C 451 B', quantity: 2 }
            ],
            overheads: [
                { manufacturer: 'Neumann', model: 'KM 184', quantity: 4 },
                { manufacturer: 'Coles', model: '4038', quantity: 2 }
            ],
            room: [
                { manufacturer: 'Neumann', model: 'U 87 Ai', quantity: 2 },
                { manufacturer: 'Royer', model: 'R-121', quantity: 2 }
            ]
        }
    },

    /**
     * Preamps and Channel Strips
     */
    preamps: {
        standalone: [
            { manufacturer: 'Neve', model: '1073SPX', channels: 2, quantity: 2, type: 'Transformer-based' },
            { manufacturer: 'API', model: '512c', channels: 1, quantity: 8, type: 'Discrete' },
            { manufacturer: 'Universal Audio', model: '610', channels: 2, quantity: 2, type: 'Tube' },
            { manufacturer: 'Millennia', model: 'HV-3D', channels: 8, quantity: 1, type: 'Clean/Transparent' },
            { manufacturer: 'Grace Design', model: 'm801', channels: 8, quantity: 1, type: 'Clean/Transparent' },
            { manufacturer: 'Chandler Limited', model: 'Germanium Pre', channels: 2, quantity: 2, type: 'Germanium' },
            { manufacturer: 'Shadow Hills', model: 'Mono GAMA', channels: 1, quantity: 4, type: 'Discrete Class A' }
        ],
        channelStrips: [
            { manufacturer: 'Neve', model: '88RS', channels: 1, quantity: 2, features: ['EQ', 'Dynamics', 'Filters'] },
            { manufacturer: 'SSL', model: 'Fusion', channels: 2, quantity: 1, features: ['EQ', 'Compression', 'Saturation'] },
            { manufacturer: 'Avalon', model: 'VT-737sp', channels: 1, quantity: 2, features: ['Tube', 'EQ', 'Compressor'] },
            { manufacturer: 'Manley', model: 'VOXBOX', channels: 1, quantity: 1, features: ['Tube', 'EQ', 'Compressor', 'De-esser'] }
        ]
    },

    /**
     * Outboard Processing
     */
    outboard: {
        compressors: [
            { manufacturer: 'Universal Audio', model: '1176LN', type: 'FET', quantity: 4 },
            { manufacturer: 'Universal Audio', model: 'LA-2A', type: 'Optical tube', quantity: 2 },
            { manufacturer: 'Teletronix', model: 'LA-3A', type: 'Optical solid-state', quantity: 2 },
            { manufacturer: 'API', model: '2500', type: 'VCA stereo bus', quantity: 1 },
            { manufacturer: 'SSL', model: 'G-Series Bus Compressor', type: 'VCA stereo', quantity: 1 },
            { manufacturer: 'Neve', model: '33609', type: 'Diode bridge stereo', quantity: 1 },
            { manufacturer: 'Manley', model: 'Variable Mu', type: 'Tube stereo', quantity: 1 },
            { manufacturer: 'Empirical Labs', model: 'Distressor EL8X', type: 'Digital control', quantity: 4 },
            { manufacturer: 'Shadow Hills', model: 'Mastering Compressor', type: 'Dual-stage stereo', quantity: 1 },
            { manufacturer: 'Elysia', model: 'Alpha Compressor', type: 'Mastering', quantity: 1 }
        ],
        equalizers: [
            { manufacturer: 'Pultec', model: 'EQP-1A3', type: 'Tube passive', quantity: 2 },
            { manufacturer: 'Pultec', model: 'MEQ-5', type: 'Tube midrange', quantity: 2 },
            { manufacturer: 'API', model: '550A', type: '3-band discrete', quantity: 4 },
            { manufacturer: 'API', model: '560', type: '10-band graphic', quantity: 2 },
            { manufacturer: 'Neve', model: '1073', type: '3-band inductor', quantity: 2 },
            { manufacturer: 'Neve', model: '1081', type: '4-band parametric', quantity: 2 },
            { manufacturer: 'Maag Audio', model: 'EQ4', type: '6-band with Air', quantity: 2 },
            { manufacturer: 'Dangerous Music', model: 'BAX EQ', type: 'Mastering', quantity: 1 },
            { manufacturer: 'Sontec', model: 'MES-432D', type: 'Mastering parametric', quantity: 1 }
        ],
        reverbs: [
            { manufacturer: 'Bricasti', model: 'M7', type: 'Digital stereo', quantity: 2 },
            { manufacturer: 'Lexicon', model: '480L', type: 'Digital', quantity: 1 },
            { manufacturer: 'AMS', model: 'RMX16', type: 'Digital', quantity: 1 },
            { manufacturer: 'EMT', model: '140', type: 'Plate', quantity: 1 },
            { manufacturer: 'AKG', model: 'BX20', type: 'Spring', quantity: 1 }
        ],
        delays: [
            { manufacturer: 'Eventide', model: 'H3000', type: 'Multi-effects', quantity: 1 },
            { manufacturer: 'Eventide', model: 'H8000FW', type: 'Ultra-harmonizer', quantity: 1 },
            { manufacturer: 'Roland', model: 'RE-201', type: 'Tape echo', quantity: 1 },
            { manufacturer: 'Fulltone', model: 'Tube Tape Echo', type: 'Tape', quantity: 1 }
        ],
        saturation: [
            { manufacturer: 'Thermionic Culture', model: 'Culture Vulture', type: 'Tube distortion', quantity: 1 },
            { manufacturer: 'Chandler Limited', model: 'Little Devil', type: 'Colored preamp', quantity: 2 },
            { manufacturer: 'Overstayer', model: 'Saturator NT-02A', type: 'Stereo saturation', quantity: 1 }
        ]
    },

    /**
     * Mixing Console
     */
    console: {
        primary: {
            manufacturer: 'SSL',
            model: 'Origin',
            channels: 32,
            type: 'Analog inline',
            features: [
                'SuperAnalogue design',
                'E-Series EQ',
                'VCA automation',
                'Bus compressor',
                'Total recall'
            ]
        },
        summing: {
            manufacturer: 'Dangerous Music',
            model: '2-BUS+',
            channels: 16,
            type: 'Analog summing'
        }
    },

    /**
     * Recording Spaces
     */
    rooms: {
        controlRoom: {
            dimensions: { length: 7.5, width: 6, height: 3.5, unit: 'meters' },
            acousticTreatment: {
                wallPanels: 'RPG Diffusor Systems',
                bassTrap: 'GIK Acoustics Monster Bass Traps',
                ceiling: 'Primacoustic Cloud System',
                flooring: 'Hardwood with area rugs'
            },
            rt60: 0.3
        },
        liveRoom: {
            dimensions: { length: 12, width: 10, height: 4.5, unit: 'meters' },
            acousticTreatment: {
                variable: true,
                panels: 'Movable absorption/diffusion panels',
                ceiling: 'Variable height cloud system'
            },
            rt60: { min: 0.4, max: 1.2 },
            capacity: 20
        },
        isoBooths: [
            {
                name: 'Vocal Booth A',
                dimensions: { length: 3, width: 2.5, height: 2.8, unit: 'meters' },
                purpose: 'Vocals, voiceover',
                rt60: 0.2
            },
            {
                name: 'Amp Booth',
                dimensions: { length: 2.5, width: 2, height: 2.5, unit: 'meters' },
                purpose: 'Guitar/bass amplifiers',
                rt60: 0.3
            },
            {
                name: 'Drum Booth',
                dimensions: { length: 5, width: 4, height: 3.5, unit: 'meters' },
                purpose: 'Drum recording',
                rt60: 0.5
            }
        ]
    },

    /**
     * Signal Routing
     */
    routing: {
        patchbays: [
            {
                manufacturer: 'Switchcraft',
                model: 'StudioPatch 9625',
                points: 96,
                type: 'TT (Bantam)',
                quantity: 4
            }
        ],
        tieLines: {
            controlToLive: 48,
            controlToIso: 24,
            format: 'XLR/TRS combo'
        },
        digitalRouting: {
            protocol: 'Dante',
            switches: [
                { manufacturer: 'Cisco', model: 'SG350-28', ports: 28, quantity: 2 }
            ],
            redundancy: true
        }
    },

    /**
     * Instruments
     */
    instruments: {
        keyboards: [
            { manufacturer: 'Steinway', model: 'Model D', type: 'Concert grand piano' },
            { manufacturer: 'Yamaha', model: 'C7', type: 'Grand piano' },
            { manufacturer: 'Hammond', model: 'B3', type: 'Organ with Leslie 122' },
            { manufacturer: 'Fender', model: 'Rhodes Mark I', type: 'Electric piano' },
            { manufacturer: 'Wurlitzer', model: '200A', type: 'Electric piano' },
            { manufacturer: 'Moog', model: 'Minimoog Model D', type: 'Analog synth' },
            { manufacturer: 'Sequential', model: 'Prophet-5 Rev4', type: 'Analog polysynth' },
            { manufacturer: 'Oberheim', model: 'OB-X8', type: 'Analog polysynth' },
            { manufacturer: 'Roland', model: 'Jupiter-8', type: 'Analog polysynth' },
            { manufacturer: 'Yamaha', model: 'DX7', type: 'FM synth' },
            { manufacturer: 'Nord', model: 'Stage 4', type: 'Stage keyboard' }
        ],
        guitars: [
            { manufacturer: 'Gibson', model: 'Les Paul Standard', type: 'Electric' },
            { manufacturer: 'Fender', model: 'Stratocaster', type: 'Electric' },
            { manufacturer: 'Fender', model: 'Telecaster', type: 'Electric' },
            { manufacturer: 'Gibson', model: 'ES-335', type: 'Semi-hollow' },
            { manufacturer: 'Martin', model: 'D-28', type: 'Acoustic' },
            { manufacturer: 'Taylor', model: '814ce', type: 'Acoustic-electric' },
            { manufacturer: 'Gibson', model: 'J-45', type: 'Acoustic' }
        ],
        bass: [
            { manufacturer: 'Fender', model: 'Precision Bass', type: 'Electric' },
            { manufacturer: 'Fender', model: 'Jazz Bass', type: 'Electric' },
            { manufacturer: 'Music Man', model: 'StingRay', type: 'Electric' },
            { manufacturer: 'Hofner', model: '500/1', type: 'Violin bass' }
        ],
        amplifiers: [
            { manufacturer: 'Fender', model: 'Twin Reverb', type: 'Guitar combo' },
            { manufacturer: 'Fender', model: 'Deluxe Reverb', type: 'Guitar combo' },
            { manufacturer: 'Marshall', model: 'JCM800', type: 'Guitar head' },
            { manufacturer: 'Vox', model: 'AC30', type: 'Guitar combo' },
            { manufacturer: 'Mesa/Boogie', model: 'Dual Rectifier', type: 'Guitar head' },
            { manufacturer: 'Ampeg', model: 'SVT-CL', type: 'Bass head' },
            { manufacturer: 'Ampeg', model: 'B-15', type: 'Bass combo' }
        ],
        drums: [
            {
                manufacturer: 'DW',
                model: "Collector's Series",
                pieces: ['22x18 kick', '10x8 tom', '12x9 tom', '14x14 floor tom', '16x16 floor tom'],
                finish: 'Natural maple'
            },
            {
                manufacturer: 'Ludwig',
                model: 'Classic Maple',
                pieces: ['24x14 kick', '13x9 tom', '16x16 floor tom'],
                finish: 'Black Oyster Pearl'
            }
        ],
        percussion: [
            'Latin Percussion congas',
            'LP bongos',
            'Meinl cajón',
            'Various shakers and tambourines',
            'Glockenspiel',
            'Vibraphone',
            'Timpani set'
        ]
    },

    /**
     * Power and Grounding
     */
    power: {
        mainPanel: {
            voltage: 240,
            phase: 'Single',
            amperage: 200,
            dedicated: true
        },
        conditioning: [
            { manufacturer: 'Furman', model: 'P-3600 AR G', type: 'Voltage regulator', quantity: 2 },
            { manufacturer: 'Equi=Tech', model: '2Q', type: 'Balanced power', quantity: 1 }
        ],
        ups: {
            manufacturer: 'APC',
            model: 'Smart-UPS 3000',
            runtime: '30 minutes at half load'
        },
        grounding: {
            type: 'Star ground',
            technicalGround: true,
            isolatedGroundCircuits: 16
        }
    },

    /**
     * Sync and Clocking
     */
    sync: {
        masterClock: {
            manufacturer: 'Antelope Audio',
            model: 'Trinity',
            outputs: ['Word Clock x8', 'AES x4', 'S/PDIF x2'],
            jitter: '<1 picosecond'
        },
        videoSync: {
            manufacturer: 'Evertz',
            model: '5601MSC',
            formats: ['Black Burst', 'Tri-Level Sync']
        },
        timecode: {
            formats: ['LTC', 'MTC', 'VITC'],
            generator: 'Horita TRG-50'
        }
    }
}

/**
 * Get the complete studio rig configuration
 * @returns {Object} Full studio rig configuration
 */
function getStudioRig() {
    return STUDIO_RIG
}

/**
 * Get a specific section of the studio rig
 * @param {string} section - Section name (e.g., 'microphones', 'outboard')
 * @returns {Object|null} Section configuration or null if not found
 */
function getStudioSection(section) {
    return STUDIO_RIG[section] || null
}

/**
 * Get total equipment count
 * @returns {Object} Equipment counts by category
 */
function getEquipmentCount() {
    const counts = {
        microphones: 0,
        preamps: 0,
        compressors: 0,
        equalizers: 0,
        monitors: 0,
        instruments: 0
    }

    // Count microphones
    Object.values(STUDIO_RIG.microphones).forEach(category => {
        if (Array.isArray(category)) {
            category.forEach(mic => { counts.microphones += mic.quantity || 1 })
        } else if (typeof category === 'object') {
            Object.values(category).forEach(subcategory => {
                if (Array.isArray(subcategory)) {
                    subcategory.forEach(mic => { counts.microphones += mic.quantity || 1 })
                }
            })
        }
    })

    // Count preamps
    STUDIO_RIG.preamps.standalone.forEach(pre => { counts.preamps += (pre.quantity || 1) * pre.channels })
    STUDIO_RIG.preamps.channelStrips.forEach(strip => { counts.preamps += (strip.quantity || 1) * strip.channels })

    // Count compressors
    STUDIO_RIG.outboard.compressors.forEach(comp => { counts.compressors += comp.quantity || 1 })

    // Count equalizers
    STUDIO_RIG.outboard.equalizers.forEach(eq => { counts.equalizers += eq.quantity || 1 })

    // Count monitors
    counts.monitors = STUDIO_RIG.monitoring.mainMonitors.quantity +
        STUDIO_RIG.monitoring.nearfield.quantity +
        STUDIO_RIG.monitoring.midfield.quantity +
        STUDIO_RIG.monitoring.subwoofer.quantity +
        STUDIO_RIG.monitoring.surroundSystem.speakers.length

    // Count instruments
    Object.values(STUDIO_RIG.instruments).forEach(category => {
        if (Array.isArray(category)) {
            counts.instruments += category.length
        }
    })

    return counts
}

/**
 * Generate signal flow diagram data
 * @returns {Object} Signal flow nodes and connections
 */
function getSignalFlow() {
    return {
        nodes: [
            { id: 'source', type: 'input', label: 'Microphone/DI' },
            { id: 'preamp', type: 'process', label: 'Preamp' },
            { id: 'outboard', type: 'process', label: 'Outboard Processing' },
            { id: 'interface', type: 'converter', label: 'Audio Interface' },
            { id: 'daw', type: 'process', label: 'DAW' },
            { id: 'summing', type: 'process', label: 'Analog Summing' },
            { id: 'mastering', type: 'process', label: 'Mastering Chain' },
            { id: 'monitors', type: 'output', label: 'Monitoring' }
        ],
        connections: [
            { from: 'source', to: 'preamp' },
            { from: 'preamp', to: 'outboard' },
            { from: 'outboard', to: 'interface' },
            { from: 'interface', to: 'daw' },
            { from: 'daw', to: 'interface' },
            { from: 'interface', to: 'summing' },
            { from: 'summing', to: 'mastering' },
            { from: 'mastering', to: 'monitors' }
        ]
    }
}

module.exports = {
    STUDIO_RIG,
    getStudioRig,
    getStudioSection,
    getEquipmentCount,
    getSignalFlow
}
