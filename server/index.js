const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('novo cliente conectado:', socket.id);
  socket.on('mensagem', msg => {
    io.emit('mensagem', msg); // reenvia pra todo mundo
  });
});

httpServer.listen(3001, () => {
  console.log('Server rodando na porta 3001');
});
