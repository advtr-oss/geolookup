#!/usr/bin/env node

const chai = require('chai')
const chaiHttp = require('chai-http')
const requireInject = require('require-inject')

const { name, version } = require('../package.json')

const app = require('../src/app')

const expect = chai.expect

chai.use(chaiHttp)

describe('server', function () {
  let config;

  before(function () {
    // Have to load this first, any subsequent
    config = require('../src/config')
    config.load()
  })

  after(function () {
    // Clean up pls
    delete require.cache[require.resolve('../src/config')]
  })

  describe('/', function () {
    let server;

    before(function () {
      server = app(config)
    })

    it('should return service information', async function () {
      const res = await chai.request(server).get('/')

      expect(res).status(200)
      expect(res).to.be.json
      expect(res.body.name).to.be.eq(name)
      expect(res.body.version).to.be.eq(version)
    });
  });

  describe('404', function () {
    let server;

    before(function () {
      server = app(config)
    })

    it('should return service information', async function () {
      const res = await chai.request(server).get('/random')

      expect(res).status(404)
      expect(res).to.be.json
    });
  });

  /**
   * This isn't 100% right due to how config works
   * */
  describe('health-check', function () {
    let app;

    before(function () {
      const config = requireInject('../src/config')
      config.load()

      app = require('../src/app')(config)
    })

    it('should return a valid health-check', async function () {
      // Use one of the most known ip address so not to dox anyone
      const res = await chai.request(app).get('/_internal_/health')
      expect(res).to.have.status(200)
    });
  });

  describe('custom base route', function () {
    let app;

    before(function () {
      const config = requireInject('../src/config')
      config.load()
      config.set('route', '/v1')

      app = require('../src/app')(config)
    })

    it('should return a 200', async function () {
      // Use one of the most known ip address so not to dox anyone
      const res = await chai.request(app).get('/v1/')
      expect(res).status(200)
      expect(res).to.be.json
      expect(res.body.name).to.be.eq(name)
      expect(res.body.version).to.be.eq(version)
    })
  })

  describe('default values', function () {
    let config;

    before(function () {
      config = requireInject('../src/config')
      config.load()
      config.set('cors', undefined)
      config.set('route', undefined)
    })

    it('should use the fallback options', function () {
      expect(() => require('../src/app')(config)).to.not.throw()
    })
  })
});
