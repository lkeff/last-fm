const fs = require('fs')
const path = require('path')
const { decodeWavBuffer } = require('./wav')
const { FIRConvolver } = require('./convolver')
const { applyPedal } = require('./pedals')
const { resampleLinear } = require('./resample')

function resolveSafePath(baseDir, userPath) {
  const resolvedBase = path.resolve(baseDir)
  const resolved = path.resolve(resolvedBase, userPath)
  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    throw new Error('Invalid path')
  }
  return resolved
}

async function loadIRWav(irPath) {
  const buf = fs.readFileSync(irPath)
  const irAudio = await decodeWavBuffer(buf)
  const mono = irAudio.channelData.length === 1 ? irAudio.channelData[0] : irAudio.channelData[0]
  return { sampleRate: irAudio.sampleRate, mono }
}

function processChannelWithPedals(channel, pedals, sampleRate) {
  let out = channel
  const ctx = { sampleRate }
  for (let i = 0; i < (pedals || []).length; i++) {
    const p = pedals[i]
    out = applyPedal(out, p, ctx, String(i))
  }
  return out
}

function clampIRLength(ir, sampleRate, maxSeconds) {
  if (!maxSeconds || maxSeconds <= 0) return ir
  const maxSamples = Math.max(1, Math.floor(maxSeconds * sampleRate))
  if (ir.length <= maxSamples) return ir
  return ir.subarray(0, maxSamples)
}

function applyPhaseDelaySamples(ir, delaySamples) {
  const d = Math.max(0, Math.floor(delaySamples || 0))
  if (d === 0) return ir
  const out = new Float32Array(ir.length + d)
  out.set(ir, d)
  return out
}

function mixIRs(a, b, morph) {
  const m = typeof morph === 'number' ? Math.max(0, Math.min(1, morph)) : 0.5
  const len = Math.max(a.length, b.length)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const x = i < a.length ? a[i] : 0
    const y = i < b.length ? b[i] : 0
    out[i] = x * (1 - m) + y * m
  }
  return out
}

async function buildCabIR({ sampleRate, cabSim }) {
  const blockSize = cabSim.blockSize || 1024
  const irDir = cabSim.irBaseDir || path.join(process.cwd(), 'config', 'irs')

  const maxIRSeconds = typeof cabSim.maxIRSeconds === 'number' ? cabSim.maxIRSeconds : 0.185

  const irFile = cabSim.irFile
  const irFileB = cabSim.irFileB
  if (!irFile) throw new Error('cabSim.irFile required when cabSim.enabled=true')

  const safeIrPathA = resolveSafePath(irDir, irFile)
  const irA = await loadIRWav(safeIrPathA)
  let irAData = irA.mono
  if (irA.sampleRate !== sampleRate) irAData = resampleLinear(irAData, irA.sampleRate, sampleRate)
  irAData = clampIRLength(irAData, sampleRate, maxIRSeconds)

  if (!irFileB) {
    return { ir: irAData, blockSize }
  }

  const safeIrPathB = resolveSafePath(irDir, irFileB)
  const irB = await loadIRWav(safeIrPathB)
  let irBData = irB.mono
  if (irB.sampleRate !== sampleRate) irBData = resampleLinear(irBData, irB.sampleRate, sampleRate)
  irBData = clampIRLength(irBData, sampleRate, maxIRSeconds)

  const delaySamples = typeof cabSim.phaseDelaySamples === 'number' ? cabSim.phaseDelaySamples : 0
  const delayedB = applyPhaseDelaySamples(irBData, delaySamples)
  const morph = typeof cabSim.morph === 'number' ? cabSim.morph : 0.5
  const ir = mixIRs(irAData, delayedB, morph)

  return { ir, blockSize }
}

function createAudioProcessor({ sampleRate, pedals, cabSim }) {
  const pedalContext = { sampleRate }

  let convolver = null
  let cabMix = 1
  let cabEnabled = false

  async function ensureCab() {
    if (!cabSim || !cabSim.enabled) {
      cabEnabled = false
      convolver = null
      return
    }
    const built = await buildCabIR({ sampleRate, cabSim })
    convolver = new FIRConvolver({ ir: built.ir, blockSize: built.blockSize })
    cabMix = typeof cabSim.mix === 'number' ? cabSim.mix : 1
    cabEnabled = true
  }

  let cabReady = false

  async function processChannels(channelData) {
    if (!cabReady) {
      await ensureCab()
      cabReady = true
    }

    const processed = channelData.map(ch => {
      let out = ch
      for (let i = 0; i < (pedals || []).length; i++) {
        out = applyPedal(out, pedals[i], pedalContext, String(i))
      }
      return out
    })

    if (!cabEnabled || !convolver) return { sampleRate, channelData: processed }

    const blockSize = convolver.blockSize
    const outChannels = processed.map(ch => {
      const out = new Float32Array(ch.length)
      for (let i = 0; i < ch.length; i += blockSize) {
        const block = ch.subarray(i, i + blockSize)
        const padded = new Float32Array(blockSize)
        padded.set(block)
        const y = convolver.processBlock(padded)
        out.set(y.subarray(0, Math.min(block.length, blockSize)), i)
      }
      return out
    })

    if (cabMix >= 1) return { sampleRate, channelData: outChannels }
    if (cabMix <= 0) return { sampleRate, channelData: processed }

    const blended = outChannels.map((wet, idx) => {
      const dry = processed[idx]
      const b = new Float32Array(wet.length)
      for (let i = 0; i < wet.length; i++) b[i] = dry[i] * (1 - cabMix) + wet[i] * cabMix
      return b
    })

    return { sampleRate, channelData: blended }
  }

  return { processChannels }
}

async function processAudio({ sampleRate, channelData, pedals, cabSim }) {
  const proc = createAudioProcessor({ sampleRate, pedals, cabSim })
  return await proc.processChannels(channelData)
}

module.exports = {
  processAudio,
  createAudioProcessor
}
