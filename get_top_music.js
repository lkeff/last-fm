// Load environment variables from .env file
require('dotenv').config({ path: 'C:\\Users\\Administrator\\Documents\\GitHub\\last-fm\\.env' });

const LastFM = require('./index.js');

const apiKey = process.env.LASTFM_API_KEY;

const lastfm = new LastFM(apiKey);

console.log('Fetching the top 10 tracks from Last.fm...');

lastfm.chartTopTracks({ limit: 10 }, (err, data) => {
  if (err) {
    console.error('\nAn error occurred:', err.message);
    return;
  }

  if (!data || !data.result || data.result.length === 0) {
    console.log('No top tracks found.');
    return;
  }

  console.log('\n--- Top 10 Tracks on Last.fm ---');
  data.result.forEach((track, index) => {
    console.log(
      `${String(index + 1).padStart(2, '0')}. ${track.name} by ${track.artistName} - (${Number(track.listeners).toLocaleString()} listeners)`
    );
  });
  console.log('------------------------------------');
});
