const recast = require('recast')

const { builders: b, namedTypes: n } = recast.types

module.exports = Object.assign({}, {
  /**
   * Create a require call with the required path/pkg
   *
   * @param {string} path
   * */
  require: (path) => {
    return b.callExpression(
      b.identifier('require'), [
        b.literal(path)
      ]
    )
  },
  /**
   * Create a variable require call
   *
   * @param {ExpressionKind} require
   * @param {string} name
   * @param {'const'|'var'|'let'} kind
   * */
  requireDeclaration: (require, name, kind = 'const') => {
    return b.variableDeclaration(kind, [
      b.variableDeclarator(b.identifier(name), require)
    ])
  },
  /**
   * Create a method call
   *
   * @param {string|ExpressionKind} klass
   * @param {string} method
   * @param {ExpressionKind} args
   * */
  method: (klass, method, ...args) => {
    // The klass could be anything, even multiple items with dot notation
    const klassIdentifier = typeof klass === 'string' ? b.identifier(klass) : klass,
      methodIdentifier = b.identifier(method)

    return b.callExpression(
      b.memberExpression(klassIdentifier, methodIdentifier, false),
      [...args]
    )
  }
})
