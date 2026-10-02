const fs = require('fs')
const path = require('path')

/**
 * Persists countdown timers to a JSON file. Writes go to a temp file first
 * and are renamed into place so a crash never leaves a half-written file.
 */
class JsonFileStore {
  constructor (filePath) {
    if (!filePath) throw new Error('Missing required `filePath` argument')
    this.filePath = path.resolve(filePath)
  }

  load () {
    let raw
    try {
      raw = fs.readFileSync(this.filePath, 'utf8')
    } catch (err) {
      if (err.code === 'ENOENT') return { timers: [] }
      throw err
    }
    try {
      const data = JSON.parse(raw)
      return {
        timers: Array.isArray(data.timers) ? data.timers : [],
        nextId: Number.isInteger(data.nextId) ? data.nextId : undefined
      }
    } catch (err) {
      console.error(`Ignoring unreadable countdown store ${this.filePath}:`, err.message)
      return { timers: [] }
    }
  }

  save ({ timers, nextId }) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    const tmp = `${this.filePath}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify({ version: 1, nextId, timers }, null, 2))
    fs.renameSync(tmp, this.filePath)
  }
}

module.exports = { JsonFileStore }
