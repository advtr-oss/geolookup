const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b } = recast.types
const { functions, utils: { identifier }, object } = require('@harrytwright/ast-types-wrapper')

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

  // Create the new AST
  const properties = {
    types: object.property('volume', identifier('String')), // zipkin: String
    defaults: object.property('volume', functions.method('process', 'cwd')) // zipkin: process.cwd()
  }

  /**
   * Add the required property
   * @param {Node} body
   * @param {Node} property
   * */
  const add = (body, property) => {
    const properties = body.declarations[0].init.properties
    properties.splice(properties.length, 0, property)
  }

  ast.program.body.forEach((node) => {
    if (node.type !== 'VariableDeclaration' || !['defaults', 'types'].includes(node.declarations[0].id.name)) return
    add(node, properties[node.declarations[0].id.name])
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
