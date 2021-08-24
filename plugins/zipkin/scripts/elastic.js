const { promises: fs } = require('fs')

const recast = require('recast')
const { builders: b, visit } = recast.types
const { functions, utils: { identifier, literal }, object } = require('@harrytwright/ast-types-wrapper')

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

  // Remove pointless imports
  ast.program.body = ast.program.body.filter((node) => {
    if (node.type !== 'VariableDeclaration') return true
    if (node?.declarations[0]?.init.type === 'MemberExpression') {
      return !['url', '@harrytwright/networking', '../utils/time'].includes(node?.declarations[0].init.object.object.arguments[0].value)
    }
    if (node?.declarations[0]?.init.type !== 'CallExpression') return true;
    if (node?.declarations[0]?.init?.callee?.name === 'require') {
      return !['url', '@harrytwright/networking', '../utils/time'].includes(node.declarations[0].init.arguments[0].value)
    }

    return true
  })

  visit(ast, {
    visitFunctionDeclaration(path) {
      const node = path.node
      this.traverse(path)

      if (node.id.name !== 'createElasticContext') return

      visit(node, {
        visitVariableDeclaration(path) {
          const node = path.node
          this.traverse(path)

          if (node.declarations[0].id.name === 'ctx') {
            node.declarations[0].init.properties.forEach((prop, idx) => {
              // Replace `generateRequestId` w/ `Connection`
              const connection = object.property(
                'Connection',
                functions.method(functions.req('../../utils/zipkin'), 'Connection')
              )
              if (prop.key.name === 'generateRequestId') node.declarations[0].init.properties.splice(idx, 1, connection)
            })
          }
        }
      })
    },
    visitAssignmentExpression(path) {
      const node = path.node
      this.traverse(path)

      if (node.right.type !== 'FunctionExpression') return
      if (node.left.property.name === 'connect') {
        visit(node.right.body, {
          visitExpressionStatement(path) {
            const node = path.node
            this.traverse(path)

            // Remove trace.id from verbose calls
            if (node.expression?.callee?.property?.name === 'verbose') {
              node.expression.arguments[1].properties.pop()
            }
          }
        })
      } else if (node.left.property.name === 'health') {
        visit(node.right.body, {
          visitReturnStatement(path) {
            const node = path.node
            this.traverse(path)

            const health = b.expressionStatement(
              functions.method(
                functions.method(
                  functions.method(
                    object.member(
                      object.computedMember(
                        'self',
                        '_client'
                      ),
                      'cluster'
                    ),
                    'health'
                  ),
                  'then',
                  b.arrowFunctionExpression(
                    [identifier('value')],
                    functions.func('cb', literal(null), identifier('value'))
                  )
                ),
                'catch',
                identifier('cb')
              )
            )
            node.argument.arguments[node.argument.arguments.length - 1].body.body.splice(0, 1, health)
          }
        })
      } else if (node.left.property.name === 'search') {
        const search = b.expressionStatement(
          functions.method(
            functions.method(
              functions.method(
                functions.method(
                  object.computedMember(
                    'self',
                    '_client'
                  ),
                  'search',
                  object.object.withProperties(
                    object.property(
                      'index',
                      object.member(
                        'self',
                        'ctx',
                        'index'
                      )
                    ),
                    object.property(
                      'body',
                      identifier('request')
                    )
                  )
                ),
                'then',
                b.arrowFunctionExpression(
                  [identifier('results')],
                  object.member('results', 'body', 'hits')
                )
              ),
              'then',
              b.arrowFunctionExpression(
                [identifier('value')],
                functions.func('cb', literal(null), identifier('value'))
              )
            ),
            'catch',
            identifier('cb')
          )
        )

        const arguments = node.right.body.body[node.right.body.body.length - 1].argument.arguments
        arguments[arguments.length - 1].body.body.splice(0, 1, search)
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
