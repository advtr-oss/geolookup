const { id } = require('@harrytwright/networking').middleware.trace

module.exports = (req, res, next) => {
  req.id = id()
  return next()
}
