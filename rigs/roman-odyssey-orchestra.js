/**
 * Roman Odyssey Orchestra Configuration
 *
 * Cinematic hybrid orchestra inspired by Roman antiquity aesthetics,
 * combining a full symphonic core with historical/folk color instruments
 * and epic low-percussion battery for trailer and score production.
 *
 * @module rigs/roman-odyssey-orchestra
 */

'use strict'

const ROMAN_ODYSSEY_ORCHESTRA = {
    name: 'Roman Odyssey Orchestra',
    version: '1.0.0',
    type: 'roman-odyssey-orchestra',
    totalMusicians: 96,

    layout: {
        arrangement: 'Cinematic hybrid (symphonic core + ancient color sections)',
        conductorPosition: { x: 0, y: 0, facing: 'orchestra' },
        stageDepth: 16,
        stageWidth: 24,
        tiers: 5,
        acousticShell: true
    },

    strings: {
        totalMusicians: 52,
        firstViolins: { count: 14 },
        secondViolins: { count: 12 },
        violas: { count: 10 },
        cellos: { count: 9 },
        doubleBasses: { count: 7 }
    },

    woodwinds: {
        totalMusicians: 12,
        flutes: { count: 3, doubles: ['alto flute', 'piccolo'] },
        oboes: { count: 3, doubles: ['english horn'] },
        clarinets: { count: 3, doubles: ['bass clarinet'] },
        bassoons: { count: 3, doubles: ['contrabassoon'] }
    },

    brass: {
        totalMusicians: 14,
        horns: { count: 6 },
        trumpets: { count: 3 },
        trombones: { count: 3 },
        tuba: { count: 2 }
    },

    percussion: {
        totalMusicians: 10,
        orchestral: ['timpani', 'snare', 'bass drum', 'cymbals', 'tam-tam'],
        epicLowBattery: ['taikos', 'gran casa', 'low tom ensemble', 'anvils', 'frame drums'],
        metals: ['thunder sheet', 'brake drum', 'sword hits', 'chain drops']
    },

    keysAndHarp: {
        totalMusicians: 4,
        harp: { count: 1 },
        piano: { count: 1 },
        celesta: { count: 1 },
        organOrSynth: { count: 1 }
    },

    ancientColorSection: {
        totalMusicians: 4,
        position: 'Stage flanks, spotlighted for thematic passages',
        instruments: [
            { name: 'Tibia (double pipe)', origin: 'Roman' },
            { name: 'Cornu', origin: 'Roman military brass' },
            { name: 'Lyre/Kithara', origin: 'Mediterranean antiquity' },
            { name: 'Aulos/folk reeds', origin: 'Ancient Mediterranean' }
        ]
    },

    choir: {
        totalMusicians: 0,
        optionalAddOn: {
            enabled: true,
            recommendedSize: 32,
            formation: 'SATB',
            purpose: 'Epic chants and liturgical textures'
        }
    },

    recording: {
        mainArray: 'Decca Tree + wide outriggers',
        closeMics: 28,
        roomMics: 6,
        stemLayout: ['Strings', 'Woodwinds', 'Brass', 'Percussion', 'Color', 'Keys/Harp']
    },

    repertoireProfiles: {
        campaignEpic: {
            tempoRange: '70-120 BPM',
            focus: 'Brass ostinati, low percussion, modal string harmony'
        },
        ritualMystic: {
            tempoRange: '50-90 BPM',
            focus: 'Ancient winds, choir drones, sparse metallic textures'
        },
        triumphalFinale: {
            tempoRange: '100-145 BPM',
            focus: 'Full tutti, fanfare brass, choral reinforcement'
        }
    }
}

function getRomanOdysseyOrchestra () {
    return ROMAN_ODYSSEY_ORCHESTRA
}

function getRomanOdysseySection (section) {
    return ROMAN_ODYSSEY_ORCHESTRA[section] || null
}

function getRomanOdysseyMusicianCount () {
    return {
        strings: ROMAN_ODYSSEY_ORCHESTRA.strings.totalMusicians,
        woodwinds: ROMAN_ODYSSEY_ORCHESTRA.woodwinds.totalMusicians,
        brass: ROMAN_ODYSSEY_ORCHESTRA.brass.totalMusicians,
        percussion: ROMAN_ODYSSEY_ORCHESTRA.percussion.totalMusicians,
        keysAndHarp: ROMAN_ODYSSEY_ORCHESTRA.keysAndHarp.totalMusicians,
        ancientColorSection: ROMAN_ODYSSEY_ORCHESTRA.ancientColorSection.totalMusicians,
        total: ROMAN_ODYSSEY_ORCHESTRA.totalMusicians
    }
}

function getRomanOdysseyPrincipals () {
    return [
        { section: 'Strings', role: 'Concertmaster', instrument: 'Violin' },
        { section: 'Brass', role: 'Principal Horn', instrument: 'French Horn' },
        { section: 'Brass', role: 'Principal Trumpet', instrument: 'Trumpet' },
        { section: 'Percussion', role: 'Principal Timpani', instrument: 'Timpani' },
        { section: 'Ancient Color', role: 'Principal Tibia', instrument: 'Tibia' },
        { section: 'Keys/Harp', role: 'Principal Harp', instrument: 'Harp' }
    ]
}

function getRomanOdysseyRepertoire (profile) {
    if (profile) return ROMAN_ODYSSEY_ORCHESTRA.repertoireProfiles[profile] || null
    return ROMAN_ODYSSEY_ORCHESTRA.repertoireProfiles
}

module.exports = {
    ROMAN_ODYSSEY_ORCHESTRA,
    getRomanOdysseyOrchestra,
    getRomanOdysseySection,
    getRomanOdysseyMusicianCount,
    getRomanOdysseyPrincipals,
    getRomanOdysseyRepertoire
}
