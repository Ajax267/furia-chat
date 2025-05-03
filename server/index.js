// server/index.js
const path    = require('path');
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
const allowedOrigins = [
    'http://localhost:5173',             // Vite dev server
    'https://chat-furia-c918aa144b28.herokuapp.com/'  // URL do Heroku
  ];
  
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  

// Configurações de cores e simulação
const CORES      = ['red-500', 'green-500', 'blue-500', 'yellow-500'];
const userColors = {};
const teams      = { f: 'FURIA', o: 'OPPONENTS' };
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

// Simula fim de rounds a cada 10s
setInterval(() => {
  if (gameStatus.finished) return;
  gameStatus.round += 1;
  const winnerKey = Math.random() < 0.5 ? 'f' : 'o';
  gameStatus.score[winnerKey] += 1;
  gameStatus.lastWinner = teams[winnerKey];
  if (gameStatus.round >= MAX_ROUNDS) {
    gameStatus.finished = true;
    gameStatus.round = MAX_ROUNDS;
  }
  io.emit('gameStatus', gameStatus);
}, 10000);

// Socket.IO
io.on('connection', socket => {
  // atribui cor única ao conectar
  userColors[socket.id] = `text-${escolhaAleatoria()}`;

  // envia status atual para quem acabou de entrar
  socket.emit('gameStatus', gameStatus);

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

// === SERVE O FRONT BUILDADO PELO VITE ===
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// CORRETO em Express 5: usa RegExp para casar qualquer caminho
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  

// inicializa o servidor
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});
