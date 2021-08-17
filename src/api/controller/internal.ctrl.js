const os = require('../../config/os')
const config = require('../../config')
const build = require('../../config/build')
const elasticsearch = require('../../dao/elastic')

module.exports = Object.assign({}, {
  home: (req, res, next) => {
    return res.status(200).json({
      name: config.get('name'),
      version: config.get('version'),
      os,
      build
    })
  },
  healthcheck: async (req, res, next) => {
    res.set('Content-Type', 'text/plain')

    try {
      const { body } = await elasticsearch.health()
      if (body.status !== 'green') return res.status(200).send(body.status).end()
    } catch (err) {
      return res.status(200).send('red').end()
    }

    return res.status(200).send('healthy').end()
  }
})
