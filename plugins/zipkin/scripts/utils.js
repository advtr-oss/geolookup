const { builders: b, namedTypes: n } = require('ast-types')
const k = require('ast-types/gen/kinds')

const Member = Symbol('utils_member')

/**
 * Create an identifier or return if the value is an Identifier or Expression
 *
 * @param {string|k.ExpressionKind} value
 *
 * @returns {k.ExpressionKind}
 * @throws
 * */
function identifier (value) {
  if (n.Identifier.check(value) || n.Expression.check(value)) return value
  if (typeof value === 'string') return b.identifier(value)
  throw new Error('Invalid identifier type: ' + value)
}

/***
 *
 * MEMBERS
 *
 * */

/**
 * Create a dot-notation member
 *
 * ```
 * member.method().value.thing
 * ```
 *
 * @param {string|k.ExpressionKind} klass
 * @param {string|k.ExpressionKind} method
 *
 * @returns {k.ExpressionKind}
 * @throws
 * */
function member (klass, ...method) {
  return _member(klass, [...method], false)
}

/**
 * Create a bracket-notation member
 *
 * ```
 * member[method][another]
 * ```
 *
 * @param {string|k.ExpressionKind} klass
 * @param {string|k.ExpressionKind} method
 *
 * @returns {k.ExpressionKind}
 * @throws
 * */
function computedMember (klass, ...method) {
  return _member(klass, [...method], true)
}

/**
 * Create a member with as many members via dot notation or bracket notation
 *
 * @param {string|k.ExpressionKind} klass
 * @param {Array<string|k.ExpressionKind>} methods
 * @param {Boolean} computed
 *
 * @returns {k.ExpressionKind}
 * @throws
 * @private
 * */
function _member (klass, methods, computed = false) {
  const mutatedMethods = [...methods]

  // Just need the initial one
  const startingDot = mutatedMethods.shift()
  let expression = b.memberExpression(identifier(klass), identifier(startingDot), computed)

  mutatedMethods.forEach((method) => {
    expression = b.memberExpression(expression, identifier(method), computed)
  })

  return expression
}

/***
 *
 * METHODS/FUNCTIONS
 *
 * */

/**
 * Create a function
 *
 * ```
 * require('path')
 * ```
 *
 * @param {k.ExpressionKind} method
 * @param {k.ExpressionKind} argument
 *
 * @returns {k.ExpressionKind}
 * */
function createFunction (method, ...argument) {
  return _method(method, [...argument])
}
/**
 * Create a function
 *
 * ```
 * module.require('path')
 * ```
 *
 * @param {string|k.ExpressionKind} klass
 * @param {k.ExpressionKind} method
 * @param {k.ExpressionKind} argument
 *
 * @returns {k.ExpressionKind}
 * @throws
 * */
function createMethod (klass, method, ...argument) {
  return _method(member(klass, method), [...argument])
}

/**
 * Create a method, just a simple wrapper for `b.callExpression`
 *
 * @param {k.ExpressionKind} method
 * @param {Array<k.ExpressionKind>} argumentsParams
 *
 * @returns {k.ExpressionKind}
 * @private
 * */
function _method (method, argumentsParams) {
  return b.callExpression(method, argumentsParams)
}

function createRequire (path) {

}

const utils = module.exports = Object.assign({}, {
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
    return b.callExpression(
      utils.member(klass, method),
      [...args]
    )
  },
  [Member]: (klass, methods, computed = false) => {
    const mutatedMethods = [...methods]

    // Just need the initial one
    const startingDot = mutatedMethods.shift()
    let expression = b.memberExpression(utils.identifier(klass), utils.identifier(startingDot), computed)

    mutatedMethods.forEach((method) => {
      expression = b.memberExpression(expression, utils.identifier(method), computed)
    })

    return expression
  },
  member: (klass, ...methods) => {
    return utils[Member](klass, [...methods], false)
  },
  computerMember: (klass, ...methods) => {
    return utils[Member](klass, [...methods], true)
  },
  identifier: (value) => {
    if (n.Identifier.check(value) || n.Expression.check(value)) return value
    if (typeof value === 'string') return b.identifier(value)
    throw new Error('Invalid identifier type: ' + value)
  },
  /**
   * @param {string} key
   * @param {Node} value
   * @param {'init'|'get'|'set'} kind
   * */
  property: (key, value, kind = 'init') => {
    return b.property(kind, utils.identifier(key), value)
  },
  object: (obj) => {
    const properties = []

    // TODO: Maybe have set a value to literal if it's not a node or something
    Object.keys(obj).forEach((key) => {
      properties.push(utils.property(key, obj[key]))
    })

    return b.objectExpression(properties)
  }
})
