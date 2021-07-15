'use strict'

/**
 * Get the elastic search query
 * */
const elasticData = require('./es-data.json')
const scoring = elasticData.map((el) => ({
  score: createFuzzyScorer(el._source.containers.entity.value),
  id: el._id
}))

/**
 * Add any mock methods to the the test mock
 *
 * @param {ClientMock} mock
 * */
module.exports = (mock) => {
  /**
   * Add a health check
   * */
  mock.add({
    method: ['GET'],
    path: '/_cluster/health'
  }, () => ({
    cluster_name: 'testcluster',
    status: 'yellow'
  }))

  mock.add({
    method: ['GET', 'POST'],
    path: '/geospatial/_search'
  }, (params) => {
    // This should work, as long as the query stays the same
    const input = params.body.query.bool.must[0].match['containers.entity.value'].query
    const results = scoring.filter((el) => el.score(input) >= 1).map((el) => el.id)

    let hits = elasticData.filter((el) => results.includes(el._id))

    if (params.body.query.bool.must[1]) {
      hits = hits.filter((hit) => params.body.query.bool.must[1].terms.country_code.includes(hit._source.country_code))
    }

    return { hits: { hits } }
  })
}

// {"status":200,"results":[{"placeid":"8949505","score":12.021529,"phrase":"Livera|Provincia di Biella|Piedmont|Italy","location":{"lat":45.61239,"lon":8.10571},"country_code":"IT","containers":{"entity":{"value":"Livera"},"admin2":{"value":"Provincia di Biella"},"admin1":{"value":"Piedmont"},"nation":{"value":"Italy"}},"type":"City"},{"placeid":"3174666","score":12.021529,"phrase":"Liveri|Napoli|Campania|Italy","location":{"lat":40.90406,"lon":14.56536},"country_code":"IT","containers":{"entity":{"value":"Liveri"},"admin2":{"value":"Napoli"},"admin1":{"value":"Campania"},"nation":{"value":"Italy"}},"type":"City"},{"placeid":"2998078","score":10.863438,"phrase":"Liverdun|Meurthe et Moselle|Grand Est|France","location":{"lat":48.74973,"lon":6.06372},"country_code":"FR","containers":{"entity":{"value":"Liverdun"},"admin2":{"value":"Meurthe et Moselle"},"admin1":{"value":"Grand Est"},"nation":{"value":"France"}},"type":"City"},{"placeid":"2644210","score":10.371102,"phrase":"Liverpool|Liverpool|England|United Kingdom","location":{"lat":53.41058,"lon":-2.97794},"country_code":"GB","containers":{"entity":{"value":"Liverpool"},"admin2":{"value":"Liverpool"},"admin1":{"value":"England"},"nation":{"value":"United Kingdom"}},"type":"City"},{"placeid":"4970214","score":10.371102,"phrase":"Livermore|Androscoggin County|Maine|United States","location":{"lat":44.38396,"lon":-70.24922},"country_code":"US","containers":{"entity":{"value":"Livermore"},"admin2":{"value":"Androscoggin County"},"admin1":{"value":"Maine"},"nation":{"value":"United States"}},"type":"City"}]}

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

// const results = scoring.filter((el) => el.score('halif') >= 1)
// console.log(results)
