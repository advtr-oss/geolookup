/**
 * Going to coverage ignore this file as it's not the place
 * for it. Will be moved out to it's own package soon
 * */

/* istanbul ignore file */
const { InternalServerError, HTTPError } = require('@hndlr/errors')

module.exports = (error) => {
  if (error.name === 'ConnectionError') {
    let underlyingError = new Error(error.message)
    underlyingError.name = underlyingError.code = error.name
    underlyingError.meta = error.meta.meta.connection
    return new InternalServerError('Elasticsearch node is down', underlyingError)
  }

  if (error.message === 'index_not_found_exception') {
    let underlyingError = new Error(error.message)
    underlyingError.name = underlyingError.code = error.name
    underlyingError.meta = error.meta.body.error
    return new InternalServerError(`${error.meta.body.error["resource.id"]} does not exist`, underlyingError)
  }

  // This is a general error, will need to diversify for the proper
  // elasticsearch error handling
  if (error.meta && error.meta.statusCode) {
    let httpError = new HTTPError(error.message, error.meta.statusCode)
    error.meta = error.meta.body.error
    httpError.underlyingError = error
    return httpError
  }
}
