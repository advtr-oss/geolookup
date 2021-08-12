# @advtr/geolookup

> This is split from [geospatial](https://github.com/advtr-oss/geospatial)

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

