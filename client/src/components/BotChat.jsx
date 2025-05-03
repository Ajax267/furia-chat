import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Countdown } from './Countdown';

const socket = import.meta.env.PROD
    ? io({ withCredentials: true })
    : io('http://localhost:3001', { withCredentials: true });

export default function BotChat() {
    const [username, setUsername] = useState('');
    const [tempName, setTempName] = useState('');
    const [msgs, setMsgs] = useState([]);
    const [texto, setTexto] = useState('');
    const [nextMatch, setNextMatch] = useState(null);
    const endRef = useRef();

    // Recebe respostas do bot e agendamento do próximo jogo
    useEffect(() => {
        socket.on('botMessage', ({ text }) => {
            setMsgs(prev => [...prev, { sender: 'bot', text }]);
        });
        socket.on('nextMatch', nm => {
            setNextMatch(nm);
            if (import.meta.env.DEV) {
                nm.start = Date.now() - 1000;
            }
            setNextMatch(nm);
        });
        return () => {
            socket.off('botMessage');
            socket.off('nextMatch');
        };
    }, []);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs]);

    // Envio de mensagem do usuário
    const enviar = () => {
        if (!texto.trim()) return;
        setMsgs(prev => [...prev, { sender: 'user', text: texto }]);
        socket.emit('userMessage', { text: texto });
        setTexto('');
    };

    // Tela de login por apelido
    if (!username) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-6 rounded shadow-md">
                    <h2 className="mb-4 text-xl text-black">Digite seu apelido</h2>
                    <input
                        className="border p-2 mb-4 w-full text-black"
                        placeholder="Seu nome de fã"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && setUsername(tempName.trim())}
                    />
                    <button
                        disabled={!tempName.trim()}
                        onClick={() => setUsername(tempName.trim())}
                        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                    >
                        Entrar no Chatbot
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            <header className="bg-blue-700 text-white py-4 text-center text-xl font-bold">
                FURIABot
            </header>

            {/* Se tiver um próximo jogo e ainda não começou, mostra o countdown */}
            {nextMatch && Date.now() < nextMatch.start && (
                <div className="p-4 bg-yellow-200 text-black text-center">
                    Próximo jogo começa em <Countdown target={nextMatch.start} />
                </div>
            )}

            {/* Se o jogo já começou ou acabou, exibe o player embed */}
            {nextMatch && Date.now() >= nextMatch.start && (
                <div className="flex justify-center p-4">
                    <iframe
                        src={nextMatch.channel}
                        height="480"
                        width="720"
                        allowFullScreen
                    />
                </div>
            )}

            <main className="flex-1 p-4 overflow-auto">
                {msgs.map((m, i) => (
                    <div key={i} className="mb-2 flex items-baseline">
                        <span
                            className={`mr-2 font-semibold ${m.sender === 'user' ? 'text-blue-500' : 'text-green-500'
                                }`}
                        >
                            {m.sender === 'user' ? username : 'FURIABot'}:
                        </span>
                        <span className="inline-block px-2 py-1 bg-white rounded shadow text-black">
                            {m.text}
                        </span>
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
                    className="bg-blue-600 text-white px-6 rounded-r hover:bg-blue-700"
                >
                    Enviar
                </button>
            </footer>
        </div>
    );
}