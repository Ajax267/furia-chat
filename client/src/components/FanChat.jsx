// src/components/FanChat.jsx
import { useState, useEffect } from 'react';
import { io }            from 'socket.io-client';
import Chat              from './Chat';
import { Countdown }     from './Countdown';

const socket = import.meta.env.PROD
  ? io({ withCredentials: true })
  : io('http://localhost:3001', { withCredentials: true });

export default function FanChat() {
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    socket.on('nextMatch', nm => {
      // Em DEV, ainda pode forçar start para debug, mas sem afetar o embed
      if (import.meta.env.DEV) nm.start = Date.now() - 1000;
      setNextMatch(nm);
    });
    return () => socket.off('nextMatch');
  }, []);

  // always show the player using the current host as parent
  const parent   = window.location.hostname.split(':')[0];
  const twitchSrc = `https://player.twitch.tv/?channel=furiatv&parent=${parent}`;

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Coluna esquerda: Chat */}
      <div className="w-1/2 flex flex-col">
        <header className="bg-black text-white py-4 text-center font-bold">
          FURIA Fans Chat
        </header>
        {/* Scoreboard, mensagens e input */}
        <Chat />
      </div>

      {/* Coluna direita: Twitch sempre visível */}
      <div className="w-1/2 p-4 flex flex-col items-center">
        <div className="w-full mb-4">
          {/* você pode manter o countdown opcionalmente */}
          {nextMatch && (
            <div className="bg-yellow-200 text-black p-2 text-center rounded">
              Próximo jogo começa em <Countdown target={nextMatch.start} />
            </div>
          )}
        </div>
        <iframe
          src={twitchSrc}
          height="480"
          width="100%"
          allowFullScreen
          className="border rounded shadow"
        />
      </div>
    </div>
  );
}
