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
    .replace(/[̀-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .toLowerCase();
}

// Configuração do cliente Pandascore
const pandascore = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: { Authorization: `Bearer ${process.env.PANDASCORE_TOKEN}` }
});
let teamId = null;

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
    console.error('Erro initTeamId:', err.message);
  }
}

// Busca escalação usando endpoint de players
async function fetchLineup() {
  if (!teamId) await initTeamId();
  try {
    const res = await pandascore.get('/csgo/players', {
      params: { 'filter[team_id]': teamId, 'page[size]': 50 }
    });
    console.log('fetchLineup -> raw data:', res.data);
    return res.data.map(p => p.name);
  } catch (err) {
    console.error('Erro fetchLineup:', err.message);
    return null;
  }
}

// Estatísticas (últimas n partidas): média kills, K/D e win rate
async function fetchStats(n = 10) {
    if (!teamId) await initTeamId();
    let page = 1, matches = [];
    while (matches.length < n) {
      const res = await pandascore.get('/csgo/matches', {
        params: {
          'filter[opponents]': teamId,   // <-- CORREÇÃO AQUI
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

// Histórico – últimos 3 confrontos contra FURIA
async function fetchHistory() {
  if (!teamId) await initTeamId();
  try {
    const res = await pandascore.get('/csgo/matches', {
      params: {
        'filter[opponents]': teamId,   // <-- CORREÇÃO AQUI
        sort: '-begin_at',
        'page[size]': 3
      }
    });
    return res.data.map(m => {
      const ours   = m.opponents.find(o => o.opponent.id === teamId);
      const theirs = m.opponents.find(o => o.opponent.id !== teamId);
      return `${m.begin_at.split('T')[0]}: FURIA ${ours.score} x ${theirs.score} ${theirs.opponent.name}`;
    });
  } catch {
    return null;
  }
}

// Padrões de NLP
const nextMatchPatterns = [/próximo jogo/, /próxima partida/, /quando.*jogo/];
const lineupPatterns    = [/escala[cç]ao/, /time inicial/];
const statsPatterns     = [/estat[ií]stica/, /desempenho/, /kd/];
const historyPatterns   = [/hist[oó]rico/, /confrontos anteriores/];
const greetingPatterns  = [/^oi\b/, /^ol[áa]?\b/, /^salve\b/];

// Inicia background
initTeamId();

// HTTP + Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:5173','https://chat-furia-c918aa144b28.herokuapp.com'], methods: ['GET','POST', 'OPTIONS'], credentials: true }
});

io.on('connection', socket => {
  socket.on('userMessage', async ({ text }) => {
    const msg = normalize(text);
    let reply;
    if (nextMatchPatterns.some(rx => rx.test(text))) {
        const d = new Date(nextMatch.start);
        reply = `Próximo jogo: ${d.toLocaleString('pt-BR')}.`;
    } else if (lineupPatterns.some(rx => rx.test(text))) {
      const lineup = await fetchLineup();
      reply = lineup ? `Escalação: ${lineup.join(', ')}.` : 'Erro ao obter escalação.';
    } else if (statsPatterns.some(rx => rx.test(text))) {
      const stats = await fetchStats(10);
      reply = stats ? `Últimas ${stats.sampleSize} partidas - kills: ${stats.avgKills}, K/D: ${stats.avgKD}, vitória: ${stats.winRate}.` : 'Erro ao obter estatísticas.';
    } else if (historyPatterns.some(rx => rx.test(text))) {
      const history = await fetchHistory();
      reply = history ? `Histórico:\n- ${history.join('\n- ')}` : 'Erro ao obter histórico.';
    } else if (greetingPatterns.some(rx => rx.test(text))) {
      reply = 'E aí, torcedor! Pergunte sobre próximo jogo, escalação, estatísticas ou histórico.';
    } else {
      const patterns = [...nextMatchPatterns,...lineupPatterns,...statsPatterns,...historyPatterns].map(r => r.source);
      const { bestMatch } = stringSimilarity.findBestMatch(msg, patterns);
      reply = bestMatch.rating > 0.6
        ? 'Não entendi bem, mas tente perguntar sobre próximo jogo, escalação, estatísticas ou histórico.'
        : 'Não entendi. Pergunte sobre próximo jogo, escalação, estatísticas ou histórico.';
    }
    socket.emit('botMessage', { text: reply });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
