const credentials = require('./credentials');
const express = require('express');
const app = express();
let broadcaster;
let server;
let port;
if (credentials.key && credentials.cert) {
  const https = require('https');
  server = https.createServer(credentials, app);
  port = 443;
} else {
  const http = require('http');
  server = http.createServer(app);
  port = 3000;
}
const io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));
io.sockets.on('error', e => console.log(e));
io.sockets.on('connection', function (socket) {
  socket.on('broadcaster', function () {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
    console.log('broadcaster');
  });
  socket.on('watcher', function () {
    broadcaster && socket.to(broadcaster).emit('watcher', socket.id);
    console.log('watcher');
  });
  socket.on('offer', function (id /* of the watcher */, message) {
    socket.to(id).emit('offer', socket.id /* of the broadcaster */, message);
    console.log('offer from watcher' + id + 'to broadcaster: ' + socket.id);
  });
  socket.on('answer', function (id /* of the broadcaster */, message) {
    socket.to(id).emit('answer', socket.id /* of the watcher */, message);
    console.log(`answer from broadcaster ${id} to watcher ${socket.id}`);
  });
  socket.on('candidate', function (id, message) {
    socket.to(id).emit('candidate', socket.id, message);
    console.log('candidate');
  });
  socket.on('disconnect', function() {
    broadcaster && socket.to(broadcaster).emit('bye', socket.id);
    console.log('disconnect');
  });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));
