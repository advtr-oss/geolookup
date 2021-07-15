/**
 * Not really important but just nice to test
 * */

const chai = require('chai')

const logger = require('../src/utils/log')

const expect = chai.expect

describe('logging', function () {
  before(function () {
    // No need to check stdin either
    // just wipe this
    logger.record = []
  })

  describe('namespace is set', function () {
    it('should have the correct namespace', function () {
      logger.info('correct', 'something informative')
      const record = logger.record.pop()

      expect(record.namespace).to.be.equal('correct')
      expect(record.level).to.be.equal('info')
    })
  })

  describe('context is set', function () {
    it('should have the correct context', function () {
      logger.info('context', { hello: 'world' }, 'something informative')
      const record = logger.record.pop()

      expect(record.context).to.include.any.keys('hello')
      expect(record.context).to.be.deep.equal({ hello: 'world' })
    })
  })
})
