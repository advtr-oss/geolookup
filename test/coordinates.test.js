const chai = require('chai')

const coordinates = require('../src/utils/coordinates')

const expect = chai.expect

describe('coordinates', function () {
  // https://en.wikipedia.org/wiki/Geo_URI_scheme
  describe('Geo URI scheme', function () {
    describe('valid coordinates', function () {
      it('should return the point', function () {
        expect(coordinates('37.78918,-122.40335')).to.be.deep
          .equal(new coordinates.Point(37.78918, -122.40335))
      })
    })

    describe('invalid coordinates', function () {
      it('should throw', function () {
        expect(() => { coordinates('180,-122.40335') }).to.throw()
      })
    })
  })

  describe('WKT POINT primitive', function () {
    describe('valid coordinates', function () {
      it('should return the point', function () {
        expect(coordinates('POINT (-71.34 41.12)')).to.be.deep
          .equal(new coordinates.Point(-71.34, 41.12))
      })
    })

    describe('invalid coordinates', function () {
      it('should throw', function () {
        expect(() => { coordinates('POINT (-180 41.12)') }).to.throw()
      })
    })
  })

  describe('GeoJSON', function () {
    describe('valid coordinates', function () {
      it('should return the point', function () {
        expect(coordinates({ type: 'Point', coordinates: [40, 5] })).to.be.deep
          .equal(new coordinates.Point(5, 40))
      })
    })

    describe('invalid coordinates', function () {
      it('should throw', function () {
        expect(() => { coordinates({ type: 'Point', coordinates: [190, 40] }) }).to.throw()
      })
    })

    describe('returning geojson', function () {
      const coords = new coordinates.Point(40, 5)
      expect(coords.toGeoJSON()).to.be.deep.equal({
        type: 'Point',
        coordinates: [5, 40]
      })
    })
  })

  describe('primitive objects', function () {
    describe('valid object', function () {
      it('should return a point', function () {
        const coords = { lat: 40, lon: 5 }
        expect(coordinates(coords)).to.be.deep
          .equal(new coordinates.Point(40, 5))
      })
    })

    describe('weird geojson object', function () {
      it('should return a point', function () {
        // Maybe its saved somewhere like this
        const coords = { coordinates: { lat: 40, lon: 5 } }
        expect(coordinates(coords)).to.be.deep
          .equal(new coordinates.Point(40, 5))
      })
    })

    describe('array', function () {
      describe('valid', function () {
        it('should return a point', function () {
          // Maybe its saved somewhere like this
          const coords = [5, 40]
          expect(coordinates(coords)).to.be.deep
            .equal(new coordinates.Point(40, 5))
        })
      })

      describe('invalid', function () {
        it('should throw', function () {
          // Maybe its saved somewhere like this
          const coords = [5, 40, 505]
          expect(() => { coordinates(coords) }).to.throw()
        })
      })
    })

    describe('point', function () {
      it('should return the point', function () {
        // Maybe its saved somewhere like this
        const coords = new coordinates.Point(40, 5)
        expect(coordinates(coords)).to.be.deep
          .equal(new coordinates.Point(40, 5))
      })
    })

    describe('invalid type', function () {
      it('should throw', function () {
        // Maybe its saved somewhere like this
        const coords = true
        expect(() => { coordinates(coords) }).to.throw()
      })
    })
  })
})
