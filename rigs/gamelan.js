/**
 * Gamelan Rig Configuration
 *
 * Comprehensive specification for the gamelan — the bronze percussion
 * orchestra of Indonesia. Covers both the dominant Javanese and Balinese
 * traditions, all instrument families, tuning systems (pelog & slendro),
 * colotomic structure, playing techniques, and recording chains.
 *
 * Traditions covered:
 *   Javanese — Gamelan Ageng (full court gamelan), Central Java
 *              Yogyakarta and Surakarta (Solo) court styles
 *   Balinese — Gamelan Gong Kebyar (most widespread modern form)
 *              Gamelan Angklung (smaller, pentatonic)
 *              Gamelan Gambuh (oldest surviving Balinese form)
 *
 * Instrument families:
 *   Bronze keyed percussion (metallophones): Saron, Slenthem, Gender, Bonang
 *   Gong family: Gong Ageng, Gong Suwukan, Kempul, Kenong, Kethuk, Kempyang
 *   Drums: Kendang (Javanese), Kendang Balinese
 *   Plucked strings: Siter, Celempung, Kacapi (Sundanese variant)
 *   Bowed strings: Rebab (2-string spike fiddle)
 *   Winds: Suling (end-blown bamboo flute)
 *   Voice: Sindhen (female soloist), Gerong (male chorus)
 *   Wooden: Gambang (xylophone), Kemanak (banana-shaped idiophone)
 *
 * @module rigs/gamelan
 */

'use strict'

const GAMELAN_RIG = {
  name: 'Gamelan Orchestra Rig',
  version: '1.0.0',
  type: 'gamelan',
  totalMusicians: 30,
  origin: 'Indonesia — Java (Yogyakarta, Surakarta) and Bali',

  // ─── Stage layout ─────────────────────────────────────────────────────
  layout: {
    arrangement: 'Traditional U-shape facing inward; Javanese court format',
    conductorPosition: null, // ensemble self-directed; kendang player leads
    stageDepth: 10,
    stageWidth: 14,
    tiers: 1, // predominantly floor-level, some instruments on low platforms
    flooring: 'Woven bamboo mat or low wooden platform (traditional)',
    instrumentOrientation: {
      gongs: 'Hung vertically on wooden rack at rear',
      metallophones: 'Arranged in rows facing conductor position',
      drums: 'Centre — kendang player is ensemble director'
    },
    acousticNote: 'Bronze instruments bloom strongly in live acoustic; recording requires distance miking to capture natural blend'
  },

  // ─── Tuning systems ───────────────────────────────────────────────────
  tuning: {
    overview: 'Gamelan does NOT use Western 12-tone equal temperament. Each gamelan set is tuned to its own unique pitches — two sets are rarely in tune with each other.',

    slendro: {
      description: 'Five-tone scale (pentatonic). Intervals roughly equal but vary by gamelan. Used for many classical pieces and puppet theatre (wayang).',
      noteCount: 5,
      approximateIntervals: '~240 cents per step (but highly variable; non-standardised)',
      westernApproximation: 'Loosely resembles a pentatonic scale but with different interval sizes',
      gongTones: 'Typically 2, 3, 5, 6, 1 (Javanese number notation)',
      character: 'Calm, meditative, associated with night and spiritual contexts'
    },

    pelog: {
      description: 'Seven-tone scale with unequal intervals. Three pentatonic sub-scales (pathet) extracted: nem, lima, barang.',
      noteCount: 7,
      approximateIntervals: 'Varies widely; small and large intervals alternate — unlike any Western scale',
      subScales: {
        pathetNem: 'Notes 1, 2, 3, 5, 6 — most common',
        pathetLima: 'Notes 1, 2, 3, 5, 7',
        pathetBarang: 'Notes 2, 3, 5, 6, 7'
      },
      character: 'More varied and dramatic than slendro; associated with day, heroic drama'
    },

    note: 'A single complete gamelan set contains two parallel sets of instruments — one tuned to slendro, one to pelog. Players move between sets during a performance.'
  },

  // ─── Bronze metallophone family ───────────────────────────────────────
  metallophones: {
    label: 'Bronze Metallophone Family',
    totalPlayers: 12,

    saron: {
      description: 'The central melody-carrying instrument of the Javanese gamelan. A row of bronze keys resting on a trough resonator, struck with a wooden mallet.',
      variants: [
        {
          name: 'Saron Demung',
          octave: 'Bass (lowest saron)',
          keys: 7,
          malletMaterial: 'Hard wood or horn',
          role: 'Plays the core melody (balungan) at the lowest octave',
          players: 1
        },
        {
          name: 'Saron Barung',
          octave: 'Middle',
          keys: 7,
          malletMaterial: 'Hard wood',
          role: 'Primary balungan melody carrier — most prominent melodic voice',
          players: 2
        },
        {
          name: 'Saron Panerus (Peking)',
          octave: 'Treble (highest saron)',
          keys: 7,
          malletMaterial: 'Horn or hard wood',
          role: 'Plays balungan twice as fast — provides rhythmic density',
          players: 2
        }
      ],
      damping: 'Left hand catches ringing key immediately after each strike (immediately muted — "kempyung" technique)',
      material: 'Bronze alloy (tin-bronze: ~80% Cu, 20% Sn)'
    },

    slenthem: {
      description: 'Low-pitched metallophone with individual bronze keys suspended over bamboo or tin tube resonators. Sustains longer than saron.',
      keys: 7,
      octave: 'Subcontrabass (below saron demung)',
      resonators: 'Bamboo or thin metal tubes underneath each key',
      role: 'Plays simplified balungan at the lowest pitch; provides foundational drone-like texture',
      damping: 'Keys allowed to sustain (unlike saron); player damps with left hand selectively',
      players: 1
    },

    gender: {
      description: 'Refined two-handed metallophone with thin bronze keys over individual tube resonators. Considered the most technically demanding gamelan instrument.',
      variants: [
        {
          name: 'Gender Barung',
          keys: 14,
          octave: 'Middle-high range',
          technique: 'Both hands strike different keys simultaneously; right hand plays melody, left hand plays lower harmonics — creates constant two-voice texture',
          damping: 'Immediately damps each key with the striking hand heel/wrist after the next key is struck',
          role: 'Melodic elaboration (garap) — one of the "loud-soft" (irama) instruments',
          players: 1
        },
        {
          name: 'Gender Panerus',
          keys: 14,
          octave: 'Treble (one octave above barung)',
          technique: 'Same two-handed technique as barung',
          role: 'Treble elaboration layer',
          players: 1
        }
      ],
      material: 'Thin-cast bronze; more resonant than saron due to thinner casting'
    },

    bonang: {
      description: 'Instrument consisting of a row of bronze pot-gongs (boss gongs) resting in a horizontal wooden rack. The conductor of the colotomic structure.',
      variants: [
        {
          name: 'Bonang Barung',
          gongCount: 14,
          octave: 'Middle',
          technique: 'Struck with padded stick (bendhe); both hands play simultaneously',
          role: 'Announces new sections; plays elaborated melody against balungan',
          players: 1
        },
        {
          name: 'Bonang Panerus',
          gongCount: 14,
          octave: 'Treble',
          role: 'Higher register elaboration above barung',
          players: 1
        }
      ],
      sticks: 'Wrapped in cord or felt to produce warm muted tone'
    },

    gambang: {
      description: 'The only wooden-keyed instrument in the gamelan — a xylophone with thick rosewood or bamboo keys over a boat-shaped resonating box.',
      keys: 20,
      keyMaterial: 'Rosewood (sono keling) or bamboo',
      mallets: 'Two padded mallets (round felt heads); held in overhand grip',
      range: '3+ octaves',
      technique: 'Rapid two-handed elaboration (imbal) at twice or four times the balungan speed',
      role: 'Rapid figuration — one of the most active melodic elaborators',
      players: 1
    }
  },

  // ─── Gong family ──────────────────────────────────────────────────────
  gongFamily: {
    label: 'Gong Family (Colotomic Punctuation)',
    totalPlayers: 5,
    note: 'Gongs define the formal structure (colotomy) of every gamelan composition — they mark the endpoints of musical phrases at different hierarchical levels.',

    gongAgeng: {
      description: 'The largest gong; 60–90 cm diameter. Marks the end of the longest melodic cycle (gongan). The most sacred gamelan instrument.',
      diameter: '60–90 cm',
      material: 'Hand-hammered bronze',
      pitch: 'Low (pitch varies per set; unlabelled — this specific gong is THE reference)',
      role: 'Marks the end of the full colotomic cycle (gongan = entire composition unit)',
      suspension: 'Hung vertically from a carved wooden rack (gayor)',
      beater: 'Large padded mallet (covered in rope or cloth)',
      players: 1,
      sacredNote: 'Considered spiritually potent; offerings placed before gamelan performances'
    },

    gongSuwukan: {
      description: 'Medium gong; smaller than gong ageng, marks sub-sections of the gongan.',
      diameter: '40–55 cm',
      role: 'Marks intermediate structural points within the colotomic cycle',
      players: 1
    },

    kempul: {
      description: 'Smaller hanging gongs (several per set); mark beat subdivisions within the cycle.',
      count: '6–8 gongs of different pitches',
      diameter: '25–40 cm',
      role: 'Marks every other beat at the kempul structural level',
      players: 1
    },

    kenong: {
      description: 'Pot gongs resting face-up in a rope nest inside a wooden case. Larger than kethuk; higher pitch than kempul.',
      gongCount: '5–10 per set',
      diameter: '25–35 cm (horizontal boss gong)',
      position: 'Sits horizontally, boss upward, in braided rope cradle',
      role: 'Marks every other beat at the kenong structural level — alternates with kempul',
      players: 1
    },

    kethukKempyang: {
      description: 'Small pot gongs; kethuk is a single fixed-pitch gong, kempyang a pair.',
      kethuk: { role: 'Marks the off-beats within kenong subdivisions', pitch: 'Fixed (one pitch per set)' },
      kempyang: { role: 'Fills between kethuk strokes (used in pelog pieces)', pitches: 'Two gongs (fifth apart)' },
      players: 1
    }
  },

  // ─── Drum family ──────────────────────────────────────────────────────
  drums: {
    label: 'Drum Family — Kendang',
    totalPlayers: 2,

    kendangAgeng: {
      description: 'The largest kendang (double-headed barrel drum); the director of the ensemble. The kendang player sets tempo, irama (rhythmic density), and signals transitions.',
      heads: 2,
      material: { body: 'Jackfruit or teak wood', heads: 'Goat or buffalo skin' },
      diameter: { large: '35–45 cm', small: '25–30 cm' },
      tuning: 'Tightened by leather lacing; right head (bem) is lower, left head (thung) is higher',
      technique: {
        hands: 'Both hands used; right fingers/palm on large head, left hand on small head',
        strokes: ['Bem (low resonant — right hand slap)', 'Thung (left hand slap)', 'Tak (right hand muted)', 'Tung (left hand open)', 'Ket (both hands damp together)'],
        role: 'Musical director — controls tempo and signals performers; the only improvising timekeeper'
      },
      players: 1
    },

    kendangCiblon: {
      description: 'Smaller kendang used for more intricate rhythmic patterns in refined (alus) pieces and dance accompaniment.',
      heads: 2,
      diameter: { large: '25 cm', small: '18 cm' },
      role: 'Plays detailed rhythmic patterns (ciblon patterns) for dance — faster and more ornate than ageng',
      players: 1
    },

    bedug: {
      description: 'Large barrel drum suspended in a frame; struck with a padded stick. Used primarily in Balinese gamelan and for mosque calls in Java.',
      heads: 2,
      diameter: '50–70 cm',
      role: 'Slow, foundational pulse (not used in all gamelan types)',
      players: 0, // shared with kendang players
      note: 'Struck with large padded mallet; not always present in court gamelan'
    }
  },

  // ─── Plucked strings ──────────────────────────────────────────────────
  pluckedStrings: {
    label: 'Plucked String Family',
    totalPlayers: 2,

    siter: {
      description: 'Small box zither with metal strings; played in the lap. The Javanese plucked-string instrument equivalent to the celempung.',
      strings: 11,
      stringMaterial: 'Bronze wire (doubled courses — 11 pitches across 22 strings)',
      range: 'Middle octave',
      technique: {
        rightThumb: 'Plucks strings outward (away from player)',
        leftThumb: 'Damps strings from behind to shape sustain',
        style: 'Plays elaboration (cengkok) patterns based on balungan — similar to gender but with plucked attack'
      },
      players: 1
    },

    celempung: {
      description: 'Larger version of the siter with a stand; legs elevate it off the floor. Richer, more resonant sound.',
      strings: 26,
      stand: true,
      role: 'Same elaborating function as siter but with fuller resonance — preferred for formal court contexts',
      players: 1
    },

    rebab: {
      description: 'Two-string spike fiddle of Arab/Persian origin; adopted into Javanese gamelan as the principal bowed-string melodic voice.',
      strings: 2,
      stringMaterial: 'Gut or nylon (fine, very thin)',
      bow: { type: 'Thin arched bow with horsehair', hold: 'Overhanded; bow hair loose-tensioned' },
      body: 'Heart-shaped wooden body with thin skin membrane; long spike (cagak) passes through body and rests on floor',
      tuning: 'Varies by pathet and slendro/pelog set; strings approximately a fifth apart',
      technique: {
        vibrato: 'Slow, wide; characteristic "singing" quality',
        role: 'Plays the padhang-ulihan (question-answer melodic phrase); guides the sindhen voice',
        fingering: 'Light touch (no fingerboard — strings pressed laterally)'
      },
      players: 1
    }
  },

  // ─── Wind instruments ─────────────────────────────────────────────────
  winds: {
    label: 'Wind Instruments',
    totalPlayers: 1,

    suling: {
      description: 'End-blown bamboo flute; the only aerophone in the standard gamelan. Produces a breathy, wavering tone deeply associated with refined Javanese mood.',
      material: 'Bamboo (Javanese: pring; various bamboo species)',
      holes: {
        javanese: 4, // four-hole suling
        sundanese: 6  // six-hole variant from West Java
      },
      keys: 'Non-standard — pitched to match each gamelan set individually',
      embouchure: 'End-blown across a hole notched at the top (no mouthpiece)',
      technique: {
        vibrato: 'Diaphragm vibrato — central to suling aesthetic',
        ornamentation: ['Gregel (trill)', 'Cengkok (melodic embellishment)', 'Glissando between tones'],
        role: 'Plays free melodic elaboration above the ensemble; not metrically strict — floats above the colotomic frame'
      },
      players: 1
    }
  },

  // ─── Vocal parts ─────────────────────────────────────────────────────
  vocal: {
    label: 'Vocal Parts',
    totalSingers: 5,

    sindhen: {
      description: 'Female solo vocalist — the most prominent vocal voice. Sings cengkok (melodic elaborations) freely against the balungan.',
      voice: 'Female (soprano/mezzo)',
      count: 1,
      technique: {
        pitch: 'Non-Western intonation — matches the specific gamelan tuning, not 440 Hz',
        vibrato: 'Wide, characteristically Javanese "goyang" vibrato',
        text: 'Sings Javanese poetry (suluk, pathetan, sekar); also abstract melodic syllables',
        timing: 'Anticipates the balungan melody — enters before the beat and resolves on the strong beat'
      },
      role: 'Central expressive voice of the gamelan; elevated social status in Javanese court music'
    },

    gerong: {
      description: 'Male chorus that sings composed vocal parts (as opposed to the improvised cengkok of the sindhen).',
      voice: 'Male (tenor/baritone)',
      count: 4,
      technique: {
        unison: 'Sings in unison (not harmonised)',
        text: 'Sings macapat poetry (formal Javanese poetic meters)',
        timing: 'Metrically aligned with the balungan (unlike sindhen)'
      }
    }
  },

  // ─── Balinese gamelan section ─────────────────────────────────────────
  balineseSection: {
    label: 'Balinese Gamelan Gong Kebyar — Supplementary Section',
    totalPlayers: 3,
    origin: 'Bali, Indonesia',
    note: 'Gong Kebyar emerged in northern Bali ~1915; dramatically different from Javanese in tempo, attack, and visual theatricality.',

    reong: {
      description: 'A row of 12 small pot gongs played by four musicians simultaneously. The defining instrument of the Balinese gamelan.',
      gongCount: 12,
      players: 4,
      technique: {
        interlock: 'Four players interlock (kotekan) in two pairs — each plays a complementary pattern that fits between the other like gears',
        kotekan: 'Interlocking figuration at very high speed — the central technique of Balinese gamelan',
        mallets: 'Each player uses two mallets (one per hand)'
      }
    },

    gangsa: {
      description: 'Balinese equivalent of the Javanese saron — bronze keyed metallophones. Four types: pemade (middle), kantilan (treble), calung, jegogan.',
      types: [
        { name: 'Pemade', keys: 10, octave: 'Middle', role: 'Plays fast kotekan interlocking patterns' },
        { name: 'Kantilan', keys: 10, octave: 'Treble (octave above pemade)', role: 'Interlocks with pemade at treble register' },
        { name: 'Calung', keys: 5, octave: 'Bass', role: 'Plays pokok (skeletal melody)' },
        { name: 'Jegogan', keys: 5, octave: 'Contrabass', role: 'Plays slowest structural melody' }
      ],
      players: 3 // in this supplementary section; full Gong Kebyar has 10+
    },

    kendangBalinese: {
      description: 'Balinese double-headed barrel drums played in pairs — one male (lanang) and one female (wadon). Always played together as a unit.',
      pair: { lanang: 'Smaller, higher-pitched', wadon: 'Larger, lower-pitched' },
      technique: {
        paired: 'Two drummers interlock patterns — one plays lanang, one wadon',
        strokes: ['Tut (right open tone)', 'Dag (left bass tone)', 'Pung (right muted)', 'Kep (double muted)']
      }
    },

    balinese_character: 'Gong Kebyar is louder, faster, and more dramatic than Javanese gamelan — sudden dynamic changes (kebyar = lightning flash) are a defining feature'
  },

  // ─── Colotomic structure reference ───────────────────────────────────
  colotomicStructure: {
    description: 'Gamelan compositions are defined by gong cycles (gongan). Each gong level marks a different structural depth — the largest gong marks the longest cycle.',
    javaneseExample: {
      form: 'Gendhing Ketawang (32 beats)',
      structure: [
        { beat: 8, instrument: 'Kenong', role: 'Marks every 8 beats' },
        { beat: 4, instrument: 'Kempul', role: 'Marks every 4 beats (alternates with kenong)' },
        { beat: 2, instrument: 'Kethuk', role: 'Marks every 2 beats' },
        { beat: 32, instrument: 'Gong Ageng', role: 'Marks the end of the full cycle' }
      ]
    },
    irama: {
      description: 'Irama is the ratio between the density of the saron melody and the gong cycles — determines "tempo feel".',
      levels: [
        { name: 'Irama I (Lancar)', ratio: '1:1 — fastest', feel: 'One saron note per beat' },
        { name: 'Irama II (Dados)', ratio: '1:2', feel: 'Two saron notes elaborated per balungan note' },
        { name: 'Irama III (Wilet)', ratio: '1:4', feel: 'Four notes elaborated per balungan note — medium' },
        { name: 'Irama IV (Rangkep)', ratio: '1:8 — slowest', feel: 'Eight elaborations — very slow, stately' }
      ]
    }
  },

  // ─── Recording chain ──────────────────────────────────────────────────
  recording: {
    philosophy: 'Gamelan is designed to blend as a unified sound mass — close-miking individual instruments destroys the natural mix. Distance miking is essential.',

    mainArray: {
      config: 'ORTF stereo pair (Neumann U 87 × 2, 17 cm apart, 110° angle)',
      height: '3–4 m above the ensemble centre',
      purpose: 'Capture the natural blend of all bronze instruments resonating together'
    },

    spotMics: {
      gongAgeng: { mic: 'AKG C414 XLII (large-diaphragm, omni)', distance: '1.5 m', purpose: 'Capture low-frequency bloom of large gong' },
      rebab: { mic: 'Neumann KM 184 (SDC cardioid)', distance: '20 cm from resonating membrane', purpose: 'Capture intimate bowed-string texture' },
      suling: { mic: 'DPA 4006 (omni)', distance: '30 cm above embouchure hole', purpose: 'Capture breathy flute with natural room mix' },
      sindhen: { mic: 'Neumann U 87 (cardioid)', distance: '40 cm', purpose: 'Vocal clarity while preserving room context' },
      kendang: { mic: 'Shure Beta 52A (kick) on bem head + SM57 on thung head', distance: '15 cm each', purpose: 'Controlled drum capture without bleed masking' }
    },

    preamp: 'Neve 1073 (× 6 channels)',
    adConversion: 'Apogee Symphony I/O Mk II — 32-bit / 96 kHz',
    roomNote: 'A live stone or hardwood-floored room is ideal — the natural reflections complement the bronze instrument bloom. Avoid carpet.',
    postProcessing: {
      eq: 'Gentle high-pass at 60 Hz on main array; no surgical EQ — let the bronze ring naturally',
      reverb: 'Minimal addition; the instruments provide their own. If needed: Lexicon 480L Large Hall, 1.4 s RT60',
      stems: ['Bronze metallophones', 'Gong family', 'Drums', 'Strings/rebab', 'Suling', 'Vocals']
    }
  },

  // ─── Repertoire ───────────────────────────────────────────────────────
  repertoire: {
    javanese: {
      forms: {
        gendhing: 'Full-length composition (many formal types: ketawang, ladrang, lancaran, etc.)',
        lancaran: 'Shortest, fastest cycle (8 beats) — used for dance accompaniment and opening',
        ladrang: '32-beat cycle — medium length; most common formal type',
        ketawang: '16-beat cycle — refined, associated with sultanate court',
        gendhing: '64+ beat cycle — the longest, most elaborate forms'
      },
      pathet: {
        description: 'Pathet is the modal/temporal system of Javanese gamelan — determines which scale subset is used and when.',
        evening: 'Pathet Nem (slendro), Pathet Lima (pelog) — early-evening sections of wayang',
        midnight: 'Pathet Sanga (slendro) — midnight section; considered most refined',
        dawn: 'Pathet Manyura (slendro), Pathet Barang (pelog) — dawn section'
      },
      wayangKulit: 'Shadow puppet theatre (wayang kulit) is the primary context for all-night gamelan performance — follows strict pathet sequence'
    },
    balinese: {
      forms: ['Kebyar Duduk (seated dance with gamelan)', 'Tabuh Telu', 'Tabuh Pat', 'Kecak (interlocking vocal gamelan-replacement)'],
      occasions: ['Odalan (temple anniversary festivals)', 'Cremation ceremonies (ngaben)', 'New Year (Nyepi) — silence, no gamelan']
    },
    contemporary: {
      composers: ['Ki Wasitodipuro (palace composer, Yogyakarta)', 'I Wayan Sadra (new Balinese composition)', 'Lou Harrison (American composer who wrote for gamelan)', 'Steve Reich (gamelan influence in Phase Music)']
    }
  }
}

// ─── Exported helper functions ─────────────────────────────────────────────

function getGamelanRig () { return GAMELAN_RIG }

function getGamelanSection (section) { return GAMELAN_RIG[section] || null }

function getGamelanPlayerCount () {
  return {
    metallophones: GAMELAN_RIG.metallophones.totalPlayers,
    gongFamily: GAMELAN_RIG.gongFamily.totalPlayers,
    drums: GAMELAN_RIG.drums.totalPlayers,
    pluckedStrings: GAMELAN_RIG.pluckedStrings.totalPlayers,
    winds: GAMELAN_RIG.winds.totalPlayers,
    vocal: GAMELAN_RIG.vocal.totalSingers,
    balineseSection: GAMELAN_RIG.balineseSection.totalPlayers,
    total: GAMELAN_RIG.totalMusicians
  }
}

function getGamelanInstruments () {
  return [
    { name: 'Saron Demung', family: 'metallophone', material: 'bronze', struck: true },
    { name: 'Saron Barung', family: 'metallophone', material: 'bronze', struck: true },
    { name: 'Saron Panerus (Peking)', family: 'metallophone', material: 'bronze', struck: true },
    { name: 'Slenthem', family: 'metallophone', material: 'bronze', struck: true, resonators: true },
    { name: 'Gender Barung', family: 'metallophone', material: 'bronze', struck: true, resonators: true, twoHanded: true },
    { name: 'Gender Panerus', family: 'metallophone', material: 'bronze', struck: true, resonators: true, twoHanded: true },
    { name: 'Bonang Barung', family: 'pot-gong', material: 'bronze', struck: true },
    { name: 'Bonang Panerus', family: 'pot-gong', material: 'bronze', struck: true },
    { name: 'Gambang', family: 'xylophone', material: 'rosewood', struck: true },
    { name: 'Gong Ageng', family: 'gong', material: 'bronze', struck: true, sacred: true },
    { name: 'Gong Suwukan', family: 'gong', material: 'bronze', struck: true },
    { name: 'Kempul', family: 'gong', material: 'bronze', struck: true },
    { name: 'Kenong', family: 'pot-gong', material: 'bronze', struck: true, horizontal: true },
    { name: 'Kethuk', family: 'pot-gong', material: 'bronze', struck: true },
    { name: 'Kempyang', family: 'pot-gong', material: 'bronze', struck: true },
    { name: 'Kendang Ageng', family: 'drum', material: 'wood+skin', struck: true },
    { name: 'Kendang Ciblon', family: 'drum', material: 'wood+skin', struck: true },
    { name: 'Siter', family: 'zither', material: 'wood+bronze', plucked: true },
    { name: 'Celempung', family: 'zither', material: 'wood+bronze', plucked: true },
    { name: 'Rebab', family: 'spike fiddle', material: 'wood+skin', bowed: true },
    { name: 'Suling', family: 'flute', material: 'bamboo', blown: true },
    { name: 'Reong (Balinese)', family: 'pot-gong row', material: 'bronze', struck: true, interlocking: true },
    { name: 'Gangsa / Pemade', family: 'metallophone', material: 'bronze', struck: true }
  ]
}

function getGamelanPrincipals () {
  return [
    { section: 'Direction', role: 'Kendang Player (ensemble director)', instrument: 'Kendang Ageng' },
    { section: 'Melody', role: 'Principal Saron Barung', instrument: 'Saron Barung' },
    { section: 'Elaboration', role: 'Gender Player', instrument: 'Gender Barung' },
    { section: 'Gong Structure', role: 'Gong Ageng Player', instrument: 'Gong Ageng' },
    { section: 'Strings', role: 'Rebab Player', instrument: 'Rebab' },
    { section: 'Wind', role: 'Suling Player', instrument: 'Suling' },
    { section: 'Vocal', role: 'Principal Sindhen', instrument: 'Voice' },
    { section: 'Balinese', role: 'Lead Reong Player', instrument: 'Reong' }
  ]
}

function getGamelanTuningSystem (system) {
  return GAMELAN_RIG.tuning[system] || null
}

function getGamelanRepertoire (tradition) {
  return tradition ? (GAMELAN_RIG.repertoire[tradition] || null) : GAMELAN_RIG.repertoire
}

module.exports = {
  GAMELAN_RIG,
  getGamelanRig,
  getGamelanSection,
  getGamelanPlayerCount,
  getGamelanInstruments,
  getGamelanPrincipals,
  getGamelanTuningSystem,
  getGamelanRepertoire
}
