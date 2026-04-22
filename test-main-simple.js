/* eslint-disable no-unused-vars */
const { app, BrowserWindow, ipcMain: _ipcMain, dialog: _dialog, shell: _shell, session: _session, powerMonitor: _powerMonitor } = require('electron')
const _path = require('path')

console.log('app:', app)
console.log('app.whenReady:', typeof app.whenReady)

function createWindow () {
  console.log('Creating window...')
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  console.log('Window created successfully')
}

app.whenReady().then(() => {
  console.log('App is ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
