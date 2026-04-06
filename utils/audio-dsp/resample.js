function resampleLinear (input, inRate, outRate) {
  if (inRate === outRate) return input
  if (!input || input.length === 0) return new Float32Array(0)

  const ratio = outRate / inRate
  const outLength = Math.max(1, Math.round(input.length * ratio))
  const out = new Float32Array(outLength)

  for (let i = 0; i < outLength; i++) {
    const t = i / ratio
    const i0 = Math.floor(t)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const frac = t - i0
    const x0 = input[i0] || 0
    const x1 = input[i1] || 0
    out[i] = x0 + (x1 - x0) * frac
  }

  return out
}

module.exports = { resampleLinear }
