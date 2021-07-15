const os = require('os')

const log = require('./log')

module.exports = (config) => {
  log.level = config.get('loglevel')

  log.app = config.get('name') || os.hostname()

  // Handle any more things for the log bellow
}
