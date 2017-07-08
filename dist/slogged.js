var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var index$1 = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$3 = createCommonjsModule(function (module) {
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var index$7 = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
};

var ansiRegex = index$7();

var index$5 = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

var re = new RegExp(index$7().source); // remove the `g` flag
var index$9 = re.test.bind(re);

var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

var index$11 = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? index$11 : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	index$3.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(index$3).forEach(function (key) {
		index$3[key].closeRe = new RegExp(index$1(index$3[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = index$3.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		index$3.dim.open = '';
	}

	while (i--) {
		var code = index$3[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	index$3.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

var index = new Chalk();
var styles_1 = index$3;
var hasColor = index$9;
var stripColor = index$5;
var supportsColor_1 = index$11;

index.styles = styles_1;
index.hasColor = hasColor;
index.stripColor = stripColor;
index.supportsColor = supportsColor_1;

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/* eslint max-params: 0 */

function slogger() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _opts$minimal = opts.minimal,
      minimal = _opts$minimal === undefined ? false : _opts$minimal,
      _opts$boring = opts.boring,
      boring = _opts$boring === undefined ? false : _opts$boring;


  var ctx = new index.constructor({ enabled: !boring });

  var magenta = ctx.magenta,
      gray = ctx.gray,
      bold = ctx.bold,
      green = ctx.green,
      red = ctx.red,
      yellow = ctx.yellow;


  return function (socket, next) {
    try {
      var onevent = socket.onevent;
      var ack = socket.ack;
      var emit = socket.emit;
      var onclose = socket.onclose;
      var connectionStart = Date.now();
      var requestStart = null;
      var packetEvent = null;

      // First log the connection
      logUp('connection', socket.id);

      socket.onevent = function (packet) {
        // Start the timer used in ack/error logging
        requestStart = Date.now();
        packetEvent = packet.data[0];

        logUp(packetEvent, socket.id, (!minimal || packetEvent === 'join') && JSON.stringify(packet.data[1]));

        // Call the real onevent function
        onevent.call(socket, packet);
      };

      socket.ack = function (id) {
        // `ack` returns a function of unknown arity, so log data as a list
        return function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          // Error scenario, assumes `ack` is used like a standard
          // Connect signature where the error is passed as the first arg
          if (args[0]) {
            logError(packetEvent, socket.id, Date.now() - requestStart, args[0].message, !minimal && `\n${args[0].stack}`);
          } else {
            logDown(packetEvent, socket.id, Date.now() - requestStart, !minimal && args.slice(1).map(function (item) {
              return JSON.stringify(item);
            }).join(' , '));
          }

          // Reset the timer, then call the real ack
          requestStart = null;
          ack.call(socket, id).apply(undefined, args);
        };
      };

      // Emit has unknown arity, so log data as a list
      socket.emit = function (ev) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        // Display the source client id but only if it's important,
        // ie. when the event is being broadcast
        logEmit(ev, socket._rooms, socket.flags.broadcast && socket.id, !minimal && args.map(function (item) {
          return JSON.stringify(item);
        }).join(' , '));

        // Call the real emit function
        emit.call.apply(emit, [socket, ev].concat(args));
      };

      socket.onclose = function () {
        logDown('disconnect', socket.id, Date.now() - connectionStart);

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
   * @returns                       undefined
   */
  function logUp(packetEvent, id, payload) {
    var _console;

    (_console = console).log.apply(_console, toConsumableArray(gather(magenta('[socket.io]'), gray('<--'), bold(packetEvent), gray(id), payload)));
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
    var _console2;

    (_console2 = console).log.apply(_console2, toConsumableArray(gather(magenta('[socket.io]'), gray('-->'), bold(packetEvent), gray(id), green('OK'), gray(time + 'ms'), ack)));
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
    var _console3;

    (_console3 = console).log.apply(_console3, toConsumableArray(gather(magenta('[socket.io]'), gray('>>>'), bold(packetEvent), gray(rooms.length ? rooms : '/'), broadcaster && yellow(`broadcast by ${broadcaster}`), payload)));
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
    var _console4;

    (_console4 = console).log.apply(_console4, toConsumableArray(gather(magenta('[socket.io]'), red('-->'), bold(packetEvent), gray(id), red('ERR'), gray(time + 'ms'), red(message), stack)));
  }
}

export default slogger;
