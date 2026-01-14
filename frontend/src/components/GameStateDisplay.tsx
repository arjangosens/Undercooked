import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameState, GameEvent } from '../types/game';
import { socketClient } from '../api/socket';

const INGREDIENT_ICONS: Record<string, string> = {
  BROODJE: '🍞',
  KAAS: '🧀',
  VLEES: '🥩',
  SLA: '🥬',
  TOMAAT: '🍅',
  UI: '🧅',
  BACON: '🥓',
};

const INGREDIENT_NAMES: Record<string, string> = {
  BROODJE: 'Broodje',
  KAAS: 'Kaas',
  VLEES: 'Vlees',
  SLA: 'Sla',
  TOMAAT: 'Tomaat',
  UI: 'Ui',
  BACON: 'Bacon',
};

interface GameStateDisplayProps {
  gameState: GameState | null;
}

export function GameStateDisplay({ gameState }: GameStateDisplayProps) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: number }>({});
  const [liveState, setLiveState] = useState<GameState | null>(gameState);
  const [renderOrders, setRenderOrders] = useState<
    Array<{ order: GameState['orders'][number]; leaving: boolean }>
  >([]);

  // Subscribe to live game state via WebSocket so the display updates even if opened separately
  useEffect(() => {
    socketClient.connect();
    const handler = (state: GameState) => setLiveState(state);
    socketClient.on(GameEvent.STATE_UPDATED, handler);
    return () => {
      socketClient.off(GameEvent.STATE_UPDATED, handler);
    };
  }, []);

  // Sync prop state when provided
  useEffect(() => {
    if (gameState) setLiveState(gameState);
  }, [gameState]);

  const displayState = liveState || gameState;
  const livesLeft = Math.max(0, 3 - (displayState?.strikes ?? 0));
  const livesTrack = '❤️'.repeat(livesLeft) + '🖤'.repeat(3 - livesLeft);

  const formatElapsed = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!displayState || displayState.status === 'waiting') return;

    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: number } = {};
      displayState.orders.forEach((order) => {
        const remaining = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
        newTimeRemaining[order.id] = remaining;
      });
      setTimeRemaining(newTimeRemaining);
    }, 100);

    return () => clearInterval(interval);
  }, [displayState]);

  // Track render orders so we can animate entry/exit
  useEffect(() => {
    if (!displayState) return;
    setRenderOrders((prev) => {
      const incomingIds = new Set(displayState.orders.map((o) => o.id));

      // Mark leaving for orders that disappeared
      const leaving = prev
        .filter((item) => !incomingIds.has(item.order.id))
        .map((item) => ({ ...item, leaving: true }));

      // Keep existing ones (fresh data) that still exist
      const staying = displayState.orders.map((order) => {
        const existing = prev.find((p) => p.order.id === order.id && !p.leaving);
        return { order, leaving: existing ? existing.leaving : false };
      });

      return [...staying, ...leaving];
    });
  }, [displayState]);

  // Remove leaving cards after animation
  useEffect(() => {
    if (!renderOrders.some((o) => o.leaving)) return;
    const timer = setTimeout(() => {
      setRenderOrders((prev) => prev.filter((p) => !p.leaving));
    }, 320);
    return () => clearTimeout(timer);
  }, [renderOrders]);

  if (!displayState || displayState.status === 'waiting') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">🍔</div>
          <h1 className="text-5xl font-bold text-orange-700 mb-4">Undercooked</h1>
          <p className="text-3xl text-orange-600">{t('game.waiting')}</p>
        </div>
      </div>
    );
  }

  if (displayState.status === 'countdown') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6">⏳</div>
          <h1 className="text-5xl font-bold text-orange-700 mb-4">{t('game.countdown')}</h1>
          <div className="text-6xl font-extrabold text-orange-600">
            {displayState.countdownRemaining ?? 0}
          </div>
        </div>
      </div>
    );
  }

  if (displayState.status === 'ended') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold text-purple-700 mb-4">{t('game.ended')}</h1>
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {t('game.score')}: {displayState.score}
          </div>
          <div className="text-2xl font-semibold text-purple-700">
            {t('game.completedOrders', 'Voltooide orders')}: {displayState.completedOrders}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-green-100 p-8">
      {/* Header */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 text-lg mb-2">{t('gameMaster.currentTeam')}</div>
          <div className="text-4xl font-bold text-blue-600">{displayState.currentTeamName}</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 text-lg mb-2">{t('game.elapsedTime')}</div>
          <div className="text-4xl font-bold text-green-600">{formatElapsed(displayState.elapsedTime)}</div>
        </div>
      </div>

      {/* Score and Lives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-yellow-50 border-4 border-yellow-400 rounded-lg shadow-lg p-8">
          <div className="text-2xl text-yellow-700 mb-4">{t('game.score')}</div>
          <div className="text-7xl font-bold text-yellow-600">{displayState.score}</div>
        </div>
        <div className="bg-emerald-50 border-4 border-emerald-400 rounded-lg shadow-lg p-8">
          <div className="text-2xl text-emerald-700 mb-3">
            {t('game.completedOrders', 'Completed orders')}
          </div>
          <div className="text-5xl font-bold text-emerald-600">
            {displayState.completedOrders}
          </div>
          <div className="text-sm text-emerald-700 mt-2">
            {t('gameMaster.activeOrders')}: {displayState.orderCount}
          </div>
        </div>
        <div className="bg-red-50 border-4 border-red-400 rounded-lg shadow-lg p-8">
          <div className="text-2xl text-red-700 mb-4">{t('game.strikes')}</div>
          <div className="text-5xl font-bold text-red-600">{livesTrack}</div>
          <div className="text-sm text-red-700 mt-2">
            {t('game.livesLeft', 'Lives left')}: {livesLeft}/3
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {displayState.orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xl">
            {t('game.noOrders')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderOrders.map(({ order, leaving }) => {
              const remaining = timeRemaining[order.id] ?? Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
              const isExpiring = remaining <= 5;
              const isWarning = !isExpiring && remaining <= 15;
              const totalSeconds = Math.max(1, Math.round((order.expiresAt - order.createdAt) / 1000));
              const progress = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
              const ingredientNames = order.ingredients
                .map((ing) => INGREDIENT_NAMES[ing] || ing)
                .join(' • ');

              const lowTimeClass = isExpiring ? 'animate-shake' : '';
              const cardTone = isExpiring
                ? 'bg-red-50 border-red-400'
                : isWarning
                ? 'bg-amber-50 border-amber-400'
                : 'bg-green-50 border-green-400';
              const meterTone = isExpiring
                ? 'bg-red-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-green-500';
              const timeTone = isExpiring
                ? 'text-red-600'
                : isWarning
                ? 'text-amber-600'
                : 'text-green-600';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-xl ${cardTone} ${
                    leaving ? 'animate-fadeOutDown' : 'animate-fadeInUp'
                  } ${lowTimeClass}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl">{order.dishIcon || '🍽️'}</div>
                    <div className="font-bold text-lg text-gray-800">{order.dishName}</div>
                  </div>
                  <div className="text-4xl mb-2">
                    {order.ingredients.map((ing) => INGREDIENT_ICONS[ing] || '❓').join(' ')}
                  </div>
                  <div className="text-lg text-gray-800 font-semibold mb-3">{ingredientNames}</div>
                  <div className="w-full h-3 rounded-full bg-white/60 overflow-hidden mb-2 border border-gray-200">
                    <div
                      className={`h-full ${meterTone}`}
                      style={{ width: `${progress}%`, transition: 'width 0.25s linear' }}
                    />
                  </div>
                  <div
                    className={`text-2xl font-bold ${timeTone}`}
                  >
                    {remaining}s
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
