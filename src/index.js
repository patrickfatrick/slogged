const {
 magenta,
 gray,
 bold,
 green,
 red,
 yellow
} = require('chalk')

export default function slogger (opts = {}) {
  // minimal flag controls whether payloads, acks, and error stacks are logged
  const {
    minimal = false
  } = opts

  return function (socket, next) {
    try {
      // First log the connection
      logUp('connection', socket.id)

      const onevent = socket.onevent
      const ack = socket.ack
      const emit = socket.emit
      const onclose = socket.onclose
      let requestStart = null
      let packetEvent = null

      socket.onevent = function (packet) {
        // Start the timer used in ack/error logging
        requestStart = Date.now()
        packetEvent = packet.data[0]

        // 'leave' events are actually from the client,
        // but this looks nicer (to me anyway)
        if (packetEvent === 'leave') {
          logDown(
            packetEvent,
            socket.id,
            null,
            [ packet.data[1] ]
          )
        } else {
          logUp(
            packetEvent,
            socket.id,
            (!minimal || packetEvent === 'join') && packet.data[1]
          )
        }

        // Call the real onevent function
        onevent.call(socket, packet)
      }

      socket.ack = function (id) {
        // ack returns a function of unknown arity, so log data as a list
        return function (...args) {
          // Error scenario, assumes `ack` is used like a standard
          // Connect signature where the error is passed as the first arg
          if (args[0]) {
            logError(
              packetEvent,
              socket.id,
              Date.now() - requestStart,
              args[0],
              !minimal && `\n${args[0].stack}`
            )
          } else {
            logDown(
              packetEvent,
              socket.id,
              Date.now() - requestStart,
              !minimal && args.slice(1)
            )
          }

          // Reset the timer, then call the real ack
          requestStart = null
          ack.call(socket, id)(...args)
        }
      }

      // emit has unknown arity, so log data as a list
      socket.emit = function (ev, ...args) {
        // Display the source client id but only if it's important,
        // ie. when the event is being broadcast
        logEmit(
          ev,
          socket._rooms,
          socket.flags.broadcast && socket.id,
          !minimal && args
        )

        // Call the real emit function
        emit.call(socket, ev, ...args)
      }

      socket.onclose = function () {
        logDown('disconnect', socket.id)

        // Call the real onclose function
        onclose.call(socket)
      }

      // Move to the next middleware, or the callback
      next()
    } catch (e) {
      console.error(e)
      next(e)
    }
  }
}

/**
 * Utility function to return all truthy values provided as an array
 * @param   {Any}   items any arguments
 * @returns {Array}       only the truthy arguments
 */
function gather (...items) {
  return items.filter(item => item)
}

/**
 * All client-sent events except for leave, as well as connection event
 * @param   {String}  packetEvent event sent by the client
 * @param   {String}  id          client id
 * @param   {Any}     payload     data sent by the client
 * @returns                       void
 */
function logUp (packetEvent, id, payload) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('<--'),
      bold(packetEvent),
      gray(id),
      payload && JSON.stringify(payload)
    )
  )
}

/**
 * Used for acks and errors, as well as disconnect and leave events
 * @param   {String}  packetEvent event sent by the client
 * @param   {String}  id          client id
 * @param   {Number}  time        time in milliseconds for the request
 * @param   {Array}   ack         data to send back to the client
 * @returns                       void
 */
function logDown (packetEvent, id, time, ack) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('-->'),
      bold(packetEvent),
      gray(id),
      green('OK'),
      typeof time === 'number' && gray(time + 'ms'),
      ack && ack.map(item => JSON.stringify(item)).join(' , ')
    )
  )
}

/**
 * Used for all emits and broadcasts
 * @param   {String}  packetEvent event to emit to client
 * @param   {Array}   rooms       rooms to receive the event
 * @param   {String}  broadcaster client id who initiated the emit
 * @param   {Array}   payload     data to send to rooms
 * @returns                       void
 */
function logEmit (packetEvent, rooms, broadcaster, payload) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      gray('>>>'),
      bold(packetEvent),
      gray(rooms.length ? rooms : '/'),
      broadcaster && yellow(`broadcast by ${broadcaster}`),
      payload && payload.map(item => JSON.stringify(item)).join(' , ')
    )
  )
}

/**
 * Used for any errors caught while handling client packet
 * @param   {String}  packetEvent event sent by the client
 * @param   {String}  id          client id
 * @param   {Number}  time        time in milliseconds for the request
 * @param   {Error}   error       Error instance
 * @param   {String}  stack       Error callstack
 * @returns                       void
 */
function logError (packetEvent, id, time, error, stack) {
  console.log(
    ...gather(
      magenta('[socket.io]'),
      red('-->'),
      bold(packetEvent),
      gray(id),
      red('ERR'),
      typeof time === 'number' && gray(time + 'ms'),
      red(error.message),
      stack && stack
    )
  )
}
