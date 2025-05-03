const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config();  // carrega o .env
// const { HLTV } = require('hltv');  // para próxima partida (importante instalar)


const app = express();
app.use(cors());

// Servir front-end
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const httpServer = http.createServer(app);
// CORS do Socket.IO: apenas origens desejadas
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173',                  // dev
            'https://chat-furia-c918aa144b28.herokuapp.com'         // prod
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Chat de torcida: cores e simulação de jogo (ou real-time HLTV)
const CORES = ['red-500', 'green-500', 'blue-500', 'yellow-500'];
const userColors = {};
let gameStatus = { round: 0, score: { f: 0, o: 0 }, lastWinner: null, finished: false };
let nextMatch = null;

async function updateNextMatch() {
    try {
        const perPage = 100;           // quantos itens por página
        let page = 1;
        let furiaMatches = [];

        // enquanto não achar e ainda tiver páginas
        while (!furiaMatches.length) {
            const res = await axios.get(
                'https://api.pandascore.co/csgo/matches/upcoming',
                {
                    params: {
                        'page[size]': perPage,
                        'page[number]': page
                    },
                    headers: {
                        Authorization: `Bearer ${process.env.PANDASCORE_TOKEN}`
                    }
                }
            );

            const data = res.data;
            if (!data.length) break;    // acabou as páginas

            // filtra só FURIA nessa página
            furiaMatches = data.filter(m =>
                m.opponents.some(o =>
                    o.opponent.name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '')
                        .includes('furia')
                )
            );

            page++;
        }

        if (!furiaMatches.length) {
            console.warn('Nenhum próximo jogo da FURIA encontrado em nenhuma página.');
            return;
        }

        const next = furiaMatches[0];
        nextMatch = {
            start: new Date(next.begin_at).getTime(),
            channel: next.live_url ||
                'https://player.twitch.tv/?channel=furiatv&parent=https://chat-furia-c918aa144b28.herokuapp.com/'
        };
        io.emit('nextMatch', nextMatch);

    } catch (err) {
        console.error('Erro ao buscar próximo jogo da FURIA:', err);
    }
}

updateNextMatch();
setInterval(updateNextMatch, 60 * 60 * 1000);

// // Simulação de rounds (se quiser usar em vez do HLTV)
// setInterval(() => {
//   if(gameStatus.finished) return;
//   gameStatus.round++;
//   const win = Math.random()<0.5?'f':'o';
//   gameStatus.score[win]++;
//   gameStatus.lastWinner = win==='f'?'FURIA':'OPPONENTS';
//   if(gameStatus.round>=30) gameStatus.finished=true;
//   io.emit('gameStatus', gameStatus);
// }, 10000);

io.on('connection', socket => {
    // envia status e agendamento ao conectar
    if (nextMatch) socket.emit('nextMatch', nextMatch);
    socket.emit('gameStatus', gameStatus);

    // atribui cor ao fã
    userColors[socket.id] = `text-${CORES[Math.floor(Math.random() * CORES.length)]}`;

    // rota Fan Chat
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

    // rota Chatbot rule-based
    socket.on('userMessage', ({ text }) => {
        const lower = text.toLowerCase();
        let reply;
        if (/(próximo jogo|quando.*jogo)/i.test(lower) && nextMatch) {
            const d = new Date(nextMatch.start);
            reply = `O próximo jogo da FURIA é em ${d.toLocaleString()}.`;
        } else if (/placar/i.test(lower)) {
            const { f, o } = gameStatus.score;
            reply = `O placar atual é FURIA ${f} x ${o} OPPONENTS.`;
        } else if (/oi|olá|salve/i.test(lower)) {
            reply = 'Olá! Pergunte-me sobre placar ou próximo jogo da FURIA.';
        } else {
            reply = 'Desculpe, só sei falar de placar e calendário da FURIA.';
        }
        socket.emit('botMessage', { text: reply });
    });

    socket.on('disconnect', () => {
        delete userColors[socket.id];
    });
});

httpServer.listen(process.env.PORT || 3001, () => {
    console.log('Server rodando na porta', process.env.PORT || 3001);
});