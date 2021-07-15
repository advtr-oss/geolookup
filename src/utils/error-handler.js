/**
 * TODO: In-conjunction with `networking`
 *
 * Should rewrite this
 *
 * 1) Needs to not use config at all. No guarantee the config is loaded
 *
 * 2) Could maybe have a log file for exits ?? /var/.service/logfile
 *
 * 3) Log more information
 *
 * 4) server shutdown should take custom codes
 * */

const os = require('os')

const server = require('@harrytwright/networking')

const log = require('./log')
// just for the loaded value
// we get the name for this instance as hostname
// will help piece things together
const config = require('../config')
const { name, version } = require('../../package.json')
const message = require('./error-message')

let exitCode = 0
let exitCalled = false

function exit (code) {
  exitCode = code

  log.verbose('error.exit', {}, exitCode)
  return server.shutdown('error')
}

module.exports = (err) => {
  if (!config.loaded) {
    // logging won't work unless we pretend that it's ready
    err = err || new Error('Exit prior to config file resolving.')
    console.error(err.stack || err.message)
  }

  if (exitCalled)
    err = err || new Error('Callback called more than once.')

  exitCalled = true
  if (!err) return exit(0)
  if (typeof err === 'string') {
    log.error('exit', err)
    return exit(1)
  } else if (!(err instanceof Error)) {
    log.error('exit', {}, err)
    return exit(1)
  }

  const m = err.code || err.message.match(/^(?:Error: )?(E[A-Z]+)/);
  if (m && !err.code) {
    err.code = m;
  } else if (err.name && !err.code) {
    err.code = err.name
  }

  /**
   * Strip the error so we can see the details
   * */
  const context = {}
  ;['type', 'stack', 'statusCode'].forEach(function (k) {
    const v = err[k];
    if (!v) return;
    context[k] = v
  });

  context['cwd'] = process.cwd()
  context['os'] = {
    'type': os.type(),
    'release': os.release()
  }

  context['argv'] = process.argv.map(JSON.stringify).join(' ')
  context['node'] = process.version
  context[name] = version

  ;[
    'code',
    'syscall',
    'file',
    'path',
    'dest',
    'errno'
  ].forEach(function(k) {
    const v = err[k];
    if (!v) return;
    context[k] = v
  });

  const msg = message(err);
  log.error('error.handler', context, msg)
  return exit(1)
}
