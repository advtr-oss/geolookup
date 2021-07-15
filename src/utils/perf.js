/**
 * Time certain methods or calls
 * */

const { id } = require('@harrytwright/networking').middleware.trace

const log = require('./log')

const timings = new Map()

process.on('time', (name) => {
  timings.set(name, Date.now())
})

process.on('timeEnd', (name) => {
  if (timings.has(name)) {
    // Create the timing context
    const trace = id(); const ctx = { }
    if (trace) ctx.trace = trace

    const ms = Date.now() - timings.get(name)
    ctx.duration = ms

    log.timing(name, ctx, `Completed in ${ms}ms`)
    timings.delete(name)
  } else
    log.silly('timing', "Tried to end timer that doesn't exist:", name)
})
