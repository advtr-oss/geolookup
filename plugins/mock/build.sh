#!/usr/bin/env bash

# shellcheck disable=SC2006
ROOT=`dirname "$0"`
CWD=`pwd`

bash "${ROOT}/scripts/npm-install.sh"

node "${ROOT}/scripts/build.js" --working-dir "${CWD}" --dry-run
