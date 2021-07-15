const os = require('os')

module.exports = Object.assign({}, {
  type: os.type(),
  release: os.release()
})
