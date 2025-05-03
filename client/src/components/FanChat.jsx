
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
            // Forçar embed em DEV
            if (import.meta.env.DEV) {
                nm.start = Date.now() - 1000;
                nm.channel = `https://player.twitch.tv/?channel=furiatv&parent=https://chat-furia-c918aa144b28.herokuapp.com`;
            }
            setNextMatch(nm);
        });
        return () => socket.off('nextMatch');
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-100">
          

            {/* Se houver próximo jogo e ainda não tiver começado */}
            {nextMatch && Date.now() < nextMatch.start && (
                <div className="p-4 bg-yellow-200 text-black text-center">
                    Próximo jogo começa em <Countdown target={nextMatch.start} />
                </div>
            )}

            {/* Se o jogo já começou ou acabou */}
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

            {/* Componente de chat multiusuário */}
            <Chat />
        </div>
    );
}
