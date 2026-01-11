/*
 * Simple Last.fm Bot Example
 * This script demonstrates how to use the Last.fm API client library
 */

// Load environment variables
import 'dotenv/config'
import LastFM from './index.js'
import readline from 'readline'

// You need to provide your Last.fm API key here
// Get one from: https://www.last.fm/api/account/create
const API_KEY = process.env.LASTFM_API_KEY || 'YOUR_LAST_FM_API_KEY'

// Create a Last.fm client instance
const lastfm = new LastFM(API_KEY)

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Main menu function
const menuActions = {
  1: searchArtist,
  2: getArtistInfo,
  3: getArtistTopTracks,
  4: searchTrack,
  5: getChartTopArtists,
  0: () => {
    rl.close()
  }
}

function showMenu () {
  rl.question('\nEnter your choice: ', (choice) => {
    const action = menuActions[choice]
    if (action) {
      action()
    } else {
      showMenu()
    }
  })
}

const LIMIT = 5
// Search for an artist
function searchArtist () {
  rl.question('Enter artist name to search: ', (query) => {
    lastfm.artistSearch({ q: query, limit: LIMIT }, (err, data) => {
      if (err) {
        console.error('Error:', err.message)
      } else {
        data.result.forEach((artist, index) => {
        })
      }
      showMenu()
    })
  })
}

// Get artist info
function getArtistInfo () {
  rl.question('Enter artist name: ', (name) => {
    lastfm.artistInfo({ name }, (err, artist) => {
      if (err) {
        console.error('Error:', err.message)
        showMenu()
        return
      }

      if (artist.summary) {
      }

      if (artist.similar && artist.similar.length > 0) {
        artist.similar.slice(0, LIMIT).forEach((similar, index) => {
        })
      }

      showMenu()
    })
  })
}

const TOP_TRACKS_LIMIT = 10
const TOP_ARTISTS_LIMIT = 10
// Get top tracks for an artist
function getArtistTopTracks () {
  rl.question('Enter artist name: ', (name) => {
    lastfm.artistTopTracks({ name, limit: TOP_TRACKS_LIMIT }, (err, data) => {
      if (err) {
        console.error('Error:', err.message)
        showMenu()
        return
      }

      data.result.forEach((track, index) => {
      })

      showMenu()
    })
  })
}

// Search for a track
function searchTrack () {
  rl.question('Enter track name to search: ', (query) => {
    lastfm.trackSearch({ q: query, limit: LIMIT }, (err, data) => {
      if (err) {
        console.error('Error:', err.message)
      } else {
        data.result.forEach((track, index) => {
        })
      }
      showMenu()
    })
  })
}

// Get chart top artists
function getChartTopArtists () {
  lastfm.chartTopArtists({ limit: TOP_ARTISTS_LIMIT }, (err, data) => {
    if (err) {
      console.error('Error:', err.message)
    } else {
      data.result.forEach((artist, index) => {
      })
    }
    showMenu()
  })
}

if (API_KEY === 'YOUR_LAST_FM_API_KEY') {
}

showMenu()
