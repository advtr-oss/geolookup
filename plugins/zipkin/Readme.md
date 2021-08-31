# @advtr/geolookup:zipkin

This is a traced geolookup service, to primarily be used as the main image for the service. This will build
with connection tools for zipkin and any instruments needed for localised debugging

## Usage

This is a simple zipkin swapped version of the main image

```shell
# Create the zipkin instance
$ docker network create zipkin
$ docker container run -d -p 9411:9411 --network zipkin openzipkin/zipkin

# Create the elastic instance
$ docker network create datastore
$ docker container run -d -p 9200:9200 -p 9300:9300 --network datastore \
  --name elastic -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.14.0

# Create the geolookup
$ docker container run -d -p 3000:3000 --network datastore \
  -e "ZIPKIN=http://zipkin:9411" -e "ES_HOST=http://elastic:9200" \
  -e "ES_INDEX=geospatial" --name geolookup advtr/geolookup:zipkin
  
# Connect zipkin to geolookup
$ docker network connect zipkin geolookup
```
