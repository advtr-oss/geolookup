const data = require('./db-data.json')
const mongo = require('../../src/dao/database')

module.exports.initialise = async () => {
  return mongo._insert(data)
}
