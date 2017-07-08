import test from 'ava';
import sinon from 'sinon';
import slogger from '../src';
import io from './io';
import validateLog from './validate-log';

let socket;
let server;

// Same tests as slogged.spec but checking that the verbose data is not logged

test.before(() => {
  io.use(slogger({minimal: true}));
  server = require('./server');
});

// Ensure server is closed
test.after(() => {
  server.close();
});

test.cb.beforeEach(t => {
  t.context.consoleLog = console.log;
  console.log = sinon.spy();
  setTimeout(t.end);
});

test.afterEach(t => {
  console.log = t.context.consoleLog;
});

// Tests are serial, so begin by connecting
test.cb('connection', t => {
  socket = require('./socket');
  socket.emit('event.spec', 'hello', err => {
    t.falsy(err);
    t.is(console.log.callCount, 3);

    t.true(validateLog(
      console.log.args[0],
      /\[socket\.io\]/,
      /<--/,
      /connection/,
      /[a-zA-Z0-9_-]+/
    ));

    t.end();
  });
});

test.cb('event', t => {
  socket.emit('event.spec', 'hello', (err, ack) => {
    t.falsy(err);
    t.truthy(ack);
    t.is(console.log.callCount, 2);

    t.true(validateLog(
      console.log.args[0],
      /\[socket\.io\]/,
      /<--/,
      /event\.spec/,
      /[a-zA-Z0-9_-]+/
    ));

    t.end();
  });
});

test.cb('ack', t => {
  socket.emit('ack.spec', 'hello', (err, ack) => {
    t.falsy(err);
    t.truthy(ack);
    t.is(console.log.callCount, 2);

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      /-->/,
      /ack\.spec/,
      /[a-zA-Z0-9_-]+/,
      /OK/,
      /\d{1,2}ms/
    ));

    t.end();
  });
});

test.cb('emit', t => {
  socket.emit('emit.spec', 'hello', (err, ack) => {
    t.falsy(err);
    t.truthy(ack);
    t.is(console.log.callCount, 3);

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      />>>/,
      /emit/,
      /\//
    ));

    t.end();
  });
});

test.cb('broadcast', t => {
  socket.emit('broadcast.spec', 'hello', (err, ack) => {
    t.falsy(err);
    t.truthy(ack);
    t.is(console.log.callCount, 3);

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      />>>/,
      /broadcast/,
      /\//,
      /broadcast by [a-zA-Z0-9_-]+/
    ));

    t.end();
  });
});

test.cb('rooms', t => {
  socket.emit('join', 'room1');
  socket.emit('join', 'room2');
  socket.emit('rooms.spec', 'hello', (err, ack) => {
    t.falsy(err);
    t.truthy(ack);
    t.is(console.log.callCount, 5);

    t.true(validateLog(
      console.log.args[3],
      /\[socket\.io\]/,
      />>>/,
      /rooms/,
      /room1,room2/
    ));

    t.end();
  });
});

test.cb('error', t => {
  socket.emit('error.spec', 'hello', (err, ack) => {
    t.truthy(err);
    t.falsy(ack);
    t.is(console.log.callCount, 2);

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      /-->/,
      /error\.spec/,
      /[a-zA-Z0-9_-]+/,
      /ERR/,
      /\d{1,2}ms/,
      /Oh no/
    ));

    t.end();
  });
});

// Tests are serial, so end by disconnecting
test.cb('disconnect', t => {
  server.close(() => {
    t.is(console.log.callCount, 3);

    t.true(validateLog(
      console.log.args[0],
      /\[socket\.io\]/,
      /-->/,
      /disconnect/,
      /[a-zA-Z0-9_-]+/,
      /OK/,
      /\d{1,2}ms/
    ));

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      />>>/,
      /disconnecting/,
      /\//
    ));

    t.true(validateLog(
      console.log.args[1],
      /\[socket\.io\]/,
      />>>/,
      /disconnecting/,
      /\//,
    ));

    t.end();
  });
});
