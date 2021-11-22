const nanoid = require('nanoid').nanoid
const { BadRequest } = require('@hndlr/errors')

const log = require('../utils/log')
const standardiseCoordinates = require('../utils/coordinates')

module.exports = Object.assign({}, {
  search: (req, res, next) => {
    let { query, location, sessiontoken, type = ['City', 'Country'] } = req.query

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

    type = Array.isArray(type) ? type : [type]
    if (type.some((el) => !['Country', 'FirstLevelNationAdministrativeDivision', 'SecondLevelNationAdministrativeDivision', 'City'].includes(el))) {
      return next(new BadRequest('Invalid types array, should be empty or contain valid type'))
    }

    next()
  }
})
