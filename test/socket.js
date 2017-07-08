const socket = require('socket.io-client')('http://localhost:8888', {
  transports: ['websocket'],
  forceNew: true
});

module.exports = socket;
