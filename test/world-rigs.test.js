'use strict'

/**
 * Tests for world instrument rig modules:
 *   rigs/gamelan.js, rigs/sitar.js, rigs/tabla.js, rigs/aboriginal-australian.js
 * Also exercises rigs/index.js integration for these four rigs.
 */

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// ─── Gamelan ─────────────────────────────────────────────────────────────────
const {
  GAMELAN_RIG,
  getGamelanRig, getGamelanSection, getGamelanPlayerCount,
  getGamelanInstruments, getGamelanPrincipals, getGamelanTuningSystem, getGamelanRepertoire
} = require('../rigs/gamelan.js')

describe('Gamelan rig', () => {
  it('GAMELAN_RIG has correct type and totalMusicians', () => {
    assert.equal(GAMELAN_RIG.type, 'gamelan')
    assert.ok(GAMELAN_RIG.totalMusicians > 0)
  })

  it('getGamelanRig() returns the config object', () => {
    assert.deepEqual(getGamelanRig(), GAMELAN_RIG)
  })

  it('getGamelanSection() returns metallophones section', () => {
    const section = getGamelanSection('metallophones')
    assert.ok(section)
  })

  it('getGamelanSection() returns null for unknown section', () => {
    assert.equal(getGamelanSection('nonexistent'), null)
  })

  it('getGamelanPlayerCount() total matches totalMusicians', () => {
    const counts = getGamelanPlayerCount()
    assert.ok(counts.total > 0)
    assert.equal(counts.total, GAMELAN_RIG.totalMusicians)
  })

  it('getGamelanInstruments() has at least 10 instruments', () => {
    const instruments = getGamelanInstruments()
    assert.ok(Array.isArray(instruments))
    assert.ok(instruments.length >= 10)
  })

  it('getGamelanInstruments() includes gong family and metallophone', () => {
    const instruments = getGamelanInstruments()
    const families = new Set(instruments.map(i => i.family))
    assert.ok(families.has('metallophone') || families.has('idiophone'))
  })

  it('getGamelanInstruments() includes Gong Ageng and Gender', () => {
    const instruments = getGamelanInstruments()
    const names = instruments.map(i => i.name)
    assert.ok(names.some(n => n.toLowerCase().includes('gong')))
    assert.ok(names.some(n => n.toLowerCase().includes('gender') || n.toLowerCase().includes('saron')))
  })

  it('getGamelanPrincipals() returns non-empty array with required fields', () => {
    const p = getGamelanPrincipals()
    assert.ok(Array.isArray(p) && p.length > 0)
    assert.ok(p[0].role)
    assert.ok(p[0].instrument)
  })

  it('getGamelanTuningSystem("slendro") returns slendro config', () => {
    const slendro = getGamelanTuningSystem('slendro')
    assert.ok(slendro)
  })

  it('getGamelanTuningSystem("pelog") returns pelog config', () => {
    const pelog = getGamelanTuningSystem('pelog')
    assert.ok(pelog)
  })

  it('getGamelanRepertoire() returns repertoire data', () => {
    const rep = getGamelanRepertoire()
    assert.ok(rep)
  })
})

// ─── Sitar ────────────────────────────────────────────────────────────────────
const {
  SITAR_RIG,
  getSitarRig, getSitarSection, getSitarMusicianCount,
  getSitarPrincipals, getSitarInstruments, getSitarRaga, getSitarRagas,
  getSitarGharana, getSitarGharanas, getSitarScaleDegrees
} = require('../rigs/sitar.js')

describe('Sitar rig', () => {
  it('SITAR_RIG has correct type and totalMusicians', () => {
    assert.equal(SITAR_RIG.type, 'sitar')
    assert.ok(SITAR_RIG.totalMusicians > 0)
  })

  it('getSitarRig() returns the config object', () => {
    assert.deepEqual(getSitarRig(), SITAR_RIG)
  })

  it('getSitarSection() returns soloSitar section', () => {
    const s = getSitarSection('soloSitar')
    assert.ok(s)
    assert.ok(s.instrument)
    assert.equal(s.instrument.name, 'Sitar')
  })

  it('getSitarSection() returns tanpura section', () => {
    const t = getSitarSection('tanpura')
    assert.ok(t)
    assert.equal(t.instrument.strings.count, 4)
  })

  it('getSitarSection() returns null for unknown section', () => {
    assert.equal(getSitarSection('nonexistent'), null)
  })

  it('getSitarMusicianCount() sums to totalMusicians', () => {
    const counts = getSitarMusicianCount()
    const sum = counts.soloSitar + counts.tanpura + counts.sarangiOrHarmonium + counts.tablaAccompaniment
    assert.equal(sum, counts.total)
    assert.equal(counts.total, SITAR_RIG.totalMusicians)
  })

  it('getSitarPrincipals() returns non-empty array with required fields', () => {
    const p = getSitarPrincipals()
    assert.ok(Array.isArray(p) && p.length > 0)
    assert.ok(p[0].role)
    assert.ok(p[0].instrument)
  })

  it('getSitarInstruments() includes Sitar and Tanpura', () => {
    const instruments = getSitarInstruments()
    const names = instruments.map(i => i.name)
    assert.ok(names.includes('Sitar'))
    assert.ok(names.includes('Tanpura'))
    assert.ok(names.includes('Sarangi'))
  })

  it('Sitar has 19 total strings (6 main + 13 sympathetic)', () => {
    const instruments = getSitarInstruments()
    const sitar = instruments.find(i => i.name === 'Sitar')
    assert.ok(sitar)
    assert.equal(sitar.strings, 19)
  })

  it('getSitarRaga() returns raga by name', () => {
    const yaman = getSitarRaga('yaman')
    assert.ok(yaman)
    assert.ok(yaman.thaat)
    assert.ok(Array.isArray(yaman.aroha))
  })

  it('getSitarRaga() returns null for unknown raga', () => {
    assert.equal(getSitarRaga('nonexistent'), null)
  })

  it('getSitarRagas() returns all time categories', () => {
    const ragas = getSitarRagas()
    assert.ok(ragas.morning)
    assert.ok(ragas.evening)
  })

  it('getSitarGharanas() includes imdadkhani and maihar', () => {
    const gharanas = getSitarGharanas()
    assert.ok(gharanas.imdadkhani)
    assert.ok(gharanas.maihar)
    assert.ok(gharanas.imdadkhani.notableMusicians.includes('Vilayat Khan'))
    assert.ok(gharanas.maihar.notableMusicians.includes('Ravi Shankar'))
  })

  it('getSitarGharana() returns null for unknown gharana', () => {
    assert.equal(getSitarGharana('nonexistent'), null)
  })

  it('getSitarScaleDegrees() includes Sa, Pa, and Ma#', () => {
    const degrees = getSitarScaleDegrees()
    assert.ok(degrees.degrees.Sa)
    assert.ok(degrees.degrees.Pa)
    assert.ok(degrees.degrees['Ma#'])
    assert.equal(degrees.degrees.Sa.fixed, true)
  })

  it('thaats include bilawal and bhairavi', () => {
    const degrees = getSitarScaleDegrees()
    assert.ok(degrees.thaats.bilawal)
    assert.ok(degrees.thaats.bhairavi)
  })
})

// ─── Tabla ────────────────────────────────────────────────────────────────────
const {
  TABLA_RIG,
  getTablaRig, getTablaSection, getTablaDrums,
  getTablaGharana, getTablaGharanas, getTablaTaal, getTablaTaals,
  getTablaBols, getTablePrincipals
} = require('../rigs/tabla.js')

describe('Tabla rig', () => {
  it('TABLA_RIG has correct type and totalMusicians', () => {
    assert.equal(TABLA_RIG.type, 'tabla')
    assert.ok(TABLA_RIG.totalMusicians > 0)
  })

  it('getTablaRig() returns the config object', () => {
    assert.deepEqual(getTablaRig(), TABLA_RIG)
  })

  it('getTablaDrums() returns dayan and bayan', () => {
    const drums = getTablaDrums()
    assert.ok(Array.isArray(drums))
    assert.equal(drums.length, 2)
    const names = drums.map(d => d.name)
    assert.ok(names.includes('Dayan'))
    assert.ok(names.includes('Bayan'))
  })

  it('Dayan is tuned, Bayan has pitch bend', () => {
    const drums = getTablaDrums()
    const dayan = drums.find(d => d.name === 'Dayan')
    const bayan = drums.find(d => d.name === 'Bayan')
    assert.equal(dayan.tuned, true)
    assert.equal(bayan.pitchBend, true)
  })

  it('getTablaSection() returns bols section', () => {
    const bols = getTablaSection('bols')
    assert.ok(bols)
    assert.ok(bols.combinedBols)
    assert.ok(bols.combinedBols.dha)
  })

  it('getTablaBols() returns dayan, bayan, combined categories', () => {
    const bols = getTablaBols()
    assert.ok(bols.dayan)
    assert.ok(bols.bayan)
    assert.ok(bols.combined)
    assert.ok(bols.combined.dha)
    assert.ok(bols.combined.dhin)
  })

  it('getTablaTaals() includes Teental and Rupak', () => {
    const taals = getTablaTaals()
    assert.ok(taals.teental)
    assert.ok(taals.rupak)
    assert.equal(taals.teental.beats, 16)
    assert.equal(taals.rupak.beats, 7)
  })

  it('getTablaTaal() returns taal by name', () => {
    const jhaptal = getTablaTaal('jhaptal')
    assert.ok(jhaptal)
    assert.equal(jhaptal.beats, 10)
  })

  it('getTablaTaal() returns null for unknown taal', () => {
    assert.equal(getTablaTaal('nonexistent'), null)
  })

  it('getTablaGharanas() includes all six gharanas', () => {
    const gharanas = getTablaGharanas()
    assert.ok(gharanas.delhi)
    assert.ok(gharanas.ajrada)
    assert.ok(gharanas.lucknow)
    assert.ok(gharanas.farukhabad)
    assert.ok(gharanas.banaras)
    assert.ok(gharanas.punjab)
  })

  it('Punjab gharana includes Zakir Hussain', () => {
    const punjab = getTablaGharana('punjab')
    assert.ok(punjab)
    assert.ok(punjab.notableArtists.includes('Zakir Hussain'))
  })

  it('getTablaGharana() returns null for unknown gharana', () => {
    assert.equal(getTablaGharana('nonexistent'), null)
  })

  it('Ektal has 12 beats', () => {
    const ektal = getTablaTaal('ektal')
    assert.equal(ektal.beats, 12)
  })
})

// ─── Aboriginal Australian ────────────────────────────────────────────────────
const {
  ABORIGINAL_AUSTRALIAN_RIG,
  getAboriginalAustralianRig, getAboriginalAustralianSection, getAboriginalAustralianMusicianCount,
  getAboriginalAustralianPrincipals, getAboriginalAustralianInstruments,
  getAboriginalAustralianRegion, getAboriginalAustralianRegions
} = require('../rigs/aboriginal-australian.js')

describe('Aboriginal Australian rig', () => {
  it('ABORIGINAL_AUSTRALIAN_RIG has correct type and totalMusicians', () => {
    assert.equal(ABORIGINAL_AUSTRALIAN_RIG.type, 'aboriginal-australian')
    assert.ok(ABORIGINAL_AUSTRALIAN_RIG.totalMusicians > 0)
  })

  it('getAboriginalAustralianRig() returns the config object', () => {
    assert.deepEqual(getAboriginalAustralianRig(), ABORIGINAL_AUSTRALIAN_RIG)
  })

  it('getAboriginalAustralianSection() returns didgeridoo section', () => {
    const didg = getAboriginalAustralianSection('didgeridoo')
    assert.ok(didg)
    assert.ok(didg.instrument)
    assert.equal(didg.instrument.name.toLowerCase().includes('didgeridoo') || didg.instrument.name.toLowerCase().includes('yidaki'), true)
  })

  it('getAboriginalAustralianSection() returns null for unknown section', () => {
    assert.equal(getAboriginalAustralianSection('nonexistent'), null)
  })

  it('getAboriginalAustralianMusicianCount() sums to totalMusicians', () => {
    const counts = getAboriginalAustralianMusicianCount()
    const sum = counts.didgeridoo + counts.clapsticks + counts.voice + counts.bullroarer
    assert.equal(sum, counts.total)
    assert.equal(counts.total, ABORIGINAL_AUSTRALIAN_RIG.totalMusicians)
  })

  it('getAboriginalAustralianPrincipals() includes Song Leader and Didgeridoo Player', () => {
    const p = getAboriginalAustralianPrincipals()
    const roles = p.map(x => x.role)
    assert.ok(roles.some(r => r.toLowerCase().includes('song')))
    assert.ok(roles.some(r => r.toLowerCase().includes('didgeridoo')))
  })

  it('getAboriginalAustralianInstruments() includes Yidaki and Bilma', () => {
    const instruments = getAboriginalAustralianInstruments()
    const names = instruments.map(i => i.name.toLowerCase())
    assert.ok(names.some(n => n.includes('yidaki') || n.includes('didgeridoo')))
    assert.ok(names.some(n => n.includes('bilma') || n.includes('clapstick')))
  })

  it('getAboriginalAustralianInstruments() includes aerophone family', () => {
    const instruments = getAboriginalAustralianInstruments()
    const families = new Set(instruments.map(i => i.family))
    assert.ok(families.has('aerophone'))
    assert.ok(families.has('idiophone'))
  })

  it('didgeridoo has circularBreathing flag', () => {
    const instruments = getAboriginalAustralianInstruments()
    const didg = instruments.find(i => i.circularBreathing === true)
    assert.ok(didg)
  })

  it('getAboriginalAustralianRegions() includes arnhemLand and centralAustralia', () => {
    const regions = getAboriginalAustralianRegions()
    assert.ok(regions.arnhemLand)
    assert.ok(regions.centralAustralia)
    assert.ok(regions.kimberley)
  })

  it('getAboriginalAustralianRegion() returns Arnhem Land data', () => {
    const arnhem = getAboriginalAustralianRegion('arnhemLand')
    assert.ok(arnhem)
    assert.ok(arnhem.peoples)
    assert.ok(arnhem.peoples.includes('Yolŋu'))
  })

  it('getAboriginalAustralianRegion() returns null for unknown region', () => {
    assert.equal(getAboriginalAustralianRegion('nonexistent'), null)
  })

  it('bullroarer has restricted flag', () => {
    const bullroarer = ABORIGINAL_AUSTRALIAN_RIG.bullroarer
    assert.ok(bullroarer)
    assert.ok(bullroarer.instrument)
  })

  it('voice section includes songlines tradition', () => {
    const voice = ABORIGINAL_AUSTRALIAN_RIG.voice
    assert.ok(voice.traditions)
    assert.ok(voice.traditions.songlines)
    assert.ok(voice.traditions.songlines.description)
  })
})

// ─── rigs/index.js integration ────────────────────────────────────────────────
const rigs = require('../rigs/index.js')

describe('rigs/index.js world instruments integration', () => {
  it('RIGS object includes all four new world rigs', () => {
    assert.ok(rigs.RIGS.gamelan)
    assert.ok(rigs.RIGS.sitar)
    assert.ok(rigs.RIGS.tabla)
    assert.ok(rigs.RIGS.aboriginalAustralian)
  })

  it('getRig() works for each world rig type', () => {
    assert.ok(rigs.getRig('gamelan'))
    assert.ok(rigs.getRig('sitar'))
    assert.ok(rigs.getRig('tabla'))
    assert.ok(rigs.getRig('aboriginalAustralian'))
  })

  it('getRigsSummary() includes summaries for all four world rigs', () => {
    const summary = rigs.getRigsSummary()
    assert.ok(summary.gamelan)
    assert.ok(summary.sitar)
    assert.ok(summary.tabla)
    assert.ok(summary.aboriginalAustralian)
  })

  it('gamelan summary has correct totalMusicians', () => {
    const summary = rigs.getRigsSummary()
    assert.equal(summary.gamelan.totalMusicians, GAMELAN_RIG.totalMusicians)
    assert.ok(summary.gamelan.totalMusicians > 0)
  })

  it('tabla summary has 6 gharanas and multiple taals', () => {
    const summary = rigs.getRigsSummary()
    assert.equal(summary.tabla.gharanas, 6)
    assert.ok(summary.tabla.taals > 0)
  })

  it('aboriginalAustralian summary has correct region count', () => {
    const summary = rigs.getRigsSummary()
    assert.ok(summary.aboriginalAustralian.regions >= 4)
  })

  it('searchEquipment finds "slendro" in gamelan rig', () => {
    const results = rigs.searchEquipment('slendro')
    assert.ok(results.some(r => r.rig === 'gamelan'))
  })

  it('searchEquipment finds "yidaki" in aboriginal rig', () => {
    const results = rigs.searchEquipment('yidaki')
    assert.ok(results.some(r => r.rig === 'aboriginalAustralian'))
  })

  it('searchEquipment finds "teental" in tabla rig', () => {
    const results = rigs.searchEquipment('teental')
    assert.ok(results.some(r => r.rig === 'tabla'))
  })

  it('direct exports GAMELAN_RIG, SITAR_RIG, TABLA_RIG, ABORIGINAL_AUSTRALIAN_RIG exist', () => {
    assert.ok(rigs.GAMELAN_RIG)
    assert.ok(rigs.SITAR_RIG)
    assert.ok(rigs.TABLA_RIG)
    assert.ok(rigs.ABORIGINAL_AUSTRALIAN_RIG)
  })
})
