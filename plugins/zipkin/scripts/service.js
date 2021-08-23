const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b, namedTypes: n } = recast.types
const { functions, utils: { identifier } } = require('@harrytwright/ast-types-wrapper')

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

  const zipkinCallee = b.expressionStatement(functions.method(
    functions.req('./utils/zipkin'),
    'initialise',
    identifier('config')
  ))
  /**
   * Add the required property
   * @param {Node} body
   * @param {Node} property
   * @param {Number} idx
   * */
  const add = (body, property, idx) => {
    body.program.body[0].expression.right.body.body.splice(idx, 0, property)
  }

  let index
  ast.program.body[0].expression.right.body.body.forEach((node, idx) => {
    if (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression') {
      try {
        if (node.expression.arguments[0].value === './utils/perf') index = idx
      } catch (e) { }
    }
  })

  if (index) {
    add(ast, zipkinCallee, index + 1)
  }

  // If it's just a dry run should exit
  if (options.dryRun) {
    options.logger && options.logger(recast.prettyPrint(ast, { ...options }).code)
    return
  }

  // rewrite the file
  await fs.writeFile(filePath, recast.prettyPrint(ast, { ...options }).code)
  options.logger && options.logger(`=> Updated ${filePath}`)
}
