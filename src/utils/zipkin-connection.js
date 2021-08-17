const {
  Instrumentation
} = require('zipkin');

const {
  Connection
} = require('@elastic/elasticsearch')

let kTracer, kRemoteServiceName;

class ZipkinConnection extends Connection {
  constructor(opts) {
    super(opts);

    this.instrumentation = new Instrumentation.HttpClient({ tracer: kTracer, remoteServiceName: kRemoteServiceName })
  }

  request(params, callback) {
    kTracer.scoped(() => {
      const zipkinOpts = this.instrumentation.recordRequest(params, this.url.toString(), 'GET')
      const traceId = kTracer.id;

      super.request(params, (err, response) => {
        if (err) {
          kTracer.scoped(() => {
            this.instrumentation.recordError(traceId, err);
          })
        } else {
          kTracer.scoped(() => {
            this.instrumentation.recordResponse(traceId, response.statusCode);
          })
        }
        callback(err, response)
      })
    })
  }
}

module.exports = ({ tracer, remoteServiceName }) => {
  kTracer = tracer
  kRemoteServiceName = remoteServiceName

  return ZipkinConnection
}
