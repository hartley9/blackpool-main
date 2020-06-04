//const credentials = require('./credentials');
const express = require('express');
const app = express();
let broadcaster;
let server;
let port;

const http = require('http');
server = http.createServer(app);
port = 4444;

const io = require('socket.io')(server);
app.use(express.static(__dirname + '/public'));

io.sockets.on('error', e => console.log(e));


io.sockets.on('connection', function (socket) {
  
  //broadcaster has connected
  socket.on('broadcaster', function () {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
    
  });

  //handle the receiver position here
  socket.on('receiver', function () {
    let data = {
      'socket': socket.id,
     
    };
    broadcaster && socket.to(broadcaster).emit('receiver', data);

  });

  //recieve offer from reciever
  socket.on('offer', function (id, message) {
    //send offer to broadcaster
    socket.to(id).emit('offer', socket.id, message);

  });
  //Recieve and send answer
  socket.on('answer', function (id , message) {
    socket.to(id).emit('answer', socket.id , message);

  });

  socket.on('candidate', function (id, message) {
    socket.to(id).emit('candidate', socket.id, message);
    console.log('candidate');
  });
  
  socket.on('disconnect', function() {
    broadcaster && socket.to(broadcaster).emit('bye', socket.id);

  });

});


server.listen(port, () => console.log(`Server is running on port ${port}`));
