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

function createSocketLogger() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var minimal = opts.minimal;


  return function (socket, next) {
    try {
      var onevent = socket.onevent;
      var ack = socket.ack;
      var emit = socket.emit;
      var onclose = socket.onclose;
      var requestStart = null;
      var packetEvent = null;

      logUp('connection', socket.id);

      socket.onevent = function (packet) {
        requestStart = Date.now();
        packetEvent = packet.data[0];
        if (packet.data[0] === 'leave') logDown('leave', socket.id, null, !minimal && packet.data[1]);else logUp(packetEvent, socket.id, !minimal && packet.data[1]);
        onevent.call(socket, packet);
      };

      socket.ack = function (id) {
        return function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (args[0]) logError(packetEvent, socket.id, Date.now() - requestStart, args[0], !minimal && '\n' + args[0].stack);else logDown(packetEvent, socket.id, Date.now() - requestStart, !minimal && args.slice(1));
          requestStart = null;
          ack.call(socket, id).apply(undefined, args);
        };
      };

      socket.emit = function (ev) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        logEmit(ev, socket._rooms, socket.flags.broadcast, !minimal && args);
        emit.call.apply(emit, [socket, ev].concat(args));
      };

      socket.onclose = function () {
        logDown('disconnect', socket.id);
        onclose.call(socket);
      };

      next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };
}

function gather() {
  for (var _len3 = arguments.length, items = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    items[_key3] = arguments[_key3];
  }

  return items.filter(function (item) {
    return item;
  });
}

function logUp(socketEvent, id, payload) {
  var _console;

  (_console = console).log.apply(_console, toConsumableArray(gather(magenta('[socket.io]'), gray('<--'), bold(socketEvent), gray(id), payload && JSON.stringify(payload))));
}

function logDown(socketEvent, id, time, ack) {
  var _console2;

  (_console2 = console).log.apply(_console2, toConsumableArray(gather(magenta('[socket.io]'), gray('-->'), bold(socketEvent), gray(id), green('OK'), time && gray(time + 'ms'), ack && ack.map(function (item) {
    return JSON.stringify(item);
  }).join(' , '))));
}

function logEmit(socketEvent, rooms, broadcast, payload) {
  var _console3;

  (_console3 = console).log.apply(_console3, toConsumableArray(gather(magenta('[socket.io]'), gray('>>>'), bold(socketEvent), gray(rooms.length ? rooms : '/'), yellow(broadcast ? 'BROADCAST' : ''), payload && payload.map(function (item) {
    return JSON.stringify(item);
  }).join(' , '))));
}

function logError(socketEvent, id, time, error, stack) {
  var _console4;

  (_console4 = console).log.apply(_console4, toConsumableArray(gather(magenta('[socket.io]'), red('-->'), bold(socketEvent), gray(id), red('ERR'), gray(time + 'ms'), red(error.message), stack && stack)));
}

return createSocketLogger;

})));
