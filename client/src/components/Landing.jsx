import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-black text-white">
      <h1 className="text-5xl font-extrabold mb-6">FURIA Fans Chat</h1>
      <p className="text-lg mb-8 text-center max-w-xl">
        Conecte-se com outros fãs da FURIA em tempo real: chat, placar e reações ao vivo!
      </p>
      <Link
        to="/chat"
        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-xl font-semibold transition"
      >
        Entrar no chat
      </Link>
    </div>
  );
}
