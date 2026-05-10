/**
 * Bagpipes Rig Configuration
 *
 * Multi-regional specification for the bagpipe family — one of the world's
 * most geographically distributed reed aerophones. Covers construction,
 * reed types, chanter scales, drone tuning, amplification, and repertoire
 * for all major traditions.
 *
 * Regional coverage:
 *   Scotland    — Great Highland Bagpipe (GHB), Small Pipes, Border Pipes
 *   Ireland     — Uilleann Pipes
 *   Northumbria — Northumbrian Smallpipes
 *   Galicia     — Gaita Gallega (Spain/Portugal)
 *   Brittany    — Biniou Kozh / Biniou Braz
 *   Italy       — Zampogna, Ciaramella
 *   Eastern EU  — Gaida (Bulgaria/Greece), Duda (Hungary/Slovakia)
 *   Middle East — Tulum (Turkey), Ghaita (North Africa adjacent)
 *
 * @module rigs/bagpipes
 */

'use strict'

const BAGPIPES_RIG = {
  name: 'Bagpipes Ensemble Rig',
  version: '1.0.0',
  type: 'bagpipes',
  totalPlayers: 12,
  origin: 'Multi-cultural (Scotland, Ireland, Iberia, Brittany, Italy, Balkans, Turkey)',

  // ─── Stage / recording layout ─────────────────────────────────────────────
  layout: {
    arrangement: 'Regional clusters — each tradition in its own stage zone',
    conductorPosition: null, // self-directed ensemble
    stageDepth: 8,   // metres
    stageWidth: 16,
    tiers: 2,
    acousticTreatment: 'Live room with adjustable absorption panels',
    outdoorCapability: true,
    outdoorPANote: 'GHB plays at 105–115 dB SPL at 1 m — requires HPF on house system at 100 Hz'
  },

  // ─── Great Highland Bagpipe (Scotland) ────────────────────────────────────
  greatHighlandBagpipe: {
    label: 'Great Highland Bagpipe (GHB)',
    totalPlayers: 3,
    position: 'Stage-left, prominent',
    origin: 'Scotland (Highland & Islands)',

    instrument: {
      chanterScale: {
        name: 'GHB scale — nominally A major with flat 7th (G natural) and sharp 4th',
        notes: ['G', 'A', 'B', 'C#', 'D', 'E', 'F#', 'G', 'A'],
        noteCount: 9,
        pitchReference: 'A = 470–480 Hz (significantly sharper than concert A=440)',
        characteristicIntervals: 'No true semitones; no chromatic capability on standard chanter'
      },
      drones: {
        bass: { count: 1, pitch: 'A (two octaves below chanter low A)', material: 'African Blackwood' },
        tenor: { count: 2, pitch: 'A (one octave below chanter low A)', material: 'African Blackwood' },
        tuning: 'Drone reeds tuned by extending/shortening sections; hemp joints seal airtight'
      },
      bag: {
        material: ['Sheepskin (traditional)', 'Synthetic Gore-Tex hybrid (modern — moisture-resistant)'],
        seasoning: 'Seasoned with mixture of hemp oil / glycerine / treacle (traditional)',
        valve: 'Non-return blowpipe valve (modern stock with flap valve)'
      },
      reeds: {
        chanter: { type: 'Double reed (cane, similar to oboe)', material: 'Arundo donax cane', strength: 'Medium-hard for outdoor; medium for indoor/recording' },
        drone: { type: 'Single reed (plastic or cane)', tuning: 'Adjusted by sliding tongue length' }
      },
      material: 'African Blackwood (Dalbergia melanoxylon) — preferred; Polypenco synthetic also used',
      keywork: null,
      spl: { at1m: '108–116 dB' }
    },

    ornaments: {
      gracenotes: 'Single grace note — adds articulation between repeated pitches',
      doublings: 'High-G grace note + note grace note combination',
      throws: 'D throw — specific GHB ornament on D using low-G and low-G grace notes',
      taorluath: 'Complex three-note ornament (G, D, and melody note)',
      crunluath: 'Extended ornament; signature of pibroch',
      birl: 'A-note ornament — thumb-and-index finger roll'
    },

    genres: {
      pibroch: {
        description: 'Ceòl mòr — the classical music of the GHB. Theme (urlar) with variations.',
        tempo: 'Freely interpreted; unmeasured in urlar',
        competitions: 'Gold Medal competitions at Argyllshire and Northern Meetings'
      },
      marchesStrathspeysReels: {
        description: 'Ceòl beag — light music. 2/4 and 4/4 marches, 4/4 strathspeys, 6/8 marches, jigs.',
        ensembleUse: 'Pipe bands (unison melody + drum corps)'
      },
      slowAirs: { description: 'Melodic interpretation of Gaelic songs and laments' }
    },

    players: [
      { seat: 1, role: 'Lead Piper / Pipe Major', speciality: 'Pibroch' },
      { seat: 2, role: 'Second Piper', speciality: 'March, Strathspey & Reel' },
      { seat: 3, role: 'Third Piper', speciality: 'Light music & recording sessions' }
    ]
  },

  // ─── Uilleann Pipes (Ireland) ─────────────────────────────────────────────
  uilleannPipes: {
    label: 'Uilleann Pipes',
    totalPlayers: 2,
    position: 'Front-right, seated',
    origin: 'Ireland (18th-century development from earlier Irish war pipes)',

    instrument: {
      chanterScale: {
        name: 'Two-octave diatonic D major with chromatic capability via cross-fingering',
        fundamentalKey: 'D',
        range: 'D4 to D6 (two full octaves)',
        pitchReference: 'A = 440 Hz (concert pitch — unlike GHB)',
        chromaticNotes: 'C♮, G♯, F♮ achievable via half-holing and cross-fingering'
      },
      drones: {
        bass: { count: 1, pitch: 'D (two octaves below chanter)' },
        baritone: { count: 1, pitch: 'D (one octave below chanter)' },
        tenor: { count: 1, pitch: 'D (octave below chanter)' },
        regulator: {
          description: 'Closed-key melody pipes, unique to uilleann; provide chordal accompaniment.',
          types: ['Treble regulator (D/E)', 'Tenor regulator (A/B)', 'Bass regulator (D/E low)'],
          technique: 'Right wrist pressed against regulator keys while playing chanter'
        }
      },
      bag: {
        material: 'Sheepskin or Gore-Tex synthetic',
        inflated: 'Elbow bellows (not mouth-blown) — allows vocalist to play simultaneously'
      },
      bellows: {
        description: 'Elbow-driven bellows strapped to right arm and torso',
        material: 'Leather with wooden boards',
        capacity: '~4 litres air per stroke'
      },
      reeds: {
        chanter: { type: 'Double reed (cane)', material: 'Arundo donax', adjustment: 'Extremely sensitive — professional pipers make their own' },
        drone: { type: 'Single cane or plastic reed' },
        regulator: { type: 'Double reed (cane)' }
      }
    },

    ornaments: {
      rolls: 'Cut + tip = roll (equivalent to a trill with a stopped note)',
      cuts: 'Brief upper-note grace note',
      tips: 'Brief lower-note grace note (often G cut)',
      crans: 'Closed-note ornament unique to uilleann pipes (uses register holes)',
      triplets: 'Three-note run using alternating cuts/tips'
    },

    genres: ['Jigs (6/8)', 'Reels (4/4)', 'Hornpipes', 'Slow airs', 'Planxties (harp transcriptions)'],
    notableRepertoire: ['The Drones of the Pipe', 'The Lament for Limerick', 'Carolan\'s Concerto'],

    players: [
      { seat: 1, role: 'Principal Uilleann Piper', speciality: 'Fully fitted set (chanter + drones + regulators)' },
      { seat: 2, role: 'Second Uilleann Piper', speciality: 'Practice set or half-set (chanter + drones only)' }
    ]
  },

  // ─── Northumbrian Smallpipes ──────────────────────────────────────────────
  northumbrianSmallpipes: {
    label: 'Northumbrian Smallpipes',
    totalPlayers: 1,
    position: 'Front-right cluster, beside uilleann',
    origin: 'Northeast England (Northumberland)',

    instrument: {
      chanterScale: {
        name: 'Closed-end chanter — fully chromatic with keys',
        fundamentalKey: 'F (most common); also G, D, Bb sets',
        range: 'One octave + a note (13 notes with keywork)',
        pitchReference: 'Concert pitch (A = 440 Hz)',
        closedEnd: true,
        note: 'Unique fully-closed chanter produces staccato melody — silence between notes unless cross-fingered'
      },
      drones: {
        configuration: 'Three drones (F, C, F — tonic + dominant) in a combined stock',
        switching: 'Each drone has a slide cut-off for on/off during performance'
      },
      bag: { material: 'Small leather bag', inflated: 'Elbow bellows' },
      keys: {
        count: 7,
        purpose: 'Chromatic semitones and extended range',
        material: 'Silver or nickel silver'
      }
    },

    genres: ['Border ballads', 'Northumbrian dance tunes', 'Reels and hornpipes', 'Songs of the North'],

    players: [{ seat: 1, role: 'Northumbrian Piper', doublings: ['Border Pipes (open-chanter variant)'] }]
  },

  // ─── Gaita Gallega (Galicia, Spain) ──────────────────────────────────────
  gaitaGallega: {
    label: 'Gaita Gallega',
    totalPlayers: 2,
    position: 'Stage-centre-right',
    origin: 'Galicia (northwestern Spain) and northern Portugal',

    instrument: {
      chanterScale: {
        name: 'Mixolydian scale (major scale with flat 7th)',
        fundamentalKey: 'C (most common); also Bb, D',
        pitchReference: 'A = 440 Hz; some traditional players use 466 Hz (a semitone sharp)',
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
        chromatic: 'Limited; cross-fingering gives some chromatic notes'
      },
      drones: {
        roncón: { count: 1, pitch: 'C (two octaves below); largest drone', type: 'Single reed' },
        ronquillo: { count: 1, pitch: 'C (one octave below)', type: 'Single reed' }
      },
      bag: { material: 'Goat or sheep skin', inflated: 'Mouth-blown (traditional) or bellows (experimental)' },
      reeds: {
        chanter: { type: 'Double reed', material: 'Cane', pitchControl: 'Pressure-sensitive — piper adjusts pressure to hit upper register' }
      },
      soprete: 'Third small drone (optional; adds a tenor C pitch)'
    },

    ornaments: {
      floreos: 'Ornamental runs unique to gaita',
      picaroos: 'Short grace-note articulations'
    },

    genres: ['Muiñeiras (6/8 — Galician dance signature)', 'Alborada (dawn music)', 'Pasodoble gallego', 'Coplas', 'Processional marches'],
    notableComposers: ['Perfecto Feijoo', 'Xosé Ferreirós'],

    players: [
      { seat: 1, role: 'Principal Gaiteiro', speciality: 'Muiñeira and alborada repertoire' },
      { seat: 2, role: 'Second Gaiteiro', doublings: ['Chifla (small recorder-style pipe)'] }
    ]
  },

  // ─── Biniou (Brittany, France) ────────────────────────────────────────────
  biniou: {
    label: 'Biniou Kozh / Biniou Braz',
    totalPlayers: 1,
    position: 'Stage-right flank',
    origin: 'Brittany (northwest France)',

    instruments: {
      binioukozh: {
        description: 'Traditional Breton bagpipe — very high-pitched, one octave above the bombard.',
        chanterKey: 'Bb (one octave above bombard)',
        drones: 'Single tenor drone',
        pairing: 'Always played with the bombard (shawm); player and bombard player form a duo called a soner'
      },
      biniouBraz: {
        description: 'Great Highland Bagpipe adopted into Breton tradition; used in bagad (Breton pipe band).',
        chanterKey: 'Bb (same fundamental as GHB in Bb bagad pitch)',
        note: 'Identical to GHB in construction; Breton-style repertoire and ornamentation style'
      }
    },

    bombard: {
      description: 'High-pitched conical double-reed shawm; not a bagpipe but always paired with biniou kozh.',
      key: 'Bb',
      reed: 'Double reed (louder than oboe — outdoor instrument)'
    },

    genres: ['Gavotte (Breton round dance)', 'An Dro', 'Ridée', 'Hanter dro', 'Kost ar c\'hoad'],

    players: [{ seat: 1, role: 'Soner (biniou + bombard duo player)', doublings: ['Bombard'] }]
  },

  // ─── Zampogna (Italy) ────────────────────────────────────────────────────
  zampogna: {
    label: 'Zampogna (Italy)',
    totalPlayers: 1,
    position: 'Rear-left',
    origin: 'Southern Italy (Calabria, Campania, Sicily, Lazio), Sardinia',

    instrument: {
      description: 'Double-chanter Italian bagpipe with two melodic chanters (no single melody + drone arrangement).',
      chanters: {
        right: { function: 'Melody (soprano)', scale: 'C major or G major depending on regional type' },
        left: { function: 'Harmonizing bass line or drone tones', note: 'Not fully chromatic — plays parallel thirds/fifths' }
      },
      drones: {
        count: 2,
        pitches: 'C and G (tonic and dominant)',
        material: 'Cane or wood'
      },
      bag: { material: 'Whole goat skin (including legs as drone stocks)', inflated: 'Mouth-blown' },
      reeds: { type: 'Double reed on both chanters (all-double-reed instrument)' },
      regionalVariants: ['Zampogna a chiave (keyed)', 'Zampogna a paro (symmetric)', 'Cornamusa (central Italy variant)']
    },

    traditions: {
      natale: 'Zampognari play pastoral Christmas music (novenas) in Italian cities from 8 December',
      reper: ['La Pastorella', 'Tu scendi dalle stelle (often accompanied by zampogna)', 'Tarantella napoletana']
    },

    players: [{ seat: 1, role: 'Zampognaro', doublings: ['Ciaramella (folk shawm companion instrument)'] }]
  },

  // ─── Gaida (Balkans) ─────────────────────────────────────────────────────
  gaida: {
    label: 'Gaida (Bulgarian / Greek / Macedonian)',
    totalPlayers: 2,
    position: 'Stage-right rear',
    origin: 'Balkans — Bulgaria, Greece, North Macedonia, Serbia',

    instrument: {
      chanterScale: {
        name: 'Mixolydian or Phrygian modal scale; microtonality between notes',
        fundamentalKey: 'G (kaba gaida — low) or A/Bb (djura gaida — high)',
        microtonality: 'Quarter-tones and variable intonation characterise Eastern European styles',
        noteCount: 8
      },
      drones: {
        main: { count: 1, pitch: 'Tonic (G or A), sustained throughout' }
      },
      bag: { material: 'Whole goat skin', inflated: 'Mouth-blown' },
      reeds: { chanter: { type: 'Single reed (clarinet-style)', material: 'Cane' }, drone: { type: 'Single reed' } },
      variants: {
        kabaGaida: { description: 'Low-pitched Bulgarian gaida (G); full deep sound', region: 'Rhodope Mountains' },
        djuraGaida: { description: 'High-pitched variant; brighter timbre', region: 'Thrace / Macedonia' }
      }
    },

    ornaments: {
      trill: 'Rapid alternation between two adjacent notes',
      mordent: 'Quick lower-note grace note',
      microtonal: 'Deliberate detuning for expressive phrase endings'
    },

    genres: ['Horo (Bulgarian chain dance)', 'Rachenitsa (7/8 asymmetric)', 'Gaida solos', 'Wedding music'],
    ensembles: ['Bistritsa Babi (UNESCO heritage ensemble)', 'Wedding band gaida'],

    players: [
      { seat: 1, role: 'Principal Kaba Gaida', speciality: 'Rhodope modal repertoire' },
      { seat: 2, role: 'Djura Gaida / Macedonian variant', doublings: ['Kaval (end-blown flute) for variety'] }
    ]
  },

  // ─── Amplification & recording chain ─────────────────────────────────────
  recording: {
    ghbMiking: {
      primary: { model: 'Shure SM57 (dynamic)', placement: '30 cm from chanter bell, off-axis 15°' },
      drone: { model: 'AKG C414 XLS (large-diaphragm condenser)', placement: '50 cm above drone stocks', attenuation: '-10 dB pad engaged' },
      note: 'GHB generates 108–116 dB SPL — always use pads; never close-mic below 20 cm'
    },
    uilleannMiking: {
      chanter: { model: 'Neumann KM 184 (cardioid SDC)', placement: '15 cm above chanter finger holes' },
      drones: { model: 'Sennheiser MKH 8050', placement: '20 cm from drone outlets' },
      regulators: { model: 'DPA 4099 (clip-on)', placement: 'Clipped directly to regulator stock' },
      note: 'Uilleann pipes are quiet (~75–80 dB SPL) — room noise floor must be below 20 dB(A)'
    },
    northumbrianMiking: {
      setup: 'Single Neumann KM 184 at 20 cm from chanter; intimate room or vocal booth ideal'
    },
    gaitaMiking: {
      setup: 'Shure SM81 (cardioid SDC) 25 cm from chanter bell; secondary Schoeps MK4 for room'
    },
    southernEuropean: {
      setup: 'Stereo pair (Schoeps CMC6 + MK4 capsules) 60 cm from instrument at 90° XY angle'
    },
    balkanMiking: {
      setup: 'AKG C451B (SDC cardioid) 25 cm off-axis; add subtle pitch correction for microtonal work'
    },
    preamp: 'Neve 1073 (x8 channels — one per primary mic position)',
    adConversion: 'Apogee Symphony I/O Mk II — 32-bit / 96 kHz',
    stems: ['GHB chanter', 'GHB drones', 'Uilleann chanter', 'Uilleann regulators', 'Gaita', 'Biniou', 'Gaida', 'Zampogna'],
    effects: {
      reverb: {
        ghb: 'Plate reverb (0.6 s) for indoor; no reverb for outdoor simulation',
        uilleann: 'Bricasti M7 Hall (1.2 s RT60)',
        zampogna: 'Large stone church impulse response'
      },
      eq: 'High-pass filter at 80 Hz on all channels; notch at 200–300 Hz to remove bag rumble',
      deEsser: 'Not required (no sibilance); apply de-click for chanter key noise if present'
    }
  },

  // ─── Maintenance & logistics ─────────────────────────────────────────────
  maintenance: {
    reeds: {
      ghb: 'Synthetic drone reeds last 12–24 months; cane chanter reeds 3–12 months',
      uilleann: 'Hand-made cane reeds; 2–4 week lifespan at professional usage; pipers carry 20+ reeds',
      replacement: 'Always check reeds before recording sessions; reed failure mid-take is common'
    },
    bag: {
      seasoning: 'Traditional bags seasoned every 2–4 weeks with oil mixture',
      synthetic: 'Gore-Tex / hybrid bags require no seasoning; recommended for studio use',
      leakChecks: 'Full airtightness check before every session'
    },
    hemp: {
      description: 'Hemp is used to seal all joints (stocks, drones, blowpipe)',
      application: 'Waxed hemp wound around tenon until airtight but removable'
    },
    storage: {
      ghb: 'Cool dry case; drones stored without reeds to prevent warping',
      uilleann: 'Disassembled after each session; reeds stored in reed pouch with humidity control',
      generalHumidity: '45–60% RH; critical for cane reeds and wooden chanters'
    }
  },

  // ─── Repertoire map ───────────────────────────────────────────────────────
  repertoire: {
    scottish: {
      pibroch: ['The Lament for the Children', 'MacCrimmon Will Never Return', 'The Big Spree'],
      marchStReel: ['Scotland the Brave', 'The Barren Rocks of Aden', 'Monymusk'],
      slowAirs: ['Loch Lomond', 'The Dark Island']
    },
    irish: {
      jigs: ['The Kesh Jig', 'The Irish Washerwoman', 'Toss the Feathers'],
      reels: ['The Drunken Landlady', 'Morning Dew', 'The Morning Dew'],
      airs: ['She Moved Through the Fair', 'Carolan\'s Draught']
    },
    galician: {
      muineiras: ['A Rianxeira', 'Negra Sombra (arranged)', 'Muiñeira de Chantada'],
      alboradas: ['Alborada Gallega (Veiga)']
    },
    breton: {
      gavottes: ['Gavotte de l\'Aven', 'Ton bale neve'],
      festNoz: ['An Dro', 'Hanter Dro', 'Ridée six temps']
    },
    balkan: {
      bulgarian: ['Dilmano Dilbero', 'Kaval Sviri', 'Pravo Horo'],
      greek: ['Kritikos', 'Tsamikos']
    }
  }
}

// ─── Exported helper functions ─────────────────────────────────────────────

function getBagpipesRig () {
  return BAGPIPES_RIG
}

function getBagpipesSection (section) {
  return BAGPIPES_RIG[section] || null
}

function getBagpipesPlayerCount () {
  return {
    greatHighlandBagpipe: BAGPIPES_RIG.greatHighlandBagpipe.totalPlayers,
    uilleannPipes: BAGPIPES_RIG.uilleannPipes.totalPlayers,
    northumbrianSmallpipes: BAGPIPES_RIG.northumbrianSmallpipes.totalPlayers,
    gaitaGallega: BAGPIPES_RIG.gaitaGallega.totalPlayers,
    biniou: BAGPIPES_RIG.biniou.totalPlayers,
    zampogna: BAGPIPES_RIG.zampogna.totalPlayers,
    gaida: BAGPIPES_RIG.gaida.totalPlayers,
    total: BAGPIPES_RIG.totalPlayers
  }
}

function getBagpipesPrincipals () {
  return [
    { section: 'Great Highland Bagpipe', role: 'Pipe Major', instrument: 'GHB' },
    { section: 'Uilleann Pipes', role: 'Principal Uilleann Piper', instrument: 'Uilleann Pipes' },
    { section: 'Northumbrian', role: 'Northumbrian Piper', instrument: 'Northumbrian Smallpipes' },
    { section: 'Gaita Gallega', role: 'Principal Gaiteiro', instrument: 'Gaita Gallega' },
    { section: 'Biniou', role: 'Soner', instrument: 'Biniou / Bombard' },
    { section: 'Zampogna', role: 'Zampognaro', instrument: 'Zampogna' },
    { section: 'Gaida', role: 'Principal Kaba Gaida', instrument: 'Kaba Gaida' }
  ]
}

function getBagpipesInstruments () {
  return [
    { name: 'Great Highland Bagpipe', region: 'Scotland', pitchRef: 470, chromatic: false, bellows: false },
    { name: 'Uilleann Pipes', region: 'Ireland', pitchRef: 440, chromatic: true, bellows: true },
    { name: 'Northumbrian Smallpipes', region: 'England (Northumbria)', pitchRef: 440, chromatic: true, bellows: true },
    { name: 'Gaita Gallega', region: 'Galicia, Spain', pitchRef: 440, chromatic: false, bellows: false },
    { name: 'Biniou Kozh', region: 'Brittany, France', pitchRef: 440, chromatic: false, bellows: false },
    { name: 'Zampogna', region: 'Southern Italy', pitchRef: 440, chromatic: false, bellows: false },
    { name: 'Kaba Gaida', region: 'Bulgaria (Rhodope)', pitchRef: 440, chromatic: false, bellows: false },
    { name: 'Djura Gaida', region: 'Thrace / Macedonia', pitchRef: 440, chromatic: false, bellows: false }
  ]
}

function getBagpipesRepertoire (region) {
  if (region) return BAGPIPES_RIG.repertoire[region] || null
  return BAGPIPES_RIG.repertoire
}

function getBagpipesMikingSetup (type) {
  return BAGPIPES_RIG.recording[type + 'Miking'] || null
}

module.exports = {
  BAGPIPES_RIG,
  getBagpipesRig,
  getBagpipesSection,
  getBagpipesPlayerCount,
  getBagpipesPrincipals,
  getBagpipesInstruments,
  getBagpipesRepertoire,
  getBagpipesMikingSetup
}
