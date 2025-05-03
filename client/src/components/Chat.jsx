import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function Chat() {
  const [username, setUsername] = useState('');
  const [tempName, setTempName] = useState('');
  const [msgs, setMsgs]     = useState([]);
  const [texto, setTexto]   = useState('');
  const [gameStatus, setGameStatus] = useState({
    round: 0,
    score: { f: 0, o: 0 },
    lastWinner: null,
    finished: false
  });
  const endRef = useRef();

  // Socket listeners
  useEffect(() => {
    socket.on('gameStatus', status => setGameStatus(status));
    socket.on('mensagem', payload => setMsgs(prev => [...prev, { ...payload, type: 'msg' }]));
    socket.on('reaction', payload => setMsgs(prev => [...prev, { ...payload, type: 'reaction' }]));
    return () => {
      socket.off('gameStatus');
      socket.off('mensagem');
      socket.off('reaction');
    };
  }, []);

  // Auto-scroll
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
        {lastWinner && <div className="italic text-sm">Último vencedor: {lastWinner}</div>}
      </div>
    );
  }

  // If not logged in, show nickname form
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

  // Render chat
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Scoreboard />
      <header className="bg-black text-white py-4 text-center text-xl font-bold">
        FURIA Fans Chat
      </header>
      <main className="flex-1 p-4 overflow-auto">
        {msgs.map((item, i) => (
          <div key={i} className="mb-2 flex items-baseline">
            <span className={`mr-2 font-semibold ${item.color}`}>{item.username}:</span>
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
        {['🔥','👏','💯','🎉'].map(emo => (
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
