function biquadCoefficients (type, sampleRate, freq, q, gainDb) {
  const w0 = 2 * Math.PI * (freq / sampleRate)
  const cosw0 = Math.cos(w0)
  const sinw0 = Math.sin(w0)
  const alpha = sinw0 / (2 * q)

  let b0, b1, b2, a0, a1, a2

  if (type === 'lowpass') {
    b0 = (1 - cosw0) / 2
    b1 = 1 - cosw0
    b2 = (1 - cosw0) / 2
    a0 = 1 + alpha
    a1 = -2 * cosw0
    a2 = 1 - alpha
  } else if (type === 'highpass') {
    b0 = (1 + cosw0) / 2
    b1 = -(1 + cosw0)
    b2 = (1 + cosw0) / 2
    a0 = 1 + alpha
    a1 = -2 * cosw0
    a2 = 1 - alpha
  } else if (type === 'peaking') {
    const a = Math.pow(10, (gainDb || 0) / 40)
    b0 = 1 + alpha * a
    b1 = -2 * cosw0
    b2 = 1 - alpha * a
    a0 = 1 + alpha / a
    a1 = -2 * cosw0
    a2 = 1 - alpha / a
  } else if (type === 'lowshelf') {
    const a = Math.pow(10, (gainDb || 0) / 40)
    const sqrtA = Math.sqrt(a)
    const twoSqrtAAlpha = 2 * sqrtA * alpha
    b0 = a * ((a + 1) - (a - 1) * cosw0 + twoSqrtAAlpha)
    b1 = 2 * a * ((a - 1) - (a + 1) * cosw0)
    b2 = a * ((a + 1) - (a - 1) * cosw0 - twoSqrtAAlpha)
    a0 = (a + 1) + (a - 1) * cosw0 + twoSqrtAAlpha
    a1 = -2 * ((a - 1) + (a + 1) * cosw0)
    a2 = (a + 1) + (a - 1) * cosw0 - twoSqrtAAlpha
  } else if (type === 'highshelf') {
    const a = Math.pow(10, (gainDb || 0) / 40)
    const sqrtA = Math.sqrt(a)
    const twoSqrtAAlpha = 2 * sqrtA * alpha
    b0 = a * ((a + 1) + (a - 1) * cosw0 + twoSqrtAAlpha)
    b1 = -2 * a * ((a - 1) + (a + 1) * cosw0)
    b2 = a * ((a + 1) + (a - 1) * cosw0 - twoSqrtAAlpha)
    a0 = (a + 1) - (a - 1) * cosw0 + twoSqrtAAlpha
    a1 = 2 * ((a - 1) - (a + 1) * cosw0)
    a2 = (a + 1) - (a - 1) * cosw0 - twoSqrtAAlpha
  } else {
    throw new Error('Unsupported biquad type: ' + type)
  }

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  }
}

class BiquadFilter {
  constructor (coeffs) {
    this.b0 = coeffs.b0
    this.b1 = coeffs.b1
    this.b2 = coeffs.b2
    this.a1 = coeffs.a1
    this.a2 = coeffs.a2
    this.x1 = 0
    this.x2 = 0
    this.y1 = 0
    this.y2 = 0
  }

  processSample (x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1
    this.x1 = x
    this.y2 = this.y1
    this.y1 = y
    return y
  }

  process (buffer) {
    const out = new Float32Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) out[i] = this.processSample(buffer[i])
    return out
  }
}

module.exports = { biquadCoefficients, BiquadFilter }
