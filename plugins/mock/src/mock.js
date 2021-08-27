/**
 * Entire job of this is to fake being ES, we use these methods for the tests, and since this is just a sort of
 * integration test container, seems to be the most logical way of doing so
 * */

const fs = require('fs')
const path = require('path')

const glob = require('glob')

module.exports = (mock, config) => {
  const files = glob.sync('*.es.?(nd)json', {
    cwd: config.get('volume')
  }).map((file) => path.join(path.relative(process.cwd(), config.get('volume')), file))

  process.emit('log', 'info', 'mock:loader', { files: files }, `Found ${files.length} mocks to load`)

  const loadData = (filePath) => {
    process.emit('log', 'info', 'mock:loader', { file: filePath, ext: path.extname(filePath) }, `Loading mock from ${filePath}`)

    const buffer = fs.readFileSync(filePath);
    let data;
    if (path.extname(filePath) === '.ndjson') {
      // ndjson
      data = buffer.toString().trim().split('\n').map(JSON.parse)
    } else {
      data = JSON.parse(buffer.toString())
    }
    return data
  }

  let mockableData = []
  for (const file of files) {
    mockableData = [...mockableData, ...loadData(file)]
  }

  const scoring = mockableData.map((el) => ({
    score: createFuzzyScorer(el._source.containers.entity.value),
    id: el._id
  }))

  /**
   * Add a health check
   * */
  process.emit('log', 'info', 'mock:add', { path: '/_cluster/health', method: ['GET'] }, `Added mock for '/_cluster/health'`)
  mock.add({
    method: ['GET'],
    path: '/_cluster/health'
  }, () => ({
    cluster_name: 'testcluster',
    status: 'green'
  }))

  process.emit('log', 'info', 'mock:add', { path: '/geospatial/_search', method: ['GET', 'POST'] }, `Added mock for '/geospatial/_search'`)
  mock.add({
    method: ['GET', 'POST'],
    path: '/geospatial/_search'
  }, (params) => {
    // This should work, as long as the query stays the same
    const input = params.body.query.bool.must[0].match['containers.entity.value'].query
    const results = scoring.filter((el) => el.score(input) >= 1).map((el) => el.id)

    let hits = mockableData.filter((el) => results.includes(el._id))

    if (params.body.query.bool.must[1]) {
      hits = hits.filter((hit) => params.body.query.bool.must[1].terms.country_code.includes(hit._source.country_code))
    }

    return { hits: { hits } }
  })

  return mock
}

/**
 * Bellow is taken from https://j11y.io/javascript/fuzzy-scoring-regex-mayhem/
 *
 * This is a little scorer to try and dynamic some results so I'm not forcing
 * the results are almost similar to what I need
 * */
function createFuzzyScorer (text) {
  var matcher = makeFuzzyRegex(text)

  return function (query) {
    var match = matcher.exec(query)

    if (!match) return 0

    var captures = match.slice(1)
    var score = 0

    // The scoring loop:
    for (var i = 0, l = captures.length; i < l; i += 3) {
      var relevancyOfCharacter = Math.pow(i + 1, -2)
      if (captures[i]) score -= relevancyOfCharacter * 0.1
      if (captures[i + 1]) score += relevancyOfCharacter * 1
      if (captures[i + 2]) score -= relevancyOfCharacter * 0.1
    }

    score -= Math.abs(query.length - text.length) * 0.05

    return score
  }

  function makeFuzzyRegex (string) {
    if (!string) { return /^$/ }

    // Escape any potential special characters:
    var cleansed = string.replace(/\W/g, '\\$&')

    return RegExp(
      '^' +
      cleansed.replace(
        // Find every escaped and non-escaped char:
        /(\\?.)/g,
        // Replace with fuzzy character matcher:
        '(?:(^.)?($1)(.??))?'
      ) +
      '$',
      'i'
    )
  }
}
