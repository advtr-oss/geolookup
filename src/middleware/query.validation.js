const nanoid = require('nanoid').nanoid
const { BadRequest } = require('@hndlr/errors')

const log = require('../utils/log')
const standardiseCoordinates = require('../utils/coordinates')

module.exports = Object.assign({}, {
  search: (req, res, next) => {
    let { query, location, sessiontoken } = req.query

    try {
      location = standardiseCoordinates(location)
      Object.defineProperty(req.query, 'location', { configurable: false, get: () => location })
    } catch (err) {
      log.error('search', { trace: req.id, error: err.message, location, sessiontoken }, 'invalid location', err)
      return next(new BadRequest('Invalid location'))
    }

    if (!query || query === '' || typeof query !== 'string') {
      return next(new BadRequest('Invalid query string'))
    }

    next()
  }
})
