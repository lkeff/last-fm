'use strict'

const SITAR_RIG = {
  type: 'sitar',
  totalMusicians: 4,
  description: 'North Indian classical sitar ensemble with tanpura drone, tabla accompaniment, and sarangi/harmonium support',
  tradition: 'Hindustani classical music (North Indian)',
  performanceContext: 'Raga-based improvisation; concert duration 45–120 minutes per raga',

  soloSitar: {
    totalMusicians: 1,
    role: 'Soloist',
    instrument: {
      name: 'Sitar',
      origin: 'North India (Mughal era, 13th–17th century development)',
      bodyMaterial: 'Teak or tun wood (body), dried gourd (tumba resonator), bone/ivory/synthetic frets',
      strings: {
        mainPlayingStrings: {
          count: 6,
          material: 'Steel (main 4) + brass-wound (2 chikari)',
          tuning: ['Pa (5th)', 'Sa (root)', 'Sa (root, octave above)', 'Pa (5th, upper)', 'Sa (high chikari)', 'Pa (high chikari)'],
          note: 'Exact tuning varies by gharana and raga; Sa = concert pitch chosen by performer (often C# or D)'
        },
        sympatheticStrings: {
          count: 13,
          name: 'Tarab strings',
          material: 'Fine steel wire',
          routing: 'Pass beneath main frets through carved notches',
          function: 'Resonate sympathetically, creating characteristic "shimmer" of Indian strings',
          tuning: 'Set to notes of raga being performed'
        },
        total: 19
      },
      frets: {
        count: 20,
        material: 'Brass wire, tied with thread (movable)',
        type: 'Curved/arched',
        feature: 'Arch allows meend (glissando) by pulling string sideways across fret face'
      },
      plectrum: {
        name: 'Mizrab',
        material: 'Thin steel wire coiled into ring + pointed pick end',
        wearing: 'Index finger of right hand',
        technique: 'Da (downstroke) and Ra (upstroke) strokes forming Diri combinations'
      },
      resonators: {
        main: 'Large gourd (tumba) at base of neck',
        secondary: 'Smaller gourd (kaddu) sometimes attached near headstock on Ravi Shankar style'
      },
      dimensions: {
        length: '120–130 cm',
        gourdsizeDiameter: '28–36 cm',
        weight: '3–4 kg'
      },
      notableStyles: {
        vilayatKhan: {
          strings: 'Reduced to 6 main + 11 sympathetic (gayaki ang style, vocal imitation)',
          modification: 'Removed extra gourd, slimmer neck for faster runs'
        },
        raviShankar: {
          strings: '6 main + 13 sympathetic (standard full set)',
          modification: 'Wider neck, full double-gourd, orchestral projection'
        }
      }
    },
    technique: {
      meend: {
        description: 'Glissando — pulling string laterally across arched fret',
        range: 'Up to 4 semitones in one pull; essential for raga ornamentation',
        variants: ['andolan (slow oscillation)', 'gamak (forceful oscillation)', 'murki (quick grace ornament)']
      },
      mizrabStrokes: {
        da: 'Downstroke (index plectrum)',
        ra: 'Upstroke (index plectrum)',
        dir: 'Da + Ra in rapid succession',
        diri: 'Double Da-Ra alternation',
        patterns: ['Da Ra Da Ra', 'Da Da Ra', 'Dir Dir Da', 'Diri Diri Da']
      },
      jhala: {
        description: 'Fast rhythmic section using chikari strings; typical raga climax',
        technique: 'Rapid thumb-nail strokes across chikari + selected melody notes'
      },
      alap: {
        description: 'Free-tempo introductory exploration of raga, no tabla',
        sections: ['alap (slow)', 'jor (rhythmic pulse emerges)', 'jhala (fast, before tabla entry)']
      },
      gat: {
        description: 'Composed melodic passage in rhythmic cycle (tala) with tabla',
        types: {
          vilambit: 'Slow gat (Teental 16 or Jhaptal 10, typically 30–60 bpm)',
          madhya: 'Medium gat',
          drut: 'Fast gat (60–180+ bpm)'
        }
      }
    }
  },

  tanpura: {
    totalMusicians: 1,
    role: 'Drone accompanist',
    instrument: {
      name: 'Tanpura (Tambura)',
      strings: {
        count: 4,
        standardTuning: ['Pa (5th, high)', 'Sa (octave)', 'Sa (low)', 'Sa (low)'],
        alternateTuning: ['Ma (4th) instead of Pa — for ragas emphasizing Ma'],
        material: 'Steel or brass wound over steel'
      },
      body: {
        material: 'Teak or marblewood neck, dried gourd body',
        resonator: 'Gourd (tumba) approximately 30–40cm diameter'
      },
      bridge: {
        name: 'Jawari bridge',
        material: 'Deer antler or bone (flat, slightly convex)',
        feature: 'Thread (silk/nylon) inserted under each string on bridge — creates characteristic buzzing "jawari" timbre',
        adjustment: 'Thread position tuned to maximize harmonic complexity'
      },
      playing: {
        technique: 'Cyclic plucking — each of 4 strings plucked in turn, continuous cycle',
        tempo: 'Slow and meditative (~30–40 strokes/minute)',
        function: 'Establishes tonal centre (Sa), sustains harmonic resonance throughout performance'
      },
      electronicAlternative: 'Digital tanpura pedals (Radel, Sur Sahayak) common in contemporary practice'
    }
  },

  sarangiOrHarmonium: {
    totalMusicians: 1,
    role: 'Melodic accompanist (optional; present in vocal-instrumental concerts)',
    instruments: {
      sarangi: {
        name: 'Sarangi',
        type: 'Bowed chordophone',
        strings: {
          main: { count: 3, material: 'Gut', tuning: 'Sa Pa Sa' },
          sympathetic: { count: 35, name: 'Tarab strings', material: 'Steel and brass' }
        },
        bow: 'Horsehair, convex (unlike Western concave bow)',
        technique: 'Fingernails of left hand press strings from side (no fingerboard)',
        role: 'Follows soloist, fills phrases, improvises within raga'
      },
      harmonium: {
        name: 'Harmonium',
        type: 'Reed organ (bellows-driven)',
        keys: '3.5 octaves (42 keys), chromatic',
        intonation: 'Equal temperament (limitation in raga context — cannot bend notes)',
        role: 'Simpler accompaniment, common in lighter classical and semi-classical settings',
        note: 'Controversial in purist circles due to fixed-pitch limitation; banned from All India Radio 1940–1971'
      }
    }
  },

  tablaAccompaniment: {
    totalMusicians: 1,
    role: 'Rhythmic accompanist (tabla player)',
    note: 'See tabla.js for full tabla configuration; this entry covers role within sitar ensemble context',
    interaction: {
      laykari: 'Rhythmic play with beat subdivisions to create tension with soloist',
      tihai: 'Triple repetition cadence landing precisely on sam (first beat)',
      sawal_jawab: 'Question-answer improvisation between sitar and tabla',
      lehra: 'Tabla plays steady cycle while sitar elaborates; reference tempo maintained'
    }
  },

  ragas: {
    morning: {
      bhairav: {
        time: 'Early morning (sunrise)',
        thaat: 'Bhairav',
        aroha: ['Sa', 're', 'Ga', 'Ma', 'Pa', 'dha', 'Ni', 'SA'],
        avaroha: ['SA', 'Ni', 'dha', 'Pa', 'Ma', 'Ga', 're', 'Sa'],
        vadi: 'dha',
        samvadi: 're',
        mood: 'Devotional, solemn'
      },
      yaman: {
        time: 'Early evening (6–9 PM) — listed for contrast',
        thaat: 'Kalyan',
        aroha: ['Ni', 'Re', 'Ga', 'Ma#', 'Ni', 'Re', 'GA', 'MA#'],
        avaroha: ['SA', 'Ni', 'Dha', 'Pa', 'Ma#', 'Ga', 'Re', 'Sa'],
        vadi: 'Ga',
        samvadi: 'Ni',
        mood: 'Expansive, romantic, evening beauty'
      }
    },
    midday: {
      bhimpalasi: {
        time: 'Afternoon (3–6 PM)',
        thaat: 'Kafi',
        aroha: ['Ni', 'Sa', 'ga', 'Ma', 'Pa', 'ni', 'SA'],
        avaroha: ['SA', 'ni', 'Dha', 'Pa', 'Ma', 'ga', 'Re', 'Sa'],
        vadi: 'Pa',
        samvadi: 'Sa',
        mood: 'Tender longing'
      }
    },
    evening: {
      darbariKanada: {
        time: 'Late night (after midnight)',
        thaat: 'Asavari',
        aroha: ['Sa', 'Re', 'ga', 'Ma', 'Pa', 'dha', 'ni', 'SA'],
        avaroha: ['SA', 'ni', 'dha', 'Pa', 'Ma', 'ga', 'Re', 'Sa'],
        vadi: 'Re',
        samvadi: 'Pa',
        mood: 'Regal, profound, meditative',
        specialFeature: 'Andolan (oscillating) on ga and dha'
      },
      bihag: {
        time: 'Night (9 PM–midnight)',
        thaat: 'Bilawal',
        aroha: ['Ni', 'Sa', 'Ga', 'Ma', 'Pa', 'Ni', 'SA'],
        avaroha: ['SA', 'Ni', 'Dha', 'Pa', 'Ma#', 'Ma', 'Ga', 'Re', 'Sa'],
        vadi: 'Ga',
        samvadi: 'Ni',
        mood: 'Romantic, serene'
      }
    },
    seasonal: {
      meghMalhar: {
        season: 'Monsoon',
        mood: 'Invocation of rain; legend: Tansen sang it causing rain'
      },
      hindol: {
        season: 'Spring (Vasant)',
        mood: 'Joyful, blossoming'
      }
    }
  },

  gharanas: {
    imdadkhani: {
      founder: 'Imdad Khan (19th century)',
      location: 'Etawah (UP)',
      style: 'Gayaki ang — vocal-like phrases, meend-heavy,少 jhala',
      notableMusicians: ['Vilayat Khan', 'Imrat Khan', 'Shujaat Khan']
    },
    maihar: {
      founder: 'Allauddin Khan',
      location: 'Maihar (MP)',
      style: 'Binkar ang — instrumental style, vigorous, complex compositions',
      notableMusicians: ['Ravi Shankar', 'Nikhil Banerjee', 'Ali Akbar Khan (sarod)']
    },
    jaipur: {
      location: 'Jaipur',
      style: 'Dhrupad-influenced, slower alap, austere',
      notableMusicians: ['Debu Chaudhuri']
    },
    senia: {
      origin: 'Tansen lineage (Gwalior)',
      style: 'The oldest lineage; beenkar ang (been/rudra vina influence)',
      note: 'Foundation of all Hindustani instrumental traditions'
    }
  },

  scaleDegrees: {
    notation: 'Sargam (Indian solfège)',
    degrees: {
      Sa: { position: 1, fixed: true, note: 'Tonic; always present' },
      re: { position: 2, variant: 'komal (flat Re)', semitones: 1 },
      Re: { position: 2, variant: 'shuddha Re', semitones: 2 },
      ga: { position: 3, variant: 'komal ga', semitones: 3 },
      Ga: { position: 3, variant: 'shuddha Ga', semitones: 4 },
      Ma: { position: 4, variant: 'shuddha Ma', semitones: 5 },
      'Ma#': { position: 4, variant: 'tivra Ma (raised 4th)', semitones: 6 },
      Pa: { position: 5, fixed: true, note: '5th; always pure', semitones: 7 },
      dha: { position: 6, variant: 'komal dha', semitones: 8 },
      Dha: { position: 6, variant: 'shuddha Dha', semitones: 9 },
      ni: { position: 7, variant: 'komal ni', semitones: 10 },
      Ni: { position: 7, variant: 'shuddha Ni', semitones: 11 },
      SA: { position: 8, note: 'Upper octave Sa' }
    },
    thaats: {
      bilawal: 'All shuddha (equivalent to major scale)',
      kalyan: 'Tivra Ma (lydian)',
      khamaj: 'Komal ni',
      bhairav: 'Komal re + komal dha',
      poorvi: 'Komal re + tivra Ma + komal dha',
      marwa: 'Komal re + tivra Ma',
      kafi: 'Komal ga + komal ni (dorian)',
      asavari: 'Komal ga + komal dha + komal ni',
      bhairavi: 'All komal except Pa (Phrygian)',
      todi: 'Komal re + komal ga + tivra Ma + komal dha'
    }
  },

  recording: {
    philosophy: 'Close-mic but not hyper-close; capture room air and sympathetic string resonance',
    mainMic: {
      position: 'Condenser (Neumann U87 or AKG C414) at ~50cm from main gourd, angled 30° toward neck',
      function: 'Primary signal: captures gourd body + string detail'
    },
    spotMic: {
      position: 'Small-diaphragm condenser (Schoeps MK4) near sound hole / string area',
      function: 'High-frequency string attack and sympathetic shimmer'
    },
    tanpuraMic: {
      position: 'Cardioid at 60–80cm from tanpura gourd',
      function: 'Drone bed; typically panned center, mixed slightly low'
    },
    roomMic: {
      type: 'ORTF or spaced pair at 2–3m',
      function: 'Blend ambient resonance of the space'
    },
    processing: {
      eq: 'High-pass at 60Hz; gentle presence boost 3–5kHz for string clarity',
      reverb: 'Short plate or room (0.8–1.2s) for concert hall illusion',
      compression: 'Gentle 2:1 (4–6dB GR) to tame dynamic range without killing dynamic swell'
    }
  }
}

function getSitarRig () { return SITAR_RIG }

function getSitarSection (key) {
  const map = {
    soloSitar: SITAR_RIG.soloSitar,
    tanpura: SITAR_RIG.tanpura,
    sarangiOrHarmonium: SITAR_RIG.sarangiOrHarmonium,
    tablaAccompaniment: SITAR_RIG.tablaAccompaniment
  }
  return map[key] || null
}

function getSitarMusicianCount () {
  return {
    soloSitar: SITAR_RIG.soloSitar.totalMusicians,
    tanpura: SITAR_RIG.tanpura.totalMusicians,
    sarangiOrHarmonium: SITAR_RIG.sarangiOrHarmonium.totalMusicians,
    tablaAccompaniment: SITAR_RIG.tablaAccompaniment.totalMusicians,
    total: SITAR_RIG.totalMusicians
  }
}

function getSitarPrincipals () {
  return [
    { section: 'soloSitar', role: 'Sitarist (Soloist)', instrument: 'Sitar' },
    { section: 'tanpura', role: 'Tanpura Player', instrument: 'Tanpura' },
    { section: 'sarangiOrHarmonium', role: 'Melodic Accompanist', instrument: 'Sarangi or Harmonium' },
    { section: 'tablaAccompaniment', role: 'Tabla Player', instrument: 'Tabla' }
  ]
}

function getSitarInstruments () {
  return [
    { name: 'Sitar', family: 'chordophone', subtype: 'plucked lute', strings: 19, category: 'solo' },
    { name: 'Tanpura', family: 'chordophone', subtype: 'plucked lute', strings: 4, category: 'drone' },
    { name: 'Mizrab', family: 'plectrum', subtype: 'wire ring plectrum', category: 'accessory' },
    { name: 'Sarangi', family: 'chordophone', subtype: 'bowed', strings: 38, category: 'accompaniment' },
    { name: 'Harmonium', family: 'aerophone', subtype: 'reed organ', category: 'accompaniment' }
  ]
}

function getSitarRaga (name) {
  const allRagas = {
    ...SITAR_RIG.ragas.morning,
    ...SITAR_RIG.ragas.midday,
    ...SITAR_RIG.ragas.evening
  }
  return allRagas[name] || null
}

function getSitarRagas () {
  return SITAR_RIG.ragas
}

function getSitarGharana (name) {
  return SITAR_RIG.gharanas[name] || null
}

function getSitarGharanas () {
  return SITAR_RIG.gharanas
}

function getSitarScaleDegrees () {
  return SITAR_RIG.scaleDegrees
}

module.exports = {
  SITAR_RIG,
  getSitarRig,
  getSitarSection,
  getSitarMusicianCount,
  getSitarPrincipals,
  getSitarInstruments,
  getSitarRaga,
  getSitarRagas,
  getSitarGharana,
  getSitarGharanas,
  getSitarScaleDegrees
}
