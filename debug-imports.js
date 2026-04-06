console.log('Starting import test...');

const electron = require('electron');
console.log('Electron imported:', typeof electron);
console.log('Electron keys:', Object.keys(electron));

const { app, BrowserWindow, ipcMain, dialog, shell, session, powerMonitor } = electron;
console.log('app after destructuring:', app);
console.log('app type:', typeof app);

// Test other imports one by one
try {
  console.log('Importing path...');
  const path = require('path');
  console.log('path imported');
} catch (e) {
  console.error('Error importing path:', e);
}

try {
  console.log('Importing crypto...');
  const crypto = require('crypto');
  console.log('crypto imported');
} catch (e) {
  console.error('Error importing crypto:', e);
}

try {
  console.log('Importing index.js...');
  const LastFM = require('./index.js');
  console.log('index.js imported');
} catch (e) {
  console.error('Error importing index.js:', e);
}

try {
  console.log('Importing axios...');
  const axios = require('axios');
  console.log('axios imported');
} catch (e) {
  console.error('Error importing axios:', e);
}

try {
  console.log('Importing fs...');
  const fs = require('fs');
  console.log('fs imported');
} catch (e) {
  console.error('Error importing fs:', e);
}

try {
  console.log('Importing utils/security.js...');
  const security = require('./utils/security.js');
  console.log('security.js imported');
} catch (e) {
  console.error('Error importing security.js:', e);
}

try {
  console.log('Importing utils/afk-guard.js...');
  const { createAFKGuard } = require('./utils/afk-guard.js');
  console.log('afk-guard.js imported');
} catch (e) {
  console.error('Error importing afk-guard.js:', e);
}

console.log('Final app check:', app);
console.log('app.whenReady:', typeof app.whenReady);

if (app && typeof app.whenReady === 'function') {
  console.log('SUCCESS: app is properly defined');
  app.quit();
} else {
  console.error('FAILED: app is still undefined');
}
