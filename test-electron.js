const { app, BrowserWindow } = require('electron')

console.log('app:', app)
console.log('app.whenReady:', typeof app.whenReady)

if (app && typeof app.whenReady === 'function') {
  console.log('Electron imports working correctly')
  app.whenReady().then(() => {
    console.log('Electron app ready')
    app.quit()
  })
} else {
  console.error('Electron imports failed')
}
