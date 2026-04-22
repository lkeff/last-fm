const { biquadCoefficients, BiquadFilter } = require('./biquad')

function applyGain (x, gain) {
  return x * gain
}

function softClip (x, drive) {
  const d = Math.max(0, drive || 1)
  return Math.tanh(x * d)
}

function makeNoiseGate ({ threshold = 0.02, reduction = 0.0, attackMs = 5, releaseMs = 50, sampleRate }) {
  const attack = Math.exp(-1 / ((attackMs / 1000) * sampleRate))
  const release = Math.exp(-1 / ((releaseMs / 1000) * sampleRate))
  let env = 0
  return function process (buffer) {
    const out = new Float32Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      const x = buffer[i]
      const absx = Math.abs(x)
      if (absx > env) env = attack * env + (1 - attack) * absx
      else env = release * env + (1 - release) * absx
      const g = env < threshold ? reduction : 1
      out[i] = x * g
    }
    return out
  }
}

function makeCompressor ({ thresholdDb = -18, ratio = 4, makeupDb = 0, attackMs = 10, releaseMs = 100, sampleRate }) {
  const thr = Math.pow(10, thresholdDb / 20)
  const makeup = Math.pow(10, makeupDb / 20)
  const attack = Math.exp(-1 / ((attackMs / 1000) * sampleRate))
  const release = Math.exp(-1 / ((releaseMs / 1000) * sampleRate))
  let env = 0
  return function process (buffer) {
    const out = new Float32Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      const x = buffer[i]
      const absx = Math.abs(x)
      if (absx > env) env = attack * env + (1 - attack) * absx
      else env = release * env + (1 - release) * absx

      let g = 1
      if (env > thr && env > 0) {
        const over = env / thr
        const compressed = Math.pow(over, (1 / ratio) - 1)
        g = compressed
      }
      out[i] = x * g * makeup
    }
    return out
  }
}

function makeEQ ({ bands = [], sampleRate }) {
  const filters = bands.map(b => {
    const type = b.type
    const freq = b.freq
    const q = b.q || 0.707
    const gainDb = b.gainDb || 0
    const coeffs = biquadCoefficients(type, sampleRate, freq, q, gainDb)
    return new BiquadFilter(coeffs)
  })

  return function process (buffer) {
    let out = buffer
    for (const f of filters) out = f.process(out)
    return out
  }
}

function makeDelay ({ timeMs = 250, feedback = 0.25, mix = 0.2, sampleRate }) {
  const delaySamples = Math.max(1, Math.round((timeMs / 1000) * sampleRate))
  const buf = new Float32Array(delaySamples)
  let idx = 0
  return function process (input) {
    const out = new Float32Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const d = buf[idx]
      const x = input[i]
      buf[idx] = x + d * feedback
      idx = (idx + 1) % delaySamples
      out[i] = x * (1 - mix) + d * mix
    }
    return out
  }
}

function applyPedal (buffer, pedal, context, pedalKey) {
  if (!pedal || !pedal.type) return buffer
  const type = pedal.type
  const key = pedalKey || type
  if (!context._state) context._state = Object.create(null)
  if (!context._state[key]) context._state[key] = Object.create(null)
  const state = context._state[key]

  if (type === 'gain') {
    const g = typeof pedal.gain === 'number' ? pedal.gain : 1
    const out = new Float32Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) out[i] = applyGain(buffer[i], g)
    return out
  }
  if (type === 'drive') {
    const d = typeof pedal.drive === 'number' ? pedal.drive : 2
    const mix = typeof pedal.mix === 'number' ? pedal.mix : 1
    const out = new Float32Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      const wet = softClip(buffer[i], d)
      out[i] = buffer[i] * (1 - mix) + wet * mix
    }
    return out
  }
  if (type === 'gate') {
    if (!state.gate) state.gate = makeNoiseGate({ ...pedal, sampleRate: context.sampleRate })
    return state.gate(buffer)
  }
  if (type === 'compressor') {
    if (!state.comp) state.comp = makeCompressor({ ...pedal, sampleRate: context.sampleRate })
    return state.comp(buffer)
  }
  if (type === 'eq') {
    if (!state.eq) state.eq = makeEQ({ ...pedal, sampleRate: context.sampleRate })
    return state.eq(buffer)
  }
  if (type === 'delay') {
    if (!state.delay) state.delay = makeDelay({ ...pedal, sampleRate: context.sampleRate })
    return state.delay(buffer)
  }

  return buffer
}

module.exports = {
  applyPedal
}
