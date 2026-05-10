/**
 * Lyre Rig Configuration
 *
 * Comprehensive specification for the lyre family of instruments spanning
 * ancient Greek origins, medieval European variants, and modern revivals.
 * Covers instrument taxonomy, tuning systems, playing techniques, recording
 * chains, and contextual repertoire mapping.
 *
 * Instrument lineage:
 *   Ancient Greek   — Kithara, Chelys (tortoise-shell), Barbitos, Phorminx
 *   Ancient Near East — Sumerian bull-lyre, Mesopotamian arched harp-lyre
 *   African          — Krar (Ethiopia/Eritrea), Begena, Nyatiti (Kenya/Uganda)
 *   Medieval Europe  — Germanic Leier, Anglo-Saxon hearpe, Welsh Crwth (bowed)
 *   Nordic/Baltic    — Talharpa/Jouhikko (bowed), Kantele (zither cousin)
 *   Modern revivals  — Concert reconstructions, neo-folk, world-music rigs
 *
 * @module rigs/lyre
 */

'use strict'

const LYRE_RIG = {
  name: 'Lyre Ensemble Rig',
  version: '1.0.0',
  type: 'lyre',
  totalPlayers: 8,
  origin: 'Multi-cultural (Ancient Greece, Africa, Medieval Europe, Nordic)',

  // ─── Stage / recording layout ─────────────────────────────────────────────
  layout: {
    arrangement: 'Semicircle — soloists front, ensemble arc behind',
    conductorPosition: null, // ensemble-led, no conductor
    stageDepth: 6,   // metres
    stageWidth: 10,
    tiers: 2,
    acousticTreatment: 'Moderate absorption (anechoic chamber not required)',
    ambientRecording: true
  },

  // ─── Instrument families ──────────────────────────────────────────────────

  ancientGreek: {
    label: 'Ancient Greek Section',
    totalPlayers: 2,
    position: 'Front-centre, spotlighted',

    kithara: {
      description: 'The kithara is the professional concert lyre of ancient Greece — larger and more resonant than the chelys, with a wooden soundbox and 7 gut strings.',
      strings: 7,
      stringMaterial: 'Gut (historical); nylon monofilament (modern reconstructions)',
      tuning: {
        system: 'Ancient Greek modes — Dorian, Phrygian, Lydian, Mixolydian',
        referenceA: 432, // Hz — commonly used for ancient music reconstructions
        stringNames: ['Proslambanomenos', 'Hypate hypaton', 'Parhypate hypaton', 'Lichanos hypaton', 'Hypate meson', 'Parhypate meson', 'Lichanos meson'],
        intervalPattern: 'Tetrachord-based (diatonic, chromatic, or enharmonic genus)'
      },
      dimensions: { length: 95, width: 55, depth: 20, unit: 'cm' },
      construction: {
        arms: 'Curved wooden staves (boxwood, maple, or horn)',
        yoke: 'Straight crossbar connecting arm tops',
        soundbox: 'Resonant wooden body, flat or slightly curved back',
        finish: 'Polished, often painted or gilded for performance'
      },
      technique: {
        rightHand: 'Plectrum sweep (plektron — horn, ivory, or bone)',
        leftHand: 'Finger damping / selective stopping of strings',
        holdingPosition: 'Upright against body, supported by wrist strap',
        styles: ['Melody + bass drone', 'Full chord strumming', 'Arpeggio runs']
      },
      players: [{ seat: 1, role: 'Principal Kithara', doublings: ['Chelys (chamber passages)'] }]
    },

    chelys: {
      description: 'The chelys (tortoise-shell lyre) is the intimate companion to the kithara — used for teaching and domestic music. Named for the tortoise whose shell forms the resonating body.',
      strings: 7,
      stringMaterial: 'Gut',
      tuning: { system: 'Same modal system as kithara; typically higher register', referenceA: 432 },
      dimensions: { length: 55, width: 35, depth: 12, unit: 'cm' },
      construction: {
        soundbox: 'Actual tortoise shell (historical) or carved wood facsimile (modern)',
        arms: 'Curved antelope horns or shaped wood',
        membrane: 'Animal skin stretched over shell opening'
      },
      technique: {
        rightHand: 'Finger plucking or light plectrum',
        leftHand: 'Damping and selective stopping',
        holdingPosition: 'Seated, instrument resting on lap or held at angle'
      },
      players: [{ seat: 2, role: 'Chelys Lyrist', doublings: ['Barbitos (deep passages)'] }]
    },

    barbitos: {
      description: 'Long-armed bass lyre associated with drinking songs and symposia. Produces a deep, resonant tone suited to accompaniment.',
      strings: 7,
      stringMaterial: 'Gut (long-scale for low tension)',
      tuning: { system: 'Dorian, Mixolydian; lower register than kithara by approx. a 4th or 5th' },
      dimensions: { length: 120, width: 40, depth: 18, unit: 'cm' },
      note: 'Shared between chelys player as a doubling instrument'
    }
  },

  africanLyre: {
    label: 'African Lyre Section',
    totalPlayers: 2,
    position: 'Stage-left flank, tier 1',

    krar: {
      description: 'The krar is a six-string bowl lyre from Ethiopia and Eritrea, central to secular and popular music of the Horn of Africa.',
      strings: 6,
      stringMaterial: 'Nylon (modern); gut (traditional)',
      tuning: {
        system: 'Ethiopian pentatonic modes — Tizita, Bati, Ambassel, Anchihoye',
        capo: 'Wrist-string wound around neck to raise pitch',
        standardPitch: { referenceA: 440 }
      },
      dimensions: { length: 70, width: 45, depth: 20, unit: 'cm' },
      construction: {
        soundbox: 'Wooden bowl covered with animal skin (goat or sheep)',
        arms: 'Two straight wooden staves',
        amplification: 'Acoustic; modern players sometimes add contact pickups'
      },
      technique: {
        rightHand: 'Plectrum (plastic or horn) — sweeping strums',
        leftHand: 'Selective damping to articulate melody against drone',
        playingStyle: 'Accompaniment to vocal improvisation; melodic solos'
      },
      players: [{ seat: 1, role: 'Principal Krar', doublings: ['Begena (ceremonial passages)'] }]
    },

    begena: {
      description: 'The begena is a massive 10-string lyre reserved for sacred Ethiopian music and meditation. Known as the "harp of King David."',
      strings: 10,
      stringMaterial: 'Gut (heavy gauge)',
      tuning: { system: 'Diatonic, bass-heavy; buzzing bridge (azan) creates distinctive tone' },
      dimensions: { length: 130, width: 80, depth: 30, unit: 'cm' },
      construction: {
        soundbox: 'Large wooden box, animal skin membrane',
        specialFeature: 'Azan — leather bridge insert that causes controlled string buzz (similar to a sitar jawari)'
      },
      technique: {
        rightHand: 'Leather finger plectrum',
        leftHand: 'Damping',
        tempo: 'Very slow, meditative; often used for prayer and psalmody'
      },
      players: [{ seat: 2, role: 'Begena Cantor', doublings: ['Krar (secular passages)'] }]
    },

    nyatiti: {
      description: 'Eight-string lyre of the Luo people of western Kenya and Uganda, used at social gatherings and storytelling.',
      strings: 8,
      stringMaterial: 'Gut or monofilament',
      tuning: { system: 'Two interlocked 4-string groupings; pentatonic' },
      construction: {
        soundbox: 'Gourd resonator with skin membrane',
        footPeg: 'Metal ring worn on toe to provide rhythmic percussion'
      },
      technique: {
        rightHand: 'Plectrum',
        leftHand: 'Thumb damping',
        footPercussion: 'Metallic toe-ring taps rhythmic counter-accent'
      },
      note: 'Shared as a doubling instrument for the begena player'
    }
  },

  medievalEuropean: {
    label: 'Medieval European Section',
    totalPlayers: 2,
    position: 'Stage-right flank, tier 1',

    germanicLeier: {
      description: 'The Germanic round lyre (Leier) is the instrument archaeologically recovered from Anglo-Saxon, Frankish, and Norse burial sites (e.g., Sutton Hoo, Kravik).',
      strings: 6,
      stringMaterial: 'Gut',
      tuning: {
        system: 'Open modal tuning (no fixed standard); common modern tunings: D A D F# A D or D G D G B D',
        technique: 'Each string can be dampened from behind by left-hand fingertips through the soundholes'
      },
      dimensions: { length: 65, width: 28, depth: 8, unit: 'cm' },
      construction: {
        body: 'Single carved block of maple, ash, or willow',
        soundholes: 'Two D-shaped holes give left hand access to rear of strings',
        finish: 'Oiled or waxed natural wood'
      },
      technique: {
        rightHand: 'Plectrum or finger plucking',
        leftHand: 'Selective damping through soundholes — creates chordal melody',
        styles: ['Scaldic verse accompaniment', 'Modal drone textures', 'Medieval song']
      },
      players: [{ seat: 1, role: 'Principal Germanic Leier', doublings: ['Welsh Crwth'] }]
    },

    welshCrwth: {
      description: 'The crwth is a bowed lyre unique to Wales, with two unfingered drone strings alongside four fingered melody strings. Active from the medieval period through the 18th century.',
      strings: 6,
      stringMaterial: 'Gut',
      bowed: true,
      bow: { type: 'Short curved bow (similar to medieval fiddle bow)', hair: 'Horsehair' },
      tuning: {
        system: 'G G D D g g (approximate, with regional variants)',
        drones: '2 unfingered drone strings beside fingerboard'
      },
      dimensions: { length: 60, width: 24, depth: 8, unit: 'cm' },
      construction: {
        fingerboard: 'Flat fingerboard bridged over a soundbox',
        bridge: 'One bridge foot passes through the f-hole to rest on back — acts as soundpost'
      },
      technique: {
        bow: 'Underhanded bow hold; melody on fingered strings + drones sounding simultaneously',
        styles: ['Welsh penillion (poetic metre improvisation)', 'Dance accompaniment', 'Psalm tones']
      },
      players: [{ seat: 2, role: 'Crwth Player', doublings: ['Germanic Leier'] }]
    }
  },

  nordicBowed: {
    label: 'Nordic Bowed Lyre Section',
    totalPlayers: 2,
    position: 'Rear-centre, tier 2',

    talharpa: {
      description: 'The talharpa (tagelharpa) is a bowed lyre played in Estonia, Latvia, Finland, and Sweden. Related to the Anglo-Saxon hearpe. Also called "horsehair lyre."',
      strings: 4,
      stringMaterial: 'Gut or horsehair (historical); nylon or gut (modern)',
      bowed: true,
      bow: { type: 'Convex horsehair bow; underhanded grip', hair: 'Horsehair (as strings too, historically)' },
      tuning: {
        common: ['G D G D', 'A D A D', 'G D A D'],
        system: 'Two melody + two drone strings'
      },
      construction: {
        body: 'Carved solid wood, rectangular or slightly yoke-shaped',
        strings: 'Attached at bottom pin, run over carved bone bridge'
      },
      technique: {
        bow: 'All strings simultaneously bowed; left thumb presses from behind for melody damping',
        styles: ['Nordic drone music', 'Swedish folk songs (visor)', 'Estonian runo-songs']
      },
      players: [{ seat: 1, role: 'Principal Talharpa', doublings: ['Jouhikko (Finnish variant)'] }]
    },

    jouhikko: {
      description: 'The Finnish/Karelian variant of the bowed lyre, closely associated with runo-songs and the Kalevala oral epic tradition.',
      strings: 3,
      stringMaterial: 'Horsehair or gut',
      bowed: true,
      tuning: {
        common: 'A D A (or G D G)',
        drones: '2 open drones + 1 melody string stopped by thumbnail'
      },
      construction: { body: 'Carved birch', feature: 'Notch in upper yoke for bow clearance' },
      technique: { bow: 'Underhanded; thumbnail presses melody string from inside the yoke opening' },
      players: [{ seat: 2, role: 'Jouhikko / Runo-song specialist', doublings: ['Talharpa'] }]
    }
  },

  // ─── Tuning & intonation systems ─────────────────────────────────────────
  tuningReference: {
    historicalPitches: {
      ancient: 432,         // Hz — common revival standard
      baroque: 415,         // A3 in Hz
      modern: 440,
      earlyMusic: 392       // A3 = 392 for some ancient-music ensembles
    },
    intonationSystems: {
      pythagorean: 'Pure 5ths; used for ancient Greek and medieval music',
      justIntonation: 'Consonant chords; used for modal drone textures',
      equalTemperament: 'Modern compromise; used when blending with fixed-pitch instruments',
      meantone: '1/4-comma meantone for Renaissance/early-modern crossover passages'
    }
  },

  // ─── Recording & amplification chain ─────────────────────────────────────
  recording: {
    primaryMic: {
      model: 'Neumann KM 184 (cardioid small-diaphragm condenser)',
      placement: '20-30 cm from soundbox, angled slightly off-axis',
      purpose: 'Natural top-end articulation without proximity effect'
    },
    ambientMic: {
      model: 'Schoeps MK2H (omni capsule)',
      placement: '2–3 m away for room capture',
      purpose: 'Natural bloom and space'
    },
    bowedLyreMic: {
      model: 'AKG C451 B (cardioid small-diaphragm)',
      placement: '15 cm, aimed at upper bout — avoids bow noise',
      note: 'Add gentle high-pass at 120 Hz to remove rumble'
    },
    africanBowlLyreMic: {
      model: 'Shure SM81 (cardioid)',
      placement: 'Above the membrane opening',
      supplement: 'K&K Sound Pure Mini (contact pickup) blended with mic'
    },
    preamp: 'API 3124+ (4-channel transformer-coupled mic pre)',
    adConversion: 'Apogee Symphony I/O Mk II — 32-bit / 96 kHz',
    daw: {
      primary: 'Logic Pro X / Pro Tools',
      stem: 'Each lyre family on its own bus (Ancient, African, Medieval, Nordic)'
    },
    effects: {
      reverb: 'Bricasti M7 (Hall — 1.8 s RT60 for ancient/medieval; shorter 0.8 s for close-mic work)',
      eq: 'Neve 1073 hardware EQ; gentle air boost at 12 kHz',
      noiseReduction: 'iZotope RX 10 — for bow noise and breath capture removal'
    }
  },

  // ─── Repertoire profiles ──────────────────────────────────────────────────
  repertoire: {
    ancientGreek: {
      periods: ['Archaic (750–480 BC)', 'Classical (480–323 BC)', 'Hellenistic (323–31 BC)'],
      genres: ['Nomos (solo aulos or kithara form)', 'Paean (choral hymn)', 'Skolion (drinking song)', 'Epinician ode'],
      composers: ['Terpander (inventor of 7-string kithara, 7th c BC)', 'Pindar (lyric odes)', 'Sappho (lyric, accompanied by barbitos)']
    },
    africanTraditional: {
      genres: ['Ethiopian azmari improvisation', 'Luo nyatiti storytelling', 'Eritrean tigrinya songs'],
      contexts: ['Weddings and celebrations', 'Sacred liturgy (begena)', 'Secular court music']
    },
    medievalEuropean: {
      periods: ['Early Medieval (500–1000)', 'High Medieval (1000–1300)'],
      genres: ['Anglo-Saxon heroic verse accompaniment', 'Welsh penillion', 'Carolingian court music'],
      sources: ['Beowulf recitation context', 'Llyfr Coch Hergest (Red Book of Hergest)', 'Gododdin']
    },
    nordicRuno: {
      genres: ['Finnish runo-songs (Kalevala tradition)', 'Estonian regilaul', 'Swedish visor'],
      contexts: ['Community storytelling', 'Seasonal rituals', 'Neo-folk / dark ambient crossover']
    }
  },

  // ─── Maintenance ─────────────────────────────────────────────────────────
  maintenance: {
    stringing: {
      frequency: 'Gut strings: replace every 3–6 months or when intonation becomes unstable',
      process: 'Tie-hitch at tailpiece; wind around tuning pegs or peg-box pins; allow 24 h stretch before concert'
    },
    bowMaintenance: {
      rosin: 'Pirastro Oliv/Evah (bowed lyres); amber rosin for horsehair strings',
      rehair: 'Every 6–12 months depending on usage'
    },
    storage: {
      humidity: '45–55% RH (critical for gut strings and carved-wood bodies)',
      temperature: '18–22 °C',
      case: 'Hard-shell case with humidity control pack'
    }
  }
}

// ─── Exported helper functions ─────────────────────────────────────────────

function getLyreRig () {
  return LYRE_RIG
}

function getLyreSection (section) {
  return LYRE_RIG[section] || null
}

function getLyrePlayerCount () {
  return {
    ancientGreek: LYRE_RIG.ancientGreek.totalPlayers,
    africanLyre: LYRE_RIG.africanLyre.totalPlayers,
    medievalEuropean: LYRE_RIG.medievalEuropean.totalPlayers,
    nordicBowed: LYRE_RIG.nordicBowed.totalPlayers,
    total: LYRE_RIG.totalPlayers
  }
}

function getLyrePrincipals () {
  return [
    { section: 'Ancient Greek', role: 'Principal Kithara', instrument: 'Kithara' },
    { section: 'African', role: 'Principal Krar', instrument: 'Krar' },
    { section: 'African', role: 'Begena Cantor', instrument: 'Begena' },
    { section: 'Medieval European', role: 'Principal Germanic Leier', instrument: 'Germanic Leier' },
    { section: 'Medieval European', role: 'Crwth Player', instrument: 'Welsh Crwth' },
    { section: 'Nordic', role: 'Principal Talharpa', instrument: 'Talharpa' }
  ]
}

function getLyreInstruments () {
  return [
    { name: 'Kithara', family: 'Ancient Greek', strings: 7, bowed: false },
    { name: 'Chelys', family: 'Ancient Greek', strings: 7, bowed: false },
    { name: 'Barbitos', family: 'Ancient Greek', strings: 7, bowed: false },
    { name: 'Krar', family: 'African', strings: 6, bowed: false },
    { name: 'Begena', family: 'African', strings: 10, bowed: false },
    { name: 'Nyatiti', family: 'African', strings: 8, bowed: false },
    { name: 'Germanic Leier', family: 'Medieval European', strings: 6, bowed: false },
    { name: 'Welsh Crwth', family: 'Medieval European', strings: 6, bowed: true },
    { name: 'Talharpa', family: 'Nordic', strings: 4, bowed: true },
    { name: 'Jouhikko', family: 'Nordic', strings: 3, bowed: true }
  ]
}

function getLyreTuningReference (pitch = 'modern') {
  return LYRE_RIG.tuningReference.historicalPitches[pitch] || LYRE_RIG.tuningReference.historicalPitches.modern
}

function getLyreRepertoire (style) {
  if (style) return LYRE_RIG.repertoire[style] || null
  return LYRE_RIG.repertoire
}

module.exports = {
  LYRE_RIG,
  getLyreRig,
  getLyreSection,
  getLyrePlayerCount,
  getLyrePrincipals,
  getLyreInstruments,
  getLyreTuningReference,
  getLyreRepertoire
}
