'use strict'

const ABORIGINAL_AUSTRALIAN_RIG = {
  type: 'aboriginal-australian',
  totalMusicians: 8,
  description: 'Aboriginal Australian musical traditions — didgeridoo, clapsticks, voice, bullroarer, and songline ceremonies across diverse regional traditions',
  tradition: 'Aboriginal Australian — the oldest continuous musical tradition on Earth (60,000+ years)',
  culturalNote: 'These traditions belong to specific Aboriginal and Torres Strait Islander peoples. Certain songs, instruments, and ceremonies are sacred and gender/initiation restricted. This configuration represents publicly documented concert and educational contexts only.',

  didgeridoo: {
    totalMusicians: 2,
    role: 'Didgeridoo players',
    instrument: {
      name: 'Didgeridoo (Yidaki — Yolŋu name; also Mago, Bamboo, Kanbi by region)',
      origin: 'Northern Australia, especially Arnhem Land (Yolŋu people) and Kakadu; now used pan-Australia',
      type: 'Aerophone — natural trumpet / drone pipe',
      material: {
        traditional: 'Eucalyptus (stringybark, bloodwood, woollybutt) hollowed by termites',
        contemporary: ['Agave', 'Bamboo', 'PVC pipe (practice)', 'Fiberglass', 'Carbon fiber'],
        selection: 'Maker tests hollow branches by tapping; termite-hollowing creates irregular interior — critical for tone quality'
      },
      dimensions: {
        length: '1.0–2.5 m (concert grade: 1.2–1.8m)',
        boreDiameter: '2.5–5 cm internal taper (wider at bell end)',
        bell: 'Natural irregular (no flare)',
        mouthpiece: 'Beeswax seal applied warm, molded to player\'s lips; airtight fit essential'
      },
      acoustics: {
        fundamentalPitch: 'D–G most common in Arnhem Land; A or lower for longer instruments',
        overblowing: 'Produces one octave jump (rarely used in traditional style)',
        resonanceRegister: 'Low drone 60–120 Hz; harmonics rich up to 2kHz',
        formants: 'Vocal tract shaping creates "talking" formant patterns (150–800Hz range)'
      },
      circularBreathing: {
        description: 'Inhale through nose while simultaneously exhaling through mouth using stored cheek air',
        effect: 'Unbroken drone of indefinite duration — minutes to hours',
        learningTime: 'Typical: 6 months–2 years to master; some acquire in weeks',
        stages: [
          'Puff cheeks with air',
          'Close soft palate',
          'Push cheek air out while rapidly inhaling nasally',
          'Coordinate muscles until seamless'
        ]
      },
      technique: {
        tonguing: {
          types: ['Diddle (tongue flutter)', 'Tu-Tu-Tu rhythm', 'Ka-Ka back-tongue', 'Drone with no tonguing'],
          rhythmicPatterns: 'Syncopated tongue patterns against drone fundamental; mirrors clapstick rhythm'
        },
        vocalisation: {
          description: 'Sing or hum while playing — voice resonates in tube, creating rich harmonic layers',
          effects: ['Animal calls (kookaburra, dingo, emu)', 'Wind sounds', 'Rhythmic vocal pulse over drone']
        },
        embouchure: {
          lipVibration: 'Loose lip buzz (not tight like brass); lips must not seal completely',
          pressure: 'Light; excess pressure kills resonance',
          warmup: 'Warm beeswax mouthpiece with hands; lip stretch exercises'
        },
        rhythmicInterplay: 'Didgeridoo rhythmic patterns lock with clapstick beat; cross-rhythms create polyrhythm'
      },
      tuningToSong: {
        method: 'Player selects instrument whose fundamental complements song key',
        adjustment: 'Wax mouthpiece can be added/removed to raise/lower pitch slightly',
        ensemblePitch: 'In ceremony, all instruments tuned relative to song leader\'s vocal pitch'
      }
    }
  },

  clapsticks: {
    totalMusicians: 2,
    role: 'Clapstick players / rhythmic keepers',
    instrument: {
      name: 'Clapsticks (Bilma — Yolŋu; also Boomerang-style, or cylindrical hardwood)',
      type: 'Idiophone — percussion',
      material: {
        traditional: ['Ironwood (Acacia)', 'Bloodwood', 'Mulga', 'Hardwood from local eucalyptus species'],
        shape: ['Cylindrical sticks (20–30cm × 2–3cm diameter)', 'Flat boomerang-shaped clappers', 'Carved painted sticks'],
        surface: 'Often painted with ochre, dot designs, or clan patterns — ceremonial significance'
      },
      playing: {
        technique: 'Strike one stick against the other — held loosely to allow resonance',
        patterns: {
          simple: 'Steady beat (pulse for song structure)',
          syncopated: 'Offbeat accents against didgeridoo cross-rhythms',
          accelerando: 'Gradual tempo increase for climax or dance passages',
          triplet: 'Three-against-two cross-rhythm patterns'
        },
        function: 'Marks rhythmic cycle; guides dancers; signals song structure (verse/chorus/end)'
      },
      pitchVariation: 'Thicker sticks produce lower pitch; thinner = higher; players often carry pair of different gauges'
    }
  },

  voice: {
    totalMusicians: 3,
    role: 'Singers / song leaders',
    description: 'Voice is the primary carrier of songline knowledge — melody, language, and spiritual content combined',
    traditions: {
      songlines: {
        description: 'Dreaming tracks — song sequences mapped to physical landscape features across thousands of km',
        function: 'Navigation, law transmission, spiritual maintenance of Country',
        length: 'Single songline may comprise hundreds of individual songs across multiple language groups',
        ownership: 'Songs are owned by specific clans; cannot be sung without proper authority'
      },
      wangga: {
        region: 'Daly River region, Northern Territory',
        style: 'Call-and-response; singer holds bilma (clapsticks) and yidaki player accompanies',
        language: 'Sung in local Aboriginal languages (Marrithiyel, Ngan\'gikurunggurr, etc.)',
        occasion: 'Ceremony, mortuary rites, celebration'
      },
      brolga: {
        region: 'Queensland and NT',
        style: 'High-pitched falsetto imitation of brolga crane; linked to dance',
        occasion: 'Ceremony and corroboree'
      },
      yirramboi: {
        region: 'Victoria (Wurundjeri, Boon Wurrung)',
        style: 'Song cycles tied to specific Country features; revival work ongoing',
        language: 'Woi wurrung and Boon wurrung languages'
      },
      wagilak: {
        region: 'Arnhem Land',
        style: 'Sacred song series tied to Wagilak sisters Dreaming story',
        restriction: 'Portions are men\'s-only sacred restricted material'
      },
      kunborrk: {
        region: 'Arnhem Land / Kakadu (Bininj Kunwok language groups)',
        style: 'Solo song style; non-fixed pitch; wide melodic range; microtonal',
        text: 'Song texts encode ecological and geographical knowledge'
      }
    },
    vocalTechniques: {
      microtonal: 'Intervals smaller than semitone used; not equal-tempered',
      glissando: 'Wide pitch slides, especially at phrase endings',
      nasalResonance: 'Nasal tone quality common in northern traditions',
      falsetto: 'Used for spirits, birds, supernatural entities',
      antiphony: 'Leader sings, group responds; often overlapping (hocket-like)',
      breathControl: 'Long phrases; some overlap singing (no circular breathing but phrase overlapping)'
    }
  },

  bullroarer: {
    totalMusicians: 1,
    role: 'Ceremonial instrument player (restricted — performed by initiated men in traditional contexts)',
    instrument: {
      name: 'Bullroarer (Tjurunga / Churinga — Central Australian name)',
      type: 'Aerophone — whirled',
      material: {
        shape: 'Flat oval or lozenge wooden board, 15–60 cm',
        material: 'Hardwood (mulga, ironwood)',
        decoration: 'Incised Dreaming designs — sacred geometric patterns specific to clan'
      },
      playing: {
        technique: 'Attached to cord, whirled overhead in circular motion',
        sound: 'Low roar/buzz (frequency 20–200 Hz depending on speed and size)',
        dynamics: 'Speed variation produces pitch change and tremolo effect'
      },
      culturalContext: {
        restriction: 'Sacred men\'s object in many communities; women and uninitiated must not see it',
        function: 'Communication with ancestors; initiation ceremonies; rain-calling in some traditions',
        publicUse: 'Small tourist-grade versions (non-sacred) sold openly; sacred versions restricted'
      }
    }
  },

  regionalTraditions: {
    arnhemLand: {
      peoples: ['Yolŋu', 'Bininj', 'Kunwinjku'],
      primaryInstruments: ['Yidaki (didgeridoo)', 'Bilma (clapsticks)', 'Voice'],
      style: 'Elaborate clan song cycles; highly developed didgeridoo technique; intricate cross-rhythms',
      language: 'Yolŋu Matha (many dialects), Kunwinjku',
      ceremony: ['Bungul (public ceremonial dance)', 'Yothu Yindi style fusion bridge to contemporary']
    },
    centralAustralia: {
      peoples: ['Arrernte', 'Luritja', 'Warlpiri', 'Pitjantjatjara', 'Yankunytjatjara'],
      primaryInstruments: ['Voice', 'Clapsticks', 'Bullroarer (restricted)', 'Seed rattles'],
      style: 'Songlines traverse desert; tonal language inflection in melody; unaccompanied singing more common',
      language: 'Arrernte, Warlpiri, Western Desert language',
      ceremony: ['Inma (ceremony/corroboree)', 'Women\'s song traditions especially strong in Western Desert']
    },
    kimberley: {
      peoples: ['Bardi', 'Nyikina', 'Gooniyandi', 'Walmajarri'],
      primaryInstruments: ['Voice', 'Clapsticks', 'Didgeridoo (adopted from east)'],
      style: 'Jadmi songs; wangga-influenced; strong dance tradition',
      ceremony: ['Junba (public dance ceremony)']
    },
    queensland: {
      peoples: ['Yidinji', 'Kuku Yalanji', 'Wik', 'Meriam (Torres Strait)'],
      primaryInstruments: ['Voice', 'Clapsticks', 'Log drums (Torres Strait Islanders)', 'Kundu drum (Torres Strait)'],
      style: 'Highly varied; Queensland coast traditions differ from inland; Torres Strait Islander traditions distinct',
      torresStrait: 'Kundu hourglass drum from PNG influence; Islander traditions separate from mainland Aboriginal'
    },
    southEast: {
      peoples: ['Wurundjeri', 'Boon Wurrung', 'Wiradjuri', 'Dharawal'],
      primaryInstruments: ['Voice', 'Clapsticks', 'Possum-skin clappers'],
      style: 'Colonial disruption most severe; significant revival and revitalisation efforts ongoing since 1990s',
      revival: 'Language and song revival programs through AIATSIS, community language centres',
      contemporary: 'Blends with contemporary music (Uncle Archie Roach, Tiddas, Yorta Yorta Nation traditions)'
    }
  },

  contemporaryFusion: {
    artists: {
      yothuYindi: {
        style: 'Blended Yolŋu traditional song with rock, didgeridoo, bilma',
        significance: 'Treaty (1991) — first mainstream crossover of traditional Aboriginal music',
        influence: 'Opened global stage for Aboriginal contemporary music'
      },
      archieRoach: {
        style: 'Singer-songwriter incorporating Aboriginal themes, English language',
        significance: 'Took Away the Children — Stolen Generations story; ARIA award winner'
      },
      georgieLittleChild: {
        style: 'Traditional Warlpiri song with contemporary context'
      },
      geoffreyGurrumul: {
        fullName: 'Geoffrey Gurrumul Yunupiŋu',
        style: 'Yolŋu song in Yolŋu Matha language with acoustic guitar',
        significance: 'Largest-selling Australian indigenous album internationally; Gurrumul (2008)'
      }
    },
    instruments: {
      didgeridooInWorldMusic: 'Widely adopted in ambient, new age, electronic (didgeridoo + loop pedal), jazz',
      hybrids: ['Electric didgeridoo (pickup + effects)', 'Didgeridoo + electronic looping', 'Didgeridoo + beatbox'],
      education: 'Didgeridoo taught in Australian school music programs; circular breathing as general wind technique'
    }
  },

  tuningAndPitch: {
    didgeridooKeys: {
      D: { lengthApprox: '1.32 m', common: true, note: 'Common for ensemble playing' },
      E: { lengthApprox: '1.18 m', common: true },
      G: { lengthApprox: '0.90 m', common: true, note: 'Popular compact size' },
      A: { lengthApprox: '0.80 m', common: false },
      B: { lengthApprox: '0.71 m', common: false, note: 'Shorter, brighter, harder to play' }
    },
    vocalPitch: 'Not fixed to 12-TET; song pitches vary by singer and tradition',
    clapstickPitch: 'Relative — different timber densities; no standard pitch system',
    pitchPhilosophy: 'Pitch relationship to Country and song text is primary; absolute pitch secondary'
  },

  recording: {
    philosophy: 'Location recording preferred; studio capture must honour acoustic environment of tradition; seek cultural authority permission before recording restricted material',
    didgeridooChain: {
      main: 'Large-diaphragm condenser (Neumann U87) at 30–50 cm, aimed at bell; captures full low-frequency drone',
      nearField: 'Small-diaphragm condenser at mouthpiece end — captures breath noise, lip detail',
      subFrequency: 'Consider LFE mic (Crown PZM on floor beneath player) for sub-40Hz body resonance'
    },
    clapsticksMic: {
      type: 'Pencil condenser (AKG C451 or Schoeps MK4)',
      position: '20–30 cm above playing hands',
      eq: 'High-pass at 200 Hz; presence boost at 6–10 kHz for attack clarity'
    },
    voiceMic: {
      type: 'Large-diaphragm condenser or ribbon (Royer R-121 for warmth)',
      distance: '30–50 cm; singers often move during performance',
      arrangement: 'Figure-8 ribbon captures front-back ambience natural to outdoor song context'
    },
    roomAndAmbience: {
      outdoor: 'Field recording in relevant Country landscape adds irreplaceable authenticity',
      studio: 'Minimal reverb (0.6–1.2s); avoid heavy Western classical reverb signatures',
      stereoField: 'Wide stereo — didgeridoo panned slightly left, clapsticks right, voice center'
    },
    culturalProtocol: [
      'Always obtain informed consent from community and song owners',
      'Restricted/sacred material must NOT be recorded without specific ceremonial authority',
      'Field recordings may require community veto on commercial release',
      'AIATSIS (Australian Institute of Aboriginal and Torres Strait Islander Studies) holds archived recordings under cultural access protocols'
    ]
  }
}

function getAboriginalAustralianRig () { return ABORIGINAL_AUSTRALIAN_RIG }

function getAboriginalAustralianSection (key) {
  const map = {
    didgeridoo: ABORIGINAL_AUSTRALIAN_RIG.didgeridoo,
    clapsticks: ABORIGINAL_AUSTRALIAN_RIG.clapsticks,
    voice: ABORIGINAL_AUSTRALIAN_RIG.voice,
    bullroarer: ABORIGINAL_AUSTRALIAN_RIG.bullroarer,
    regionalTraditions: ABORIGINAL_AUSTRALIAN_RIG.regionalTraditions,
    contemporaryFusion: ABORIGINAL_AUSTRALIAN_RIG.contemporaryFusion
  }
  return map[key] || null
}

function getAboriginalAustralianMusicianCount () {
  return {
    didgeridoo: ABORIGINAL_AUSTRALIAN_RIG.didgeridoo.totalMusicians,
    clapsticks: ABORIGINAL_AUSTRALIAN_RIG.clapsticks.totalMusicians,
    voice: ABORIGINAL_AUSTRALIAN_RIG.voice.totalMusicians,
    bullroarer: ABORIGINAL_AUSTRALIAN_RIG.bullroarer.totalMusicians,
    total: ABORIGINAL_AUSTRALIAN_RIG.totalMusicians
  }
}

function getAboriginalAustralianPrincipals () {
  return [
    { section: 'voice', role: 'Song Leader / Senior Songman', instrument: 'Voice' },
    { section: 'didgeridoo', role: 'Principal Didgeridoo Player', instrument: 'Yidaki (Didgeridoo)' },
    { section: 'clapsticks', role: 'Clapstick Keeper', instrument: 'Bilma (Clapsticks)' },
    { section: 'bullroarer', role: 'Ceremonial Instrument Holder (initiated)', instrument: 'Tjurunga (Bullroarer)' }
  ]
}

function getAboriginalAustralianInstruments () {
  return [
    { name: 'Yidaki (Didgeridoo)', family: 'aerophone', subtype: 'natural trumpet', circularBreathing: true, region: 'Northern Australia' },
    { name: 'Bilma (Clapsticks)', family: 'idiophone', subtype: 'concussion sticks', region: 'Pan-Australian' },
    { name: 'Tjurunga (Bullroarer)', family: 'aerophone', subtype: 'whirled aerophone', restricted: true, region: 'Central Australia' },
    { name: 'Kundu', family: 'membranophone', subtype: 'hourglass drum', region: 'Torres Strait Islands' },
    { name: 'Possum-skin clapper', family: 'idiophone', subtype: 'clapper', region: 'South-East Australia' },
    { name: 'Seed rattle', family: 'idiophone', subtype: 'shaken', region: 'Central and Northern Australia' },
    { name: 'Voice / Song', family: 'aerophone', subtype: 'human voice', primary: true, region: 'Pan-Australian' }
  ]
}

function getAboriginalAustralianRegion (name) {
  return ABORIGINAL_AUSTRALIAN_RIG.regionalTraditions[name] || null
}

function getAboriginalAustralianRegions () {
  return ABORIGINAL_AUSTRALIAN_RIG.regionalTraditions
}

module.exports = {
  ABORIGINAL_AUSTRALIAN_RIG,
  getAboriginalAustralianRig,
  getAboriginalAustralianSection,
  getAboriginalAustralianMusicianCount,
  getAboriginalAustralianPrincipals,
  getAboriginalAustralianInstruments,
  getAboriginalAustralianRegion,
  getAboriginalAustralianRegions
}
