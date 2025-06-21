const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', socket => {
  console.log('User connected: ' + socket.id);

  socket.on('signal', data => {
    // Forward signalling data to the target client
    io.to(data.target).emit('signal', {
      sender: socket.id,
      signal: data.signal
    });
  });

  socket.on('join', roomID => {
    socket.join(roomID);
    socket.roomID = roomID;
    console.log(`User ${socket.id} joined room ${roomID}`);

    // Notify others in the room about the new user
    socket.to(roomID).emit('user-joined', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
    if (socket.roomID) {
      socket.to(socket.roomID).emit('user-left', socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signalling server running on port ${PORT}`);
});
