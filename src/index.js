/* eslint max-params: 0 */

import chalk from 'chalk';

export default function slogger(opts = {}) {
  const {
    minimal = false, // Controls whether payloads, acks, and error stacks are logged
    boring = false // Controls whether logs are colorized
  } = opts;

  const {
    magenta,
    gray,
    bold,
    green,
    red,
    yellow
  } = new chalk.constructor({enabled: !boring});

  return function (socket, next) {
    try {
      const onevent = socket.onevent;
      const ack = socket.ack;
      const emit = socket.emit;
      const onclose = socket.onclose;
      let connectionStart = Date.now();
      let requestStart = null;
      let packetEvent = null;

      // First log the connection
      logUp(
        'connection',
        socket.id
      );

      socket.onevent = function (packet) {
        // Start the timer used in ack/error logging
        requestStart = Date.now();
        packetEvent = packet.data[0];

        logUp(
          packetEvent,
          socket.id,
          (!minimal || packetEvent === 'join') && JSON.stringify(packet.data[1])
        );

        // Call the real onevent function
        onevent.call(socket, packet);
      };

      socket.ack = function (id) {
        // `ack` returns a function of unknown arity, so log data as a list
        return function (...args) {
          // Error scenario, assumes `ack` is used like a standard
          // Connect signature where the error is passed as the first arg
          if (args[0]) {
            logError(
              packetEvent,
              socket.id,
              Date.now() - requestStart,
              args[0].message,
              !minimal && `\n${args[0].stack}`
            );
          } else {
            logDown(
              packetEvent,
              socket.id,
              Date.now() - requestStart,
              !minimal && args.slice(1).map(item => JSON.stringify(item)).join(' , ')
            );
          }

          // Reset the timer, then call the real ack
          requestStart = null;
          ack.call(socket, id)(...args);
        };
      };

      // Emit has unknown arity, so log data as a list
      socket.emit = function (ev, ...args) {
        // Display the source client id but only if it's important,
        // ie. when the event is being broadcast
        logEmit(
          ev,
          socket._rooms,
          socket.flags.broadcast && socket.id,
          !minimal && args.map(item => JSON.stringify(item)).join(' , ')
        );

        // Call the real emit function
        emit.call(socket, ev, ...args);
      };

      socket.onclose = function () {
        logDown(
          'disconnect',
          socket.id,
          Date.now() - connectionStart
        );

        // Reset the timer, then call the real onclose function
        connectionStart = null;
        onclose.call(socket);
      };

      // Move to the next middleware, or the callback
      next();
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

  /**
   * Utility function to return all truthy values provided as an array
   * @param   {Any}   items any arguments
   * @returns {Array}       only the truthy arguments
   */
  function gather(...items) {
    return items.filter(item => item);
  }

  /**
   * All client-sent events except for leave, as well as connection event
   * @param   {String}  packetEvent event sent by the client
   * @param   {String}  id          client id
   * @param   {Any}     payload     data sent by the client
   * @returns                       undefined
   */
  function logUp(packetEvent, id, payload) {
    console.log(
      ...gather(
        magenta('[socket.io]'),
        gray('<--'),
        bold(packetEvent),
        gray(id),
        payload
      )
    );
  }

  /**
   * Used for acks and errors, as well as disconnect and leave events
   * @param   {String}  packetEvent event sent by the client
   * @param   {String}  id          client id
   * @param   {Number}  time        time in milliseconds for the request
   * @param   {Array}   ack         data to send back to the client
   * @returns                       undefined
   */
  function logDown(packetEvent, id, time, ack) {
    console.log(
      ...gather(
        magenta('[socket.io]'),
        gray('-->'),
        bold(packetEvent),
        gray(id),
        green('OK'),
        gray(time + 'ms'),
        ack
      )
    );
  }

  /**
   * Used for all emits and broadcasts
   * @param   {String}  packetEvent event to emit to client
   * @param   {Array}   rooms       rooms to receive the event
   * @param   {String}  broadcaster client id who initiated the emit
   * @param   {Array}   payload     data to send to rooms
   * @returns                       undefined
   */
  function logEmit(packetEvent, rooms, broadcaster, payload) {
    console.log(
      ...gather(
        magenta('[socket.io]'),
        gray('>>>'),
        bold(packetEvent),
        gray(rooms.length ? rooms : '/'),
        broadcaster && yellow(`broadcast by ${broadcaster}`),
        payload
      )
    );
  }

  /**
   * Used for any errors caught while handling client packet
   * @param   {String}  packetEvent event sent by the client
   * @param   {String}  id          client id
   * @param   {Number}  time        time in milliseconds for the request
   * @param   {Error}   error       Error instance
   * @param   {String}  stack       Error callstack
   * @returns                       undefined
   */
  function logError(packetEvent, id, time, message, stack) {
    console.log(
      ...gather(
        magenta('[socket.io]'),
        red('-->'),
        bold(packetEvent),
        gray(id),
        red('ERR'),
        gray(time + 'ms'),
        red(message),
        stack
      )
    );
  }
}
