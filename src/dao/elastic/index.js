const { URL } = require('url')

const { nanoid } = require('nanoid')
const { Client } = require('@elastic/elasticsearch')
const { id } = require('@harrytwright/networking').middleware.trace

const constants = require('./constants')

const time = require('../utils/time')
const log = require('../../utils/log')
const globalConfig = require('../../config')
const promiseOrCallback = require('../utils/promiseOrCallback')

const _client = Symbol('elastic:client')

/**
 * Elastic handler
 *
 * This will just do the routing and any changes to the
 * data we need
 * */
function Elastic () {
  this.ctx = undefined
  this[_client] = undefined

  // For testing only maybe??
  this.$_connection = undefined

  this.helpers = {
    ...constants
  }
}

/**
 * Create a new elasticsearch client
 *
 * If no callback is supplied a promise is returned
 *
 * @param {Config} config
 * @returns this
 * */
Elastic.prototype.connect = function (config = globalConfig) {
  const ctx = this.ctx = createElasticContext(config, this)
  this[_client] = new Client(ctx)

  this[_client].on('request', (err, result) => {
    const { meta } = result
    log.verbose('elastic.emit.request', { connection: meta.connection.id, status: meta.connection.status, trace: id() }, 'starting a new request')
  })

  this[_client].on('response', (err, result) => {
    const { meta } = result
    log.verbose('elastic.emit.response', { connection: meta.connection.id, status: meta.connection.status, trace: id() }, 'response received')
  })

  this[_client].on('resurrect', (err, result) => {
    const { connection, request } = result
    log.http(`elastic.emit.resurrect.${request.id}`, { connection: connection.id, status: connection.status }, 'resurrected a node')
  })

  return this
}

/**
 * Run a health-check on the clients cluster
 *
 * Returns a promise if no callback
 *
 * @param {Function} [callback]
 * @return [Promise]
 * */
Elastic.prototype.health = function (callback) {
  const self = this
  return promiseOrCallback(callback, (cb) => {
    time('elastic.health', () => self[_client].cluster.health())
      .then((value) => cb(null, value)).catch(cb)
  })
}

/**
 * Search the request on the cluster
 *
 * This method is timed too
 *
 * @note Returns a promise if no callback
 *
 * @param {Object} request - The request body
 * @param {Function} [callback]
 * @return [Promise]
 * */
Elastic.prototype.search = function (request, callback) {
  const self = this
  return promiseOrCallback(callback, (cb) => {
    time('elastic.search', async function () {
      const results = await self[_client].search({
        index: self.ctx.index,
        body: request
      })
      return results.body.hits
    }).then((value) => cb(null, value)).catch(cb)
  })
}

module.exports = new Elastic()

/**
 * Just create the elasticsearch client
 * context
 *
 * @todo clean this up a little
 *
 * @param {Config} config
 * @param {Elastic} elastic
 *
 * @return {Object}
 * */
function createElasticContext (config, elastic) {
  const auth = {}
  if (config.get('elastic-password') || config.get('elastic-username')) {
    auth.username = config.get('elastic-username')
    auth.password = config.get('elastic-password')
  }

  // const proxy = new URL(config.get('elastic-uri'))
  // proxy.username = config.get('elastic-username')
  // proxy.password = config.get('elastic-password')

  const ctx = {
    node: config.get('elastic-uri'),
    Connection: require('../../utils/zipkin').Connection(),

    // Could maybe name this host instead??
    name: config.get('name'),
    index: config.get('elastic-index'),
    log: config.get('loglevel'),
    generateRequestId: (params, options) => {
      const reqID = id()
      if (reqID) return reqID
      return nanoid()
    },
    auth
  }

  if (elastic.$_connection) ctx.Connection = elastic.$_connection

  return ctx
}
