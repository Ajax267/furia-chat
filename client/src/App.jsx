import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [msgs, setMsgs] = useState([]);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    socket.on('mensagem', m => setMsgs(prev => [...prev, m]));
  }, []);

  const enviar = () => {
    socket.emit('mensagem', texto);
    setTexto('');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">FURIA Fans Chat</h1>
      <div className="border p-2 h-64 overflow-auto mb-4">
        {msgs.map((m,i) => <div key={i}>{m}</div>)}
      </div>
      <input
        className="border p-2 mr-2"
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />
      <button onClick={enviar} className="px-4 py-2 bg-green-600 text-white rounded">
        Enviar
      </button>
    </div>
  );
}

export default App;
