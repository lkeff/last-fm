/*
 * Simple Last.fm Bot Example
 * This script demonstrates how to use the Last.fm API client library
 */

const LastFM = require('./index.js');
const readline = require('readline');

// You need to provide your Last.fm API key here
// Get one from: https://www.last.fm/api/account/create
const API_KEY = 'YOUR_LAST_FM_API_KEY';

// Create a Last.fm client instance
const lastfm = new LastFM(API_KEY);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main menu function
function showMenu() {
  console.log('\n===== Last.fm Bot =====');
  console.log('1. Search for an artist');
  console.log('2. Get artist info');
  console.log('3. Get top tracks for an artist');
  console.log('4. Search for a track');
  console.log('5. Get chart top artists');
  console.log('0. Exit');
  
  rl.question('\nEnter your choice: ', (choice) => {
    switch(choice) {
      case '1':
        searchArtist();
        break;
      case '2':
        getArtistInfo();
        break;
      case '3':
        getArtistTopTracks();
        break;
      case '4':
        searchTrack();
        break;
      case '5':
        getChartTopArtists();
        break;
      case '0':
        console.log('Goodbye!');
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        showMenu();
    }
  });
}

// Search for an artist
function searchArtist() {
  rl.question('Enter artist name to search: ', (query) => {
    console.log(`Searching for artist: ${query}...`);
    
    lastfm.artistSearch({ q: query, limit: 5 }, (err, data) => {
      if (err) {
        console.error('Error:', err.message);
      } else {
        console.log('\nResults:');
        data.result.forEach((artist, index) => {
          console.log(`${index + 1}. ${artist.name} (${artist.listeners.toLocaleString()} listeners)`);
        });
      }
      showMenu();
    });
  });
}

// Get artist info
function getArtistInfo() {
  rl.question('Enter artist name: ', (name) => {
    console.log(`Getting info for artist: ${name}...`);
    
    lastfm.artistInfo({ name }, (err, artist) => {
      if (err) {
        console.error('Error:', err.message);
        showMenu();
        return;
      }
      
      console.log('\nArtist Info:');
      console.log(`Name: ${artist.name}`);
      console.log(`Listeners: ${artist.listeners.toLocaleString()}`);
      console.log(`Tags: ${artist.tags.join(', ')}`);
      
      if (artist.summary) {
        console.log(`\nSummary: ${artist.summary}`);
      }
      
      if (artist.similar && artist.similar.length > 0) {
        console.log('\nSimilar Artists:');
        artist.similar.slice(0, 5).forEach((similar, index) => {
          console.log(`${index + 1}. ${similar.name}`);
        });
      }
      
      showMenu();
    });
  });
}

// Get top tracks for an artist
function getArtistTopTracks() {
  rl.question('Enter artist name: ', (name) => {
    console.log(`Getting top tracks for artist: ${name}...`);
    
    lastfm.artistTopTracks({ name, limit: 10 }, (err, data) => {
      if (err) {
        console.error('Error:', err.message);
        showMenu();
        return;
      }
      
      console.log(`\nTop tracks for ${name}:`);
      data.result.forEach((track, index) => {
        console.log(`${index + 1}. ${track.name}`);
      });
      
      showMenu();
    });
  });
}

// Search for a track
function searchTrack() {
  rl.question('Enter track name to search: ', (query) => {
    console.log(`Searching for track: ${query}...`);
    
    lastfm.trackSearch({ q: query, limit: 5 }, (err, data) => {
      if (err) {
        console.error('Error:', err.message);
      } else {
        console.log('\nResults:');
        data.result.forEach((track, index) => {
          console.log(`${index + 1}. ${track.name} by ${track.artistName}`);
        });
      }
      showMenu();
    });
  });
}

// Get chart top artists
function getChartTopArtists() {
  console.log('Getting chart top artists...');
  
  lastfm.chartTopArtists({ limit: 10 }, (err, data) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('\nTop Artists:');
      data.result.forEach((artist, index) => {
        console.log(`${index + 1}. ${artist.name} (${artist.listeners.toLocaleString()} listeners)`);
      });
    }
    showMenu();
  });
}

// Start the bot
console.log('Starting Last.fm Bot...');
console.log('NOTE: You need to set your Last.fm API key in the bot.js file');
console.log('Get a free API key from: https://www.last.fm/api/account/create');

// Check if API key is set
if (API_KEY === 'YOUR_LAST_FM_API_KEY') {
  console.log('\nWARNING: You need to edit bot.js and set your Last.fm API key first!');
  console.log('The bot will run but API calls will fail until you set a valid API key.');
}

// Show the main menu
showMenu();
