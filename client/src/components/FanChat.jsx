// src/components/FanChat.jsx
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Chat from './Chat';
import { Countdown } from './Countdown';

const socket = import.meta.env.PROD
  ? io({ withCredentials: true })
  : io('http://localhost:3001', { withCredentials: true });

export default function FanChat() {
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    socket.on('nextMatch', nm => {
      // Forçar início em DEV
      if (import.meta.env.DEV) {
        nm.start = Date.now() - 1000;
      }
      setNextMatch(nm);
    });
    return () => socket.off('nextMatch');
  }, []);

  // monta o parâmetro parent automaticamente
  const parent = window.location.hostname;  
  const twitchSrc = nextMatch
    ? `https://player.twitch.tv/?channel=furiatv&parent=${parent}`
    : '';

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-black text-white py-4 text-center text-xl font-bold">
        FURIA Fans Chat
      </header>

      {nextMatch && Date.now() < nextMatch.start && (
        <div className="p-4 bg-yellow-200 text-black text-center">
          Próximo jogo começa em <Countdown target={nextMatch.start} />
        </div>
      )}

      {nextMatch && Date.now() >= nextMatch.start && (
        <div className="flex justify-center p-4">
          <iframe
            src={twitchSrc}
            height="480"
            width="720"
            allowFullScreen
          />
        </div>
      )}

      <Chat />
    </div>
  );
}
