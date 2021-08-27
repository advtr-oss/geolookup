const url = require('url')

const {
  Instrumentation
} = require('zipkin')

const {
  Connection
} = require('@elastic/elasticsearch')

let kTracer, kRemoteServiceName

class ZipkinConnection extends Connection {
  constructor (opts) {
    super(opts)

    this.instrumentation = new Instrumentation.HttpClient({ tracer: kTracer, remoteServiceName: kRemoteServiceName })
  }

  request (params, callback) {
    kTracer.scoped(() => {
      const requestOpts = this.buildRequestObject(params)
      const zipkinOpts = this.instrumentation.recordRequest(requestOpts, url.format(this.buildRequestObject(params)).toString(), 'GET')
      const traceId = kTracer.id

      super.request(params, (err, response) => {
        if (err) {
          kTracer.scoped(() => {
            this.instrumentation.recordError(traceId, err)
          })
        } else {
          kTracer.scoped(() => {
            this.instrumentation.recordResponse(traceId, response.statusCode)
          })
        }
        callback(err, response)
      })
    })
  }

  buildRequestObject (params) {
    const url = this.url
    const request = {
      protocol: url.protocol,
      hostname: url.hostname[0] === '['
        ? url.hostname.slice(1, -1)
        : url.hostname,
      hash: url.hash,
      search: url.search,
      pathname: url.pathname,
      path: '',
      href: url.href,
      origin: url.origin,
      // https://github.com/elastic/elasticsearch-js/issues/843
      port: url.port !== '' ? url.port : undefined,
      headers: this.headers,
      agent: this.agent
    }

    const paramsKeys = Object.keys(params)
    for (let i = 0, len = paramsKeys.length; i < len; i++) {
      const key = paramsKeys[i]
      if (key === 'path') {
        request.pathname = resolve(request.pathname, params[key])
      } else if (key === 'querystring' && !!params[key] === true) {
        if (request.search === '') {
          request.search = '?' + params[key]
        } else {
          request.search += '&' + params[key]
        }
      } else if (key === 'headers') {
        request.headers = Object.assign({}, request.headers, params.headers)
      } else {
        request[key] = params[key]
      }
    }

    request.path = request.pathname + request.search

    return request
  }
}

function resolve (host, path) {
  const hostEndWithSlash = host[host.length - 1] === '/'
  const pathStartsWithSlash = path[0] === '/'

  if (hostEndWithSlash === true && pathStartsWithSlash === true) {
    return host + path.slice(1)
  } else if (hostEndWithSlash !== pathStartsWithSlash) {
    return host + path
  } else {
    return host + '/' + path
  }
}

module.exports = ({ tracer, remoteServiceName }) => {
  kTracer = tracer
  kRemoteServiceName = remoteServiceName

  return ZipkinConnection
}
