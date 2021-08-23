const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b, namedTypes: n, visit } = recast.types
const { functions, utils: { identifier }, variable } = require('@harrytwright/ast-types-wrapper')

/**
 * @typedef {Object} Parser
 * @property {Function} parse
 * */

/**
 * @typedef {Object} ConfigOptions
 * @property {Boolean} [dryRun]
 * @property {Function} [logger]
 * @property {Number} [tabWidth]
 * */

/**
 * @type {ConfigOptions}
 * */
const defaultOptions = {
  dryRun: false,
  logger: console.log,
  tabWidth: 2
}

/**
 * @param {PathLike} filePath
 * @param {Parser} parser
 * @param {ConfigOptions} opts
 * */
module.exports = async (filePath, parser, opts = defaultOptions) => {
  const options = { ...defaultOptions, ...opts }

  // Lookup and parse the original config code
  const code = (await fs.readFile(filePath)).toString()
  const ast = recast.parse(code, { parser })

  const inserted = {}
  visit(ast, {
    visitVariableDeclaration (path) {
      const node = path.node
      this.traverse(path)

      if (node.declarations[0].id.name === 'log') {
        options.logger && options.logger(`==> Adding zipkin import @ ${filePath}`)

        path.insertAfter(
          variable.req('zipkin', './utils/zipkin')
        )
      }
    },
    visitExpressionStatement (path) {
      const node = path.node
      this.traverse(path)

      if (node?.expression?.callee?.object?.name === 'app' && !('middleware' in inserted)) {
        options.logger && options.logger(`==> Adding zipkin middleware @ ${filePath}`)

        path.insertBefore(
          b.expressionStatement(
            functions.method(
              'app',
              'use',
              functions.method(
                'zipkin',
                'express'
              )
            )
          )
        )
        inserted.middleware = true
      }
    }
  })

  // If it's just a dry run should exit
  if (options.dryRun) {
    options.logger && options.logger(recast.prettyPrint(ast, { ...options }).code)
    return
  }

  // rewrite the file
  await fs.writeFile(filePath, recast.prettyPrint(ast, { ...options }).code)
  options.logger && options.logger(`=> Updated ${filePath}`)
}
