/**
 * Entire job of this is to fake being ES, we use these methods for the tests, and since this is just a sort of
 * integration test container, seems to be the most logical way of doing so
 * */

const fs = require('fs')
const path = require('path')

const glob = require('glob')
const chokidar = require('chokidar')

const log = require('./log')

module.exports = (mock, config) => {
  log.info('mock', { cwd: config.get('volume') }, `Volume path set at ${config.get('volume')}`)

  let processedData = []

  // Create a rough scoring, called as a function so it creates data each time
  const scoring = memorise(() => {
    return processedData.map((el) => ({
      score: createFuzzyScorer(el._source.containers.entity.value),
      id: el._id
    }))
  }, processedData)

  // Load the files from the mock folder
  const load = () => {
    log.notice('mock:loader', { cwd: config.get('volume') }, `Loading files @ ${config.get('volume')}`)

    const files = glob.sync('*.es.?(nd)json', {
      cwd: config.get('volume')
    }).map((file) => path.join(path.relative(process.cwd(), config.get('volume')), file))

    log.info('mock:loader', { files: files }, `Found ${files.length} mocks to load`)

    let rawData = []
    for (const file of files) {
      rawData = [...rawData, ...loadData(file)]
    }

    processedData = rawData
  }

  // Call load
  log.notice('mock:bootstrap', 'Initial call to load')
  load()

  // Add the healthcheck
  log.info('mock:add', { path: '/_cluster/health', method: ['GET'] }, `Added mock for '/_cluster/health'`)
  mock.add({
    method: ['GET'],
    path: '/_cluster/health'
  }, () => ({
    cluster_name: 'testcluster',
    status: 'green'
  }))

  // Add the fake search
  log.info('mock:add', { path: `/${config.get('elastic-index')}/_search`, method: ['GET', 'POST'] }, `Added mock for '/${config.get('elastic-index')}/_search'`)
  mock.add({
    method: ['GET', 'POST'],
    path: `/${config.get('elastic-index')}/_search`
  }, (params) => {
    // This should work, as long as the query stays the same
    const input = params.body.query.bool.must[0].match['containers.entity.value'].query
    const results = scoring().filter((el) => el.score(input) >= 1).map((el) => el.id)

    let hits = processedData.filter((el) => results.includes(el._id))

    if (params.body.query.bool.must[1]) {
      hits = hits.filter((hit) => params.body.query.bool.must[1].terms.country_code.includes(hit._source.country_code))
    }

    return { hits: { hits } }
  })

  log.notice('mock:bootstrap', { }, 'Setting chokidar to watch for mock changes')
  chokidar.watch('*.es.?(nd)json', { ignored: /^\./, persistent: true, cwd: config.get('volume'), ignoreInitial: true })
    .on('add', (path) => {
      log.info('mock:watcher', { path }, `File added to mock folder @ ${path}`)
      load()
    }).on('change', (path) => {
    log.info('mock:watcher', { path }, `File updated in mock folder @ ${path}`)
    load()
  })

  return mock
}

function Memorised(count, result, deps) {
  this.count = count
  this.result = result
  this.deps = JSON.stringify(deps)
}

/**
 * Function to be save time on when calling score and update only when their is a change to dependencies
 *
 * Very rough work at a memorisation function
 * */
function memorise(fn, deps) {
  let count = 0
  const dependency = {}

  return (...args) => {
    if (!dependency[fn] || dependency[fn].deps !== JSON.stringify(deps)) {
      dependency[fn] = new Memorised(!dependency[fn]?.count ? count++ : dependency[fn]?.count, fn(...args), deps)
    }
    return dependency[fn].result
  }
}

function loadData(filePath) {
  log.info('mock:loader', { file: filePath, ext: path.extname(filePath) }, `Loading mock from ${filePath}`)

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
