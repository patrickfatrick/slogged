import test from 'ava'
import sinon from 'sinon'
import slogger from '../src'
import io from './io'
let socket
let server

test.before((t) => {
  io.use(slogger({ minimal: true }))
  server = require('./server')
})

// Ensure server is closed
test.after((t) => {
  server.close()
})

test.cb.beforeEach((t) => {
  t.context.consoleLog = console.log
  console.log = sinon.spy()
  setTimeout(t.end)
})

test.afterEach((t) => {
  console.log = t.context.consoleLog
})

// Tests are serial, so begin by connecting
test.cb('connection', (t) => {
  socket = require('./socket')
  socket.emit('event.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.is(console.log.callCount, 3)

    const eventLogArgs = console.log.args[0]

    t.is(eventLogArgs.length, 4)
    t.true(eventLogArgs[0].includes('[socket.io]'))
    t.true(eventLogArgs[1].includes('<--'))
    t.true(eventLogArgs[2].includes('connection'))
    t.true(/\w+/.test(eventLogArgs[3]))
    t.end()
  })
})

test.cb('event', (t) => {
  socket.emit('event.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.truthy(ack)
    t.is(console.log.callCount, 2)

    const eventArgLogs = console.log.args[0]

    t.is(eventArgLogs.length, 4)
    t.true(eventArgLogs[0].includes('[socket.io]'))
    t.true(eventArgLogs[1].includes('<--'))
    t.true(eventArgLogs[2].includes('event.spec'))
    t.true(/\w+/.test(eventArgLogs[3]))
    t.end()
  })
})

test.cb('ack', (t) => {
  socket.emit('ack.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.truthy(ack)
    t.is(console.log.callCount, 2)

    const ackLogArgs = console.log.args[1]

    t.is(ackLogArgs.length, 6)
    t.true(ackLogArgs[0].includes('[socket.io]'))
    t.true(ackLogArgs[1].includes('-->'))
    t.true(ackLogArgs[2].includes('ack.spec'))
    t.true(/\w+/.test(ackLogArgs[3]))
    t.true(ackLogArgs[4].includes('OK'))
    t.true(/\d{1,2}ms/.test(ackLogArgs[5]))
    t.end()
  })
})

test.cb('emit', (t) => {
  socket.emit('emit.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.truthy(ack)
    t.is(console.log.callCount, 3)

    const emitLogArgs = console.log.args[1]

    t.is(emitLogArgs.length, 4)
    t.true(emitLogArgs[0].includes('[socket.io]'))
    t.true(emitLogArgs[1].includes('>>>'))
    t.true(emitLogArgs[2].includes('emit'))
    t.true(emitLogArgs[3].includes('/'))
    t.end()
  })
})

test.cb('broadcast', (t) => {
  socket.emit('broadcast.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.truthy(ack)
    t.is(console.log.callCount, 3)

    const broadcastLogArgs = console.log.args[1]

    t.is(broadcastLogArgs.length, 5)
    t.true(broadcastLogArgs[0].includes('[socket.io]'))
    t.true(broadcastLogArgs[1].includes('>>>'))
    t.true(broadcastLogArgs[2].includes('broadcast'))
    t.true(broadcastLogArgs[3].includes('/'))
    t.true(broadcastLogArgs[4].includes('broadcast by'))
    t.end()
  })
})

test.cb('rooms', (t) => {
  socket.emit('join', 'room1')
  socket.emit('join', 'room2')
  socket.emit('rooms.spec', 'hello', (err, ack) => {
    t.falsy(err)
    t.truthy(ack)
    t.is(console.log.callCount, 5)

    const roomLogArgs = console.log.args[3]

    t.is(roomLogArgs.length, 4)
    t.true(roomLogArgs[0].includes('[socket.io]'))
    t.true(roomLogArgs[1].includes('>>>'))
    t.true(roomLogArgs[2].includes('rooms'))
    t.true(roomLogArgs[3].includes('room1,room2'))
    t.end()
  })
})

test.cb('error', (t) => {
  socket.emit('error.spec', 'hello', (err, ack) => {
    t.truthy(err)
    t.falsy(ack)
    t.is(console.log.callCount, 2)

    const errorLogArgs = console.log.args[1]

    t.is(errorLogArgs.length, 7)
    t.true(errorLogArgs[0].includes('[socket.io]'))
    t.true(errorLogArgs[1].includes('-->'))
    t.true(errorLogArgs[2].includes('error.spec'))
    t.true(/\w+/.test(errorLogArgs[3]))
    t.true(errorLogArgs[4].includes('ERR'))
    t.true(/\d{1,2}ms/.test(errorLogArgs[5]))
    t.true(errorLogArgs[6].includes('Oh no'))
    t.end()
  })
})

// Tests are serial, so end by disconnecting
test.cb('disconnect', (t) => {
  server.close(() => {
    t.is(console.log.callCount, 3)

    const disconnectAckLogArgs = console.log.args[0]
    t.is(disconnectAckLogArgs.length, 5)
    t.true(disconnectAckLogArgs[0].includes('[socket.io]'))
    t.true(disconnectAckLogArgs[1].includes('-->'))
    t.true(disconnectAckLogArgs[2].includes('disconnect'))
    t.true(/\w+/.test(disconnectAckLogArgs[3]))
    t.true(disconnectAckLogArgs[4].includes('OK'))

    const disconnectingEmitLogArgs = console.log.args[1]
    t.is(disconnectingEmitLogArgs.length, 4)
    t.true(disconnectingEmitLogArgs[0].includes('[socket.io]'))
    t.true(disconnectingEmitLogArgs[1].includes('>>>'))
    t.true(disconnectingEmitLogArgs[2].includes('disconnecting'))
    t.true(disconnectingEmitLogArgs[3].includes('/'))

    const disconnectEmitLogArgs = console.log.args[1]
    t.is(disconnectEmitLogArgs.length, 4)
    t.true(disconnectEmitLogArgs[0].includes('[socket.io]'))
    t.true(disconnectEmitLogArgs[1].includes('>>>'))
    t.true(disconnectEmitLogArgs[2].includes('disconnect'))
    t.true(disconnectEmitLogArgs[3].includes('/'))

    t.end()
  })
})
