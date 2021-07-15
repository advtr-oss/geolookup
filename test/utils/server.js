const http = require('http')

let server

module.exports.start = (app, configuration) => {
  return new Promise((resolve, reject) => {
    const port = normalizePort(configuration.port)
    app.set('port', port)

    server = http.createServer(app)

    server.listen(port)
    server.on('error', reject)
    server.on('listening', resolve)
  })
}

module.exports.close = () => {
  return new Promise(resolve => {
    server.close(resolve)
  })
}

function normalizePort (val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}
