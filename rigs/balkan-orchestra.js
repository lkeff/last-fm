/**
 * Balkan Orchestra Configuration
 *
 * A 68-musician chamber-to-full orchestra rooted in the folk and classical
 * traditions of the Balkan Peninsula. Fuses the symphonic string backbone
 * with the distinctive modal, asymmetric-rhythm, and micro-tonal character
 * of Bulgarian, Serbian, Greek, Romanian, Albanian, Macedonian, and
 * Turkish-influenced musical traditions.
 *
 * Regional coverage:
 *   Bulgaria  — Gaida, Gadulka, Kaval, Tambura, Tapan, Kaba-style vocals
 *   Serbia    — Gusle, Frula, Tamburica, Trumpet (Dragačevo), Dvojnice
 *   Greece    — Lyra (Cretan & Pontic), Baglamas, Bouzouki, Ney, Tzouras
 *   Romania   — Cobza, Nai (pan flute), Cimbal (hammer dulcimer), Taraf strings
 *   Albania   — Lahuta (one-string fiddle), Iso-polyphonic vocal choir
 *   N. Macedonia — Zurla + Tapan, Kaval, Tambura
 *   Bosnia/Hercegovina — Saz, Šargija, Ganga vocal group
 *   Turkey-adj — Kanun (qanun), Ney, Saz/Baglama (adjacent influence)
 *
 * Rhythmic character:
 *   Asymmetric meters dominate — 5/8, 7/8, 9/8, 11/8 (Kopanitsa), 13/16 (Rachenitsa)
 *   Additive rhythm (3+2+2, 2+2+3, 2+3+2+2, etc.)
 *
 * @module rigs/balkan-orchestra
 */

'use strict'

const BALKAN_ORCHESTRA = {
  name: 'Balkan Orchestra',
  version: '1.0.0',
  type: 'balkan-orchestra',
  totalMusicians: 81,
  origin: 'Balkan Peninsula (Bulgaria, Serbia, Greece, Romania, Albania, N. Macedonia, Bosnia)',

  // ─── Stage layout ──────────────────────────────────────────────────────
  layout: {
    arrangement: 'Hybrid — symphonic core (centre/rear) + folk sections (flanks + front)',
    conductorPosition: { x: 0, y: 0, facing: 'orchestra' },
    stageDepth: 14,
    stageWidth: 22,
    tiers: 4,
    acousticShell: true,
    regionalZones: {
      bulgarianSection: 'Stage-left flank, tier 1–2',
      serbianSection: 'Stage-right flank, tier 1',
      greekSection: 'Front-centre-right',
      romanianSection: 'Stage-right, tier 2',
      albanianChoir: 'Rear-left, tier 3–4',
      orchestralCore: 'Centre, all tiers'
    },
    tuningNote: 'A = 442 Hz for strings; folk instruments tuned to match by ear in rehearsal'
  },

  // ─── Orchestral string core — 24 musicians ────────────────────────────
  strings: {
    totalMusicians: 24,
    note: 'Reduced from full symphony to balance folk section prominence',

    firstViolins: {
      count: 7,
      position: 'Front-left arc, tier 1',
      principal: { title: 'Concertmaster', seat: 1 },
      instruments: Array(7).fill(null).map((_, i) => ({
        seat: i + 1, instrument: 'Violin', stand: Math.floor(i / 2) + 1
      }))
    },
    secondViolins: {
      count: 5,
      position: 'Front-right arc, tier 1',
      principal: { title: 'Principal Second Violin', seat: 1 },
      instruments: Array(5).fill(null).map((_, i) => ({
        seat: i + 1, instrument: 'Violin', stand: Math.floor(i / 2) + 1
      }))
    },
    violas: {
      count: 4, position: 'Centre, tier 1–2',
      principal: { title: 'Principal Viola', seat: 1 },
      instruments: Array(4).fill(null).map((_, i) => ({ seat: i + 1, instrument: 'Viola' }))
    },
    cellos: {
      count: 4, position: 'Front-right, tier 1',
      principal: { title: 'Principal Cello', seat: 1 },
      instruments: Array(4).fill(null).map((_, i) => ({ seat: i + 1, instrument: 'Cello' }))
    },
    doubleBasses: {
      count: 4, position: 'Rear-left, tier 2',
      principal: { title: 'Principal Double Bass', seat: 1 },
      instruments: Array(4).fill(null).map((_, i) => ({ seat: i + 1, instrument: 'Double Bass' }))
    }
  },

  // ─── Bulgarian folk section — 10 musicians ────────────────────────────
  bulgarianSection: {
    totalMusicians: 10,
    position: 'Stage-left flank, tier 1–2',
    origin: 'Bulgaria (Rhodope, Thrace, Shop, Dobrudzha regions)',

    gaida: {
      count: 2,
      description: 'Bulgarian bagpipe — single-reed chanter + bass drone; kaba gaida (low G, Rhodope) and djura gaida (high A, Thrace)',
      players: [
        { seat: 1, role: 'Kaba Gaida', region: 'Rhodope', tuning: 'G (low)' },
        { seat: 2, role: 'Djura Gaida', region: 'Thrace', tuning: 'A (high)' }
      ]
    },

    gadulka: {
      count: 2,
      description: 'Bulgarian bowed fiddle with 3 melody strings and 8–10 sympathetic resonance strings. Held vertically on the knee.',
      strings: { melody: 3, sympathetic: '8–10 (vary by maker)' },
      tuning: 'A E A (standard); varies by region',
      bow: 'Short convex bow; underhanded or overhanded grip depending on region',
      players: [
        { seat: 1, role: 'Principal Gadulka', region: 'Rhodope' },
        { seat: 2, role: 'Gadulka (Thracian style)', region: 'Thrace', ornaments: ['Trill', 'Mordent', 'Microtonal bends'] }
      ]
    },

    kaval: {
      count: 2,
      description: 'End-blown open flute of Bulgaria and the wider Balkans. Deeply evocative sound; capable of extensive microtonality via embouchure.',
      material: 'Plum wood, cherry, or boxwood',
      holes: { melody: 8, thumb: 1, decorative: 3 },
      range: 'Three octaves via overblowing',
      keys: 'D (most common); also C, E',
      ornaments: ['Mordent', 'Trill', 'Glissando', 'Throat-noise effects'],
      players: [
        { seat: 1, role: 'Principal Kaval', speciality: 'Melodic solos, Rhodope laments' },
        { seat: 2, role: 'Second Kaval', doublings: ['Ney (for Ottoman-inflected repertoire)'] }
      ]
    },

    tambura: {
      count: 2,
      description: 'Long-necked lute of the Bulgarian folk tradition. Four doubled strings; plucked with plectrum.',
      strings: 4,
      tuning: 'G D A E (most common)',
      body: 'Pear-shaped wooden resonator with flat top',
      role: 'Harmonic accompaniment + rhythmic strumming',
      players: [
        { seat: 1, role: 'Tambura (rhythm)', speciality: 'Off-beat strumming in asymmetric meters' },
        { seat: 2, role: 'Tambura (melody)', speciality: 'Solo melodic runs in ornamental style' }
      ]
    },

    tapan: {
      count: 2,
      description: 'Large double-headed cylindrical drum; one bass head (struck with heavy mallet) + one treble head (struck with thin stick). Core of Bulgarian/Macedonian dance music.',
      diameter: '60–80 cm',
      mallets: { heavy: 'Curved wooden mallet for bass head', light: 'Thin flexible stick for treble head' },
      role: 'Primary rhythmic foundation for outdoor/festival contexts; reinforced by orchestral percussion',
      players: [
        { seat: 1, role: 'Principal Tapan' },
        { seat: 2, role: 'Second Tapan', doublings: ['Davul (Turkish variant for Ottoman repertoire)'] }
      ]
    }
  },

  // ─── Serbian folk section — 8 musicians ──────────────────────────────
  serbianSection: {
    totalMusicians: 8,
    position: 'Stage-right flank, tier 1',
    origin: 'Serbia (Šumadija, Vojvodina, Raška, Dragačevo regions)',

    gusle: {
      count: 1,
      description: 'One-string bowed fiddle of Serbian, Croatian, Montenegrin, and Bosnian epic tradition. Inseparable from South Slavic heroic poetry.',
      strings: 1,
      stringMaterial: 'Horsehair (single string)',
      bow: 'Arched bow with horsehair; inseparable from instrument (strings touch and bow together)',
      tuning: 'Variable — tuned to match singer\'s voice',
      role: 'Accompaniment to sung epic poetry (epic gusle songs)',
      repertoire: ['Marko Kraljević cycle', 'Kosovo cycle', 'Hajduk songs'],
      players: [{ seat: 1, role: 'Guslar (epic singer/player)', doubling: 'None — gusle + voice is an inseparable unit' }]
    },

    frula: {
      count: 2,
      description: 'Short end-blown duct flute (Serbian folk flute). Quiet, intimate; used for personal expression and dance accompaniment.',
      length: '25–30 cm (standard frula); longer variants for lower pitch',
      holes: 6,
      material: 'Plum, cherry, or maple wood',
      keys: 'D or G most common',
      players: [
        { seat: 1, role: 'Principal Frula', speciality: 'Kolo dance accompaniment' },
        { seat: 2, role: 'Dvojnice player', instrument: 'Dvojnice — twin-bore double flute; produces two-voice parallel melody', holes: '3+3 (one bore each)' }
      ]
    },

    tamburicaOrkestar: {
      count: 3,
      description: 'Tamburica orchestra section — the dominant folk ensemble of Vojvodina and Pannonian Serbia. Multiple sizes of long-necked plucked lutes form a full harmonic ensemble.',
      instruments: [
        { name: 'Bisernica', role: 'Melody (treble)', strings: 4, tuning: 'G D A E (soprano range)' },
        { name: 'Prim', role: 'Melody / counter-melody', strings: 4, tuning: 'G D A E (one octave below bisernica)' },
        { name: 'Bugarija', role: 'Rhythm + harmony (mid)', strings: 4, tuning: 'A E A E (chordal role)' }
      ],
      players: [
        { seat: 1, role: 'Bisernica (lead melody)' },
        { seat: 2, role: 'Prim' },
        { seat: 3, role: 'Bugarija (rhythm/harmony)' }
      ]
    },

    trumpetDragacevo: {
      count: 2,
      description: 'The Dragačevo trumpet (sopele / truba) — the iconic sound of the Guča trumpet festival. Bright, penetrating, ornamented with rapid vibrato and microtonal inflections.',
      instrument: 'B♭ or E♭ soprano trumpet (folk style; no valves in earliest form; modern players use standard valve trumpet)',
      pitch: 'B♭ (most common for Dragačevo style)',
      ornaments: ['Rapid vibrato', 'Mordent runs', 'Glissando', 'Microtonal wail'],
      players: [
        { seat: 1, role: 'Principal Trumpet (Dragačevo)', speciality: 'Čoček and oro dance styles' },
        { seat: 2, role: 'Second Trumpet', doublings: ['Zurna (shawm) for Romani-influenced passages'] }
      ]
    }
  },

  // ─── Greek folk section — 7 musicians ────────────────────────────────
  greekSection: {
    totalMusicians: 7,
    position: 'Front-centre-right',
    origin: 'Greece — Crete, Pontic region, mainland Greece, islands',

    cretanLyra: {
      count: 2,
      description: 'The Cretan lyra is the dominant folk instrument of Crete — a bowed fiddle with three strings held vertically on the knee. Extensive ornamentation.',
      strings: 3,
      tuning: 'A D G (from highest to lowest; Cretan standard)',
      bow: 'Short bow; small bells often attached for rhythmic effect',
      ornaments: ['Trill', 'Vibrato', 'Glissando', 'Scale runs in compound meter'],
      styles: ['Pentozali (5/8)', 'Sousta (2/4)', 'Siganos (slow)', 'Haniotiko (dance)'],
      players: [
        { seat: 1, role: 'Principal Cretan Lyra', speciality: 'Pentozali and Sousta' },
        { seat: 2, role: 'Second Lyra', doublings: ['Pontic Lyra (3-string bowed fiddle from Black Sea tradition)'] }
      ]
    },

    bouzouki: {
      count: 2,
      description: 'The bouzouki is the defining sound of Greek urban music (rembetika and laïká). Long-necked plucked lute; three or four doubled string courses.',
      stringCourses: '3 (traditional trichordo) or 4 (modern tetrachordo)',
      tuning: {
        trichordo: 'D A D (traditional rembetika tuning)',
        tetrachordo: 'C F A D (modern, more guitar-like)'
      },
      body: 'Bowl-shaped back (similar to mandolin family)',
      ornaments: ['Taksimi (modal improvisation)', 'Vibrato', 'Hammer-on runs'],
      players: [
        { seat: 1, role: 'Principal Bouzouki', speciality: 'Rembetika and taksimi improvisation' },
        { seat: 2, role: 'Tzouras (smaller 3-course variant)', note: 'Quieter, higher — suits ensemble texture' }
      ]
    },

    ney: {
      count: 1,
      description: 'End-blown reed flute of the Ottoman / Middle Eastern tradition; widely used in Greek Sufi and classical music. Breathy, ethereal, deeply expressive tone.',
      material: 'Phragmites australis (giant reed)',
      holes: { finger: 6, thumb: 1 },
      keys: 'Multiple (Rast, Uşşak, Hicaz, Saba — Ottoman makam system)',
      technique: 'Embouchure against edge of open top; angle and lip pressure control pitch and timbre',
      players: [{ seat: 1, role: 'Ney Player', doublings: ['Kaval (Bulgarian folk ney substitute for cross-cultural passages)'] }]
    },

    baglamas: {
      count: 1,
      description: 'Miniature long-necked lute — the "prison bouzouki" — used in rembetika tradition. Small, bright, metallic tone.',
      stringCourses: 3,
      length: '~40 cm',
      tuning: 'One octave above trichordo bouzouki (D A D)',
      players: [{ seat: 1, role: 'Baglamas / Rhythm Bouzouki', doublings: ['Santuri (hammered dulcimer) for urban rembetika ensemble pieces'] }]
    },

    outi: {
      count: 1,
      description: 'The Greek/Ottoman oud (outi). Unfretted short-neck lute; rich, warm, mellow tone. Used in classical Ottoman and Greek makam music.',
      stringCourses: 6,
      tuning: 'F# B E A D G (Turkish/Greek standard)',
      frets: 'None (unfretted — allows full microtonality)',
      players: [{ seat: 1, role: 'Outi / Oud Principal', speciality: 'Makam improvisation and accompaniment' }]
    }
  },

  // ─── Romanian folk section — 7 musicians ─────────────────────────────
  romanianSection: {
    totalMusicians: 7,
    position: 'Stage-right, tier 2',
    origin: 'Romania — Transylvania, Wallachia, Moldavia, Dobrogea',

    tarafStrings: {
      count: 3,
      description: 'The taraf is the traditional Romanian folk ensemble led by lăutar (professional Romani musician) fiddlers. Deeply ornamented violin playing with characteristic doina (free-rhythm lament) style.',
      instruments: [
        { name: 'Vioara (violin)', count: 2, role: 'Lead melody with ornamental improvisation', tuning: 'Standard A D G E; often tuned slightly sharp' },
        { name: 'Cobza', count: 1, role: 'Plucked lute — chordal rhythm accompaniment', strings: 8, tuning: 'Paired string courses; G D A E' }
      ],
      players: [
        { seat: 1, role: 'Principal Lăutar (lead violin)', speciality: 'Doina improvisation' },
        { seat: 2, role: 'Second Violin (taraf)', speciality: 'Harmonic doubling' },
        { seat: 3, role: 'Cobzar', instrument: 'Cobza' }
      ]
    },

    naiPanFlute: {
      count: 1,
      description: 'Nai — the Romanian pan flute. One of the great solo instruments of Romanian classical-folk crossover. Gheorghe Zamfir made it internationally famous.',
      pipes: 20,
      range: 'G3 to D7 (modern extended range instruments)',
      material: 'Phragmites australis or bamboo',
      technique: 'Lower lip angle to change pitch ± quarter-tone; vibrato from diaphragm',
      players: [{ seat: 1, role: 'Principal Nai', speciality: 'Doina and classical Romanian repertoire' }]
    },

    cimbal: {
      count: 1,
      description: 'Țambal (cimbal) — the Romanian hammer dulcimer, related to the Hungarian cimbalom and Persian santur. Prominent in Romani ensemble and orchestral Romanian music.',
      strings: 125,
      range: '4 octaves (C2 to C6)',
      mallets: 'Felt-covered hammers (or padded spoons in folk tradition)',
      damping: 'Felt strip damper bar controlled by knee',
      players: [{ seat: 1, role: 'Cimbalist', speciality: 'Hora, Sîrba, and Doina accompaniment' }]
    },

    taragot: {
      count: 1,
      description: 'Taragot — a single-reed woodwind instrument unique to Romania. Resembles a soprano saxophone in fingering but with a wooden body; penetrating, slightly nasal tone.',
      keys: 'Bb (most common), A',
      material: 'Ebony or rosewood body; metal bell',
      fingering: 'Boehm system (clarinet-like)',
      players: [{ seat: 1, role: 'Taragotist', doublings: ['Soprano Saxophone for certain arrangements'], speciality: 'Dobrudzha and Transylvanian dance music' }]
    },

    accordion: {
      count: 1,
      description: 'Diatonic button accordion (acordeon / armonică) — central to Romanian folk dance music of all regions.',
      type: 'Diatonic button accordion (bisonoric)',
      buttons: { right: 21, left: 8 },
      keys: 'G/C (most common in Romanian folk)',
      players: [{ seat: 1, role: 'Accordionist', speciality: 'Hora, Sîrba, Polka' }]
    }
  },

  // ─── Albanian iso-polyphonic choir — 6 singers ───────────────────────
  albanianChoir: {
    totalMusicians: 6,
    position: 'Rear-left, tier 3–4',
    origin: 'Southern Albania — Labëria region (UNESCO Intangible Cultural Heritage)',

    isopolyphony: {
      description: 'Albanian iso-polyphony (këngë iso-polifonike) is a UNESCO-listed tradition of multi-part singing with a sustained drone (iso) underneath interlocking melodic voices.',
      voices: {
        marrës: { count: 1, role: 'Lead voice — begins phrase and improvises melody' },
        kthyes: { count: 1, role: 'Response voice — echoes and answers the marrës' },
        hedhës: { count: 2, role: 'Countermelody — interweaves between marrës and kthyes' },
        iso: { count: 2, role: 'Sustained drone on tonic — held for entire piece; may alternate between singers for breath' }
      },
      microtonality: 'Characteristic use of neutral thirds and seconds; notation in standard western staff is approximate',
      repertoire: ['Këngë trimash (heroic songs)', 'Ballads (balada)', 'Wedding songs', 'Seasonal ritual songs'],
      regions: ['Labëria (south Albania)', 'Çamëria', 'Northern Epirus (Greece)']
    },

    players: [
      { seat: 1, role: 'Marrës (lead)', voice: 'Tenor' },
      { seat: 2, role: 'Kthyes (response)', voice: 'Baritone' },
      { seat: 3, role: 'Hedhës I', voice: 'Tenor' },
      { seat: 4, role: 'Hedhës II', voice: 'Bass' },
      { seat: 5, role: 'Iso (drone) I', voice: 'Bass' },
      { seat: 6, role: 'Iso (drone) II', voice: 'Bass' }
    ]
  },

  // ─── Bosian / Macedonian color section — 4 musicians ─────────────────
  bosnianMacedonianSection: {
    totalMusicians: 4,
    position: 'Stage-right, tier 1 (beside Serbian section)',
    origin: 'Bosnia-Hercegovina, North Macedonia',

    sazSargija: {
      count: 1,
      description: 'Saz/Šargija — long-neck lute of Bosnian and Macedonian folk music. Smaller than the Turkish saz; three double-string courses.',
      stringCourses: 3,
      frets: 'Moveable gut frets; allows microtonal intonation adjustment',
      tuning: 'A E B (standard Bosnian šargija)',
      role: 'Melodic accompaniment to sevdah (Bosnian blues) and epic song',
      players: [{ seat: 1, role: 'Šargija / Saz Player', speciality: 'Sevdah and starogradska muzika' }]
    },

    zurlaAndTapan: {
      count: 2,
      description: 'Zurla (zurna) — high-pitched conical shawm paired with Tapan drum in Macedonian and Roma traditions. Used for outdoor ceremony and dance.',
      zurla: {
        type: 'Conical double-reed shawm',
        material: 'Plum wood',
        range: '~2 octaves',
        pitch: 'Varies; highest pitches 500+ Hz',
        overblowing: 'Continuous circular breathing for sustained melody'
      },
      tapan: { diameter: '60–70 cm', note: 'Zurlaci always accompanied by tapan' },
      players: [
        { seat: 1, role: 'Zurlacı (zurla player)', speciality: 'Macedonian oro dances, wedding music' },
        { seat: 2, role: 'Tapan player', doublings: ['Davul'] }
      ]
    },

    gangaVoice: {
      count: 1,
      description: 'Ganga is a two-voice Bosnian/Herzegovinian and Dalmatian unison-then-clash vocal tradition — one singer holds a drone while the other creates tense dissonance against it.',
      voices: { leader: 'Sings melody with intentional flat/sharp dissonances', drone: 'Holds sustained tonic (drone voice = "dronač")' },
      texture: 'Raw, nasal, high-tension timbre; the dissonance is the aesthetic goal',
      players: [{ seat: 1, role: 'Ganga Singer / Vocal colorist', doublings: ['Can double as additional iso voice for Albanian section'] }]
    }
  },

  // ─── Orchestral winds & brass — 8 musicians ───────────────────────────
  orchestralWindsBrass: {
    totalMusicians: 8,
    position: 'Centre-rear, tier 2–3',
    note: 'Standard symphonic wind instruments used to provide harmonic depth and bridge folk modal music to orchestral writing',

    woodwinds: {
      flute: { count: 1, note: 'Often doubles piccolo for high ornamental lines' },
      oboe: { count: 1, note: 'English horn double available for darker modal passages' },
      clarinet: { count: 2, note: 'Bb and A clarinets; occasionally microtonal bends attempted for Balkan inflection' },
      bassoon: { count: 1 }
    },
    brass: {
      horn: { count: 2, note: 'Harmonic support; not featured melodically in folk-focused passages' },
      trumpet: { count: 1, note: 'Can cross into Dragačevo-style ornamentation for folk passages' }
    }
  },

  // ─── Percussion — 4 musicians ─────────────────────────────────────────
  percussion: {
    totalMusicians: 4,
    position: 'Rear-centre/right, tier 3',

    orchestral: {
      timpani: { count: 1, role: 'Rhythmic anchor; adapts to asymmetric meters' },
      snare: { count: 1 },
      bassDrum: { count: 1 },
      tamTam: { count: 1 }
    },

    folkPercussion: {
      tapan: { count: 1, note: 'Dedicated orchestral tapan player (separate from Bulgarian section tapan)' },
      darbuka: {
        count: 1,
        description: 'Goblet drum of Middle Eastern / Ottoman origin; used in Greek and Bulgarian urban music',
        material: 'Clay or metal',
        technique: 'Dum (bass), Tek/Ka (treble) strokes with fingertips'
      },
      daireFrame: {
        count: 1,
        description: 'Daire/Def — large frame drum with jingles; Romani and Ottoman influence across all Balkan regions'
      }
    }
  },

  // ─── Keys & plucked strings — 3 musicians ────────────────────────────
  keysAndHarp: {
    totalMusicians: 3,

    accordion: {
      count: 1,
      type: 'Piano accordion (120 bass)',
      role: 'Harmonic glue between folk and orchestral textures',
      players: [{ seat: 1, role: 'Principal Accordion', speciality: 'Adaptable — Serbian kolo, Greek laïká, Romanian hora' }]
    },

    kanun: {
      count: 1,
      description: 'Qanun/kanun — 78-string zither of Ottoman/Arab classical music. Provides chromatic and microtonal capabilities via small brass levers (mandal) per string course.',
      strings: 78,
      courses: 26,
      mandal: 'Small brass levers per course to raise pitch by quarter-tone increments',
      range: 'A1 to A5',
      players: [{ seat: 1, role: 'Kanunist', speciality: 'Ottoman makam and Greek rembetika crossover passages' }]
    },

    santouri: {
      count: 1,
      description: 'Greek hammered dulcimer (santouri) — related to cimbalom and Persian santur. The Greek version has a more percussive, metallic tone.',
      strings: 92,
      mallets: 'Felt-padded hammers',
      players: [{ seat: 1, role: 'Santouri Player', doublings: ['Cimbal if Romanian passages require it'] }]
    }
  },

  // ─── Asymmetric rhythm reference ──────────────────────────────────────
  rhythmReference: {
    note: 'Balkan music is defined by additive asymmetric time signatures. All musicians expected to internalise these.',
    commonMeters: [
      { meter: '5/8', additive: '2+3 or 3+2', name: 'Makedonsko oro (slow)', bpm: '80–100' },
      { meter: '7/8', additive: '3+2+2 or 2+2+3', name: 'Rachenitsa (Bulgaria)', bpm: '120–160' },
      { meter: '9/8', additive: '2+2+2+3', name: 'Daichovo horo', bpm: '120–140' },
      { meter: '11/8', additive: '2+2+3+2+2', name: 'Kopanitsa (Bulgaria)', bpm: '130–160' },
      { meter: '13/16', additive: '2+2+2+2+2+3', name: 'Krivo horo variant', bpm: '150–180' },
      { meter: '15/16', additive: '2+2+2+2+3+2+2', name: 'Buchimish', bpm: '160–200' }
    ],
    conductorNote: 'Conductor must be specialist — standard beat patterns do not map to asymmetric meters. Use subdivision conducting for complex meters.'
  },

  // ─── Tuning & intonation ──────────────────────────────────────────────
  tuningAndIntonation: {
    referenceA: 442,
    microtonality: {
      note: 'Many Balkan instruments (kaval, ney, gadulka, gusle) operate outside 12-TET; quarter-tones and neutral intervals are stylistic, not errors',
      approach: 'Orchestral strings tune to 442 Hz; folk instruments tune to each other by ear in rehearsal; kanun mandals set for session key before performance'
    },
    scaleTypes: {
      naturalMinor: 'Common for Serbian and much Romanian repertoire',
      dorian: 'Bulgarian and Macedonian — raised 6th vs. natural minor',
      phrygianDominant: 'Used in Greek and Turkish-influenced material (hijaz tetrachord)',
      doubleHarmonic: 'Minor with raised 4th and 7th — "gypsy scale"; used across Roma-influenced traditions'
    }
  },

  // ─── Recording chain ───────────────────────────────────────────────────
  recording: {
    mainArray: 'Decca Tree (Neumann M50 × 3) above conductor, 2 m high',
    outriggers: 'DPA 4006 (wide omni) × 2 at stage edges',
    closeMicsBySection: {
      strings: 'Schoeps CMC6 + MK4 per desk pair (spot mics for principal chairs)',
      gaida: 'Shure SM81 × 2 (chanter + drone separately)',
      gadulka: 'Neumann KM 184 (cardioid SDC, 15 cm from bridge)',
      kaval: 'Neumann KM 184, 20 cm above finger holes',
      tapan: { bass: 'Shure Beta 91A (boundary mic inside)', treble: 'SM57 at 15 cm' },
      gusle: 'DPA 4099 clip-on + room mic blend',
      bouzoukiOuti: 'Neumann U 67 (large-diaphragm, 30 cm, off-axis)',
      nai: 'Neumann KM 184 at 25 cm, aimed at lower pipes',
      cimbal: 'Stereo pair (Schoeps MK4) above soundboard',
      taragot: 'Shure SM81 at 20 cm from bell',
      albanianChoir: 'Stereo AB pair (Neumann U 87 × 2) at 1.5 m from choir arc; capture iso drone specifically'
    },
    preamps: 'API 3124+ × 4 (16 channels total)',
    adConversion: 'Apogee Symphony I/O Mk II — 32-bit / 96 kHz',
    stemLayout: ['Orchestral strings', 'Bulgarian section', 'Serbian section', 'Greek section', 'Romanian section', 'Albanian choir', 'Bosnian/Macedonian', 'Winds/Brass', 'Percussion', 'Keys/Plucked'],
    reverb: 'Bricasti M7 — medium hall (1.6 s RT60); folk solos may get shorter room (0.8 s) to preserve intimacy'
  },

  // ─── Repertoire map ────────────────────────────────────────────────────
  repertoire: {
    bulgarians: {
      horaDances: ['Pravo horo (2/4)', 'Rachenitsa (7/8)', 'Kopanitsa (11/8)', 'Daichovo horo (9/8)'],
      laments: ['Rhodope doinas', 'Kaval solos (improvised)'],
      composers: ['Filip Kutev (founder of Bulgarian State Ensemble)', 'Kosta Kolev']
    },
    serbian: {
      koloKolo: ['Užičko kolo (2/4)', 'Moravac', 'Šumadinka'],
      epicSong: ['Gusle epics from Kosovo cycle'],
      composers: ['Stevan Mokranjac', 'Petar Konjović']
    },
    greek: {
      rembetika: ['Zeibekiko (9/4 asymmetric)', 'Tsifteteli', 'Hasapiko'],
      cretan: ['Pentozali', 'Sousta', 'Siganos'],
      composers: ['Mikis Theodorakis', 'Manos Hadjidakis', 'Vassilis Tsitsanis']
    },
    romanian: {
      dances: ['Hora (6/8)', 'Sîrba (2/4)', 'Brîu (10/16)'],
      laments: ['Doina (free rhythm — most expressive genre)', 'Cântec lung (long song)'],
      composers: ['George Enescu', 'Ciprian Porumbescu']
    },
    albanian: {
      isopolyphonic: ['Këngë trimash', 'Isopolyphonic laments', 'Wedding songs'],
      composers: ['Çesk Zadeja', 'Feim Ibrahimi']
    },
    crossCultural: {
      ottomanMakam: 'Passages in Rast, Uşşak, Hicaz makam — uses kanun, ney, outi',
      romaTradition: 'Čoček, Cocek, Kyuchek — Romani dance forms present across all regions; cross-regional improvisation sessions'
    }
  }
}

// ─── Exported helper functions ─────────────────────────────────────────────

function getBalkanOrchestra () {
  return BALKAN_ORCHESTRA
}

function getBalkanSection (section) {
  return BALKAN_ORCHESTRA[section] || null
}

function getBalkanMusicianCount () {
  return {
    strings: BALKAN_ORCHESTRA.strings.totalMusicians,
    bulgarianSection: BALKAN_ORCHESTRA.bulgarianSection.totalMusicians,
    serbianSection: BALKAN_ORCHESTRA.serbianSection.totalMusicians,
    greekSection: BALKAN_ORCHESTRA.greekSection.totalMusicians,
    romanianSection: BALKAN_ORCHESTRA.romanianSection.totalMusicians,
    albanianChoir: BALKAN_ORCHESTRA.albanianChoir.totalMusicians,
    bosnianMacedonianSection: BALKAN_ORCHESTRA.bosnianMacedonianSection.totalMusicians,
    orchestralWindsBrass: BALKAN_ORCHESTRA.orchestralWindsBrass.totalMusicians,
    percussion: BALKAN_ORCHESTRA.percussion.totalMusicians,
    keysAndHarp: BALKAN_ORCHESTRA.keysAndHarp.totalMusicians,
    total: BALKAN_ORCHESTRA.totalMusicians
  }
}

function getBalkanPrincipals () {
  return [
    { section: 'Strings', role: 'Concertmaster', instrument: 'Violin' },
    { section: 'Bulgarian', role: 'Principal Kaba Gaida', instrument: 'Kaba Gaida' },
    { section: 'Bulgarian', role: 'Principal Gadulka', instrument: 'Gadulka' },
    { section: 'Bulgarian', role: 'Principal Kaval', instrument: 'Kaval' },
    { section: 'Serbian', role: 'Guslar', instrument: 'Gusle' },
    { section: 'Serbian', role: 'Principal Trumpet', instrument: 'Dragačevo Trumpet' },
    { section: 'Greek', role: 'Principal Cretan Lyra', instrument: 'Cretan Lyra' },
    { section: 'Greek', role: 'Principal Bouzouki', instrument: 'Bouzouki' },
    { section: 'Greek', role: 'Ney Player', instrument: 'Ney' },
    { section: 'Romanian', role: 'Principal Lăutar', instrument: 'Violin (taraf)' },
    { section: 'Romanian', role: 'Principal Nai', instrument: 'Nai Pan Flute' },
    { section: 'Albanian', role: 'Marrës', instrument: 'Voice (iso-polyphony)' },
    { section: 'Keys', role: 'Kanunist', instrument: 'Kanun / Qanun' }
  ]
}

function getBalkanInstruments () {
  return [
    { name: 'Gaida', region: 'Bulgaria', family: 'aerophone', type: 'bagpipe' },
    { name: 'Gadulka', region: 'Bulgaria', family: 'chordophone', type: 'bowed fiddle' },
    { name: 'Kaval', region: 'Bulgaria/Balkans', family: 'aerophone', type: 'flute' },
    { name: 'Tambura', region: 'Bulgaria', family: 'chordophone', type: 'plucked lute' },
    { name: 'Tapan', region: 'Bulgaria/Macedonia', family: 'membranophone', type: 'drum' },
    { name: 'Gusle', region: 'Serbia/Montenegro', family: 'chordophone', type: 'bowed fiddle' },
    { name: 'Frula', region: 'Serbia', family: 'aerophone', type: 'flute' },
    { name: 'Dvojnice', region: 'Serbia', family: 'aerophone', type: 'double flute' },
    { name: 'Tamburica (Bisernica)', region: 'Serbia/Vojvodina', family: 'chordophone', type: 'plucked lute' },
    { name: 'Dragačevo Trumpet', region: 'Serbia', family: 'aerophone', type: 'brass' },
    { name: 'Cretan Lyra', region: 'Greece (Crete)', family: 'chordophone', type: 'bowed fiddle' },
    { name: 'Pontic Lyra', region: 'Greece (Pontus)', family: 'chordophone', type: 'bowed fiddle' },
    { name: 'Bouzouki', region: 'Greece', family: 'chordophone', type: 'plucked lute' },
    { name: 'Baglamas', region: 'Greece', family: 'chordophone', type: 'plucked lute' },
    { name: 'Ney', region: 'Greece/Turkey/Balkans', family: 'aerophone', type: 'flute' },
    { name: 'Outi (Oud)', region: 'Greece/Ottoman', family: 'chordophone', type: 'plucked lute' },
    { name: 'Cobza', region: 'Romania', family: 'chordophone', type: 'plucked lute' },
    { name: 'Nai (pan flute)', region: 'Romania', family: 'aerophone', type: 'flute' },
    { name: 'Cimbal (Ţambal)', region: 'Romania', family: 'chordophone', type: 'hammered dulcimer' },
    { name: 'Taragot', region: 'Romania', family: 'aerophone', type: 'woodwind' },
    { name: 'Šargija', region: 'Bosnia', family: 'chordophone', type: 'plucked lute' },
    { name: 'Zurla', region: 'Macedonia', family: 'aerophone', type: 'shawm' },
    { name: 'Kanun (Qanun)', region: 'Greece/Ottoman', family: 'chordophone', type: 'plucked zither' },
    { name: 'Santouri', region: 'Greece', family: 'chordophone', type: 'hammered dulcimer' },
    { name: 'Darbuka', region: 'Balkans/Middle East', family: 'membranophone', type: 'drum' }
  ]
}

function getBalkanRhythmReference () {
  return BALKAN_ORCHESTRA.rhythmReference.commonMeters
}

function getBalkanRepertoire (region) {
  if (region) return BALKAN_ORCHESTRA.repertoire[region] || null
  return BALKAN_ORCHESTRA.repertoire
}

module.exports = {
  BALKAN_ORCHESTRA,
  getBalkanOrchestra,
  getBalkanSection,
  getBalkanMusicianCount,
  getBalkanPrincipals,
  getBalkanInstruments,
  getBalkanRhythmReference,
  getBalkanRepertoire
}
