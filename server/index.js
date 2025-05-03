const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Socket } = require('dgram');

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const CORES = ['red-500','green-500','blue-500','yellow-500']

const userColors= {};

const teams = { f: 'FURIA', o: 'OPPONENTS' };
const MAX_ROUNDS = 30;

let gameStatus = {
  round: 1,
  score: { f: 0, o: 0 },
  lastWinner: null,
  finished: false
};

function escolhaAleatoria() {
    const idx = Math.floor(Math.random() * CORES.length);
    return CORES[idx];
  }
  

  io.on('connection', socket => {
    // já deixa a cor pronta no connect
    userColors[socket.id] = `text-${escolhaAleatoria()}`;
  
    socket.on('mensagem', ({ texto, username }) => {
      io.emit('mensagem', {
        texto,
        username,
        id: socket.id,
        color: userColors[socket.id]
      });
    });
  
    socket.on('reaction', ({ emoji, username }) => {
      io.emit('reaction', {
        emoji,
        username,
        id: socket.id,
        color: userColors[socket.id]
      });
    });
  
    socket.on('disconnect', () => {
      delete userColors[socket.id];
    });
  });



// Função que simula fim de round a cada 10s
const simInterval = setInterval(() => {
    if (gameStatus.finished) return;
  
    // avança o round
    gameStatus.round += 1;
  
    // escolhe vencedor e atualiza score
    const winnerKey = Math.random() < 0.5 ? 'f' : 'o';
    gameStatus.score[winnerKey] += 1;
    gameStatus.lastWinner = teams[winnerKey];
  
    // checa término
    if (gameStatus.round >= MAX_ROUNDS) {
      gameStatus.finished = true;
      gameStatus.round = MAX_ROUNDS;
    }
  
    // broadcast para todos os clientes conectados
    io.emit('gameStatus', gameStatus);
  }, 10000);

httpServer.listen(3001, () => {
  console.log('Server rodando na porta 3001');
});
