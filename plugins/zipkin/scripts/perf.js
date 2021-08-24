const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b, visit } = recast.types
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

  visit(ast, {
    visitArrowFunctionExpression (path) {
      const node = path.node
      this.traverse(path)

      if (node.body.body[0].type === 'IfStatement') {
        // Take `ctx = { }` and replace the old trace code around it
        const ctx = node.body.body[0].consequent.body[1]
        node.body.body[0].consequent.body.splice(0, 3, ctx)
      }
    }
  })

  // Move the initial comments to the starting require
  const id = ast.program.body.shift()
  ast.program.body[0].comments = id.comments

  // If it's just a dry run should exit
  if (options.dryRun) {
    options.logger && options.logger(recast.prettyPrint(ast, { ...options }).code)
    return
  }

  // rewrite the file
  await fs.writeFile(filePath, recast.prettyPrint(ast, { ...options }).code)
  options.logger && options.logger(`=> Updated ${filePath}`)
}
