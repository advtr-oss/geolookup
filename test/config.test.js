const chai = require('chai')
const requireInject = require('require-inject')

const { name: pkgName } = require('../package.json')

const expect = chai.expect

describe('config', function () {
  describe('env-vars', function () {
    let env;

    before(function () {
      env = process.env
      process.env.PORT = 9000
    })

    after(function () {
      process.env = env
    })

    it('should load a correct var', function () {
      const config = requireInject('../src/config')
      config.load()

      expect(config.get('port')).to.be.eq(9000)
    });
  });

  // This will revert to a default value
  describe('invalid types', function () {
    let argv;

    before(function () {
      argv = process.argv
      process.argv = ['/node', 'app', '--elastic-uri', 'not-a-url']
    })

    after(function () {
      process.argv = argv
    })

    it('should load a correct var', function () {
      const config = requireInject('../src/config')
      config.load()

      expect(config.get('elastic-uri')).to.be.eq(config.get('elastic-uri', 'default'))
    });
  });

  describe('default values', function () {
    it('should load a correct var', function () {
      const config = requireInject('../src/config')
      config.load()

      expect(config.get('name')).to.be.eq(pkgName)
    });
  });
})
