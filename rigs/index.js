/**
 * Rigs Module - Main Entry Point
 * 
 * Comprehensive audio production rig configurations including:
 * - Professional Studio Rig
 * - Live Performance Rig
 * - Full 89-Person Symphony Orchestra
 * - Professional DJ Booth
 * 
 * @module rigs
 */

const studioRig = require('./studio-rig')
const liveRig = require('./live-rig')
const orchestra = require('./orchestra')
const djBooth = require('./dj-booth')

/**
 * All available rig configurations
 */
const RIGS = {
    studio: studioRig.STUDIO_RIG,
    live: liveRig.LIVE_RIG,
    orchestra: orchestra.ORCHESTRA,
    djBooth: djBooth.DJ_BOOTH
}

/**
 * Get all rig configurations
 * @returns {Object} All rig configurations
 */
function getAllRigs() {
    return RIGS
}

/**
 * Get a specific rig by type
 * @param {string} type - Rig type (studio, live, orchestra, djBooth)
 * @returns {Object|null} Rig configuration or null if not found
 */
function getRig(type) {
    return RIGS[type] || null
}

/**
 * Get summary of all rigs
 * @returns {Object} Summary information for all rigs
 */
function getRigsSummary() {
    return {
        studio: {
            name: studioRig.STUDIO_RIG.name,
            type: studioRig.STUDIO_RIG.type,
            equipmentCount: studioRig.getEquipmentCount(),
            rooms: Object.keys(studioRig.STUDIO_RIG.rooms).length,
            daw: studioRig.STUDIO_RIG.daw.primary.name
        },
        live: {
            name: liveRig.LIVE_RIG.name,
            type: liveRig.LIVE_RIG.type,
            venueCapacity: liveRig.LIVE_RIG.venueCapacity,
            speakerCount: liveRig.getSpeakerCount(),
            wirelessChannels: liveRig.getWirelessCount(),
            crewSize: Object.values(liveRig.LIVE_RIG.crew).reduce((sum, dept) => {
                return sum + Object.values(dept).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
            }, 0)
        },
        orchestra: {
            name: orchestra.ORCHESTRA.name,
            type: orchestra.ORCHESTRA.type,
            totalMusicians: orchestra.ORCHESTRA.totalMusicians,
            sections: orchestra.getMusicianCount(),
            principals: orchestra.getPrincipals().length
        },
        djBooth: {
            name: djBooth.DJ_BOOTH.name,
            type: djBooth.DJ_BOOTH.type,
            channels: djBooth.getChannelCount(),
            equipmentItems: djBooth.getEquipmentList().length
        }
    }
}

/**
 * Search across all rigs for equipment
 * @param {string} query - Search query
 * @returns {Array} Matching equipment across all rigs
 */
function searchEquipment(query) {
    const results = []
    const searchTerm = query.toLowerCase()

    // Search studio rig
    const searchObject = (obj, path = '', rigType = '') => {
        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key
                if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                    results.push({
                        rig: rigType,
                        path: currentPath,
                        key,
                        value,
                        context: obj
                    })
                } else if (typeof value === 'object') {
                    searchObject(value, currentPath, rigType)
                }
            }
        }
    }

    searchObject(RIGS.studio, '', 'studio')
    searchObject(RIGS.live, '', 'live')
    searchObject(RIGS.orchestra, '', 'orchestra')
    searchObject(RIGS.djBooth, '', 'djBooth')

    return results
}

/**
 * Get combined input/output channel count across all rigs
 * @returns {Object} Total I/O counts
 */
function getTotalIOCount() {
    return {
        studio: {
            inputs: studioRig.STUDIO_RIG.audioInterface.primary.inputs,
            outputs: studioRig.STUDIO_RIG.audioInterface.primary.outputs
        },
        live: {
            fohInputs: liveRig.LIVE_RIG.foh.console.channels,
            monitorInputs: liveRig.LIVE_RIG.monitors.console.channels,
            wirelessChannels: liveRig.getWirelessCount().total
        },
        orchestra: {
            musicians: orchestra.ORCHESTRA.totalMusicians,
            recordingChannels: 24 // Typical orchestra recording setup
        },
        djBooth: {
            mixerChannels: djBooth.DJ_BOOTH.mixer.primary.channels,
            totalInputs: djBooth.getChannelCount().totalInputs
        }
    }
}

/**
 * Generate a combined equipment manifest
 * @returns {Object} Complete equipment manifest
 */
function generateManifest() {
    return {
        generatedAt: new Date().toISOString(),
        rigs: {
            studio: {
                name: studioRig.STUDIO_RIG.name,
                version: studioRig.STUDIO_RIG.version,
                equipment: studioRig.getEquipmentCount(),
                signalFlow: studioRig.getSignalFlow()
            },
            live: {
                name: liveRig.LIVE_RIG.name,
                version: liveRig.LIVE_RIG.version,
                speakers: liveRig.getSpeakerCount(),
                wireless: liveRig.getWirelessCount(),
                inputList: liveRig.generateInputList(),
                power: liveRig.getPowerRequirements()
            },
            orchestra: {
                name: orchestra.ORCHESTRA.name,
                version: orchestra.ORCHESTRA.version,
                musicians: orchestra.getMusicianCount(),
                roster: orchestra.generateRoster(),
                seatingChart: orchestra.generateSeatingChart(),
                principals: orchestra.getPrincipals()
            },
            djBooth: {
                name: djBooth.DJ_BOOTH.name,
                version: djBooth.DJ_BOOTH.version,
                equipment: djBooth.getEquipmentList(),
                channels: djBooth.getChannelCount(),
                signalFlow: djBooth.getSignalFlow(),
                rider: djBooth.getRider(),
                setupChecklist: djBooth.getSetupChecklist()
            }
        }
    }
}

/**
 * Compare two rigs
 * @param {string} rig1 - First rig type
 * @param {string} rig2 - Second rig type
 * @returns {Object} Comparison data
 */
function compareRigs(rig1, rig2) {
    const r1 = RIGS[rig1]
    const r2 = RIGS[rig2]

    if (!r1 || !r2) {
        return { error: 'Invalid rig type(s)' }
    }

    return {
        rig1: { name: r1.name, type: r1.type },
        rig2: { name: r2.name, type: r2.type },
        comparison: {
            purpose: {
                [rig1]: r1.type,
                [rig2]: r2.type
            }
        }
    }
}

/**
 * Export individual rig modules for direct access
 */
module.exports = {
    // Main exports
    RIGS,
    getAllRigs,
    getRig,
    getRigsSummary,
    searchEquipment,
    getTotalIOCount,
    generateManifest,
    compareRigs,

    // Individual rig modules
    studioRig,
    liveRig,
    orchestra,
    djBooth,

    // Direct access to configurations
    STUDIO_RIG: studioRig.STUDIO_RIG,
    LIVE_RIG: liveRig.LIVE_RIG,
    ORCHESTRA: orchestra.ORCHESTRA,
    DJ_BOOTH: djBooth.DJ_BOOTH
}
