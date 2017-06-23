const http = require('http')
const io = require('./io')

const server = module.exports = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.write('Hello world!')
  res.end()
})

io.attach(server)
server.listen(8888)
console.log('Server listening on port 8888')
