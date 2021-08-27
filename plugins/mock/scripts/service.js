const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b, namedTypes: n } = recast.types
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

  const mock = variable.req('Mock', '@elastic/elasticsearch-mock')
  const mockConstant = variable.constant('mock', b.newExpression(identifier('Mock'), []))
  const mockCallee = b.expressionStatement(functions.func(
    functions.req('./utils/mock'),
    identifier('mock'),
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
      var _node$expression, _node$expression$call, _node$expression$call2, _node$expression2, _node$expression3, _node$expression3$arg;

      if (!!((_node$expression = node.expression) !== null && _node$expression !== void 0 && (_node$expression$call = _node$expression.callee) !== null && _node$expression$call !== void 0 && _node$expression$call.arguments) && ((_node$expression$call2 = node.expression.callee.arguments[0]) === null || _node$expression$call2 === void 0 ? void 0 : _node$expression$call2.value) === './dao/loader') {
        node.expression.arguments.splice(0, 0, identifier('mock'));
      } else if (!!((_node$expression2 = node.expression) !== null && _node$expression2 !== void 0 && _node$expression2.arguments) && ((_node$expression3 = node.expression) === null || _node$expression3 === void 0 ? void 0 : (_node$expression3$arg = _node$expression3.arguments[0]) === null || _node$expression3$arg === void 0 ? void 0 : _node$expression3$arg.value) === './utils/perf') {
        index = idx;
      }
    }
  })

  if (index) {
    add(ast, mock, index + 1)
    add(ast, mockConstant, index + 2)
    add(ast, mockCallee, index + 3)
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
