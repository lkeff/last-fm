const { fft, ifft } = require('fft-js')

function nextPow2(n) {
  let p = 1
  while (p < n) p <<= 1
  return p
}

function complexMul(a, b) {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
}

function padReal(arr, n) {
  const out = new Array(n)
  for (let i = 0; i < n; i++) out[i] = i < arr.length ? arr[i] : 0
  return out
}

class FIRConvolver {
  constructor({ ir, blockSize }) {
    if (!ir || ir.length === 0) throw new Error('IR is required')
    this.ir = ir
    this.blockSize = blockSize || 1024

    this.fftSize = nextPow2(this.blockSize + this.ir.length - 1)
    this.H = fft(padReal(this.ir, this.fftSize))
    this.overlap = new Float32Array(this.fftSize)
  }

  processBlock(input) {
    if (input.length !== this.blockSize) throw new Error('Input block must match blockSize')

    const X = fft(padReal(input, this.fftSize))

    const Y = new Array(this.fftSize)
    for (let i = 0; i < this.fftSize; i++) Y[i] = complexMul(X[i], this.H[i])

    const yC = ifft(Y)
    const y = new Float32Array(this.fftSize)
    for (let i = 0; i < this.fftSize; i++) y[i] = yC[i][0]

    const out = new Float32Array(this.blockSize)
    for (let i = 0; i < this.blockSize; i++) {
      out[i] = y[i] + this.overlap[i]
    }

    this.overlap.fill(0)
    for (let i = this.blockSize; i < this.fftSize; i++) {
      this.overlap[i - this.blockSize] = y[i]
    }

    return out
  }

  flushTail() {
    const tail = this.overlap.slice(0)
    this.overlap.fill(0)
    return tail
  }
}

function convolveStream({ input, ir, blockSize }) {
  const conv = new FIRConvolver({ ir, blockSize })
  const out = []
  for (let i = 0; i < input.length; i += blockSize) {
    const block = input.subarray(i, i + blockSize)
    if (block.length < blockSize) {
      const padded = new Float32Array(blockSize)
      padded.set(block)
      out.push(conv.processBlock(padded))
    } else {
      out.push(conv.processBlock(block))
    }
  }
  return out
}

module.exports = {
  FIRConvolver,
  convolveStream,
  nextPow2
}
