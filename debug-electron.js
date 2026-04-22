console.log('Testing electron import...')

const electronPath = require.resolve('electron')
console.log('Electron path:', electronPath)

const electron = require('electron')
console.log('Electron type:', typeof electron)
console.log('Electron value:', electron)

// Try direct import
try {
  const directElectron = require('./node_modules/electron')
  console.log('Direct electron type:', typeof directElectron)
  console.log('Direct electron keys:', Object.keys(directElectron))
} catch (e) {
  console.error('Direct import failed:', e)
}
