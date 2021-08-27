#!/usr/bin/env bash

echo "npm install --save-dev espree recast ast-types @harrytwright/ast-types-wrapper"
npm install --save-dev espree recast ast-types @harrytwright/ast-types-wrapper

echo "npm uninstall --save-dev @elastic/elasticsearch-mock"
npm uninstall --save-dev @elastic/elasticsearch-mock

echo "npm install --save glob @elastic/elasticsearch-mock"
npm install --save glob @elastic/elasticsearch-mock
