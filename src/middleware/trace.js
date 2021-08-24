module.exports = (req, res, next) => {
  req.id = req._trace_id
  return next()
}
