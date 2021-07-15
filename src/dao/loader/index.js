/**
 * Load the clients, handle any errors inside this so
 * we can keep `service.js` cleaner and divide the code
 * out to more maintainable chunks.
 *
 * Should not be called during tests
 * */

const elastic = require('../elastic')

module.exports = (config) => {
  // Since this is just a rest API no need for closures
  elastic.connect(config)
}
