(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.slogged = factory());
}(this, (function () { 'use strict';

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var _require = require('chalk');
var magenta = _require.magenta;
var gray = _require.gray;
var bold = _require.bold;
var green = _require.green;
var red = _require.red;
var yellow = _require.yellow;

function slogger() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  // minimal flag controls whether payloads, acks, and error stacks are logged
  var _opts$minimal = opts.minimal,
      minimal = _opts$minimal === undefined ? false : _opts$minimal;


  return function (socket, next) {
    try {
      // First log the connection
      logUp('connection', socket.id);

      var onevent = socket.onevent;
      var ack = socket.ack;
      var emit = socket.emit;
      var onclose = socket.onclose;
      var requestStart = null;
      var packetEvent = null;

      socket.onevent = function (packet) {
        // Start the timer used in ack/error logging
        requestStart = Date.now();
        packetEvent = packet.data[0];

        // 'leave' events are actually from the client,
        // but this looks nicer (to me anyway)
        if (packetEvent === 'leave') {
          logDown(packetEvent, socket.id, null, [packet.data[1]]);
        } else {
          logUp(packetEvent, socket.id, (!minimal || packetEvent === 'join') && packet.data[1]);
        }

        // Call the real onevent function
        onevent.call(socket, packet);
      };

      socket.ack = function (id) {
        // ack returns a function of unknown arity, so log data as a list
        return function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          // Error scenario, assumes `ack` is used like a standard
          // Connect signature where the error is passed as the first arg
          if (args[0]) {
            logError(packetEvent, socket.id, Date.now() - requestStart, args[0], !minimal && `\n${args[0].stack}`);
          } else {
            logDown(packetEvent, socket.id, Date.now() - requestStart, !minimal && args.slice(1));
          }

          // Reset the timer, then call the real ack
          requestStart = null;
          ack.call(socket, id).apply(undefined, args);
        };
      };

      // emit has unknown arity, so log data as a list
      socket.emit = function (ev) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        // Display the source client id but only if it's important,
        // ie. when the event is being broadcast
        logEmit(ev, socket._rooms, socket.flags.broadcast && socket.id, !minimal && args);

        // Call the real emit function
        emit.call.apply(emit, [socket, ev].concat(args));
      };

      socket.onclose = function () {
        logDown('disconnect', socket.id);

        // Call the real onclose function
        onclose.call(socket);
      };

      // Move to the next middleware, or the callback
      next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };
}

/**
 * Utility function to return all truthy values provided as an array
 * @param   {Any}   items any arguments
 * @returns {Array}       only the truthy arguments
 */
function gather() {
  for (var _len3 = arguments.length, items = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    items[_key3] = arguments[_key3];
  }

  return items.filter(function (item) {
    return item;
  });
}

/**
 * All client-sent events except for leave, as well as connection event
 * @param   {String}  packetEvent event sent by the client
 * @param   {String}  id          client id
 * @param   {Any}     payload     data sent by the client
 * @returns                       void
 */
function logUp(packetEvent, id, payload) {
  var _console;

  (_console = console).log.apply(_console, toConsumableArray(gather(magenta('[socket.io]'), gray('<--'), bold(packetEvent), gray(id), payload && JSON.stringify(payload))));
}

/**
 * Used for acks and errors, as well as disconnect and leave events
 * @param   {String}  packetEvent event sent by the client
 * @param   {String}  id          client id
 * @param   {Number}  time        time in milliseconds for the request
 * @param   {Array}   ack         data to send back to the client
 * @returns                       void
 */
function logDown(packetEvent, id, time, ack) {
  var _console2;

  (_console2 = console).log.apply(_console2, toConsumableArray(gather(magenta('[socket.io]'), gray('-->'), bold(packetEvent), gray(id), green('OK'), typeof time === 'number' && gray(time + 'ms'), ack && ack.map(function (item) {
    return JSON.stringify(item);
  }).join(' , '))));
}

/**
 * Used for all emits and broadcasts
 * @param   {String}  packetEvent event to emit to client
 * @param   {Array}   rooms       rooms to receive the event
 * @param   {String}  broadcaster client id who initiated the emit
 * @param   {Array}   payload     data to send to rooms
 * @returns                       void
 */
function logEmit(packetEvent, rooms, broadcaster, payload) {
  var _console3;

  (_console3 = console).log.apply(_console3, toConsumableArray(gather(magenta('[socket.io]'), gray('>>>'), bold(packetEvent), gray(rooms.length ? rooms : '/'), broadcaster && yellow(`broadcast by ${broadcaster}`), payload && payload.map(function (item) {
    return JSON.stringify(item);
  }).join(' , '))));
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
function logError(packetEvent, id, time, error, stack) {
  var _console4;

  (_console4 = console).log.apply(_console4, toConsumableArray(gather(magenta('[socket.io]'), red('-->'), bold(packetEvent), gray(id), red('ERR'), typeof time === 'number' && gray(time + 'ms'), red(error.message), stack && stack)));
}

return slogger;

})));
