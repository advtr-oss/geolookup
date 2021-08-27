const { promises: fs } = require('fs')
const path = require('path')
const espree = require('espree')

const exit = (err) => {
  console.error(err)
  process.exit(typeof err.code === 'number' ? err.code : 1)
}

main(process.argv)
  .then(() => console.log('Built'))
  .catch(exit)

async function main (args = process.argv) {
  const options = { dryRun: !!args.includes('--dry-run'), tabWidth: 2, quote: 'single' }
  const docker = !!args.includes('--docker')

  const workingDir = args[args.indexOf('--working-dir') + 1] || process.cwd()
  const cwd = docker ? path.relative(__dirname, workingDir) : workingDir

  const parser = {
    parse: (src) => espree.parse(src, {
      ecmaVersion: 11,
      comment: true,
      tokens: true,
      range: true,
      loc: true
    })
  }

  console.log('=> Update config/index.js')
  await require('./config')(path.join(cwd, './src/config/index.js'), parser, options)

  console.log('=> Update dao/elastic/index.js')
  await require('./elastic')(path.join(cwd, './src/dao/loader/index.js'), parser, options)

  console.log('=> Update service.js')
  await require('./service')(path.join(cwd, './src/service.js'), parser, options)

  if (!options.dryRun) {
    console.log('=> Copy mock.js')
    await fs.copyFile(path.join(__dirname, '../src/mock.js'), path.join(cwd, './src/utils/mock.js'))
  }
}
