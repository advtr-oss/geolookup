const { InternalServerError } = require('@hndlr/errors')

const log = require('../../utils/log')
const autocompleteService = require('../../services/autocomplete')

module.exports = Object.assign({}, {
  customESRequest: (req, res, next) => {
    res.set('Cache-Control', `max-age=${60 * 60 * 24 * 365}`)
    return next(new InternalServerError('Not Implemented Yet'))
  },
  search: async (req, res, next) => {
    // These are handled by the validation tool
    let { query, location, sessiontoken, country, type = ['City', 'Country'] } = req.query

    type = Array.isArray(type) ? type : [type]

    try {
      const results = await autocompleteService.search(query, location, type, country)

      return res.status(200).json({
        meta: {
          status: 200,
          requestId: req.id
        },
        results
      })
    } catch (err) {
      log.error('controller:search', { trace: req.id, status: err.status, sessiontoken }, err.message)
      return next(err)
    }
  }
})
