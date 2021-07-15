/* istanbul-ignore-file */

const os = require('os')
const build = module.exports = {}

const FLAVOUR = {
  DOCKER: 'docker',
  MANUAL: 'manual'
}

build.flavour = process.env.DOCKER === 'true' ? FLAVOUR.DOCKER : FLAVOUR.MANUAL
build.name = os.hostname()

// These need to be set during the CI
//
// So we can see where this version has come from
build.tag = process.env.DOCKER_TAG || undefined
build.sha = (process.env.SOURCE_COMMIT && process.env.SOURCE_COMMIT.substr(0, 7)) || undefined
build.branch = process.env.SOURCE_BRANCH || undefined
