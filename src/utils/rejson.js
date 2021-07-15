// https://github.com/stockholmux/node_redis-rejson/blob/master/index.js

// Set these for the ones we actually want to use
function addReJSONModule (redis) {
  // var cmds = ["json.del", "json.get", "json.mget", "json.set", "json.type", "json.numincrby", "json.nummultby", "json.strappend", "json.strlen", "json.arrappend", "json.arrindex", "json.arrinsert", "json.arrlen", "json.arrpop", "json.arrtrim", "json.objkeys", "json.objlen", "json.debug", "json.forget", "json.resp"];

  ;['json.get', 'json.set'].forEach(function (aCmd) {
    redis.addCommand(aCmd)
  })
}

module.exports = addReJSONModule
