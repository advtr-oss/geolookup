const {
  Tracer,
  BatchRecorder,
  ConsoleRecorder,
  jsonEncoder: { JSON_V2 }
} = require('zipkin')

const { nanoid } = require('nanoid')

const CLSContext = require('zipkin-context-cls')
const { HttpLogger } = require('zipkin-transport-http')

const initialised = Symbol('initialised')

let tracer

class Zipkin {
  get tracer () {
    if (!tracer) {
      tracer = new Tracer({
        recorder: this.recorder,
        ctxImpl: new CLSContext(),
        localServiceName: this.localService
      })
    }

    return tracer
  }

  /**
   * @param {Config} config
   * */
  initialise (config) {
    this.localService = config.get('name')

    const zipkin = config.get('zipkin')
    if (!zipkin) throw new Error(`Invalid zipkin configuration, if in docker please use '${this.localService}:main'`)

    this.recorder = typeof zipkin === 'string' ? new BatchRecorder({
      logger: new HttpLogger({
        endpoint: `${zipkin}/api/v2/spans`,
        jsonEncoder: JSON_V2, // JSON encoder to use. Optional (defaults to JSON_V1)
        httpInterval: 1000,
        timeout: 1000,
        agent: new (require('http').Agent)({ keepAlive: true })
      })
    }) : new ConsoleRecorder()

    this[initialised] = true
  }

  express () {
    // This is for testing since we don't have a zipkin mock
    if (!this[initialised]) return (req, res, next) => {
      req._trace_id = { traceId: nanoid() }
      next()
    }

    return require('zipkin-instrumentation-express').expressMiddleware({ tracer: this.tracer })
  }

  Connection () {
    return require('./zipkin-connection')({ tracer: this.tracer, remoteServiceName: 'elasticsearch' })
  }
}

module.exports = new Zipkin()
