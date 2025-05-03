import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Chat from './Chat';           // agora assume que Chat não faz login
import { Countdown } from './Countdown';

const socket = import.meta.env.PROD
  ? io({ withCredentials: true })
  : io('http://localhost:3001', { withCredentials: true });

export default function FanChat() {
  // Novo estado de login aqui
  const [username, setUsername]   = useState('');
  const [tempName, setTempName]   = useState('');
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    socket.on('nextMatch', nm => {
      // Forçar embed em DEV
      if (import.meta.env.DEV) nm.start = Date.now() - 1000;
      setNextMatch(nm);
    });
    return () => socket.off('nextMatch');
  }, []);

  // Se não estiver logado, mostra o campo de apelido
  if (!username) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="mb-4 text-xl text-black">Digite seu apelido</h2>
          <input
            className="border p-2 mb-4 w-full text-black rounded-md"
            placeholder="Seu nome de fã"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setUsername(tempName.trim())}
          />
          <button
            disabled={!tempName.trim()}
            onClick={() => setUsername(tempName.trim())}
            className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
          >
            Entrar no chat
          </button>
        </div>
      </div>
    );
  }

  const parent = window.location.hostname;
  const twitchSrc = nextMatch
    ? `https://player.twitch.tv/?channel=furiatv&parent=${parent}`
    : '';

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Área de chat à esquerda */}
      <div className="w-1/2 flex flex-col">
        <header className="bg-black text-white py-4 text-center font-bold">
          FURIA Fans Chat
        </header>
        {/* Placar */}
        {/* ... insira aqui seu Scoreboard, Chat feed e Input */}
        <Chat username={username} />
      </div>

      {/* Área de vídeo à direita */}
      <div className="w-1/2 p-4 flex flex-col">
        {/* Countdown */}
        {nextMatch && Date.now() < nextMatch.start && (
          <div className="mb-4 bg-yellow-200 text-black p-2 text-center">
            Próximo jogo começa em <Countdown target={nextMatch.start} />
          </div>
        )}
        {/* Embed */}
        {nextMatch && (
          <iframe
            src={twitchSrc}
            height="480"
            width="100%"
            allowFullScreen
            className="flex-1 border rounded"
          />
        )}
      </div>
    </div>
  );
}
