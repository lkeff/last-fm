'use strict'

/**
 * Tests for all four new rig modules:
 *   rigs/lyre.js, rigs/bagpipes.js, rigs/synth-strings.js, rigs/balkan-orchestra.js
 * Also exercises rigs/index.js integration.
 */

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// ─── Lyre ────────────────────────────────────────────────────────────────────
const {
  LYRE_RIG,
  getLyreRig, getLyreSection, getLyrePlayerCount,
  getLyrePrincipals, getLyreInstruments, getLyreTuningReference, getLyreRepertoire
} = require('../rigs/lyre.js')

describe('Lyre rig', () => {
  it('LYRE_RIG has correct type and totalPlayers', () => {
    assert.equal(LYRE_RIG.type, 'lyre')
    assert.equal(typeof LYRE_RIG.totalPlayers, 'number')
    assert.ok(LYRE_RIG.totalPlayers > 0)
  })

  it('getLyreRig() returns the config object', () => {
    assert.deepEqual(getLyreRig(), LYRE_RIG)
  })

  it('getLyreSection() returns a section by key', () => {
    const greek = getLyreSection('ancientGreek')
    assert.ok(greek)
    assert.equal(typeof greek.totalPlayers, 'number')
    assert.ok(greek.kithara)
    assert.equal(greek.kithara.strings, 7)
  })

  it('getLyreSection() returns null for unknown section', () => {
    assert.equal(getLyreSection('nonexistent'), null)
  })

  it('getLyrePlayerCount() sums to totalPlayers', () => {
    const counts = getLyrePlayerCount()
    const sum = counts.ancientGreek + counts.africanLyre + counts.medievalEuropean + counts.nordicBowed
    assert.equal(sum, counts.total)
    assert.equal(counts.total, LYRE_RIG.totalPlayers)
  })

  it('getLyrePrincipals() returns non-empty array with required fields', () => {
    const p = getLyrePrincipals()
    assert.ok(Array.isArray(p) && p.length > 0)
    assert.ok(p[0].section)
    assert.ok(p[0].role)
    assert.ok(p[0].instrument)
  })

  it('getLyreInstruments() includes both plucked and bowed instruments', () => {
    const instruments = getLyreInstruments()
    assert.ok(instruments.some(i => i.bowed === true))
    assert.ok(instruments.some(i => i.bowed === false))
    const names = instruments.map(i => i.name)
    assert.ok(names.includes('Kithara'))
    assert.ok(names.includes('Welsh Crwth'))
    assert.ok(names.includes('Talharpa'))
    assert.ok(names.includes('Begena'))
  })

  it('getLyreTuningReference() returns correct Hz values', () => {
    assert.equal(getLyreTuningReference('modern'), 440)
    assert.equal(getLyreTuningReference('ancient'), 432)
    assert.equal(getLyreTuningReference('baroque'), 415)
    assert.equal(getLyreTuningReference('nonexistent'), 440) // fallback
  })

  it('getLyreRepertoire() returns all styles when no arg', () => {
    const r = getLyreRepertoire()
    assert.ok(r.ancientGreek)
    assert.ok(r.africanTraditional)
    assert.ok(r.medievalEuropean)
    assert.ok(r.nordicRuno)
  })

  it('getLyreRepertoire(style) returns specific style', () => {
    const r = getLyreRepertoire('nordicRuno')
    assert.ok(Array.isArray(r.genres))
    assert.ok(r.genres.includes('Finnish runo-songs (Kalevala tradition)'))
  })
})

// ─── Bagpipes ─────────────────────────────────────────────────────────────────
const {
  BAGPIPES_RIG,
  getBagpipesRig, getBagpipesSection, getBagpipesPlayerCount,
  getBagpipesPrincipals, getBagpipesInstruments, getBagpipesRepertoire, getBagpipesMikingSetup
} = require('../rigs/bagpipes.js')

describe('Bagpipes rig', () => {
  it('BAGPIPES_RIG has correct type and totalPlayers', () => {
    assert.equal(BAGPIPES_RIG.type, 'bagpipes')
    assert.ok(BAGPIPES_RIG.totalPlayers > 0)
  })

  it('getBagpipesRig() returns the config object', () => {
    assert.deepEqual(getBagpipesRig(), BAGPIPES_RIG)
  })

  it('getBagpipesSection() returns GHB section', () => {
    const ghb = getBagpipesSection('greatHighlandBagpipe')
    assert.ok(ghb)
    assert.equal(ghb.origin, 'Scotland (Highland & Islands)')
    assert.equal(ghb.instrument.drones.bass.count, 1)
    assert.equal(ghb.instrument.drones.tenor.count, 2)
  })

  it('getBagpipesPlayerCount() sums to totalPlayers', () => {
    const counts = getBagpipesPlayerCount()
    const sum = counts.greatHighlandBagpipe + counts.uilleannPipes + counts.northumbrianSmallpipes +
                counts.gaitaGallega + counts.biniou + counts.zampogna + counts.gaida
    assert.equal(sum, counts.total)
    assert.equal(counts.total, BAGPIPES_RIG.totalPlayers)
  })

  it('getBagpipesPrincipals() includes Pipe Major and Uilleann Piper', () => {
    const p = getBagpipesPrincipals()
    const roles = p.map(x => x.role)
    assert.ok(roles.includes('Pipe Major'))
    assert.ok(roles.includes('Principal Uilleann Piper'))
  })

  it('getBagpipesInstruments() includes bellows and non-bellows instruments', () => {
    const instruments = getBagpipesInstruments()
    assert.ok(instruments.some(i => i.bellows === true))
    assert.ok(instruments.some(i => i.bellows === false))
    const names = instruments.map(i => i.name)
    assert.ok(names.includes('Great Highland Bagpipe'))
    assert.ok(names.includes('Uilleann Pipes'))
    assert.ok(names.includes('Gaita Gallega'))
    assert.ok(names.includes('Zampogna'))
    assert.ok(names.includes('Kaba Gaida'))
  })

  it('GHB pitchRef is sharper than concert A', () => {
    const ghb = getBagpipesInstruments().find(i => i.name === 'Great Highland Bagpipe')
    assert.ok(ghb.pitchRef > 440)
  })

  it('getBagpipesRepertoire(region) returns regional repertoire', () => {
    const scottish = getBagpipesRepertoire('scottish')
    assert.ok(scottish.pibroch)
    assert.ok(Array.isArray(scottish.pibroch))
    const irish = getBagpipesRepertoire('irish')
    assert.ok(Array.isArray(irish.jigs))
  })

  it('getBagpipesMikingSetup() returns correct setup for uilleann', () => {
    const setup = getBagpipesMikingSetup('uilleann')
    assert.ok(setup)
    assert.ok(setup.chanter)
    assert.ok(setup.drones)
  })

  it('getBagpipesMikingSetup() returns null for unknown type', () => {
    assert.equal(getBagpipesMikingSetup('nonexistent'), null)
  })
})

// ─── Synth strings ────────────────────────────────────────────────────────────
const {
  SYNTH_STRINGS_RIG,
  getSynthStringsRig, getSynthStringsSection, getSynthUnitsCount,
  getSynthInstruments, getSynthPatchPreset, getSynthPatchPresets,
  getSynthMidiZones, getSynthUseCases
} = require('../rigs/synth-strings.js')

describe('Synth strings rig', () => {
  it('SYNTH_STRINGS_RIG has correct type and totalUnits', () => {
    assert.equal(SYNTH_STRINGS_RIG.type, 'synth-strings')
    assert.ok(SYNTH_STRINGS_RIG.totalUnits > 0)
  })

  it('getSynthStringsRig() returns config', () => {
    assert.deepEqual(getSynthStringsRig(), SYNTH_STRINGS_RIG)
  })

  it('getSynthStringsSection() returns a section', () => {
    const vintage = getSynthStringsSection('vintageHardware')
    assert.ok(vintage)
    assert.ok(vintage.solinaStringEnsemble)
  })

  it('getSynthUnitsCount() includes all categories', () => {
    const counts = getSynthUnitsCount()
    assert.ok(counts.vintageHardware > 0)
    assert.ok(counts.modernHardware > 0)
    assert.ok(counts.virtualInstruments > 0)
    assert.ok(counts.eurorackModules > 0)
    assert.equal(counts.total, SYNTH_STRINGS_RIG.totalUnits)
  })

  it('getSynthInstruments() returns vintage, modern, vst categories', () => {
    const { vintage, modern, vst } = getSynthInstruments()
    assert.ok(Array.isArray(vintage) && vintage.length > 0)
    assert.ok(Array.isArray(modern) && modern.length > 0)
    assert.ok(Array.isArray(vst) && vst.length > 0)
    assert.ok(vintage.every(i => i.category === 'vintage'))
    assert.ok(modern.every(i => i.category === 'modern'))
    assert.ok(vst.every(i => i.category === 'virtual'))
  })

  it('Solina is in vintage instruments', () => {
    const { vintage } = getSynthInstruments()
    const found = vintage.find(i => i.name && i.name.toLowerCase().includes('solina'))
    assert.ok(found, 'Solina not found in vintage instruments')
  })

  it('getSynthPatchPresets() returns array with id and description', () => {
    const presets = getSynthPatchPresets()
    assert.ok(Array.isArray(presets) && presets.length > 0)
    assert.ok(presets[0].id)
    assert.ok(presets[0].description)
  })

  it('getSynthPatchPreset() returns preset by name', () => {
    const preset = getSynthPatchPreset('mellotronTexture')
    assert.ok(preset)
    assert.ok(preset.description)
    assert.ok(preset.instruments.some(i => i.toLowerCase().includes('mellotron')))
  })

  it('getSynthPatchPreset() returns null for unknown', () => {
    assert.equal(getSynthPatchPreset('nonexistent'), null)
  })

  it('getSynthMidiZones() returns array of zone mappings', () => {
    const zones = getSynthMidiZones()
    assert.ok(Array.isArray(zones) && zones.length > 0)
    assert.ok(zones[0].zone)
    assert.ok(zones[0].target || zones[0].action)
  })

  it('getSynthUseCases() covers film and pop production', () => {
    const uc = getSynthUseCases()
    assert.ok(uc.filmScore)
    assert.ok(uc.popProduction)
    assert.ok(uc.electronicDance)
    assert.ok(uc.neoClassical)
  })
})

// ─── Balkan orchestra ─────────────────────────────────────────────────────────
const {
  BALKAN_ORCHESTRA,
  getBalkanOrchestra, getBalkanSection, getBalkanMusicianCount,
  getBalkanPrincipals, getBalkanInstruments, getBalkanRhythmReference, getBalkanRepertoire
} = require('../rigs/balkan-orchestra.js')

describe('Balkan orchestra rig', () => {
  it('BALKAN_ORCHESTRA has correct type and totalMusicians', () => {
    assert.equal(BALKAN_ORCHESTRA.type, 'balkan-orchestra')
    assert.ok(BALKAN_ORCHESTRA.totalMusicians > 0)
  })

  it('getBalkanOrchestra() returns config', () => {
    assert.deepEqual(getBalkanOrchestra(), BALKAN_ORCHESTRA)
  })

  it('getBalkanSection() returns Bulgarian section', () => {
    const bg = getBalkanSection('bulgarianSection')
    assert.ok(bg)
    assert.ok(bg.gaida)
    assert.ok(bg.gadulka)
    assert.ok(bg.kaval)
    assert.ok(bg.tapan)
  })

  it('getBalkanMusicianCount() sums to totalMusicians', () => {
    const counts = getBalkanMusicianCount()
    const sum = counts.strings + counts.bulgarianSection + counts.serbianSection +
                counts.greekSection + counts.romanianSection + counts.albanianChoir +
                counts.bosnianMacedonianSection + counts.orchestralWindsBrass +
                counts.percussion + counts.keysAndHarp
    assert.equal(sum, BALKAN_ORCHESTRA.totalMusicians)
  })

  it('getBalkanPrincipals() includes Cretan Lyra and Kanun', () => {
    const p = getBalkanPrincipals()
    const instruments = p.map(x => x.instrument)
    assert.ok(instruments.includes('Cretan Lyra'))
    assert.ok(instruments.includes('Kanun / Qanun'))
    assert.ok(instruments.includes('Kaba Gaida'))
  })

  it('getBalkanInstruments() has at least 20 instruments', () => {
    const instruments = getBalkanInstruments()
    assert.ok(instruments.length >= 20)
  })

  it('getBalkanInstruments() includes all instrument families', () => {
    const instruments = getBalkanInstruments()
    const families = new Set(instruments.map(i => i.family))
    assert.ok(families.has('aerophone'))
    assert.ok(families.has('chordophone'))
    assert.ok(families.has('membranophone'))
  })

  it('getBalkanRhythmReference() includes 7/8 and 11/8', () => {
    const meters = getBalkanRhythmReference()
    assert.ok(Array.isArray(meters))
    assert.ok(meters.some(m => m.meter === '7/8'))
    assert.ok(meters.some(m => m.meter === '11/8'))
  })

  it('getBalkanRepertoire(region) returns greek repertoire', () => {
    const greek = getBalkanRepertoire('greek')
    assert.ok(greek)
    assert.ok(greek.rembetika)
  })

  it('Albanian choir has iso-polyphony structure', () => {
    const choir = BALKAN_ORCHESTRA.albanianChoir
    assert.equal(choir.totalMusicians, 6)
    assert.ok(choir.isopolyphony)
    assert.ok(choir.isopolyphony.voices.marrës)
    assert.ok(choir.isopolyphony.voices.iso)
  })

  it('tuningAndIntonation includes Phrygian Dominant scale', () => {
    const t = BALKAN_ORCHESTRA.tuningAndIntonation
    assert.ok(t.scaleTypes.phrygianDominant)
    assert.ok(t.scaleTypes.doubleHarmonic)
  })
})

// ─── rigs/index.js integration ────────────────────────────────────────────────
const rigs = require('../rigs/index.js')

describe('rigs/index.js integration', () => {
  it('RIGS object includes all four new rigs', () => {
    assert.ok(rigs.RIGS.lyre)
    assert.ok(rigs.RIGS.bagpipes)
    assert.ok(rigs.RIGS.synthStrings)
    assert.ok(rigs.RIGS.balkanOrchestra)
  })

  it('getRig() works for each new rig type', () => {
    assert.ok(rigs.getRig('lyre'))
    assert.ok(rigs.getRig('bagpipes'))
    assert.ok(rigs.getRig('synthStrings'))
    assert.ok(rigs.getRig('balkanOrchestra'))
  })

  it('getRigsSummary() includes summaries for all four new rigs', () => {
    const summary = rigs.getRigsSummary()
    assert.ok(summary.lyre)
    assert.ok(summary.bagpipes)
    assert.ok(summary.synthStrings)
    assert.ok(summary.balkanOrchestra)
  })

  it('lyre summary has correct player count', () => {
    const summary = rigs.getRigsSummary()
    assert.equal(summary.lyre.totalPlayers, LYRE_RIG.totalPlayers)
    assert.ok(summary.lyre.totalPlayers > 0)
  })

  it('searchEquipment finds "kithara" in lyre rig', () => {
    const results = rigs.searchEquipment('kithara')
    assert.ok(results.some(r => r.rig === 'lyre'))
  })

  it('searchEquipment finds "gaida" across bagpipes and balkan rigs', () => {
    const results = rigs.searchEquipment('gaida')
    const rigsFound = new Set(results.map(r => r.rig))
    assert.ok(rigsFound.has('bagpipes') || rigsFound.has('balkanOrchestra'))
  })

  it('direct exports LYRE_RIG, BAGPIPES_RIG, SYNTH_STRINGS_RIG, BALKAN_ORCHESTRA exist', () => {
    assert.ok(rigs.LYRE_RIG)
    assert.ok(rigs.BAGPIPES_RIG)
    assert.ok(rigs.SYNTH_STRINGS_RIG)
    assert.ok(rigs.BALKAN_ORCHESTRA)
  })
})
