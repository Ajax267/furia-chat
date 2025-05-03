// src/components/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = import.meta.env.PROD
  ? io({ withCredentials: true })
  : io('http://localhost:3001', {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });

export default function Chat({ username }) {
  const [msgs, setMsgs] = useState([]);
  const [texto, setTexto] = useState('');
  const [gameStatus, setGameStatus] = useState({
    round: 0,
    score: { f: 0, o: 0 },
    lastWinner: null,
    finished: false
  });
  const endRef = useRef();

  // Socket listeners
  useEffect(() => {
    socket.on('gameStatus', setGameStatus);
    socket.on('mensagem', payload =>
      setMsgs(prev => [...prev, { ...payload, type: 'msg' }])
    );
    socket.on('reaction', payload =>
      setMsgs(prev => [...prev, { ...payload, type: 'reaction' }])
    );
    return () => socket.off();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Send message
  const enviar = () => {
    if (!texto.trim()) return;
    socket.emit('mensagem', { texto, username });
    setTexto('');
  };

  // Scoreboard component
  function Scoreboard() {
    const { round, score, lastWinner, finished } = gameStatus;
    if (finished) {
      return (
        <div className="bg-gray-800 text-white p-2 text-center">
          Partida encerrada: {score.f} x {score.o}
        </div>
      );
    }
    return (
      <div className="bg-gray-900 text-white py-2 px-4 flex justify-between items-center">
        <div className="font-bold text-lg">
          {round > 1 ? `Round ${round - 1} finalizado` : 'Aguardando início'}
        </div>
        <div className="text-xl">
          <span className="font-bold">FURIA</span> {score.f} – {score.o}{' '}
          <span className="font-bold">OPPONENTS</span>
        </div>
        {lastWinner && (
          <div className="italic text-sm">Último vencedor: {lastWinner}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Scoreboard />
      <main className="flex-1 p-4 overflow-auto">
        {msgs.map((item, i) => (
          <div key={i} className="mb-2 flex items-baseline">
            <span className={`mr-2 font-semibold ${item.color}`}>
              {item.username}:
            </span>
            {item.type === 'reaction' ? (
              <span className="text-2xl">{item.emoji}</span>
            ) : (
              <span className="inline-block px-2 py-1 bg-white rounded shadow text-black">
                {item.texto}
              </span>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </main>
      <footer className="p-4 flex">
        <input
          className="flex-1 border rounded-l px-3 py-2 focus:outline-none text-black"
          placeholder="Digite sua mensagem..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <button
          onClick={enviar}
          className="bg-green-600 text-white px-6 rounded-r hover:bg-green-700"
        >
          Enviar
        </button>
      </footer>
      <div className="flex space-x-4 p-2 border-t">
        {['🔥', '👏', '💯', '🎉'].map(emo => (
          <button
            key={emo}
            onClick={() => socket.emit('reaction', { emoji: emo, username })}
            className="text-2xl hover:scale-110 transition"
          >
            {emo}
          </button>
        ))}
      </div>
    </div>
  );
}
