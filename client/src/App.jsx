// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing  from './components/Landing';
import FanChat  from './components/FanChat';   // ← certifique-se deste import
import BotChat  from './components/BotChat';   // ← e deste também

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/fan-chat" element={<FanChat />} />
        <Route path="/bot-chat" element={<BotChat />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
