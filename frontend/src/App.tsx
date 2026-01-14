import { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { GameStateDisplay } from './components/GameStateDisplay';
import { GameMasterControl } from './components/GameMasterControl';
import { Leaderboard } from './components/Leaderboard';
import { GameState } from './types/game';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />
      <Route
        path="/display"
        element={<GameStateDisplay gameState={gameState} />}
      />
      <Route
        path="/manager"
        element={<GameMasterControl onGameStateChange={setGameState} />}
      />
      <Route
        path="/leaderboard"
        element={<Leaderboard />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🍔</div>
          <h1 className="text-5xl font-extrabold text-orange-700">Undercooked</h1>
          <p className="text-xl text-orange-600 mt-2">Kies een scherm om te openen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/display"
            className="bg-white shadow-lg rounded-2xl p-6 text-left border-2 border-transparent hover:border-orange-300 transition-all"
          >
            <div className="text-4xl mb-3">📺</div>
            <div className="text-2xl font-bold text-orange-700 mb-1">Spelscherm</div>
            <p className="text-gray-600">Volledig scherm voor projector/TV.</p>
          </Link>

          <Link
            to="/manager"
            className="bg-white shadow-lg rounded-2xl p-6 text-left border-2 border-transparent hover:border-blue-300 transition-all"
          >
            <div className="text-4xl mb-3">👩‍✈️</div>
            <div className="text-2xl font-bold text-blue-700 mb-1">Game manager</div>
            <p className="text-gray-600">Start rondes, beheer teams en orders.</p>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-white shadow-lg rounded-2xl p-6 text-left border-2 border-transparent hover:border-purple-300 transition-all"
          >
            <div className="text-4xl mb-3">🏆</div>
            <div className="text-2xl font-bold text-purple-700 mb-1">Scorebord</div>
            <p className="text-gray-600">Bekijk vorige rondes en resultaten.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
