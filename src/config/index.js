const Config = require('@harrytwright/cli-config')

const {
  version,
  name
} = require('../../package.json')

const environment = require('./env')
const index = name.replace(/[@/]/g, '_')

const defaults = {
  ...environment,
  cors: '*',
  date: new Date(),
  'elastic-uri': 'http://localhost:9200',
  'elastic-index': index,
  'elastic-username': null,
  'elastic-password': null,
  loglevel: 'info',
  name,
  proxy: true,
  port: 3000,
  route: '/',
  version,
  zipkin: true
}

const types = {
  cors: String,
  date: [Date, String],
  'elastic-uri': require('url'),
  'elastic-index': String,
  'elastic-username': String,
  'elastic-password': String,
  loglevel: [
    'silent',
    'error',
    'warn',
    'notice',
    'http',
    'timing',
    'info',
    'verbose',
    'silly'
  ],
  name: String,
  'node-env': [null, String],
  production: Boolean,
  proxy: Boolean,
  port: [Number, String],
  route: String,
  test: Boolean,
  version: String,
  zipkin: [String, Boolean]
}

const shorthand = {}

const envFromTypes = Object.keys(types).reduce((curr, key) => ({
  ...curr,
  [key.replace(/-/, '_').toUpperCase()]: key
}), {})

const envMap = {
  ...envFromTypes,
  PORT: 'port',
  ES_HOST: 'elastic-uri',
  ELASTIC_HOST: 'elastic-uri',
  ELASTICSEARCH_HOST: 'elastic-uri',
  ES_INDEX: 'elastic-index',
  ELASTIC_INDEX: 'elastic-index',
  ELASTICSEARCH_INDEX: 'elastic-index',
  ES_PASS: 'elastic-password',
  ES_USER: 'elastic-username'
}

module.exports = new Config(defaults, types, envMap, {})
