/**
 * Effects Chain Manager
 * Professional signal routing and effects chain management system
 * for the Last.fm Desktop studio rig configuration.
 * 
 * @module rigs/effects-chain-manager
 */

const EFFECTS_CHAINS = {
    /**
     * Vocal Processing Chain
     */
    vocal: {
        name: 'Professional Vocal Chain',
        description: 'Complete vocal processing from microphone to mix',
        signalFlow: [
            'Microphone → Preamp → EQ → Compressor → De-esser → Reverb → Delay → Mix'
        ],
        equipment: [
            { position: 1, type: 'Microphone', model: 'Neumann U87 Ai', purpose: 'Capture' },
            { position: 2, type: 'Preamp', model: 'Neve 1073', purpose: 'Gain & Color' },
            { position: 3, type: 'EQ', model: 'API 550B', purpose: 'Tonal Shaping' },
            { position: 4, type: 'Compressor', model: 'LA-2A', purpose: 'Dynamic Control' },
            { position: 5, type: 'De-esser', model: 'dbx 286A', purpose: 'Sibilance Control' },
            { position: 6, type: 'Reverb', model: 'Bricasti M7', purpose: 'Space' },
            { position: 7, type: 'Delay', model: 'Eventide H3000', purpose: 'Ambience' }
        ],
        settings: {
            preampGain: '45-55dB',
            eqSettings: 'High-pass 80Hz, +3dB @ 4kHz, -2dB @ 200Hz',
            compression: 'Ratio 3:1, Threshold -18dB, Fast attack',
            reverb: 'Plate preset, 1.2s decay, 15% wet',
            delay: '1/4 note, 25% feedback, low-pass filter'
        },
        midiAutomation: {
            parameters: ['Preamp Gain', 'EQ Frequency', 'Compression Threshold', 'Reverb Mix', 'Delay Time'],
            controller: 'Native Instruments Komplete Kontrol S88',
            ccMapping: {
                'Preamp Gain': 'CC1',
                'EQ Frequency': 'CC2',
                'Compression Threshold': 'CC3',
                'Reverb Mix': 'CC4',
                'Delay Time': 'CC5'
            }
        }
    },

    /**
     * Drum Processing Chain
     */
    drums: {
        name: 'Multi-Channel Drum Processing',
        description: 'Complete drum kit processing with parallel compression',
        signalFlow: [
            'Overhead Mics → Room Mics → Close Mics → Gate → EQ → Compression → Parallel → Reverb → Mix'
        ],
        equipment: [
            { position: 1, type: 'Microphones', model: 'Neumann KM184', purpose: 'Overheads' },
            { position: 2, type: 'Microphones', model: 'AKG C414', purpose: 'Room mics' },
            { position: 3, type: 'Microphones', model: 'Shure SM57', purpose: 'Close mics' },
            { position: 4, type: 'Gate', model: 'Drawmer DS201', purpose: 'Noise Gating' },
            { position: 5, type: 'EQ', model: 'API 550B', purpose: 'Tonal Shaping' },
            { position: 6, type: 'Compressor', model: '1176', purpose: 'Transient Control' },
            { position: 7, type: 'Compressor', model: 'LA-2A', purpose: 'Parallel Compression' },
            { position: 8, type: 'Reverb', model: 'Lexicon 480L', purpose: 'Room Ambience' }
        ],
        settings: {
            gateThreshold: '-30dB with fast attack',
            eqSettings: 'Kick: +2dB @ 80Hz, Snare: +3dB @ 200Hz',
            compression: '1176: 4:1 ratio, LA-2A: 2:1 parallel',
            reverb: 'Large hall preset, 2.5s decay'
        },
        midiAutomation: {
            parameters: ['Gate Threshold', 'EQ Gain', 'Compression Ratio', 'Reverb Decay'],
            controller: 'Avid S3 Control Surface',
            ccMapping: {
                'Gate Threshold': 'CC10',
                'EQ Gain': 'CC11',
                'Compression Ratio': 'CC12',
                'Reverb Decay': 'CC13'
            }
        }
    },

    /**
     * Guitar/Bass Processing Chain
     */
    guitar: {
        name: 'Electric Guitar/Bass Chain',
        description: 'Complete guitar and bass processing with amp simulation',
        signalFlow: [
            'Instrument → DI Box → Preamp → EQ → Saturation → Delay → Reverb → Mix'
        ],
        equipment: [
            { position: 1, type: 'DI Box', model: 'Radial J48', purpose: 'Impedance Matching' },
            { position: 2, type: 'Preamp', model: 'Chandler Little Devil', purpose: 'Color & Gain' },
            { position: 3, type: 'EQ', model: 'Maag EQ4', purpose: 'Tonal Shaping with Air' },
            { position: 4, type: 'Saturation', model: 'Culture Vulture', purpose: 'Tube Distortion' },
            { position: 5, type: 'Delay', model: 'Roland RE-201', purpose: 'Tape Echo' },
            { position: 6, type: 'Reverb', model: 'EMT 140', purpose: 'Plate Reverb' }
        ],
        settings: {
            preampGain: '30-40dB for clean, 50-60dB for distorted',
            eqSettings: 'Bass: +4dB @ 80Hz, Guitar: +2dB @ 2kHz with Air band',
            saturation: 'Tube bias at 12 o\'clock, medium triode mode',
            delay: 'Tape echo 240ms with 15% degradation',
            reverb: 'Plate preset, 1.8s decay, 20% wet'
        },
        midiAutomation: {
            parameters: ['Preamp Drive', 'EQ Air Band', 'Saturation Bias', 'Delay Time', 'Reverb Mix'],
            controller: 'Native Instruments Maschine Mk3',
            ccMapping: {
                'Preamp Drive': 'CC20',
                'EQ Air Band': 'CC21',
                'Saturation Bias': 'CC22',
                'Delay Time': 'CC23',
                'Reverb Mix': 'CC24'
            }
        }
    },

    /**
     * Master Bus Processing Chain
     */
    master: {
        name: 'Master Bus Processing',
        description: 'Final mastering chain with comprehensive processing',
        signalFlow: [
            'Mix → EQ → Multi-band Compression → Saturation → Limiter → Final Output'
        ],
        equipment: [
            { position: 1, type: 'EQ', model: 'Dangerous Music BAX EQ', purpose: 'Mastering EQ' },
            { position: 2, type: 'Compressor', model: 'Sontec MES-432D', purpose: 'Multi-band Dynamics' },
            { position: 3, type: 'Saturation', model: 'Overstayer Saturator NT-02A', purpose: 'Analog Saturation' },
            { position: 4, type: 'Limiter', model: 'SSL Bus Compressor', purpose: 'Dynamic Control' }
        ],
        settings: {
            eqSettings: 'Subtle shelving, +1dB @ 60Hz, +0.5dB @ 12kHz',
            compression: 'Multi-band: 1.5:1 ratio, gentle attack/release',
            saturation: '5% harmonic generation, warm mode',
            limiting: '-1dBTP ceiling, fast release'
        },
        midiAutomation: {
            parameters: ['Master EQ Gain', 'Compression Threshold', 'Saturation Amount', 'Limiter Ceiling'],
            controller: 'Avid S3 Control Surface',
            ccMapping: {
                'Master EQ Gain': 'CC30',
                'Compression Threshold': 'CC31',
                'Saturation Amount': 'CC32',
                'Limiter Ceiling': 'CC33'
            }
        }
    }
};

/**
 * Patch Bay Configuration
 */
const PATCH_BAY = {
    manufacturer: 'Bantam',
    model: 'Pro Patch Bay',
    points: 96,
    normalization: 'Full-normalled',
    sections: {
        inputs: { points: 32, purpose: 'Microphone and line inputs' },
        outputs: { points: 32, purpose: 'Monitor and recording outputs' },
        inserts: { points: 32, purpose: 'Effects and processing insert points' }
    },
    signalRouting: {
        microphoneInputs: 'Points 1-16',
        lineInputs: 'Points 17-32',
        effectsSends: 'Points 33-48',
        effectsReturns: 'Points 49-64',
        monitorOutputs: 'Points 65-80',
        recordingOutputs: 'Points 81-96'
    }
};

/**
 * MIDI Automation System
 */
const MIDI_AUTOMATION = {
    interfaces: [
        {
            name: 'MOTU MIDI Express XT',
            ports: 8,
            purpose: 'Primary MIDI routing'
        },
        {
            name: 'RME MADI-Router',
            purpose: 'MIDI over IP networking'
        }
    ],
    controllers: [
        {
            name: 'Native Instruments Komplete Kontrol S88',
            type: 'Master Keyboard',
            ccRange: '1-32',
            purpose: 'Primary performance control'
        },
        {
            name: 'Avid S3',
            type: 'Control Surface',
            ccRange: '33-64',
            purpose: 'DAW and mixing control'
        },
        {
            name: 'Native Instruments Maschine Mk3',
            type: 'Drum Controller',
            ccRange: '65-96',
            purpose: 'Drum programming and sample triggering'
        }
    ],
    mapping: {
        'Performance Controls': 'CC 1-32',
        'DAW Controls': 'CC 33-64',
        'Drum Controls': 'CC 65-96',
        'System Controls': 'CC 97-127'
    }
};

/**
 * Get all available effects chains
 * @returns {Object} All effects chain configurations
 */
function getAllChains() {
    return EFFECTS_CHAINS;
}

/**
 * Get a specific effects chain
 * @param {string} chainName - Name of the chain (vocal, drums, guitar, master)
 * @returns {Object|null} Effects chain configuration or null if not found
 */
function getChain(chainName) {
    return EFFECTS_CHAINS[chainName] || null;
}

/**
 * Get patch bay configuration
 * @returns {Object} Patch bay configuration
 */
function getPatchBay() {
    return PATCH_BAY;
}

/**
 * Get MIDI automation configuration
 * @returns {Object} MIDI automation system configuration
 */
function getMidiAutomation() {
    return MIDI_AUTOMATION;
}

/**
 * Get signal flow for a specific chain
 * @param {string} chainName - Name of the chain
 * @returns {Array|null} Signal flow array or null if not found
 */
function getSignalFlow(chainName) {
    const chain = getChain(chainName);
    return chain ? chain.signalFlow : null;
}

/**
 * Get MIDI CC mapping for a specific chain
 * @param {string} chainName - Name of the chain
 * @returns {Object|null} MIDI CC mapping or null if not found
 */
function getMidiMapping(chainName) {
    const chain = getChain(chainName);
    return chain ? chain.midiAutomation : null;
}

/**
 * Generate complete routing diagram data
 * @returns {Object} Complete routing information
 */
function getRoutingDiagram() {
    return {
        chains: getAllChains(),
        patchBay: getPatchBay(),
        midiAutomation: getMidiAutomation(),
        signalFlows: Object.keys(EFFECTS_CHAINS).map(name => ({
            name,
            flow: getSignalFlow(name)
        }))
    };
}

module.exports = {
    getAllChains,
    getChain,
    getPatchBay,
    getMidiAutomation,
    getSignalFlow,
    getMidiMapping,
    getRoutingDiagram
};
