/**
 * time the network request??
 *
 * Run the promise, and regardless of result end tht timer
 * then if its an error, throw it
 *
 * @param {string} namespace
 * @param {Promise|function} fn
 * @async
 * */
module.exports = async (namespace, fn) => {
  let data, err

  process.emit('time', namespace)
  try {
    data = await fn()
  } catch (e) {
    err = e
  }
  process.emit('timeEnd', namespace)

  if (err) throw err
  return data
}
