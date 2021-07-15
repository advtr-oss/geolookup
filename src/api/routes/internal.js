const controller = require('../controller/internal.ctrl')

module.exports = (router) => {
  router.get('/', controller.home)
  router.get('/_internal_/health', controller.healthcheck)
}
