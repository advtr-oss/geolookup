const controller = require('../controller/geolookup.ctrl')
const validation = require('../../middleware/query.validation')

module.exports = (router) => {
  router.get('/geolookup', validation.search, controller.search)
  router.get('/geolookup/custom', controller.customESRequest)
}
