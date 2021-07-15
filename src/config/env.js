/**
 * Any important values from `process.env` related to itself
 *
 * Mainly for the production or testing
 * */
const environment = module.exports = { }

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = (NODE_ENV === 'production')

/* istanbul ignore next */
const isTest = NODE_ENV === 'test' ||
  NODE_ENV === 'testing'

environment['node-env'] = NODE_ENV
environment.production = isProduction
environment.test = isTest
