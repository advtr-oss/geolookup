const {
  Tracer,
  BatchRecorder,
  ConsoleRecorder,
  jsonEncoder: {JSON_V2}
} = require('zipkin');

const CLSContext = require('zipkin-context-cls');
const { HttpLogger } = require('zipkin-transport-http');

let tracer;

class Zipkin {

  get tracer() {
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
  constructor(config) {
    this.localService = config.get('name')

    const zipkin = config.get('zipkin')
    if (!zipkin) throw new Error(`Invalid zipkin configuration, if in docker please use '${this.localService}:main'`)

    this.recorder = zipkin === true ? new ConsoleRecorder() : new BatchRecorder({
      logger: new HttpLogger({
        endpoint: zipkin,
        jsonEncoder: JSON_V2, // JSON encoder to use. Optional (defaults to JSON_V1)
        httpInterval: 1000,
        timeout: 1000,
        agent: new (require('http').Agent)({ keepAlive: true })
      })
    })
  }
}

let zipkin;
module.exports = (config) => {
  if (!zipkin) {
    zipkin = new Zipkin(config)
  }
  return zipkin
}
