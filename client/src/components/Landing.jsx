import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-black text-white">
      <h1 className="text-5xl font-extrabold mb-6">FURIA Fans Hub</h1>
      <p className="text-lg mb-8 text-center max-w-xl">
        Escolha seu modo de interação:
      </p>
      <div className="flex space-x-6">
        <Link
          to="/fan-chat"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-xl font-semibold transition"
        >
          <span className='text-white'>Chat de Torcida</span>
        </Link>
        <Link
          to="/bot-chat"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-xl font-semibold transition"
        >
          <span className='text-white'>Chatbot FURIA</span>
        </Link>
      </div>
    </div>
  );
}
