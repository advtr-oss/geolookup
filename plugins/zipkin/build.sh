#!/usr/bin/env bash

# shellcheck disable=SC2006
ROOT=`dirname "$0"`
CWD=`pwd`

bash "${ROOT}/scripts/npm-install.sh"

node "${ROOT}/scripts/build.js" --dry-run --working-dir "${CWD}"
