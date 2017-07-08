const http = require('http');
const io = require('./io');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello world!');
  res.end();
});

module.exports = server;

io.attach(server);
server.listen(8888);
