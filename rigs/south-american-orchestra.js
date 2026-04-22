/**
 * South American Section Orchestra Configuration
 *
 * A comprehensive 72-musician orchestra built around the rich instrumental
 * traditions of South America. Fuses Andean (Quechua/Aymara), Brazilian,
 * Argentine/Uruguayan tango, Afro-Brazilian, and pan-Caribbean traditions
 * alongside a classical string & brass backbone.
 *
 * The SA section extends the standard European orchestra (rigs/orchestra.js)
 * by replacing / augmenting specific seats with indigenous and regional
 * instruments, and adding a dedicated Folk & Rhythm section.
 *
 * Regional coverage:
 *   Andean    – Bolivia, Peru, Ecuador, northern Chile/Argentina
 *   Amazonian – Brazil, Colombia, Venezuela
 *   Southern  – Argentina, Uruguay (tango lineage)
 *   Afro-SA   – Afro-Brazilian candomblé / samba percussion traditions
 *   Caribbean – Colombia, Venezuela (cumbia, joropo, salsa ancestry)
 *
 * @module rigs/south-american-orchestra
 */

'use strict'

const SA_ORCHESTRA = {
  name: 'South American Section Orchestra',
  version: '1.0.0',
  type: 'south-american-orchestra',
  totalMusicians: 72,
  origin: 'South America (multi-regional)',

  /**
     * Stage Layout
     * Semicircular arrangement — conductor at front-center.
     * Classical sections fill the rear two tiers; the SA Folk & Rhythm
     * section wraps the stage left/right flanks.
     */
  layout: {
    arrangement: 'Semicircular hybrid (classical core + SA flanks)',
    conductorPosition: { x: 0, y: 0, facing: 'orchestra' },
    stageDepth: 14, // metres
    stageWidth: 22, // metres — wider for flank sections
    tiers: 4,
    acousticShell: true,
    regionalZones: {
      andean: 'Stage-left flank, tier 1-2',
      tango: 'Stage-right flank, tier 1-2',
      afroBrazilian: 'Back-right, tier 3-4',
      classical: 'Centre, all tiers'
    }
  },

  // -----------------------------------------------------------------------
  // CLASSICAL STRING BACKBONE — 36 musicians
  // (reduced vs. standard 89-person to make room for SA sections)
  // -----------------------------------------------------------------------
  strings: {
    totalMusicians: 36,
    note: 'Strings tuned to A=442 Hz to blend with Andean instruments',

    firstViolins: {
      count: 10,
      position: 'Front-left arc, tier 1',
      principal: { title: 'Concertmaster', seat: 1 },
      instruments: Array(10).fill(null).map((_, i) => ({
        seat: i + 1,
        instrument: 'Violin',
        stand: Math.floor(i / 2) + 1,
        position: i % 2 === 0 ? 'outside' : 'inside'
      }))
    },

    secondViolins: {
      count: 8,
      position: 'Front-right arc, tier 1',
      principal: { title: 'Principal Second Violin', seat: 1 },
      instruments: Array(8).fill(null).map((_, i) => ({
        seat: i + 1,
        instrument: 'Violin',
        stand: Math.floor(i / 2) + 1,
        position: i % 2 === 0 ? 'outside' : 'inside'
      }))
    },

    violas: {
      count: 6,
      position: 'Centre, tier 1-2',
      principal: { title: 'Principal Viola', seat: 1 },
      instruments: Array(6).fill(null).map((_, i) => ({
        seat: i + 1,
        instrument: 'Viola'
      }))
    },

    cellos: {
      count: 6,
      position: 'Front-right, tier 1',
      principal: { title: 'Principal Cello', seat: 1 },
      instruments: Array(6).fill(null).map((_, i) => ({
        seat: i + 1,
        instrument: 'Cello',
        stand: Math.floor(i / 2) + 1
      }))
    },

    doubleBasses: {
      count: 4,
      position: 'Back-right, tier 2, elevated',
      principal: { title: 'Principal Double Bass', seat: 1 },
      note: 'Two basses fitted with C-extension for lower Andean resonance',
      instruments: Array(4).fill(null).map((_, i) => ({
        seat: i + 1,
        instrument: 'Double Bass',
        tuning: i < 2 ? 'Standard (E-A-D-G)' : 'Extended (C-extension)'
      }))
    },

    // SA string additions
    charango: {
      count: 2,
      position: 'Stage-left flank, tier 1',
      origin: 'Andean (Bolivia/Peru)',
      description: '10-string lute, originally with armadillo shell body; modern versions use wood',
      tunings: ['Standard (G-C-E-A-E)', 'Diablo tuning (G#-C#-F-A#-F)'],
      players: [
        { seat: 1, role: 'Principal Charango', doublings: ['Ronroco'] },
        { seat: 2, role: 'Second Charango' }
      ]
    },

    guitarronChileno: {
      count: 1,
      position: 'Stage-left flank, tier 1',
      origin: 'Chile',
      description: '25-string acoustic bass guitar used in Chilean folk (Cueca)',
      players: [{ seat: 1, role: 'Principal Guitarrón Chileno' }]
    },

    cuatro: {
      count: 1,
      position: 'Stage-right flank, tier 1',
      origin: 'Venezuela/Colombia',
      description: '4-string small guitar, rhythmic strumming patterns in joropo & llanera',
      players: [{ seat: 1, role: 'Principal Cuatro Venezolano' }]
    },

    violaCaipira: {
      count: 1,
      position: 'Stage-right flank, tier 1',
      origin: 'Brazil (São Paulo/Minas Gerais)',
      description: '10-string double-course Brazilian viola used in forró/sertanejo',
      players: [{ seat: 1, role: 'Principal Viola Caipira', doublings: ['Cavaquinho'] }]
    }
  },

  // -----------------------------------------------------------------------
  // ANDEAN WINDS SECTION — 8 musicians
  // Indigenous wind instruments from the Andes mountain range.
  // -----------------------------------------------------------------------
  andeanWinds: {
    totalMusicians: 8,
    position: 'Stage-left flank, tier 2',
    origin: 'Andean (Bolivia, Peru, Ecuador, northern Chile/Argentina)',

    quena: {
      count: 2,
      description: 'End-notched bamboo flute, characteristic breathy tone, pentatonic scales',
      tuning: 'G (concert) — transposing instrument',
      rangeHz: [195, 1047], // G3–C6
      players: [
        { seat: 1, role: 'Principal Quena', doublings: ['Quenacho (bass quena)'] },
        { seat: 2, role: 'Second Quena', doublings: ['Quena in D'] }
      ]
    },

    siku: {
      count: 2,
      description: 'Zampoña / pan pipes — interlocking antiphonal playing technique (trenza)',
      sets: [
        { name: 'Arka (follower)', tubes: 7, key: 'G' },
        { name: 'Ira (leader)', tubes: 6, key: 'G' }
      ],
      players: [
        { seat: 1, role: 'Principal Siku (Ira)', technique: 'interlocking ira part' },
        { seat: 2, role: 'Principal Siku (Arka)', technique: 'interlocking arka part' }
      ]
    },

    tarka: {
      count: 1,
      description: 'Duct flute with internal duct, strident festival sound, played only in dry season',
      origin: 'Bolivia (Aymara tradition)',
      players: [{ seat: 1, role: 'Tarka / Pinkillo', doublings: ['Pinkillo (side-blown)'] }]
    },

    ocarina: {
      count: 1,
      description: 'Clay vessel flute — ocarinas de barro, ovoid or zoomorphic',
      origin: 'Pre-Columbian Andean tradition',
      players: [{ seat: 1, role: 'Ocarina / Ocarinas de barro' }]
    },

    bansuri: {
      count: 1,
      description: 'Transverse cane flute; used in modern crossover SA classical compositions',
      players: [{ seat: 1, role: 'Transverse Cane Flute', doublings: ['Concert Flute'] }]
    },

    antara: {
      count: 1,
      description: 'Nazca/Paracas panpipe — single row (vs. double-row siku). Archaeological origin.',
      origin: 'Peru (Nazca culture)',
      players: [{ seat: 1, role: 'Antara (Nazca panpipe)' }]
    }
  },

  // -----------------------------------------------------------------------
  // CLASSICAL WOODWINDS — 4 musicians (reduced complement)
  // -----------------------------------------------------------------------
  woodwinds: {
    totalMusicians: 4,
    position: 'Centre, tier 2',

    flutes: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Flute', instrument: 'Concert Flute in C', doublings: ['Piccolo'] }]
    },
    oboes: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Oboe', instrument: 'Oboe', note: 'Provides tuning A' }]
    },
    clarinets: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Clarinet', instrument: 'Clarinet in Bb', doublings: ['Eb Clarinet'] }]
    },
    bassoons: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Bassoon', instrument: 'Bassoon', doublings: ['Contrabassoon'] }]
    }
  },

  // -----------------------------------------------------------------------
  // BRASS — 6 musicians (compact complement)
  // -----------------------------------------------------------------------
  brass: {
    totalMusicians: 6,
    position: 'Back-centre, tier 3',

    horns: {
      count: 2,
      players: [
        { seat: 1, role: 'Principal Horn', instrument: 'French Horn in F' },
        { seat: 2, role: 'Second Horn', instrument: 'French Horn in F' }
      ]
    },
    trumpets: {
      count: 2,
      players: [
        { seat: 1, role: 'Principal Trumpet', instrument: 'Trumpet in Bb' },
        { seat: 2, role: 'Second Trumpet', instrument: 'Trumpet in Bb', doublings: ['Flugelhorn'] }
      ]
    },
    trombone: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Trombone', instrument: 'Tenor Trombone' }]
    },
    tuba: {
      count: 1,
      players: [{ seat: 1, role: 'Principal Tuba', instrument: 'Contrabass Tuba in CC' }]
    }
  },

  // -----------------------------------------------------------------------
  // TANGO & RÍO DE LA PLATA SECTION — 5 musicians
  // Argentine/Uruguayan tango lineage. Stage-right flank.
  // -----------------------------------------------------------------------
  tangoSection: {
    totalMusicians: 5,
    position: 'Stage-right flank, tier 1-2',
    origin: 'Argentina / Uruguay',
    style: 'Tango, Milonga, Vals criollo',

    bandoneon: {
      count: 2,
      description: 'German-origin concertina, soul of Argentine tango — chromatic button accordion',
      layout: 'Chromatic, bisonoric (different pitch on push/pull)',
      buttons: { left: 33, right: 38 },
      players: [
        { seat: 1, role: 'Principal Bandoneón', style: 'Pugliese / Piazzolla school' },
        { seat: 2, role: 'Second Bandoneón', style: 'Orquesta típica comping' }
      ]
    },

    pianoTango: {
      count: 1,
      description: 'Upright piano preferred for tango; distinct attack and comping style',
      players: [{ seat: 1, role: 'Tango Piano', doublings: ['Concert Grand Piano'] }]
    },

    tangoViolin: {
      count: 1,
      description: 'Violin with tango phrasing: legato slides, marcato bowing, improvisatory ornamentation',
      players: [{ seat: 1, role: 'Tango Violin / Concertino' }]
    },

    contrabass: {
      count: 1,
      description: 'Rhythmic marcato pizzicato tango role — doubles SA double bass section',
      players: [{ seat: 1, role: 'Tango Contrabass' }]
    }
  },

  // -----------------------------------------------------------------------
  // AFRO-BRAZILIAN & SAMBA PERCUSSION SECTION — 7 musicians
  // Candomblé, samba, baião, forró rhythmic foundations.
  // -----------------------------------------------------------------------
  afroBrazilianPercussion: {
    totalMusicians: 7,
    position: 'Back-right, tier 3-4, elevated on risers',
    origin: 'Brazil (Afro-Brazilian traditions)',
    roots: ['Candomblé Nagô-Kêtu', 'Samba Enredo', 'Baião', 'Forró', 'Maracatu'],

    players: [
      {
        seat: 1,
        role: 'Surdo Principal',
        primaryInstrument: 'Surdo de marcação (26")',
        description: 'Bass anchor drum of samba — deep pulse, played with padded mallet',
        secondaryInstruments: ['Surdo de terceira'],
        technique: 'One hand open/mute, one mallet strike'
      },
      {
        seat: 2,
        role: 'Repique de Mão / Repinique',
        primaryInstrument: 'Repique (11")',
        description: 'High-pitched tenor drum — leads the bateria, signals breaks',
        secondaryInstruments: ['Caixa (snare)'],
        technique: 'Stick + hand technique'
      },
      {
        seat: 3,
        role: 'Pandeiro Principal',
        primaryInstrument: 'Pandeiro (10")',
        description: 'Brazilian frame drum with jingles — distinct from tambourine',
        styles: ['Samba', 'Choro', 'Forró'],
        technique: 'Thumb-bass-heel-toe technique'
      },
      {
        seat: 4,
        role: 'Zabumba / Bombo Leguero',
        primaryInstrument: 'Zabumba (18")',
        description: 'Low bass drum of forró/baião — mallet + stick off-beat',
        secondaryInstruments: ['Bombo leguero (Andean bass drum)'],
        origin: 'Northeast Brazil / Andean dual role'
      },
      {
        seat: 5,
        role: 'Atabaques',
        primaryInstrument: 'Rum (largest atabaque)',
        description: 'Candomblé sacred drums — single-headed tall conical drums',
        set: ['Rum (bass)', 'Rumpi (mid)', 'Lê (treble)'],
        technique: 'Hand technique, sometimes with small stick (dó)',
        origin: 'Candomblé Nagô-Kêtu (Salvador da Bahia)'
      },
      {
        seat: 6,
        role: 'Cuíca',
        primaryInstrument: 'Cuíca (10")',
        description: 'Friction drum — internal bamboo stick rubbed to produce crying/whining sound',
        technique: 'Wet cloth on internal rod; left hand mutes head for pitch',
        origin: 'Central Africa via Brazil (samba)'
      },
      {
        seat: 7,
        role: 'Agogô & Small Percussion',
        primaryInstrument: 'Agogô (double bell)',
        description: 'Iron double cone bells struck with metal rod — rhythmic timekeeper',
        secondaryInstruments: ['Ganzá (shaker)', 'Caxixi (wicker rattle)', 'Afoxé (beaded gourd)'],
        origin: 'Yoruba tradition via Candomblé'
      }
    ],

    inventory: {
      membranophones: [
        'Surdo de marcação (26")',
        'Surdo de segunda (24")',
        'Surdo de terceira (22")',
        'Repique / Repinique (11")',
        'Caixa de guerra (13" snare)',
        'Pandeiro (10")',
        'Zabumba (18" x 8" NE Brazil forró)',
        'Bombo leguero (Andean)',
        'Rum atabaque (70cm × 30cm)',
        'Rumpi atabaque (60cm × 28cm)',
        'Lê atabaque (55cm × 25cm)',
        'Cuíca (10" friction drum)',
        'Timba / Timbal (14" Brazilian conga)'
      ],
      idiophones: [
        'Agogô duplo (double iron bell)',
        'Ganzá (cylindrical shaker, metal)',
        'Caxixi (wicker + gourd rattle)',
        'Afoxé / Xequeré (beaded gourd shaker)',
        'Reco-reco (bamboo scraper)',
        'Triângulo (Brazilian triangle — open, shimmering)',
        'Claves (Cuban-SA hybrid use in salsa patterns)'
      ]
    }
  },

  // -----------------------------------------------------------------------
  // ANDEAN PERCUSSION — 3 musicians
  // -----------------------------------------------------------------------
  andeanPercussion: {
    totalMusicians: 3,
    position: 'Stage-left flank, tier 3',
    origin: 'Andes — Bolivia, Peru, Ecuador',

    players: [
      {
        seat: 1,
        role: 'Wankara / Tinya',
        primaryInstrument: 'Wankara (large double-headed Andean drum)',
        description: 'Frame drum played during festivals; llama/alpaca skin heads',
        secondaryInstruments: ['Tinya (small hand drum held by women)']
      },
      {
        seat: 2,
        role: 'Cajón Peruano Principal',
        primaryInstrument: 'Cajón peruano',
        description: 'Box drum from Afro-Peruvian tradition; player sits atop and slaps front face',
        origin: 'Afro-Peruvian (Lima, Chincha)',
        technique: 'Bass tone (centre), slap (upper edges), open tone',
        styles: ['Festejo', 'Landó', 'Zamacueca']
      },
      {
        seat: 3,
        role: 'Chajchas & Idiophones',
        primaryInstrument: 'Chajchas (hooves/seeds rattle)',
        description: 'Rattles made from llama/goat hooves or dried seeds worn around ankles',
        secondaryInstruments: [
          'Pututu (conch-shell horn, Andean ceremonial)',
          'Wayllaquepa (ceramic trumpet)',
          'Maracas / maraca de totuma (gourd shaker)'
        ]
      }
    ]
  },

  // -----------------------------------------------------------------------
  // KEYBOARDS & HARP — 3 musicians
  // -----------------------------------------------------------------------
  keyboards: {
    totalMusicians: 3,

    harp: {
      count: 1,
      position: 'Stage-left, between Andean and classical sections',
      variants: [
        {
          type: 'Arpa Llanera (Venezuelan / Colombian harp)',
          strings: 32,
          material: 'Nylon strings, cedar soundbox, no pedals',
          origin: 'Venezuela / Colombia (Joropo)',
          note: 'Primary instrument for this rig'
        },
        {
          type: 'Arpa Andina (Peruvian diatonic harp)',
          strings: 36,
          material: 'Gut or nylon strings, no pedals',
          origin: 'Peru / Bolivia'
        }
      ],
      players: [{ seat: 1, role: 'Principal Arpa Llanera', doublings: ['Arpa Andina'] }]
    },

    piano: {
      count: 1,
      position: 'Stage-right, near tango section',
      instrument: {
        type: 'Concert Grand Piano',
        model: 'Steinway Model D (or Yamaha CFIII)',
        keys: 88
      },
      players: [{ seat: 1, role: 'Piano (dual role: classical + tango comping)' }]
    },

    accordion: {
      count: 1,
      position: 'Stage-right flank',
      instrument: {
        type: 'Diatonic button accordion (gaita / vallenato accordion)',
        buttons: { right: 12, left: 12 },
        origin: 'Colombia (Vallenato) / Argentina (folklore)'
      },
      players: [{ seat: 1, role: 'Principal Accordion / Gaita', doublings: ['Bandoneón (backup)'] }]
    }
  },

  // -----------------------------------------------------------------------
  // CONDUCTOR
  // -----------------------------------------------------------------------
  conductor: {
    position: 'Centre front, facing orchestra',
    podium: { height: 0.3, dimensions: '1m × 1m' },
    specialisation: 'SA & Latin American repertoire (Villa-Lobos, Ginastera, Piazzolla, Revueltas)',
    equipment: ['Music stand with light', 'Baton', 'Full score']
  },

  // -----------------------------------------------------------------------
  // REPERTOIRE GUIDE
  // -----------------------------------------------------------------------
  repertoire: {
    classical_SA: {
      period: 'SA Nationalist / Neo-classical (1900–1980)',
      composers: [
        { name: 'Heitor Villa-Lobos', origin: 'Brazil', works: ['Bachianas Brasileiras', 'Choros'] },
        { name: 'Alberto Ginastera', origin: 'Argentina', works: ['Estancia Suite', 'Variaciones Concertantes'] },
        { name: 'Carlos Chávez', origin: 'Mexico', works: ['Sinfonía India'] },
        { name: 'Silvestre Revueltas', origin: 'Mexico', works: ['Sensemayá', 'Noche de los Mayas'] },
        { name: 'Astor Piazzolla', origin: 'Argentina', works: ['Libertango', 'Adiós Nonino', 'Tango Suite'] },
        { name: 'Darius Milhaud', origin: 'France (SA influence)', works: ['Le Bœuf sur le Toit', 'Saudades do Brasil'] }
      ]
    },
    folk_fusion: {
      period: 'Folk-symphonic fusion (1960–present)',
      traditions: ['Nueva Canción (Chile/Argentina)', 'Tropicália (Brazil)', 'Andean fusion', 'Tango Nuevo'],
      examples: [
        'Victor Jara arrangements for orchestra',
        'Mercedes Sosa orchestrations',
        'Piazzolla chamber orchestra works',
        'Inti-Illimani orchestral arrangements'
      ]
    },
    andean_classical: {
      period: 'Pre-Columbian reconstruction & fusion',
      notes: 'Ethnomusicological reconstructions of Inca/Tiwanaku music; modern compositions for Andean instruments with orchestra'
    }
  },

  // -----------------------------------------------------------------------
  // TUNING & TEMPERAMENT
  // -----------------------------------------------------------------------
  technical: {
    tuning: {
      orchestralA: 'A = 442 Hz (slightly raised to blend with metallic quality of Andean winds)',
      andeanWinds: 'Quena typically tuned to G or D; siku interlocks in G',
      tango: 'A = 440 Hz (strict; tango tradition)',
      note: 'Conductor calls separate tuning checks for classical, Andean, and tango groups'
    },
    temperament: {
      default: '12-tone equal temperament',
      andean: 'Pentatonic/hexatonic scales — E, F#, G#, A#, C# (Andean pentatonic)',
      microtones: 'Quena and siku allow quarter-tone inflections; notate with arrows'
    },
    rehearsal: {
      typical: '3 hours with two 15-min breaks (extra for cross-cultural coordination)',
      specialSessions: [
        'Andean section isolated for rhythmic interlocking drill (30 min)',
        'Tango section isolated for marcato/rubato synchronisation (30 min)',
        'Afro-Brazilian bateria warm-up with full ensemble (15 min)'
      ]
    }
  },

  // -----------------------------------------------------------------------
  // RECORDING SETUP
  // -----------------------------------------------------------------------
  recording: {
    mainArray: {
      technique: 'Decca Tree (main) + ORTF pair (SA section coverage)',
      microphones: [
        { position: 'Left', model: 'Neumann M 50', height: '3m' },
        { position: 'Centre', model: 'Neumann M 50', height: '3m' },
        { position: 'Right', model: 'Neumann M 50', height: '3m' }
      ]
    },
    saSpotMics: {
      andean: { model: 'DPA 4099 (clip-on)', instruments: ['Quena', 'Siku', 'Charango'] },
      tango: { model: 'Neumann KM 184', instruments: ['Bandoneón', 'Tango violin'] },
      afroBrazilian: { model: 'Shure SM57 + AKG C414', instruments: ['Pandeiro', 'Surdo', 'Cuíca', 'Atabaque'] },
      andeanPerc: { model: 'AKG C414 XLII', instruments: ['Cajón', 'Wankara'] },
      harp: { model: 'DPA 4011', quantity: 2, notes: 'Stereo pair; close-mic to capture Arpa Llanera attack' }
    },
    ambience: {
      technique: 'Spaced omnis',
      position: 'Hall, 10–15m from stage',
      microphones: { model: 'Neumann M 50 or DPA 4006', quantity: 2 }
    },
    daw: {
      recommended: 'Pro Tools / Logic Pro X',
      sampleRate: '96kHz / 32-bit float',
      channels: 48,
      specialConsiderations: [
        'Separate stem groups: Classical strings, Andean winds, Tango, Afro-Brazilian perc, Andean perc',
        'Surdo and atabaque require heavy low-shelf EQ control in mix',
        'Bandoneón benefits from mild plate reverb (1.2s RT)',
        'Quena proximity effect — avoid dynamic microphones closer than 30cm'
      ]
    }
  },

  // -----------------------------------------------------------------------
  // ROSTER GENERATION
  // -----------------------------------------------------------------------
  roster: {
    generateFullRoster () {
      const roster = []
      let id = 1

      // Classical strings
      const stringSections = [
        { sub: 'First Violin', count: 10, roles: ['Concertmaster', 'Associate Concertmaster'] },
        { sub: 'Second Violin', count: 8, roles: ['Principal Second Violin'] },
        { sub: 'Viola', count: 6, roles: ['Principal Viola'] },
        { sub: 'Cello', count: 6, roles: ['Principal Cello'] },
        { sub: 'Double Bass', count: 4, roles: ['Principal Double Bass'] }
      ]
      stringSections.forEach(sec => {
        for (let i = 0; i < sec.count; i++) {
          roster.push({
            id: id++,
            section: 'Strings',
            subsection: sec.sub,
            seat: i + 1,
            role: sec.roles[i] || `${sec.sub} ${i + 1}`,
            instrument: sec.sub.includes('Bass') ? 'Double Bass' : 'Violin/Viola/Cello'
          })
        }
      })

      // SA strings
      const saStrings = [
        { sub: 'Charango', count: 2, instrument: 'Charango', region: 'Andean' },
        { sub: 'Guitarrón Chileno', count: 1, instrument: 'Guitarrón Chileno', region: 'Chile' },
        { sub: 'Cuatro', count: 1, instrument: 'Cuatro Venezolano', region: 'Venezuela' },
        { sub: 'Viola Caipira', count: 1, instrument: 'Viola Caipira', region: 'Brazil' }
      ]
      saStrings.forEach(sec => {
        for (let i = 0; i < sec.count; i++) {
          roster.push({
            id: id++,
            section: 'SA Strings',
            subsection: sec.sub,
            seat: i + 1,
            role: i === 0 ? `Principal ${sec.sub}` : `Second ${sec.sub}`,
            instrument: sec.instrument,
            region: sec.region
          })
        }
      })

      // Andean winds
      const andeanWindInstruments = [
        { name: 'Quena', count: 2 },
        { name: 'Siku', count: 2 },
        { name: 'Tarka', count: 1 },
        { name: 'Ocarina', count: 1 },
        { name: 'Transverse Cane Flute', count: 1 },
        { name: 'Antara', count: 1 }
      ]
      andeanWindInstruments.forEach(aw => {
        for (let i = 0; i < aw.count; i++) {
          roster.push({
            id: id++,
            section: 'Andean Winds',
            subsection: aw.name,
            seat: i + 1,
            role: i === 0 ? `Principal ${aw.name}` : `Second ${aw.name}`,
            instrument: aw.name,
            region: 'Andean'
          })
        }
      })

      // Classical woodwinds
      const wwInstruments = ['Flute', 'Oboe', 'Clarinet', 'Bassoon']
      wwInstruments.forEach(inst => {
        roster.push({
          id: id++,
          section: 'Woodwinds',
          subsection: inst,
          seat: 1,
          role: `Principal ${inst}`,
          instrument: inst
        })
      })

      // Brass
      const brassInstruments = [
        { name: 'French Horn', count: 2 },
        { name: 'Trumpet', count: 2 },
        { name: 'Trombone', count: 1 },
        { name: 'Tuba', count: 1 }
      ]
      brassInstruments.forEach(b => {
        for (let i = 0; i < b.count; i++) {
          roster.push({
            id: id++,
            section: 'Brass',
            subsection: b.name,
            seat: i + 1,
            role: i === 0 ? `Principal ${b.name}` : `Second ${b.name}`,
            instrument: b.name
          })
        }
      })

      // Tango section
      const tangoInstruments = [
        { name: 'Bandoneón', count: 2 },
        { name: 'Tango Piano', count: 1 },
        { name: 'Tango Violin', count: 1 },
        { name: 'Tango Contrabass', count: 1 }
      ]
      tangoInstruments.forEach(t => {
        for (let i = 0; i < t.count; i++) {
          roster.push({
            id: id++,
            section: 'Tango Section',
            subsection: t.name,
            seat: i + 1,
            role: i === 0 ? `Principal ${t.name}` : `Second ${t.name}`,
            instrument: t.name,
            region: 'Argentina/Uruguay'
          })
        }
      })

      // Afro-Brazilian percussion (7 players)
      const afroBrNames = [
        'Surdo Principal', 'Repique de Mão', 'Pandeiro Principal',
        'Zabumba', 'Atabaques', 'Cuíca', 'Agogô & Idiophones'
      ]
      const afroBrInstruments = [
        'Surdo', 'Repique', 'Pandeiro', 'Zabumba', 'Atabaque (set)', 'Cuíca', 'Agogô'
      ]
      for (let i = 0; i < 7; i++) {
        roster.push({
          id: id++,
          section: 'Afro-Brazilian Percussion',
          subsection: afroBrNames[i],
          seat: i + 1,
          role: afroBrNames[i],
          instrument: afroBrInstruments[i],
          region: 'Brazil'
        })
      }

      // Andean percussion (3 players)
      const andeanPercNames = ['Wankara', 'Cajón Peruano', 'Chajchas & Idiophones']
      const andeanPercInstruments = ['Wankara / Tinya', 'Cajón Peruano', 'Chajchas / Pututu']
      for (let i = 0; i < 3; i++) {
        roster.push({
          id: id++,
          section: 'Andean Percussion',
          subsection: andeanPercNames[i],
          seat: i + 1,
          role: andeanPercNames[i],
          instrument: andeanPercInstruments[i],
          region: 'Andean'
        })
      }

      // Keyboards & Harp
      roster.push({
        id: id++,
        section: 'Keyboards',
        subsection: 'Arpa Llanera',
        seat: 1,
        role: 'Principal Arpa Llanera',
        instrument: 'Arpa Llanera',
        region: 'Venezuela'
      })
      roster.push({
        id: id++,
        section: 'Keyboards',
        subsection: 'Piano',
        seat: 1,
        role: 'Piano (classical + tango)',
        instrument: 'Grand Piano'
      })
      roster.push({
        id: id++,
        section: 'Keyboards',
        subsection: 'Accordion',
        seat: 1,
        role: 'Principal Accordion / Gaita',
        instrument: 'Diatonic Accordion',
        region: 'Colombia'
      })

      return roster
    }
  },

  // -----------------------------------------------------------------------
  // SEATING CHART
  // -----------------------------------------------------------------------
  seatingChart: {
    generateCoordinates () {
      const positions = []

      // Classical strings — front-centre arc
      const stringConfig = [
        { section: 'First Violin', count: 10, startX: -7, y: 1.5, colStep: 1.3 },
        { section: 'Second Violin', count: 8, startX: -3, y: 2.5, colStep: 1.3 },
        { section: 'Viola', count: 6, startX: 0, y: 3, colStep: 1.3 },
        { section: 'Cello', count: 6, startX: 4, y: 1.5, colStep: 1.4 },
        { section: 'Double Bass', count: 4, startX: 7, y: 5, colStep: 1.4 }
      ]
      stringConfig.forEach(cfg => {
        for (let i = 0; i < cfg.count; i++) {
          const row = Math.floor(i / 4)
          const col = i % 4
          positions.push({
            section: cfg.section,
            seat: i + 1,
            x: cfg.startX + col * cfg.colStep,
            y: cfg.y + row * 1.5,
            angle: 15
          })
        }
      })

      // SA strings — left flank
      const saStringConfig = [
        { section: 'Charango', count: 2, x: -10, y: 2 },
        { section: 'Guitarrón Chileno', count: 1, x: -10, y: 3.5 },
        { section: 'Cuatro', count: 1, x: 9.5, y: 2 },
        { section: 'Viola Caipira', count: 1, x: 9.5, y: 3.5 }
      ]
      saStringConfig.forEach(cfg => {
        for (let i = 0; i < cfg.count; i++) {
          positions.push({
            section: cfg.section,
            seat: i + 1,
            x: cfg.x,
            y: cfg.y + i * 1.5,
            angle: 20,
            flank: 'SA'
          })
        }
      })

      // Andean winds — left flank, tier 2
      const andeanWindConfig = ['Quena', 'Siku', 'Tarka', 'Ocarina', 'Transverse Cane Flute', 'Antara']
      andeanWindConfig.forEach((section, i) => {
        positions.push({
          section,
          seat: 1,
          x: -10,
          y: 5 + i * 1.5,
          angle: 10,
          flank: 'Andean',
          elevated: i > 3
        })
        if (section === 'Quena' || section === 'Siku') {
          positions.push({
            section,
            seat: 2,
            x: -8.5,
            y: 5 + i * 1.5,
            angle: 10,
            flank: 'Andean'
          })
        }
      })

      // Classical woodwinds — centre, tier 2
      const wwConfig = [
        { section: 'Flute', x: -2, y: 5.5 },
        { section: 'Oboe', x: -0.7, y: 5.5 },
        { section: 'Clarinet', x: 0.7, y: 5.5 },
        { section: 'Bassoon', x: 2, y: 5.5 }
      ]
      wwConfig.forEach(cfg => {
        positions.push({ section: cfg.section, seat: 1, x: cfg.x, y: cfg.y, angle: 0, elevated: true })
      })

      // Brass — back-centre, tier 3
      const brassConfig = [
        { section: 'Horn', seats: 2, startX: -4, y: 8 },
        { section: 'Trumpet', seats: 2, startX: -1, y: 8 },
        { section: 'Trombone', seats: 1, startX: 2, y: 8 },
        { section: 'Tuba', seats: 1, startX: 3.5, y: 8 }
      ]
      brassConfig.forEach(cfg => {
        for (let i = 0; i < cfg.seats; i++) {
          positions.push({
            section: cfg.section,
            seat: i + 1,
            x: cfg.startX + i * 1.5,
            y: cfg.y,
            angle: 0,
            elevated: true
          })
        }
      })

      // Tango section — right flank, tier 1-2
      const tangoConfig = [
        { section: 'Bandoneón', seats: 2, startX: 9.5, y: 5 },
        { section: 'Tango Piano', seats: 1, startX: 9.5, y: 7.5 },
        { section: 'Tango Violin', seats: 1, startX: 9.5, y: 9 },
        { section: 'Tango Contrabass', seats: 1, startX: 9.5, y: 10.5 }
      ]
      tangoConfig.forEach(cfg => {
        for (let i = 0; i < cfg.seats; i++) {
          positions.push({
            section: cfg.section,
            seat: i + 1,
            x: cfg.startX,
            y: cfg.y + i * 1.5,
            angle: -20,
            flank: 'Tango'
          })
        }
      })

      // Afro-Brazilian percussion — back-right, tier 3-4
      for (let i = 0; i < 7; i++) {
        positions.push({
          section: 'Afro-Brazilian Percussion',
          seat: i + 1,
          x: 3 + (i % 4) * 1.8,
          y: 11 + Math.floor(i / 4) * 1.5,
          angle: 0,
          elevated: true
        })
      }

      // Andean percussion — left flank, tier 3
      for (let i = 0; i < 3; i++) {
        positions.push({
          section: 'Andean Percussion',
          seat: i + 1,
          x: -10,
          y: 11 + i * 1.5,
          angle: 10,
          elevated: true
        })
      }

      // Arpa Llanera — stage-left, near Andean section
      positions.push({ section: 'Arpa Llanera', seat: 1, x: -9, y: 3.5, angle: 45 })
      // Piano — stage-right, near tango
      positions.push({ section: 'Piano', seat: 1, x: 9, y: 6, angle: -45, optional: false })
      // Accordion — stage-right flank
      positions.push({ section: 'Accordion', seat: 1, x: 9, y: 4.5, angle: -15 })

      return positions
    }
  }
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Get the full SA orchestra configuration
 * @returns {Object}
 */
function getSAOrchestra () {
  return SA_ORCHESTRA
}

/**
 * Get section by name
 * @param {string} section
 * @returns {Object|null}
 */
function getSASection (section) {
  return SA_ORCHESTRA[section] || null
}

/**
 * Musician count by section
 * @returns {Object}
 */
function getSAMusicianCount () {
  return {
    strings: SA_ORCHESTRA.strings.totalMusicians,
    andeanWinds: SA_ORCHESTRA.andeanWinds.totalMusicians,
    woodwinds: SA_ORCHESTRA.woodwinds.totalMusicians,
    brass: SA_ORCHESTRA.brass.totalMusicians,
    tangoSection: SA_ORCHESTRA.tangoSection.totalMusicians,
    afroBrazilianPercussion: SA_ORCHESTRA.afroBrazilianPercussion.totalMusicians,
    andeanPercussion: SA_ORCHESTRA.andeanPercussion.totalMusicians,
    keyboards: SA_ORCHESTRA.keyboards.totalMusicians,
    total: SA_ORCHESTRA.totalMusicians
  }
}

/**
 * Generate full musician roster (72 musicians)
 * @returns {Array}
 */
function generateSARoster () {
  return SA_ORCHESTRA.roster.generateFullRoster()
}

/**
 * Generate seating chart coordinates
 * @returns {Array}
 */
function generateSASeatingChart () {
  return SA_ORCHESTRA.seatingChart.generateCoordinates()
}

/**
 * Get all SA-specific instruments (non-European)
 * @returns {Array}
 */
function getSAInstruments () {
  const saInstruments = []

  // SA strings
  Object.entries(SA_ORCHESTRA.strings).forEach(([key, val]) => {
    if (val && val.origin) {
      saInstruments.push({ name: key, origin: val.origin, description: val.description })
    }
  })

  // Andean winds
  Object.entries(SA_ORCHESTRA.andeanWinds).forEach(([key, val]) => {
    if (val && val.description && key !== 'totalMusicians' && key !== 'position' && key !== 'origin') {
      saInstruments.push({ name: key, origin: val.origin || 'Andean', description: val.description })
    }
  })

  // Tango
  Object.entries(SA_ORCHESTRA.tangoSection).forEach(([key, val]) => {
    if (val && val.description && key !== 'totalMusicians' && key !== 'position' && key !== 'origin' && key !== 'style') {
      saInstruments.push({ name: key, origin: 'Argentina/Uruguay (tango)', description: val.description })
    }
  })

  return saInstruments
}

/**
 * Get principal players from SA sections
 * @returns {Array}
 */
function getSAPrincipals () {
  return [
    { section: 'Strings', role: 'Concertmaster', instrument: 'Violin' },
    { section: 'SA Strings', role: 'Principal Charango', instrument: 'Charango', region: 'Andean' },
    { section: 'Andean Winds', role: 'Principal Quena', instrument: 'Quena', region: 'Andean' },
    { section: 'Andean Winds', role: 'Principal Siku (Ira)', instrument: 'Siku', region: 'Andean' },
    { section: 'Woodwinds', role: 'Principal Flute', instrument: 'Concert Flute' },
    { section: 'Woodwinds', role: 'Principal Oboe', instrument: 'Oboe' },
    { section: 'Brass', role: 'Principal Horn', instrument: 'French Horn' },
    { section: 'Brass', role: 'Principal Trumpet', instrument: 'Trumpet' },
    { section: 'Tango Section', role: 'Principal Bandoneón', instrument: 'Bandoneón', region: 'Argentina' },
    { section: 'Tango Section', role: 'Tango Piano', instrument: 'Piano', region: 'Argentina' },
    { section: 'Afro-Brazilian Percussion', role: 'Surdo Principal', instrument: 'Surdo', region: 'Brazil' },
    { section: 'Afro-Brazilian Percussion', role: 'Pandeiro Principal', instrument: 'Pandeiro', region: 'Brazil' },
    { section: 'Andean Percussion', role: 'Cajón Peruano Principal', instrument: 'Cajón Peruano', region: 'Peru' },
    { section: 'Keyboards', role: 'Principal Arpa Llanera', instrument: 'Arpa Llanera', region: 'Venezuela' }
  ]
}

/**
 * Get repertoire recommendations
 * @param {string} [style] - 'classical_SA' | 'folk_fusion' | 'andean_classical'
 * @returns {Object}
 */
function getRepertoire (style) {
  if (style) return SA_ORCHESTRA.repertoire[style] || null
  return SA_ORCHESTRA.repertoire
}

module.exports = {
  SA_ORCHESTRA,
  getSAOrchestra,
  getSASection,
  getSAMusicianCount,
  generateSARoster,
  generateSASeatingChart,
  getSAInstruments,
  getSAPrincipals,
  getRepertoire
}
