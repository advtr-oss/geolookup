# @advtr/geolookup

[![Node.js CI](https://github.com/advtr-oss/geolookup/actions/workflows/node.js.yml/badge.svg)](https://github.com/advtr-oss/geolookup/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/advtr-oss/geolookup/branch/main/graph/badge.svg?token=SLVA23MUD1)](https://codecov.io/gh/advtr-oss/geolookup)

> This is split from [geospatial](https://github.com/advtr-oss/geospatial)

## Deployment

### Shared Tags

#### Main

- `0.0.1` `0.0` `0` `main`
- `0.0.1-zipkin` `0.0-zipkin` `0-zipkin` `main-zipkin` `zipkin`
- `0.0.1-mock` `0.0-mock` `0-mock` `main-mock` `mock`

## API

### Lookup

```shell
$ curl --request GET -sL \
     --url '${API_ROUTE}/geolookup?location=1,1&query=hali'
```

#### Params

| Query Param | Description | Required |
|----|----|----|
| location | Coordinates to bias the results, can be set using standard [Geo URI scheme](https://en.wikipedia.org/wiki/Geo_URI_scheme) without the `geo:` prefix | `true` |
| query    | The city/country to lookup | `true` |
| sessiontoken | A token to help identify logs between geolookup, and geospatial, more for internal use | `false` |

