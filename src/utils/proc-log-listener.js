const log = require('./log')

module.exports = () => {
  process.on('log', (level, ...args) => {
    log[level](...args)
  })
}
