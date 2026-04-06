const wavDecoder = require('wav-decoder')
const wavEncoder = require('wav-encoder')

async function decodeWavBuffer (buffer) {
  const audioData = await wavDecoder.decode(buffer)
  const channelData = audioData.channelData || []
  const sampleRate = audioData.sampleRate
  if (!sampleRate || channelData.length === 0) {
    throw new Error('Invalid WAV: missing sampleRate or channelData')
  }
  return {
    sampleRate,
    channelData
  }
}

async function encodeWavBuffer ({ sampleRate, channelData }) {
  if (!sampleRate || !Array.isArray(channelData) || channelData.length === 0) {
    throw new Error('Invalid audio data: missing sampleRate or channelData')
  }
  const arrayBuffer = await wavEncoder.encode({ sampleRate, channelData })
  return Buffer.from(arrayBuffer)
}

function pcm16leToFloat32Channels (pcmBuffer, channels) {
  if (!Buffer.isBuffer(pcmBuffer)) throw new Error('pcmBuffer must be a Buffer')
  if (!channels || channels < 1) throw new Error('channels must be >= 1')
  if (pcmBuffer.length % (channels * 2) !== 0) throw new Error('pcmBuffer length not aligned to channels')

  const frames = pcmBuffer.length / (channels * 2)
  const out = Array.from({ length: channels }, () => new Float32Array(frames))
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const offset = (i * channels + ch) * 2
      const s = pcmBuffer.readInt16LE(offset)
      out[ch][i] = s / 32768
    }
  }
  return out
}

function float32ChannelsToPcm16le (channelsData) {
  if (!Array.isArray(channelsData) || channelsData.length === 0) throw new Error('channelsData must be an array')
  const channels = channelsData.length
  const frames = channelsData[0].length
  for (let ch = 1; ch < channels; ch++) {
    if (channelsData[ch].length !== frames) throw new Error('All channels must have same length')
  }

  const out = Buffer.alloc(frames * channels * 2)
  for (let i = 0; i < frames; i++) {
    for (let ch = 0; ch < channels; ch++) {
      let v = channelsData[ch][i]
      if (!Number.isFinite(v)) v = 0
      v = Math.max(-1, Math.min(1, v))
      const s = Math.round(v * 32767)
      const offset = (i * channels + ch) * 2
      out.writeInt16LE(s, offset)
    }
  }
  return out
}

module.exports = {
  decodeWavBuffer,
  encodeWavBuffer,
  pcm16leToFloat32Channels,
  float32ChannelsToPcm16le
}
