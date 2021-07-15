function Point (x, y) {
  this.lat = x
  this.lon = y
}

Point.prototype.toGeoJSON = function () {
  return {
    type: 'Point',
    coordinates: [this.lon, this.lat]
  }
}

Point.prototype.validate = function () {
  if (!latitude(this.lat)) throw new Error('Invalid latitude: ' + this.lat)
  if (!longitude(this.lon)) throw new Error('Invalid longitude: ' + this.lon)
  return this
}

const lat = ['lat', 'x']

const standardiseCoordinates = module.exports = (location) => {
  if (!location || (Array.isArray(location) && location.length !== 2)) throw new TypeError('Invalid Location')

  // No point checking... 🥁
  if (location instanceof Point) return location.validate()

  // For GeoJSON or any array of coordinates
  if (Array.isArray(location)) {
    return new Point(parseFloat(location[1]), parseFloat(location[0])).validate()
  } else if (typeof location === 'string' && location.includes(',')) {
    // reverse this since above tests for geojson
    return standardiseCoordinates(location.split(',').slice(0, 2).reverse())
  } else if (typeof location === 'string' && location.includes('POINT')) {
    // $ curl ~/search?location=POINT(12,89)
    return standardiseCoordinates(location.replace('POINT (', '').replace(')', '').split(' ').reverse())
  } else if (typeof location === 'object' && !Array.isArray(location)) {
    // For GeoJSON, assume if coordinates is passed then it must be GeoJSON, or if coords should work either way
    if ('coordinates' in location) return standardiseCoordinates(location.coordinates)

    // Turn an object into Point probably never called but should be okay
    return Object.keys(location).reduce((loc, el) => {
      loc[lat.includes(el) ? 'lat' : 'lon'] = parseFloat(location[el])
      return loc
    }, new Point(0, 0)).validate()
  } else {
    throw new TypeError('Invalid Location')
  }
}

module.exports.Point = Point

/**
 * Utilities
 * */

function between (value, n1, n2) {
  return n1 <= value && n2 >= value
}

function longitude (lon) {
  return !!(isNumber(lon) && between(lon, -180, 180))
}

function latitude (lat) {
  return !!(isNumber(lat) && between(lat, -90, 90))
}

function isNumber (n) {
  return typeof n === 'number'
}
