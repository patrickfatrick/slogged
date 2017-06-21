const {
 magenta,
 gray,
 bold,
 green,
 red,
 yellow
} = require('chalk')

export default function createSocketLogger (opts = {}) {
  const { minimal } = opts

  return function (socket, next) {
    try {
      const onevent = socket.onevent
      const ack = socket.ack
      const emit = socket.emit
      const onclose = socket.onclose
      let requestStart = null
      let packetEvent = null

      logUp('connection', socket.id)

      socket.onevent = function (packet) {
        requestStart = Date.now()
        packetEvent = packet.data[0]
        if (packet.data[0] === 'leave') logDown('leave', socket.id, null, !minimal && packet.data[1])
        else logUp(packetEvent, socket.id, !minimal && packet.data[1])
        onevent.call(socket, packet)
      }

      socket.ack = function (id) {
        return function (...args) {
          if (args[0]) logError(packetEvent, socket.id, Date.now() - requestStart, args[0], !minimal && '\n' + args[0].stack)
          else logDown(packetEvent, socket.id, Date.now() - requestStart, !minimal && args.slice(1))
          requestStart = null
          ack.call(socket, id)(...args)
        }
      }

      socket.emit = function (ev, ...args) {
        logEmit(ev, socket._rooms, socket.flags.broadcast, !minimal && args)
        emit.call(socket, ev, ...args)
      }

      socket.onclose = function () {
        logDown('disconnect', socket.id)
        onclose.call(socket)
      }

      next()
    } catch (e) {
      console.error(e)
      next(e)
    }
  }
}

function gather (...items) {
  return items.filter(item => item)
}

function logUp (socketEvent, id, payload) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('<--'),
      bold(socketEvent),
      gray(id),
      payload && JSON.stringify(payload)
    )
  )
}

function logDown (socketEvent, id, time, ack) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('-->'),
      bold(socketEvent),
      gray(id),
      green('OK'),
      time && gray(time + 'ms'),
      ack && ack.map(item => JSON.stringify(item)).join(' , ')
    )
  )
}

function logEmit (socketEvent, rooms, broadcast, payload) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('>>>'),
      bold(socketEvent),
      gray(rooms.length ? rooms : '/'),
      yellow(broadcast ? 'BROADCAST' : ''),
      payload && payload.map(item => JSON.stringify(item)).join(' , ')
    )
  )
}

function logError (socketEvent, id, time, error, stack) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      red('-->'),
      bold(socketEvent),
      gray(id),
      red('ERR'),
      gray(time + 'ms'),
      red(error.message),
      stack && stack
    )
  )
}
