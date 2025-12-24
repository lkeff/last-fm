/**
 * Full Symphony Orchestra Configuration
 * Complete 89-person orchestra with detailed seating arrangement,
 * instrument sections, and performance specifications.
 * 
 * Based on professional symphony orchestra standards with
 * traditional European seating layout.
 * 
 * @module rigs/orchestra
 */

const ORCHESTRA = {
    name: 'Full Symphony Orchestra',
    version: '1.0.0',
    type: 'orchestra',
    totalMusicians: 89,

    /**
     * Orchestra Layout Configuration
     * Standard European/American seating arrangement
     * Conductor faces the orchestra from the front
     */
    layout: {
        arrangement: 'Traditional European',
        conductorPosition: { x: 0, y: 0, facing: 'orchestra' },
        stageDepth: 15, // meters
        stageWidth: 20, // meters
        tiers: 4, // risers from front to back
        acousticShell: true
    },

    /**
     * STRING SECTION - 55 Musicians
     * Positioned in the front of the orchestra
     */
    strings: {
        totalMusicians: 55,

        firstViolins: {
            count: 16,
            position: 'Front left (conductor\'s left)',
            seating: 'Arc formation, 8 stands of 2',
            principal: {
                title: 'Concertmaster',
                position: 'First stand, outside seat',
                role: 'Orchestra leader, solo passages'
            },
            instruments: Array(16).fill(null).map((_, i) => ({
                seat: i + 1,
                instrument: 'Violin',
                stand: Math.floor(i / 2) + 1,
                position: i % 2 === 0 ? 'outside' : 'inside'
            }))
        },

        secondViolins: {
            count: 14,
            position: 'Front right or inner left (varies by conductor)',
            seating: 'Arc formation, 7 stands of 2',
            principal: {
                title: 'Principal Second Violin',
                position: 'First stand, outside seat'
            },
            instruments: Array(14).fill(null).map((_, i) => ({
                seat: i + 1,
                instrument: 'Violin',
                stand: Math.floor(i / 2) + 1,
                position: i % 2 === 0 ? 'outside' : 'inside'
            }))
        },

        violas: {
            count: 12,
            position: 'Center-right, behind second violins',
            seating: '6 stands of 2',
            principal: {
                title: 'Principal Viola',
                position: 'First stand, outside seat'
            },
            instruments: Array(12).fill(null).map((_, i) => ({
                seat: i + 1,
                instrument: 'Viola',
                stand: Math.floor(i / 2) + 1,
                position: i % 2 === 0 ? 'outside' : 'inside'
            }))
        },

        cellos: {
            count: 10,
            position: 'Front right (conductor\'s right)',
            seating: '5 stands of 2, angled toward audience',
            principal: {
                title: 'Principal Cello',
                position: 'First stand, outside seat'
            },
            instruments: Array(10).fill(null).map((_, i) => ({
                seat: i + 1,
                instrument: 'Cello',
                stand: Math.floor(i / 2) + 1,
                position: i % 2 === 0 ? 'outside' : 'inside'
            }))
        },

        doubleBasses: {
            count: 8,
            position: 'Back right, elevated on risers',
            seating: 'Single row or staggered, standing or seated on stools',
            principal: {
                title: 'Principal Double Bass',
                position: 'Stage right end of section'
            },
            instruments: Array(8).fill(null).map((_, i) => ({
                seat: i + 1,
                instrument: 'Double Bass',
                tuning: i < 6 ? 'Standard (E-A-D-G)' : 'Extended (C or B extension)'
            }))
        }
    },

    /**
     * WOODWIND SECTION - 12 Musicians
     * Positioned center, behind strings
     */
    woodwinds: {
        totalMusicians: 12,
        position: 'Center, second tier behind strings',

        flutes: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Flute', instrument: 'Concert Flute in C' },
                { seat: 2, role: 'Second Flute', instrument: 'Concert Flute in C' },
                { seat: 3, role: 'Third Flute / Piccolo', instrument: 'Piccolo / Flute doubling' }
            ]
        },

        oboes: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Oboe', instrument: 'Oboe', note: 'Provides tuning A' },
                { seat: 2, role: 'Second Oboe', instrument: 'Oboe' },
                { seat: 3, role: 'Third Oboe / English Horn', instrument: 'English Horn / Oboe doubling' }
            ]
        },

        clarinets: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Clarinet', instrument: 'Clarinet in Bb/A' },
                { seat: 2, role: 'Second Clarinet', instrument: 'Clarinet in Bb/A' },
                { seat: 3, role: 'Third Clarinet / Bass Clarinet', instrument: 'Bass Clarinet / Eb Clarinet doubling' }
            ]
        },

        bassoons: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Bassoon', instrument: 'Bassoon' },
                { seat: 2, role: 'Second Bassoon', instrument: 'Bassoon' },
                { seat: 3, role: 'Third Bassoon / Contrabassoon', instrument: 'Contrabassoon / Bassoon doubling' }
            ]
        }
    },

    /**
     * BRASS SECTION - 12 Musicians
     * Positioned back center-left, elevated
     */
    brass: {
        totalMusicians: 12,
        position: 'Back center-left, third tier',

        horns: {
            count: 4,
            arrangement: 'Paired: 1st & 3rd (high), 2nd & 4th (low)',
            positions: [
                { seat: 1, role: 'Principal Horn', instrument: 'French Horn in F', range: 'High' },
                { seat: 2, role: 'Second Horn', instrument: 'French Horn in F', range: 'Low' },
                { seat: 3, role: 'Third Horn', instrument: 'French Horn in F', range: 'High' },
                { seat: 4, role: 'Fourth Horn', instrument: 'French Horn in F', range: 'Low' }
            ]
        },

        trumpets: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Trumpet', instrument: 'Trumpet in Bb/C' },
                { seat: 2, role: 'Second Trumpet', instrument: 'Trumpet in Bb/C' },
                { seat: 3, role: 'Third Trumpet', instrument: 'Trumpet in Bb/C' }
            ]
        },

        trombones: {
            count: 3,
            positions: [
                { seat: 1, role: 'Principal Trombone', instrument: 'Tenor Trombone' },
                { seat: 2, role: 'Second Trombone', instrument: 'Tenor Trombone' },
                { seat: 3, role: 'Bass Trombone', instrument: 'Bass Trombone' }
            ]
        },

        tuba: {
            count: 1,
            positions: [
                { seat: 1, role: 'Principal Tuba', instrument: 'Contrabass Tuba in F/CC' }
            ]
        },

        extras: {
            note: 'Additional brass may be added for specific repertoire',
            options: [
                'Wagner Tubas (4)',
                'Cornets (2)',
                'Flugelhorn',
                'Euphonium'
            ]
        }
    },

    /**
     * PERCUSSION SECTION - 5 Musicians
     * Positioned back right, elevated
     */
    percussion: {
        totalMusicians: 5,
        position: 'Back right, third/fourth tier',

        players: [
            {
                seat: 1,
                role: 'Principal Timpani',
                primaryInstrument: 'Timpani (4-5 drums)',
                setup: {
                    drums: [
                        { size: '32"', range: 'D2-A2' },
                        { size: '29"', range: 'F2-C3' },
                        { size: '26"', range: 'Bb2-F3' },
                        { size: '23"', range: 'D3-A3' },
                        { size: '20"', range: 'F3-C4', optional: true }
                    ],
                    mallets: ['General', 'Soft', 'Hard', 'Wood', 'Flannel']
                }
            },
            {
                seat: 2,
                role: 'Principal Percussion',
                instruments: ['Snare Drum', 'Bass Drum', 'Cymbals', 'Triangle', 'Tambourine']
            },
            {
                seat: 3,
                role: 'Percussion 2',
                instruments: ['Xylophone', 'Glockenspiel', 'Chimes', 'Crotales']
            },
            {
                seat: 4,
                role: 'Percussion 3',
                instruments: ['Vibraphone', 'Marimba', 'Suspended Cymbals', 'Tam-tam']
            },
            {
                seat: 5,
                role: 'Percussion 4 / Auxiliary',
                instruments: ['Various auxiliary percussion', 'Specialty instruments as needed']
            }
        ],

        inventory: {
            pitched: [
                'Timpani (set of 5)',
                'Xylophone (4 octave)',
                'Glockenspiel (2.5 octave)',
                'Vibraphone (3 octave)',
                'Marimba (4.3 octave)',
                'Tubular Bells/Chimes',
                'Crotales (2 octave)'
            ],
            unpitched: [
                'Snare Drum (concert)',
                'Bass Drum (concert 36")',
                'Cymbals (pair, 18"-20")',
                'Suspended Cymbals (various)',
                'Tam-tam (36")',
                'Triangle (various sizes)',
                'Tambourine',
                'Wood Block',
                'Temple Blocks',
                'Castanets',
                'Ratchet',
                'Slapstick/Whip',
                'Anvil'
            ]
        }
    },

    /**
     * KEYBOARD/HARP SECTION - 3 Musicians
     * Positioned stage left, near first violins
     */
    keyboards: {
        totalMusicians: 3,

        harp: {
            count: 1,
            position: 'Stage left, behind first violins',
            instrument: {
                type: 'Concert Grand Harp',
                strings: 47,
                pedals: 7,
                range: 'Cb1 to G#7'
            },
            role: 'Principal Harp'
        },

        piano: {
            count: 1,
            position: 'Stage left, near harp (when required)',
            instrument: {
                type: 'Concert Grand Piano',
                model: 'Steinway Model D or equivalent',
                keys: 88
            },
            role: 'Piano/Celesta',
            note: 'Not always present - repertoire dependent'
        },

        celesta: {
            count: 1,
            position: 'Near piano/percussion',
            instrument: {
                type: 'Celesta',
                range: '4-5 octaves'
            },
            role: 'Celesta (often doubled by pianist)',
            note: 'Repertoire dependent'
        },

        organ: {
            count: 0,
            note: 'Pipe organ used when venue has one and repertoire requires',
            position: 'Venue dependent'
        }
    },

    /**
     * CONDUCTOR
     */
    conductor: {
        position: 'Center front, facing orchestra',
        podium: {
            height: 0.3, // meters
            dimensions: '1m x 1m'
        },
        equipment: [
            'Music stand with light',
            'Baton',
            'Score'
        ]
    },

    /**
     * Complete Musician Roster
     */
    roster: {
        generateFullRoster: function () {
            const roster = []
            let id = 1

            // Strings
            for (let i = 0; i < 16; i++) {
                roster.push({
                    id: id++,
                    section: 'Strings',
                    subsection: 'First Violin',
                    seat: i + 1,
                    role: i === 0 ? 'Concertmaster' : (i === 1 ? 'Associate Concertmaster' : `First Violin ${i + 1}`),
                    instrument: 'Violin'
                })
            }
            for (let i = 0; i < 14; i++) {
                roster.push({
                    id: id++,
                    section: 'Strings',
                    subsection: 'Second Violin',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Second Violin' : `Second Violin ${i + 1}`,
                    instrument: 'Violin'
                })
            }
            for (let i = 0; i < 12; i++) {
                roster.push({
                    id: id++,
                    section: 'Strings',
                    subsection: 'Viola',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Viola' : `Viola ${i + 1}`,
                    instrument: 'Viola'
                })
            }
            for (let i = 0; i < 10; i++) {
                roster.push({
                    id: id++,
                    section: 'Strings',
                    subsection: 'Cello',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Cello' : `Cello ${i + 1}`,
                    instrument: 'Cello'
                })
            }
            for (let i = 0; i < 8; i++) {
                roster.push({
                    id: id++,
                    section: 'Strings',
                    subsection: 'Double Bass',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Double Bass' : `Double Bass ${i + 1}`,
                    instrument: 'Double Bass'
                })
            }

            // Woodwinds
            const woodwindInstruments = [
                { name: 'Flute', count: 3, roles: ['Principal Flute', 'Second Flute', 'Third Flute/Piccolo'] },
                { name: 'Oboe', count: 3, roles: ['Principal Oboe', 'Second Oboe', 'Third Oboe/English Horn'] },
                { name: 'Clarinet', count: 3, roles: ['Principal Clarinet', 'Second Clarinet', 'Third Clarinet/Bass Clarinet'] },
                { name: 'Bassoon', count: 3, roles: ['Principal Bassoon', 'Second Bassoon', 'Third Bassoon/Contrabassoon'] }
            ]
            woodwindInstruments.forEach(ww => {
                for (let i = 0; i < ww.count; i++) {
                    roster.push({
                        id: id++,
                        section: 'Woodwinds',
                        subsection: ww.name,
                        seat: i + 1,
                        role: ww.roles[i],
                        instrument: ww.name
                    })
                }
            })

            // Brass
            for (let i = 0; i < 4; i++) {
                roster.push({
                    id: id++,
                    section: 'Brass',
                    subsection: 'Horn',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Horn' : `${['Second', 'Third', 'Fourth'][i - 1]} Horn`,
                    instrument: 'French Horn'
                })
            }
            for (let i = 0; i < 3; i++) {
                roster.push({
                    id: id++,
                    section: 'Brass',
                    subsection: 'Trumpet',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Trumpet' : `${['Second', 'Third'][i - 1]} Trumpet`,
                    instrument: 'Trumpet'
                })
            }
            for (let i = 0; i < 3; i++) {
                roster.push({
                    id: id++,
                    section: 'Brass',
                    subsection: 'Trombone',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Trombone' : (i === 2 ? 'Bass Trombone' : 'Second Trombone'),
                    instrument: i === 2 ? 'Bass Trombone' : 'Tenor Trombone'
                })
            }
            roster.push({
                id: id++,
                section: 'Brass',
                subsection: 'Tuba',
                seat: 1,
                role: 'Principal Tuba',
                instrument: 'Tuba'
            })

            // Percussion
            for (let i = 0; i < 5; i++) {
                roster.push({
                    id: id++,
                    section: 'Percussion',
                    subsection: 'Percussion',
                    seat: i + 1,
                    role: i === 0 ? 'Principal Timpani' : `Percussion ${i}`,
                    instrument: i === 0 ? 'Timpani' : 'Various Percussion'
                })
            }

            // Keyboards
            roster.push({
                id: id++,
                section: 'Keyboards',
                subsection: 'Harp',
                seat: 1,
                role: 'Principal Harp',
                instrument: 'Harp'
            })
            roster.push({
                id: id++,
                section: 'Keyboards',
                subsection: 'Piano',
                seat: 1,
                role: 'Piano/Celesta',
                instrument: 'Piano'
            })

            return roster
        }
    },

    /**
     * Seating Chart Coordinates
     * X: left-right (negative = stage left, positive = stage right)
     * Y: front-back (0 = conductor, positive = toward back)
     */
    seatingChart: {
        generateCoordinates: function () {
            const positions = []

            // First Violins - arc on left
            for (let i = 0; i < 16; i++) {
                const row = Math.floor(i / 4)
                const col = i % 4
                positions.push({
                    section: 'First Violin',
                    seat: i + 1,
                    x: -7 + col * 1.2,
                    y: 1 + row * 1.5,
                    angle: 30 // degrees, facing conductor
                })
            }

            // Second Violins - inner left or right depending on arrangement
            for (let i = 0; i < 14; i++) {
                const row = Math.floor(i / 4)
                const col = i % 4
                positions.push({
                    section: 'Second Violin',
                    seat: i + 1,
                    x: -3 + col * 1.2,
                    y: 2 + row * 1.5,
                    angle: 15
                })
            }

            // Violas - center right
            for (let i = 0; i < 12; i++) {
                const row = Math.floor(i / 4)
                const col = i % 4
                positions.push({
                    section: 'Viola',
                    seat: i + 1,
                    x: 1 + col * 1.2,
                    y: 2.5 + row * 1.5,
                    angle: -15
                })
            }

            // Cellos - front right
            for (let i = 0; i < 10; i++) {
                const row = Math.floor(i / 3)
                const col = i % 3
                positions.push({
                    section: 'Cello',
                    seat: i + 1,
                    x: 5 + col * 1.5,
                    y: 1 + row * 1.8,
                    angle: -30
                })
            }

            // Double Basses - back right, elevated
            for (let i = 0; i < 8; i++) {
                positions.push({
                    section: 'Double Bass',
                    seat: i + 1,
                    x: 7 + (i % 4) * 1.2,
                    y: 6 + Math.floor(i / 4) * 1.5,
                    angle: -45,
                    elevated: true
                })
            }

            // Woodwinds - center, second tier
            const wwPositions = [
                { section: 'Flute', seats: 3, startX: -3, y: 5 },
                { section: 'Oboe', seats: 3, startX: 0, y: 5 },
                { section: 'Clarinet', seats: 3, startX: -3, y: 6.5 },
                { section: 'Bassoon', seats: 3, startX: 0, y: 6.5 }
            ]
            wwPositions.forEach(ww => {
                for (let i = 0; i < ww.seats; i++) {
                    positions.push({
                        section: ww.section,
                        seat: i + 1,
                        x: ww.startX + i * 1.2,
                        y: ww.y,
                        angle: 0,
                        elevated: true
                    })
                }
            })

            // Brass - back center-left, third tier
            // Horns
            for (let i = 0; i < 4; i++) {
                positions.push({
                    section: 'Horn',
                    seat: i + 1,
                    x: -5 + i * 1.5,
                    y: 8,
                    angle: 0,
                    elevated: true
                })
            }
            // Trumpets
            for (let i = 0; i < 3; i++) {
                positions.push({
                    section: 'Trumpet',
                    seat: i + 1,
                    x: -4 + i * 1.5,
                    y: 9.5,
                    angle: 0,
                    elevated: true
                })
            }
            // Trombones
            for (let i = 0; i < 3; i++) {
                positions.push({
                    section: 'Trombone',
                    seat: i + 1,
                    x: 1 + i * 1.8,
                    y: 9.5,
                    angle: 0,
                    elevated: true
                })
            }
            // Tuba
            positions.push({
                section: 'Tuba',
                seat: 1,
                x: 6,
                y: 9.5,
                angle: 0,
                elevated: true
            })

            // Percussion - back right
            for (let i = 0; i < 5; i++) {
                positions.push({
                    section: 'Percussion',
                    seat: i + 1,
                    x: 4 + i * 2,
                    y: 11,
                    angle: 0,
                    elevated: true
                })
            }

            // Harp - stage left
            positions.push({
                section: 'Harp',
                seat: 1,
                x: -9,
                y: 3,
                angle: 45
            })

            // Piano (when present)
            positions.push({
                section: 'Piano',
                seat: 1,
                x: -9,
                y: 5,
                angle: 45,
                optional: true
            })

            return positions
        }
    },

    /**
     * Standard Repertoire Requirements
     */
    repertoire: {
        classical: {
            period: 'Classical (1750-1820)',
            composers: ['Haydn', 'Mozart', 'Beethoven (early)'],
            typicalSize: '40-60 musicians',
            notes: 'Smaller string sections, pairs of winds'
        },
        romantic: {
            period: 'Romantic (1820-1900)',
            composers: ['Brahms', 'Tchaikovsky', 'Dvořák', 'Wagner'],
            typicalSize: '70-90 musicians',
            notes: 'Full orchestra, expanded brass and percussion'
        },
        lateRomantic: {
            period: 'Late Romantic (1880-1920)',
            composers: ['Mahler', 'Strauss', 'Bruckner'],
            typicalSize: '100-120 musicians',
            notes: 'Expanded forces, multiple harps, extended percussion'
        },
        modern: {
            period: 'Modern (1900-present)',
            composers: ['Stravinsky', 'Bartók', 'Shostakovich'],
            typicalSize: 'Variable',
            notes: 'Highly variable instrumentation'
        }
    },

    /**
     * Technical Requirements
     */
    technical: {
        tuning: {
            standard: 'A = 440 Hz',
            baroque: 'A = 415 Hz',
            european: 'A = 442-443 Hz',
            procedure: 'Oboe provides A, strings tune first, then winds'
        },
        rehearsal: {
            typical: '2.5 hours with 20-minute break',
            dressRehearsal: 'Full run-through in concert attire'
        },
        seatingRehearsal: {
            purpose: 'Establish positions, check sightlines',
            duration: '30-45 minutes'
        }
    },

    /**
     * Audio/Recording Setup for Orchestra
     */
    recording: {
        mainArray: {
            technique: 'Decca Tree',
            microphones: [
                { position: 'Left', model: 'Neumann M 50 or U 87', height: '3-4m' },
                { position: 'Center', model: 'Neumann M 50 or U 87', height: '3-4m' },
                { position: 'Right', model: 'Neumann M 50 or U 87', height: '3-4m' }
            ],
            spacing: '2m between L/R, center 1.5m forward'
        },
        outriggers: {
            purpose: 'Extended stereo width',
            microphones: [
                { position: 'Far Left', model: 'Neumann KM 184 or Schoeps CMC' },
                { position: 'Far Right', model: 'Neumann KM 184 or Schoeps CMC' }
            ]
        },
        spotMics: {
            woodwinds: { model: 'Schoeps CMC 6 MK4', quantity: 2 },
            brass: { model: 'Neumann U 87', quantity: 2 },
            percussion: { model: 'AKG C414', quantity: 2 },
            harp: { model: 'DPA 4011', quantity: 1 },
            soloists: { model: 'Neumann U 87 or TLM 170', quantity: 2 }
        },
        ambience: {
            technique: 'Spaced omnis or Blumlein',
            position: 'Hall, 10-15m from stage',
            microphones: { model: 'DPA 4006 or Neumann M 50', quantity: 2 }
        }
    }
}

/**
 * Get the complete orchestra configuration
 * @returns {Object} Full orchestra configuration
 */
function getOrchestra() {
    return ORCHESTRA
}

/**
 * Get a specific section of the orchestra
 * @param {string} section - Section name (strings, woodwinds, brass, percussion, keyboards)
 * @returns {Object|null} Section configuration or null if not found
 */
function getSection(section) {
    return ORCHESTRA[section] || null
}

/**
 * Get musician count by section
 * @returns {Object} Musician counts
 */
function getMusicianCount() {
    return {
        strings: ORCHESTRA.strings.totalMusicians,
        woodwinds: ORCHESTRA.woodwinds.totalMusicians,
        brass: ORCHESTRA.brass.totalMusicians,
        percussion: ORCHESTRA.percussion.totalMusicians,
        keyboards: ORCHESTRA.keyboards.totalMusicians,
        total: ORCHESTRA.totalMusicians
    }
}

/**
 * Generate full musician roster
 * @returns {Array} Complete roster of all 89 musicians
 */
function generateRoster() {
    return ORCHESTRA.roster.generateFullRoster()
}

/**
 * Generate seating chart with coordinates
 * @returns {Array} Seating positions with x,y coordinates
 */
function generateSeatingChart() {
    return ORCHESTRA.seatingChart.generateCoordinates()
}

/**
 * Get section by instrument family
 * @param {string} family - Instrument family (strings, woodwinds, brass, percussion)
 * @returns {Object} Section details
 */
function getSectionByFamily(family) {
    const familyMap = {
        strings: ORCHESTRA.strings,
        woodwinds: ORCHESTRA.woodwinds,
        brass: ORCHESTRA.brass,
        percussion: ORCHESTRA.percussion,
        keyboards: ORCHESTRA.keyboards
    }
    return familyMap[family.toLowerCase()] || null
}

/**
 * Get all principal players
 * @returns {Array} List of principal positions
 */
function getPrincipals() {
    const principals = []

    // String principals
    principals.push({ section: 'First Violin', role: 'Concertmaster', instrument: 'Violin' })
    principals.push({ section: 'Second Violin', role: 'Principal Second Violin', instrument: 'Violin' })
    principals.push({ section: 'Viola', role: 'Principal Viola', instrument: 'Viola' })
    principals.push({ section: 'Cello', role: 'Principal Cello', instrument: 'Cello' })
    principals.push({ section: 'Double Bass', role: 'Principal Double Bass', instrument: 'Double Bass' })

    // Woodwind principals
    principals.push({ section: 'Flute', role: 'Principal Flute', instrument: 'Flute' })
    principals.push({ section: 'Oboe', role: 'Principal Oboe', instrument: 'Oboe' })
    principals.push({ section: 'Clarinet', role: 'Principal Clarinet', instrument: 'Clarinet' })
    principals.push({ section: 'Bassoon', role: 'Principal Bassoon', instrument: 'Bassoon' })

    // Brass principals
    principals.push({ section: 'Horn', role: 'Principal Horn', instrument: 'French Horn' })
    principals.push({ section: 'Trumpet', role: 'Principal Trumpet', instrument: 'Trumpet' })
    principals.push({ section: 'Trombone', role: 'Principal Trombone', instrument: 'Trombone' })
    principals.push({ section: 'Tuba', role: 'Principal Tuba', instrument: 'Tuba' })

    // Percussion principal
    principals.push({ section: 'Percussion', role: 'Principal Timpani', instrument: 'Timpani' })

    // Keyboard principal
    principals.push({ section: 'Harp', role: 'Principal Harp', instrument: 'Harp' })

    return principals
}

module.exports = {
    ORCHESTRA,
    getOrchestra,
    getSection,
    getMusicianCount,
    generateRoster,
    generateSeatingChart,
    getSectionByFamily,
    getPrincipals
}
