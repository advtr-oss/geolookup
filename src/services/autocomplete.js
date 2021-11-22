/**
 * The only place any updates to the request body should happen
 * */

const { BadRequest, NoContent } = require('@hndlr/errors')

const elastic = require('../dao/elastic')

function Autocomplete () {}

/**
 * Generate the search body and query the index
 * */
Autocomplete.prototype.search = async function (input, location, type, country) {
  if (!!country && !Array.isArray(country)) {
    country = [country]
  }

  if (!input) {
    throw new BadRequest('Missing input')
  }

  // If there are country limitations, will be helpful to
  // filter with this
  let countryQuery
  if (country) {
    countryQuery = {
      terms: { country_code: country.map((el) => el.toUpperCase()) }
    }
  }

  const bias = elastic.helpers._geo_distance(location)

  const data = await elastic.search(this._request(input, bias, type, countryQuery))

  const results = data.hits.map(map)

  if (results.length < 1) { throw new NoContent() }

  return results
}

Autocomplete.prototype._request = function (input, bias, type, country) {
  return {
    size: 5,
    track_scores: false,
    sort: [
      '_score', bias
    ].filter(el => !!el),
    query: {
      bool: {
        must: [
          this._query(input),
          country,
          {
            terms: {
              type
            }
          }
        ]
      }
    }
  }
}

Autocomplete.prototype._query = function (input) {
  return {
    match: {
      'containers.entity.value': {
        query: input,
        operator: 'and',
        fuzziness: 0,
        max_expansions: 2
      }
    }
  }
}

module.exports = new Autocomplete()

// Map the ES return object to one we use
function map (hit) {
  return {
    placeid: hit._id,
    score: hit._score,
    ...hit._source
  }
}
