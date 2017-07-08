const io = require('socket.io')();

module.exports = io;

io.on('connection', socket => {
  socket.on('event.spec', (payload, ack) => {
    return ack(null, payload);
  });

  socket.on('ack.spec', (payload, ack) => {
    return ack(null, 'ack');
  });

  socket.on('emit.spec', (payload, ack) => {
    socket.emit('emit', 'hi');
    return ack(null, payload);
  });

  socket.on('broadcast.spec', (payload, ack) => {
    socket.broadcast.emit('broadcast', 'hi');
    return ack(null, payload);
  });

  socket.on('rooms.spec', (payload, ack) => {
    socket.to('room1').to('room2').emit('rooms', 'hi');
    return ack(null, payload);
  });

  socket.on('error.spec', (payload, ack) => {
    return ack(new Error('Oh no'), null);
  });
});
