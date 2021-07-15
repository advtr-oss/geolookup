module.exports = (router) => {
  require('./routes/internal')(router)
  require('./routes/geolookup')(router)
}
