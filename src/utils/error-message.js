const config = require('../config')

module.exports = message

function message (err) {
  let message

  const bind = typeof config.get('port') === 'string'
    ? `Pipe ${config.get('port')}`
    : `Port ${config.get('port')}`

  switch (err.code) {
    case 'MongoServerSelectionError':
      message = [
        err.message,
        '',
        `monk is unable to connect to: ${config.get('database-uri')}`,
        '',
        'Please run:',
        '    `$ docker container ps`',
        'To see if the container is running and that the port is exposed',
        '',
        'If running inside a closed network with docker, make sure the network',
        'has been created and your database and service are connected.',
        'Please run:',
        '    `$ docker network inspect`',
        '',
        'If a MongoDB server is not running, run:',
        '    `$ docker container run -p "27017:27017" --name mongodb --rm mongo`',
        'And attempt a restart'
      ].join('\n')
      break
    case 'EADDRINUSE':
      message = [
        err.message,
        '',
        `${bind} is already in use`,
        '',
        'To check and remove the previous running node process run',
        `    \`$ lsof -n -i4TCP:${config.get('port')} | grep LISTEN | tr -s ' ' | cut -f 2 -d ' ' | xargs kill -9\``,
        '',
        'Any other issues check',
        '    <https://stackoverflow.com/q/4075287/7031674>',
        ''
      ].join('\n')
      break
    default:
      message = err.message
      break
  }

  return message
}
