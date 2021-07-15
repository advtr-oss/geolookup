#!/usr/bin/env bash

BASE_DIR="$(dirname "$(test -L "$0" && readlink "$0" || echo "$0")")"
BIN_DIR="${BASE_DIR}/../bin"

ES_URI=${ES_URI:-http://localhost:9200}
ES_USER=${ES_USER:-elastic}
ES_PASS=${ES_PASS:-changeme}

NODE_ENV=production node ${BIN_DIR}/www.js \
    --elastic-uri ${ES_URI} \
    --elastic-index geospatial \
    --elastic-username ${ES_USER} \
    --elastic-password ${ES_PASS} \
    --loglevel verbose \
    --port 3000

#docker pull advtr/geospatial:master
#
#docker container run --name geospatial -p 3000:3000 --rm \
#    -e "ES_HOST=${ES_URI}" \
#    -e "ES_INDEX=geospatial" \
#    -e "ES_USER=${ES_USER}" \
#    -e "ES_PASS=${ES_PASS}" \
#    -e "DB_COLLECTION=geospatial" \
#    -e "DB_URI=mongodb/geospatial" \
#    --network advtr-test \
#    advtr/geospatial:master
