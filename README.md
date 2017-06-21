# Slogged

_socket.io logger middleware inspired by koa-logger_

[![MIT License][license-image]][license-url]
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## What is it?

Slogged is a basic logger middleware for [socket.io](https://socket.io) that modifies the Socket class to output colorful logging to display information about client events, acks, emits, and errors. For the appearance it takes [koa-logger](https://github.com/koajs/logger) as an inspiration.

## Usage

```bash
$ npm install slogged
```

Then in your io.js (or wherever you're instantiating socket.io),

```javascript
const io = require('socket.io')()
const slogger = require('slogged')

io.use(slogger())

io.on('connection', (socket) => {
  // ...
})
```

## Types of logs

There are essentially four different types of logs: client events, emit events, acks, and errors.

Client events use `<--`, emit events use `>>>`, acks and errors both use `-->` as those are sent back to the originating client.

Acks and errors also report the overall time taken from the time the server received the packet to when the ack or error is sent back to the client.

By default, payloads (both from client events and emits), acks, and error callstacks are included in the logs, but there is an option to disregard this data in the logs. See below.

For emits, if the broadcast flag is added, then the log will also add the client id that initiated the emit.

Finally, an important note about using acks and error logs is that the logging assumes you are using a standard Connect-like signature, with an error as the first argument, followed by the data to ack. If the first argument is not null then slogged will log it as an error.

```javascript
ack(null, { success: true }) // CORRECT! Will be logged as an OK ack
ack({ success: true }) // WRONG! Will be logged as an ERROR
ack(new Error(), null) // CORRECT! Will be logged as an ERROR
```

Make sense?

## Options

Currently there is only one option,

```javascript
{
  minimal: false
}
```

Set this to true to ignore payloads (both from client events and in emit events), ack data, and error call stacks.

## Examples

With minimal === false

```
[socket.io] <-- connection Rquzt8syTkGjMZzyAAAB
[socket.io] <-- join Rquzt8syTkGjMZzyAAAB "patrick.fricano@icloud.com"
[socket.io] <-- join Rquzt8syTkGjMZzyAAAB "1b9ie86u62"
[socket.io] <-- update-user Rquzt8syTkGjMZzyAAAB {"username":"patrick.fricano@icloud.com","body":{"currentList":"1b9ie86u62"}}
[socket.io] >>> updated patrick.fricano@icloud.com broadcast by Rquzt8syTkGjMZzyAAAB {"_id":"58c5658f0a3d0025673bdf89","darkmode":true,"username":"patrick.fricano@icloud.com","currentList":"1b9ie86u62"}
[socket.io] --> update-user Rquzt8syTkGjMZzyAAAB OK 12ms {"_id":"58c5658f0a3d0025673bdf89","darkmode":true,"username":"patrick.fricano@icloud.com","currentList":"1b9ie86u62"}
[socket.io] <-- create-item Rquzt8syTkGjMZzyAAAB {"listid":"1b9ie86u62","item":{"_id":"b2oo811us1","item":"Do something","createdBy":"patrick.fricano@icloud.com","complete":false,"dateCreated":"2017-06-21T14:21:29.182Z","dueDate":null,"dateCompleted":null,"completedBy":"","notes":"","_dueDateDifference":null,"_deleting":false,"_detailsToggled":false},"username":"patrick.fricano@icloud.com"}
[socket.io] --> create-item Rquzt8syTkGjMZzyAAAB ERR 2ms ERRROOOOOR
Error: ERRROOOOOR
    at Object.create (/Users/patrick/Projects/taskmastr/routes/items.js:10:11)
    at Socket.socket.on (/Users/patrick/Projects/taskmastr/io.js:96:18)
    at emitTwo (events.js:125:13)
    at Socket.emit (events.js:213:7)
    at /Users/patrick/Projects/taskmastr/node_modules/socket.io/lib/socket.js:514:12
    at _combinedTickCallback (internal/process/next_tick.js:95:7)
    at process._tickCallback (internal/process/next_tick.js:161:9)
```

With minimal === true

```
[socket.io] <-- connection Rquzt8syTkGjMZzyAAAB
[socket.io] <-- join Rquzt8syTkGjMZzyAAAB "patrick.fricano@icloud.com"
[socket.io] <-- join Rquzt8syTkGjMZzyAAAB "1b9ie86u62"
[socket.io] <-- update-user Rquzt8syTkGjMZzyAAAB 
[socket.io] >>> updated patrick.fricano@icloud.com broadcast by Rquzt8syTkGjMZzyAAAB
[socket.io] --> update-user Rquzt8syTkGjMZzyAAAB OK 12ms 
[socket.io] <-- create-item Rquzt8syTkGjMZzyAAAB
[socket.io] --> create-item Rquzt8syTkGjMZzyAAAB ERR 2ms ERRROOOOOR
```

## License

Slogged is freely distributable under the terms of the [MIT license](./LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE