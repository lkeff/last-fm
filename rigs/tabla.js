'use strict'

const TABLA_RIG = {
  type: 'tabla',
  totalMusicians: 1,
  description: 'North Indian classical tabla — paired hand drums with 6 major gharanas, full bol syllable vocabulary, and principal taals',
  tradition: 'Hindustani classical music (North Indian)',
  performanceContext: 'Solo recital (solo tabla), accompaniment to vocal/instrumental raga, kathak dance, light classical (thumri/dadra)',

  drums: {
    dayan: {
      name: 'Dayan (Tabla proper)',
      handedness: 'Right hand (treble drum)',
      body: {
        material: 'Indian rosewood (sheesham) or teak or steel',
        shape: 'Cylindrical, open bottom',
        diameter: '14–15 cm (head)'
      },
      head: {
        material: {
          mainMembrane: 'Goatskin (parchment)',
          syahi: 'Black paste — iron filings + iron oxide + rice starch, tuned in concentric rings'
        },
        tuning: {
          method: 'Hammer strikes on braided leather straps; tightening raises pitch',
          pitchRange: 'Tunable to specific note matching soloist tonic (Sa); typically C#, D, E or F depending on concert pitch',
          targetNote: 'Tuned to Pa (5th) or Sa of the raga being performed'
        }
      },
      syahiFunction: 'Multi-layered tuned loading patch; concentric ring structure produces harmonic partials; enables "pitched" tabla tone unique in world percussion',
      straps: {
        material: 'Braided leather (tasma)',
        cylinderBlocks: 'Wooden cylinders (gatta) threaded under straps for pitch adjustment'
      }
    },
    bayan: {
      name: 'Bayan (Bass drum)',
      handedness: 'Left hand (bass drum)',
      body: {
        material: 'Copper (traditional, most resonant) or brass or aluminium or clay',
        shape: 'Hemispherical / kettle-shaped',
        diameter: '21–25 cm (head)'
      },
      head: {
        material: {
          mainMembrane: 'Buffalo or goat skin',
          syahi: 'Smaller off-centre black patch — enables pitch bend via heel pressure'
        },
        pitchBending: {
          technique: 'Press heel of left hand on membrane while striking — changes pitch on the fly',
          range: '~4–6 semitones downward pressure bend',
          effect: 'Creates "ga" resonating bass tone fundamental to tabla character'
        }
      },
      pitch: 'Indefinite (bass); character determined by playing technique, not fixed tuning'
    }
  },

  bols: {
    description: 'Onomatopoeic syllables representing specific strokes; the verbal language of tabla',
    dayaBols: {
      na: { stroke: 'Index/middle finger rim strike', sound: 'high, crisp open tone', dayan: true },
      ta: { stroke: 'Index finger edge stroke', sound: 'sharp attack, open', dayan: true },
      tin: { stroke: 'Three-finger flat stroke on syahi', sound: 'resonant, pitched', dayan: true },
      te: { stroke: 'Middle finger on syahi', sound: 'mid, open', dayan: true },
      re: { stroke: 'Ring finger lift-off', sound: 'staccato, light', dayan: true },
      ne: { stroke: 'Index finger knuckle stroke', sound: 'muted', dayan: true }
    },
    bayaBols: {
      ge: { stroke: 'Four fingers flat on membrane center', sound: 'open bass resonance', bayan: true },
      ka: { stroke: 'Three-finger light tap', sound: 'muted bass', bayan: true },
      ke: { stroke: 'Ring+middle finger rim strike', sound: 'dry bass', bayan: true },
      ghe: { stroke: 'Full hand slap then slide (heel pressure)', sound: 'sliding bass "wa" sound', bayan: true }
    },
    combinedBols: {
      dha: { composition: 'ge + na', sound: 'Full open stroke — most used bol' },
      dhi: { composition: 'ge + tin', sound: 'Resonant open combined' },
      dhin: { composition: 'ge + tin (sustained)', sound: 'Open resonant — foundation of Teental' },
      ta: { composition: 'right muted (na) alone, left silent', sound: 'Crisp right muted' },
      tite: { composition: 'te + te', sound: 'Double right rapid' },
      kida: { composition: 'ke + na', sound: 'Left muted + right open' },
      trkt: { composition: 'te + re + ki + te', sound: 'Four-stroke fast run' },
      dhage: { composition: 'dha + ge', sound: 'Classic laykari phrase opener' }
    }
  },

  taals: {
    teental: {
      beats: 16,
      divisions: [4, 4, 4, 4],
      vibhags: 4,
      structure: ['Dha Dhin Dhin Dha', 'Dha Dhin Dhin Dha', 'Dha Tin Tin Ta', 'Ta Dhin Dhin Dha'],
      sam: 1,
      khali: { beat: 9, marker: 'wave of hand (no bayan)' },
      popularity: 'Most widely used taal in Hindustani classical; used for vilambit and drut gats'
    },
    jhaptal: {
      beats: 10,
      divisions: [2, 3, 2, 3],
      vibhags: 4,
      structure: ['Dhi Na', 'Dhi Dhi Na', 'Ti Na', 'Dhi Dhi Na'],
      sam: 1,
      khali: { beat: 6 },
      popularity: 'Common for medium-tempo compositions'
    },
    ektal: {
      beats: 12,
      divisions: [2, 2, 2, 2, 2, 2],
      vibhags: 6,
      structure: ['Dhin Dhin', 'Aage Trkt', 'Tin Na', 'Kida Trkt', 'Dhin Na', 'Dhin Na'],
      sam: 1,
      khali: [5, 11],
      popularity: 'Used for slow (vilambit) khyal; feels like 6/4'
    },
    rupak: {
      beats: 7,
      divisions: [3, 2, 2],
      vibhags: 3,
      structure: ['Tin Tin Na', 'Dhin Na', 'Dhin Na'],
      sam: 1,
      khali: { beat: 1, note: 'Sam itself is khali in rupak (unusual — no bayan on beat 1)' },
      popularity: 'Common for bhajans, thumri, some classical compositions'
    },
    jhoomra: {
      beats: 14,
      divisions: [3, 4, 3, 4],
      vibhags: 4,
      structure: ['Dhin _ Dhin', 'Dha Ge Tere Ke', 'Tin _ Tin', 'Dha Ge Dhi Na'],
      sam: 1,
      khali: { beat: 8 },
      popularity: 'Slow vilambit; spacious feel for slow khyal'
    },
    keherwa: {
      beats: 8,
      divisions: [4, 4],
      vibhags: 2,
      structure: ['Dha Ge Na Ti', 'Na Ke Dhi Na'],
      sam: 1,
      khali: { beat: 5 },
      popularity: 'Light classical, bhajan, folk, folk fusion'
    },
    dadra: {
      beats: 6,
      divisions: [3, 3],
      vibhags: 2,
      structure: ['Dha Dhi Na', 'Dha Ti Na'],
      sam: 1,
      khali: { beat: 4 },
      popularity: 'Semi-classical thumri, dadra style'
    },
    tintal: {
      note: 'Alternate name for Teental',
      beats: 16,
      aliases: ['Teental', 'Trital']
    }
  },

  gharanas: {
    delhi: {
      city: 'Delhi',
      founder: 'Siddhar Khan Dhadhi (18th century)',
      style: {
        character: 'Forceful, robust, use of heavy bayan strokes',
        specialty: 'Elaborate kayda (theme + variations) with strong ge bols',
        bols: 'Extensive use of kida, trkt patterns',
        tempoRange: 'Comfortable across all tempos'
      },
      notableArtists: ['Lal Bhai Dhadhi', 'Amir Hussain Khan', 'Shafaat Ahmed Khan']
    },
    ajrada: {
      city: 'Ajrada (near Delhi)',
      founder: 'Kallu Khan and Miru Khan',
      style: {
        character: 'Softer than Delhi, lyrical, rounded tone',
        specialty: 'Rela (fast passages) with intricate fingerwork',
        influence: 'Strong sarod/sitar accompaniment tradition'
      },
      notableArtists: ['Habibuddin Khan', 'Haji Vilayat Ali']
    },
    lucknow: {
      city: 'Lucknow (Nawabi court)',
      founder: 'Mian Bakshu',
      style: {
        character: 'Refined, courtly, "mehfil" (gathering) aesthetic',
        specialty: 'Nazakat (delicacy) — light touch, ornate compositions',
        bols: 'Distinctive use of fine tehai and tukda',
        influence: 'Kathak dance accompaniment tradition'
      },
      notableArtists: ['Abid Hussain', 'Afaq Hussain Khan', 'Imran Khan']
    },
    farukhabad: {
      city: 'Farukhabad (UP)',
      founder: 'Haji Vilayat Ali Khan',
      style: {
        character: 'Balance between Delhi and Lucknow; versatile',
        specialty: 'Gat (compositions) in medium and fast tempo; clear articulation',
        bols: 'Clean dha-tin-na structure, minimal ornament'
      },
      notableArtists: ['Ahmed Jan Thirakwa', 'Keramatullah Khan', 'Sabir Khan']
    },
    banaras: {
      city: 'Varanasi (Banaras)',
      founder: 'Ram Sahai (19th century)',
      style: {
        character: 'Heavy, earthy, maximum bayan resonance',
        specialty: 'Peshkar (slow elaborate opening) with deep ge tones',
        bols: 'Extensive ghe and ghe-re combinations for bass texture',
        influence: 'Temple and Dhrupad vocal accompaniment'
      },
      notableArtists: ['Kanthe Maharaj', 'Samta Prasad (Gudai Maharaj)', 'Kumar Bose']
    },
    punjab: {
      city: 'Punjab (Lahore / Amritsar)',
      founder: 'Lala Bhawani Das',
      style: {
        character: 'Bold, martial, high energy; favors fast tempo',
        specialty: 'Chakkardar tihais — triple cadences with internal complexity',
        bols: 'Aggressive te-re-ke-te patterns; sharp rim strokes',
        influence: 'North West frontier musical styles'
      },
      notableArtists: ['Alla Rakha', 'Zakir Hussain', 'Tari Khan']
    }
  },

  compositions: {
    peshkar: {
      type: 'Opening improvisation',
      character: 'Slow, measured; explores the taal cycle with melodic quality',
      structure: 'No fixed composition; improvised within taal structure'
    },
    kayda: {
      type: 'Theme and variations',
      character: 'Fixed theme (mukhda) + paltas (variations) maintaining bol structure',
      rule: 'Each variation must return to mukhda with tihai (triple cadence) landing on sam'
    },
    rela: {
      type: 'Fast variation form',
      character: 'High-speed fingerwork; tests technical dexterity',
      tempoRange: '200–400+ BPM in drut compositions'
    },
    tukda: {
      type: 'Short composition',
      character: 'Brief fixed piece, typically 1–2 avartans (cycles); often ends in tihai'
    },
    chakkardar: {
      type: 'Complex tihai',
      character: 'Tihai (×3 phrase) that itself contains internal repetitions; counts land exactly on sam',
      formula: 'Inner phrase × 3, total × 3; total beats = (n × 3 × 3) + 2 gaps = multiple of taal'
    },
    mukhda: {
      type: 'Head/hook phrase',
      character: 'Signature phrase that returns to sam; functions as refrain in kayda and gat'
    }
  },

  tuningAndMaintenance: {
    tuningProcess: [
      'Place dayan on padded ring (tabla stand)',
      'Tap wooden cylinder (gatta) sideways with small hammer (tabla hammer)',
      'Tap straps at 4 equidistant points around drum — even tension',
      'Strike syahi with index finger to check pitch',
      'Target note = Pa (5th above soloist Sa) or Sa',
      'Fine-tune by tapping hammer on syahi edge (raise pitch) or loosening (lower pitch)'
    ],
    maintenanceItems: {
      syahiRepairs: 'Cracked syahi — apply fresh iron paste layer, allow to cure 24–48h',
      headReplacement: 'Full head replacement every 2–5 years depending on usage',
      strapCondition: 'Leather straps should be oiled; replace when cracked or broken',
      gattas: 'Wooden blocks — replace if cracked; affects tension uniformity'
    },
    storageAndTransport: {
      humidity: 'Avoid extremes; 45–60% RH ideal',
      temperature: 'Room temperature; never leave in hot car (warps goat skin)',
      case: 'Hard cases for touring; padded bags for local concerts',
      travel: 'Loosen head tension slightly for air travel (pressure/altitude affects skin tension)'
    }
  },

  recording: {
    philosophy: 'Capture full dynamic range and bayan bass resonance without mud; preserve attack transients',
    dayaMic: {
      type: 'Small-diaphragm condenser (Shure SM81 or Schoeps MK4)',
      position: '15–20 cm above dayan head, pointed at syahi',
      function: 'Captures precise attack and tonal pitch of dayan',
      eq: 'High-pass at 150Hz; boost presence 5–8kHz for clarity'
    },
    bayaMic: {
      type: 'Large-diaphragm condenser (Neumann U87) or kick-drum mic (AKG D112)',
      position: '20–30 cm from bayan head, slightly off-axis',
      function: 'Captures bass resonance and pitch-bend sliding tones',
      eq: 'High-pass at 40Hz; gentle presence 200–400Hz for warmth; notch at 500Hz if muddy'
    },
    overheadMic: {
      type: 'Stereo pair (ORTF or AB)',
      position: '60–80 cm above both drums',
      function: 'Blends dayan and bayan in natural stereo image; room character'
    },
    processing: {
      compression: 'Parallel compression (attack 5ms, release 50ms, 4:1) — keeps transients, adds body',
      reverb: 'Short room or plate (0.4–0.8s) for ambience without blurring articulation',
      transientShaper: 'Attack +2–4 dB for extra punch in dense mix contexts'
    }
  }
}

function getTablaRig () { return TABLA_RIG }

function getTablaSection (key) {
  const map = {
    dayan: TABLA_RIG.drums.dayan,
    bayan: TABLA_RIG.drums.bayan,
    bols: TABLA_RIG.bols,
    taals: TABLA_RIG.taals,
    gharanas: TABLA_RIG.gharanas,
    compositions: TABLA_RIG.compositions
  }
  return map[key] || null
}

function getTablaDrums () {
  return [
    {
      name: 'Dayan',
      hand: 'right',
      pitch: 'treble',
      tuned: true,
      material: TABLA_RIG.drums.dayan.body.material
    },
    {
      name: 'Bayan',
      hand: 'left',
      pitch: 'bass',
      tuned: false,
      pitchBend: true,
      material: TABLA_RIG.drums.bayan.body.material
    }
  ]
}

function getTablaGharana (name) {
  return TABLA_RIG.gharanas[name] || null
}

function getTablaGharanas () {
  return TABLA_RIG.gharanas
}

function getTablaTaal (name) {
  return TABLA_RIG.taals[name] || null
}

function getTablaTaals () {
  return TABLA_RIG.taals
}

function getTablaBols () {
  return {
    dayan: TABLA_RIG.bols.dayaBols,
    bayan: TABLA_RIG.bols.bayaBols,
    combined: TABLA_RIG.bols.combinedBols
  }
}

function getTablePrincipals () {
  return [
    { role: 'Tabla Player', instrument: 'Tabla (Dayan + Bayan)', tradition: 'Hindustani' }
  ]
}

module.exports = {
  TABLA_RIG,
  getTablaRig,
  getTablaSection,
  getTablaDrums,
  getTablaGharana,
  getTablaGharanas,
  getTablaTaal,
  getTablaTaals,
  getTablaBols,
  getTablePrincipals
}
