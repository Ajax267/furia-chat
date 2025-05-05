// src/components/FanChat.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

const socket = import.meta.env.PROD
    ? io({ withCredentials: true })
    : io('http://localhost:3001', { transports: ['polling', 'websocket'], withCredentials: true });

export default function FanChat() {
    // Login
    const [username, setUsername] = useState('');
    const [tempName, setTempName] = useState('');

    // Chat state
    const [msgs, setMsgs] = useState([]);
    const [texto, setTexto] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const endRef = useRef();

    // Score and match state
    const [gameStatus, setGameStatus] = useState({
        round: 0,
        score: { f: 0, o: 0 },
        lastWinner: null,
        finished: false
    });
    const [nextMatch, setNextMatch] = useState(null);

    // Socket listeners
    useEffect(() => {
        socket.on('nextMatch', nm => {
            if (import.meta.env.DEV) nm.start = Date.now() - 1000;
            setNextMatch(nm);
        });
        socket.on('gameStatus', setGameStatus);
        socket.on('mensagem', payload =>
            setMsgs(prev => [...prev, { ...payload, type: 'msg' }])
        );
        socket.on('reaction', payload =>
            setMsgs(prev => [...prev, { ...payload, type: 'reaction' }])
        );
        return () => socket.off();
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

    //   // Scoreboard
    //   const Scoreboard = () => {
    //     const { round, score, lastWinner, finished } = gameStatus;
    //     if (finished) {
    //       return (
    //         <div className="bg-gray-800 text-white p-2 text-center">
    //           Partida encerrada: {score.f} x {score.o}
    //         </div>
    //       );
    //     }
    //     return (
    //       <div className="bg-gray-900 text-white py-2 px-4 flex justify-between items-center">
    //         <div className="font-bold text-lg">
    //           {round > 1 ? `Round ${round - 1} finalizado` : 'Aguardando início'}
    //         </div>
    //         <div className="text-xl">
    //           <span className="font-bold">FURIA</span> {score.f} – {score.o}{' '}
    //           <span className="font-bold">OPPONENTS</span>
    //         </div>
    //         {lastWinner && <div className="italic text-sm">Último vencedor: {lastWinner}</div>}
    //       </div>
    //     );
    //   };

    // Login screen
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

    // Twitch embed URL
    const parent = window.location.hostname.split(':')[0];
    const twitchSrc = `https://player.twitch.tv/?channel=furiatv&parent=${parent}`;

    return (
        <div className="w-screen h-screen flex bg-gray-100">
            {/* Sidebar de chat fixa */}
            <div className="w-1/4 bg-white flex flex-col">
                <header className="bg-black text-white py-4 text-center font-bold">
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
                <footer className="pl-4 pr-4">
                    <div className="relative flex items-center">
                        <div className="flex flex-1 rounded border border-r-0 border-gray-300 overflow-hidden !bg-transparent">
                        <button
                            onClick={() => setShowPicker(v => !v)}
                            className="px-6 hover:bg-gray-200 mr-2 !bg-transparent"
                        >
                            😄
                        </button>
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 outline-none text-black"
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                onKeyDown={e => e.key === 'Enter' && enviar()}
                            />
                            <button
                                onClick={enviar}
                                className="px-4 bg-green-600 text-white hover:bg-green-700 !rounded-l-none rounded-r -mr-px"
                            >
                                Enviar
                            </button>
                        </div>
                        {showPicker && (
                            <div className="absolute bottom-full mb-2 left-0 z-20">
                                <EmojiPicker
                                    onEmojiClick={(emojiObject, event) => setTexto(t => t + emojiObject.emoji)}
                                    pickerStyle={{ boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                                />
                            </div>
                        )}
                    </div>
                </footer>
                <div className="flex space-x-4 p-2 justify-center items-center">
                    {['🔥', '👏', '💯', '🎉'].map(emo => (
                        <button
                            key={emo}
                            onClick={() => socket.emit('reaction', { emoji: emo, username })}
                            className="text-2xl hover:scale-110 transition !bg-transparent"
                        >
                            {emo}
                        </button>
                    ))}
                </div>
            </div>

            {/* TWITCH STREAM */}
            <div className="w-full md:flex-1 flex justify-center items-center">
                <iframe
                    src={twitchSrc}
                    title="Twitch Stream"
                    className="w-full h-64 md:h-full"
                    allowFullScreen
                />
            </div>
        </div>
    );
}
