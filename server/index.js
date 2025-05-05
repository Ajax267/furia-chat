const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const axios = require('axios');
const stringSimilarity = require('string-similarity');
require('dotenv').config();

const app = express();
app.use(cors());

// Servir front-end
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));
app.get(/.*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));

// --- Helpers ---
function normalize(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .toLowerCase()
        .trim();
}

// Configuração do cliente Pandascore
const pandascore = axios.create({
    baseURL: 'https://api.pandascore.co',
    headers: { Authorization: `Bearer ${process.env.PANDASCORE_TOKEN}` }
});

let teamId = null;
let nextMatch = null;


const CORES = ['red-500', 'green-500', 'blue-500', 'yellow-500'];
const userColors = {};


// Inicializa o ID do time FURIA
async function initTeamId() {
    try {
        const res = await pandascore.get('/csgo/teams', {
            params: { 'filter[name]': 'FURIA', 'page[size]': 1 }
        });
        if (res.data.length) {
            teamId = res.data[0].id;
            console.log('initTeamId -> teamId:', teamId);
        }
    } catch (err) {
        console.error('Erro initTeamId:', err.response?.data || err.message);
    }
}

// Busca e formata o próximo jogo
async function fetchNextMatch() {
    if (!teamId) await initTeamId();
    try {
        const res = await pandascore.get('/csgo/matches/upcoming', {
            params: {
                'filter[opponent_id]': teamId,
                sort: 'begin_at',
                'page[size]': 1
            }
        });
        const match = res.data[0];
        if (!match) return null;
        return {
            start: new Date(match.begin_at).getTime(),
            begin_at: match.begin_at
        };
    } catch (err) {
        console.error('Erro fetchNextMatch:', err.response?.data || err.message);
        return null;
    }
}

// Inicializa e agenda atualização de nextMatch
async function initTeamInfo() {
    await initTeamId();
    nextMatch = await fetchNextMatch();
    console.log('Próximo jogo:', nextMatch?.begin_at);
}
initTeamInfo();
setInterval(async () => {
    nextMatch = await fetchNextMatch();
    console.log('Atualizado próximo jogo:', nextMatch?.begin_at);
}, 60 * 60 * 1000);

// Busca escalação usando endpoint de players
async function fetchLineup() {
    if (!teamId) await initTeamId();
    try {
        const res = await pandascore.get('/csgo/players', {
            params: { 'filter[team_id]': teamId, 'page[size]': 50 }
        });
        return res.data.map(p => p.name);
    } catch (err) {
        console.error('Erro fetchLineup:', err.response?.data || err.message);
        return null;
    }
}

// Estatísticas (últimas n partidas)
async function fetchStats(n = 10) {
    if (!teamId) await initTeamId();
    let page = 1, matches = [];
    while (matches.length < n) {
        const res = await pandascore.get('/csgo/matches', {
            params: {
                'filter[opponent_id]': teamId,
                sort: '-begin_at',
                'page[size]': n,
                'page[number]': page
            }
        });
        if (!res.data.length) break;
        matches.push(...res.data);
        page++;
    }
    matches = matches.slice(0, n);
    let totalKills = 0, totalDeaths = 0, wins = 0;
    matches.forEach(m => {
        const ours = m.opponents.find(o => o.opponent.id === teamId);
        const them = m.opponents.find(o => o.opponent.id !== teamId);
        if (ours && ours.stats) {
            totalKills += ours.stats.kills || 0;
            totalDeaths += ours.stats.deaths || 0;
            if (ours.score > (them && them.score)) wins++;
        }
    });
    const count = matches.length || 1;
    return {
        sampleSize: matches.length,
        avgKills: (totalKills / count).toFixed(1),
        avgKD: totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : 'N/A',
        winRate: ((wins / count) * 100).toFixed(1) + '%'
    };
}

// Histórico – últimos 3 confrontos
async function fetchHistory() {
    if (!teamId) await initTeamId();
    try {
        const res = await pandascore.get('/csgo/matches', {
            params: {
                'filter[opponent_id]': teamId,
                sort: '-begin_at',
                'page[size]': 3
            }
        });
        return res.data.map(m => {
            const ours = m.opponents.find(o => o.opponent.id === teamId);
            const them = m.opponents.find(o => o.opponent.id !== teamId);
            return `${m.begin_at.split('T')[0]}: FURIA ${ours.score} x ${them.score} ${them.opponent.name}`;
        });
    } catch {
        return null;
    }
}

// Padrões de NLP
const nextMatchPatterns = [/próximo jogo/, /próxima partida/, /quando.*jogo/];
const lineupPatterns = [/escala[cç][aã]o/, /time inicial/];
const statsPatterns = [/estat[ií]stica/, /desempenho/, /kd/];
const historyPatterns = [/hist[oó]rico/, /confrontos anteriores/];
const greetingPatterns = [/^oi\b/, /^ol[áa]?\b/, /^salve\b/];

// HTTP + Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173',
            'https://chat-furia-c918aa144b28.herokuapp.com'
        ],
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
    }
});

io.on('connection', socket => {
    userColors[socket.id] = `text-${CORES[Math.floor(Math.random() * CORES.length)]}`;

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
    socket.on('userMessage', async ({ text }) => {
        let reply;
        if (nextMatchPatterns.some(rx => rx.test(text))) {
            if (!nextMatch) {
                reply = 'Ainda não sei quando é o próximo jogo.';
            } else {
                const d = new Date(nextMatch.start);
                reply = `Próximo jogo: ${d.toLocaleString('pt-BR')}.`;
            }
        } else if (lineupPatterns.some(rx => rx.test(text))) {
            const lineup = await fetchLineup();
            reply = lineup ? `Escalação: ${lineup.join(', ')}.` : 'Erro ao obter escalação.';
        } else if (statsPatterns.some(rx => rx.test(text))) {
            const stats = await fetchStats(10);
            reply = stats
                ? `Últimas ${stats.sampleSize} partidas – kills: ${stats.avgKills}, K/D: ${stats.avgKD}, vitória: ${stats.winRate}.`
                : 'Erro ao obter estatísticas.';
        } else if (historyPatterns.some(rx => rx.test(text))) {
            const history = await fetchHistory();
            reply = history ? `Histórico:\n- ${history.join('\n- ')}` : 'Erro ao obter histórico.';
        } else if (greetingPatterns.some(rx => rx.test(text))) {
            reply = 'E aí, torcedor! Pergunte sobre próximo jogo, escalação, estatísticas ou histórico.';
        } else {
            const patterns = [
                ...nextMatchPatterns,
                ...lineupPatterns,
                ...statsPatterns,
                ...historyPatterns
            ].map(r => r.source);
            const { bestMatch } = stringSimilarity.findBestMatch(normalize(text), patterns);
            reply = bestMatch.rating > 0.6
                ? 'Não entendi bem, mas tente perguntar sobre próximo jogo, escalação, estatísticas ou histórico.'
                : 'Não entendi. Pergunte sobre próximo jogo, escalação, estatísticas ou histórico.';
        }
        socket.emit('botMessage', { text: reply });
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
