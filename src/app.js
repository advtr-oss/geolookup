const cors = require('cors')
const helmet = require('helmet')
const express = require('express')
const erred = require('@hndlr/erred')
const compression = require('compression')
const { NotFound } = require('@hndlr/errors')
const { trace, morgan } = require('@harrytwright/networking').middleware

const log = require('./utils/log')
const reqID = require('./middleware/trace')
const elasticErrorHandler = require('./utils/erred-elastic')

/**
 * @param {Config} ctx
 * */
module.exports = (ctx) => {
  const app = express()

  // For reverse proxying
  app.set('trust proxy', !!ctx.get('proxy'))

  // CORS
  app.use(cors({
    origin: ctx.get('cors') || '*',
    methods: 'GET,HEAD',
    preflightContinue: false,
    optionsSuccessStatus: 204
  }))

  // Add more middlware here when required
  app.use(helmet())
  app.use(compression())

  // Handle the tracing
  //
  // Probably use a better system
  // in the future but self built
  // for now
  app.use(trace)
  app.use(reqID)

  // This will be reset back to using my fork
  // and trying to sending a PR with the use
  // of custom loggers
  app.use(morgan(log))

  /**
   * Routing
   * */
  const router = express.Router()
  require('./api')(router)
  app.use(ctx.get('route') || '/', router)

  /**
   * Add error handling, we like to pass all errors back as a JSON
   * object since we're an API, the client should handle these
   * appropriately!
   */
  app.get('*', async (req, res, next) => {
    return next(new NotFound(`Could not find ${req.path}`))
  })

  // Setup error handling
  let handler = erred({ stack: false })
  handler.use(elasticErrorHandler)
  app.use(handler)

  return app
}
