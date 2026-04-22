// Load environment variables from .env file
require('dotenv/config')

const LastFM = require('./index.js')

const apiKey = process.env.LASTFM_API_KEY

const lastfm = new LastFM(apiKey)

const TOP_TRACKS_LIMIT = 10
const _PADDING = 2 // eslint-disable-line no-unused-vars
lastfm.chartTopTracks({ limit: TOP_TRACKS_LIMIT }, (err, data) => {
  if (err) {
    return
  }

  if (!data || !data.result || data.result.length === 0) {
    return
  }

  data.result.forEach((track, index) => {

  })
})
