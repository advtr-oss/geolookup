#!/usr/bin/env node

const chai = require('chai')
const chaiHttp = require('chai-http')
const Mock = require('@elastic/elasticsearch-mock')

const mock = new Mock()
require('./utils/elastic-mock')(mock)

const elastic = require('../src/dao/elastic')

const expect = chai.expect

chai.use(chaiHttp)

describe('search', function () {
  let app;

  before('initialisation', async function () {
    // Default app with config
    const config = require('../src/config')
    config.load()

    app = require('../src/app')(config)

    // connect to the mock
    config.set('elastic-index', 'geospatial')
    elastic.$_connection = mock.getConnection()
    elastic.connect(config)
  })

  after('termination', async function () {
    delete require.cache[require.resolve('../src/config')]
    delete require.cache[require.resolve('../src/dao/elastic')]
  })

  describe('location bias', function () {
    describe('valid coordinates', function () {
      describe('geo uri scheme', function () {
        it('should return a 204', async function () {
          const res = await chai.request(app).get('/geolookup?query=h&location=1,-1')
          expect(res).status(204)
        })
      })

      describe('WKT POINT primitive', function () {
        it('should return a 204', async function () {
          const res = await chai.request(app).get('/geolookup?query=h&location=POINT%20(1%20-1)')
          expect(res).status(204)
        })
      })
    })

    describe('invalid', function () {
      it('should return a 400', async function () {
        const res = await chai.request(app).get('/geolookup?location=false')
        expect(res).status(400)
      })
    })
  })

  describe('input', function () {
    // Since we don't use fuzziness a single letter will return a 204
    describe('single character', function () {
      it('should return a 204', async function () {
        const res = await chai.request(app).get('/geolookup?query=h&location=1,-1')
        expect(res).status(204)
      })
    })

    describe('no input', function () {
      it('should return a 400', async function () {
        const res = await chai.request(app).get('/geolookup?location=1,-1')
        expect(res).status(400)
      })
    })

    describe('valid input', function () {
      it('should return a 200', async function () {
        // Can't check for actual results as the returns here will be different to
        // what es will give, see `../globals/mock.js` for why
        const res = await chai.request(app).get('/geolookup?query=halif&location=1,-1')
        expect(res).status(200)
        expect(res.body.results).to.be.an('array')
      })
    })
  })

  xdescribe('country filter', function () {
    describe('single country', function () {
      it('should return a filtered result', async function () {
        // Can't check for actual results as the returns here will be different to
        // what es will give, see `../globals/mock.js` for why
        const res = await chai.request(app).get('/geolookup?query=halif&location=1,-1&country=MN')
        expect(res).status(200)
        expect(res.body.results).to.be.an('array').that.is.not.empty

        const countryCodes = check(res.body.results, (el) => el.country_code)
        expect(countryCodes).to.have.members(['MN'])
      })
    })

    describe('multiple country', function () {
      it('should return multiple filtered countries', async function () {
        // Can't check for actual results as the returns here will be different to
        // what es will give, see `../globals/mock.js` for why
        const res = await chai.request(app).get('/geolookup?query=ha&location=1,-1&country[]=fr&country=gb')
        expect(res).status(200)
        expect(res.body.results).to.be.an('array').that.is.not.empty

        const countryCodes = check(res.body.results, (el) => el.country_code)
        expect(countryCodes).to.have.members(['GB', 'FR'])
      })
    })
  })
})

function check (array, map) {
  return array.map(map)
}
