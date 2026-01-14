import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameEvent, GameState, Team } from '../types/game';
import { gameApi } from '../api/gameApi';
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

interface GameMasterControlProps {
  onGameStateChange: (state: GameState | null) => void;
}

export function GameMasterControl({ onGameStateChange }: GameMasterControlProps) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [renderOrders, setRenderOrders] = useState<
    Array<{ order: GameState['orders'][number]; leaving: boolean }>
  >([]);
  const [sessionId] = useState<string>(() => {
    const id = sessionStorage.getItem('sessionId');
    if (id) return id;
    // Generate a new session ID
    const newId = `session-${Date.now()}`;
    sessionStorage.setItem('sessionId', newId);
    return newId;
  });
  const [loading, setLoading] = useState(true);

  // Fetch teams on mount
  useEffect(() => {
    const load = async () => {
      try {
        await refreshTeams();
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Listen to game state updates
  useEffect(() => {
    socketClient.connect();
    const handler = (state: GameState) => {
      setGameState(state);
      onGameStateChange(state);
    };
    socketClient.on(GameEvent.STATE_UPDATED, handler);

    return () => {
      socketClient.off(GameEvent.STATE_UPDATED, handler);
    };
  }, [onGameStateChange]);

  // Keep renderOrders in sync for entry/exit animations
  useEffect(() => {
    if (!gameState) return;
    setRenderOrders((prev) => {
      const incomingIds = new Set(gameState.orders.map((o) => o.id));

      const leaving = prev
        .filter((item) => !incomingIds.has(item.order.id))
        .map((item) => ({ ...item, leaving: true }));

      const staying = gameState.orders.map((order) => {
        const existing = prev.find((p) => p.order.id === order.id && !p.leaving);
        return { order, leaving: existing ? existing.leaving : false };
      });

      return [...staying, ...leaving];
    });
  }, [gameState]);

  useEffect(() => {
    if (!renderOrders.some((o) => o.leaving)) return;
    const timer = setTimeout(() => {
      setRenderOrders((prev) => prev.filter((p) => !p.leaving));
    }, 320);
    return () => clearTimeout(timer);
  }, [renderOrders]);

  const refreshTeams = async () => {
    const teamsData = await gameApi.getTeams();
    setTeams(teamsData);
  };

  const handleStartRound = async () => {
    if (!selectedTeam) return;

    try {
      const result = await gameApi.startRound(sessionId, selectedTeam._id, selectedTeam.name);
      setGameState(result.gameState);
      onGameStateChange(result.gameState);
    } catch (error) {
      console.error('Error starting round:', error);
    }
  };

  const handleEndRound = async () => {
    if (!gameState) return;

    try {
      await gameApi.endRound(sessionId);
      setGameState(null);
      onGameStateChange(null);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error ending round:', error);
    }
  };

  const formatElapsed = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFulfillOrder = async (orderId: string) => {
    if (!gameState) return;

    try {
      await gameApi.fulfillOrder(sessionId, orderId);
    } catch (error) {
      console.error('Error fulfilling order:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const created = await gameApi.createTeam(newTeamName.trim());
    setNewTeamName('');
    setTeams((prev) => [...prev, created]);
  };

  const startEditTeam = (team: Team) => {
    setEditingTeam(team._id);
    setEditingName(team.name);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;
    const updated = await gameApi.updateTeam(editingTeam, editingName.trim());
    setTeams((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (id: string) => {
    await gameApi.deleteTeam(id);
    setTeams((prev) => prev.filter((t) => t._id !== id));
    if (selectedTeam?._id === id) setSelectedTeam(null);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">{t('gameMaster.title')}</h1>

      {/* Team Selection */}
      {!gameState && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 space-y-6">
          <div className="text-2xl font-bold text-gray-700">{t('gameMaster.selectTeam')}</div>

          {/* Team create */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('team.name')}</label>
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder={t('team.name')}
              />
            </div>
              <button
                onClick={handleCreateTeam}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg py-2 px-4"
              >
                {t('team.add')}
              </button>
          </div>

          {/* Team list with edit/delete */}
          {teams.length === 0 ? (
            <div className="text-gray-500 mb-4">{t('gameMaster.noTeams')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => {
                const isEditing = editingTeam === team._id;
                return (
                  <div
                    key={team._id}
                    className={`p-4 rounded-lg border-2 ${
                      selectedTeam?._id === team._id ? 'border-blue-500' : 'border-gray-200'
                    } bg-gray-50`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {isEditing ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 border rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-lg font-bold text-gray-800">{team.name}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => setSelectedTeam(team)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold"
                          >
                            {t('team.choose')}
                          </button>
                          <button
                            onClick={() => startEditTeam(team)}
                            className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                          >
                            {t('team.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team._id)}
                            className="px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50"
                          >
                            {t('team.delete')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleUpdateTeam}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditingTeam(null)}
                            className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                          >
                            {t('common.cancel')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleStartRound}
            disabled={!selectedTeam}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
              selectedTeam
                ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {t('gameMaster.startRound')}
          </button>
        </div>
      )}

      {/* Active Game Controls */}
      {gameState && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('gameMaster.currentTeam')}</div>
              <div className="text-2xl font-bold text-blue-600">{gameState.currentTeamName}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('gameMaster.status', 'Ronde status')}</div>
              <div className="text-xl font-bold text-indigo-600 capitalize">{gameState.status}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('gameMaster.currentScore')}</div>
              <div className="text-2xl font-bold text-yellow-600">{gameState.score}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('game.completedOrders', 'Completed orders')}</div>
              <div className="text-2xl font-bold text-emerald-600">{gameState.completedOrders}</div>
              <div className="text-xs text-emerald-700 mt-1">
                {t('game.totalOrders', 'Total spawned')}: {gameState.orderCount}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('gameMaster.currentStrikes')}</div>
              <div className="text-2xl font-bold text-red-600">
                {'❤️'.repeat(Math.max(0, 3 - gameState.strikes))}
                {'🖤'.repeat(Math.min(3, Math.max(0, gameState.strikes)))}
              </div>
              <div className="text-xs text-red-700 mt-1">
                {t('game.livesLeft', 'Lives left')}: {Math.max(0, 3 - gameState.strikes)}/3
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm">{t('game.elapsedTime')}</div>
              <div className="text-2xl font-bold text-slate-700">{formatElapsed(gameState.elapsedTime)}</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-xl font-bold text-gray-700 mb-4">{t('gameMaster.activeOrders')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderOrders.map(({ order, leaving }) => {
                const remaining = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));
                const isExpiring = remaining <= 5;
                const isWarning = !isExpiring && remaining <= 15;
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

                return (
                  <button
                    key={order.id}
                    onClick={() => handleFulfillOrder(order.id)}
                    className={`p-4 rounded-lg hover:bg-opacity-90 transition-all text-left transform hover:-translate-y-1 hover:shadow-lg ${
                      leaving ? 'animate-fadeOutDown' : 'animate-fadeInUp'
                    } ${isExpiring ? 'animate-shake' : ''} ${cardTone}`}
                  >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">{order.dishIcon || '🍽️'}</div>
                    <div className="font-bold text-gray-700">{order.dishName}</div>
                  </div>
                  <div className="text-4xl mb-2">
                    {order.ingredients.map((ing) => INGREDIENT_ICONS[ing] || '❓').join(' ')}
                  </div>
                  <div className="text-lg text-gray-800 font-semibold mb-2">
                    {order.ingredients
                      .map((ing) => INGREDIENT_NAMES[ing] || ing)
                      .join(' • ')}
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/60 overflow-hidden mb-2 border border-green-200">
                    {(() => {
                      const total = Math.max(1, Math.round((order.expiresAt - order.createdAt) / 1000));
                      const progress = Math.max(0, Math.min(100, (remaining / total) * 100));
                      return (
                        <div
                          className={`h-full ${meterTone}`}
                          style={{ width: `${progress}%`, transition: 'width 0.25s linear' }}
                        />
                      );
                    })()}
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    {order.points} {t('game.score')} · {t('game.timeLeft', 'Time left')}: {remaining}s
                  </div>
                  <div className="bg-green-500 text-white py-2 px-3 rounded text-center font-bold">
                    {t('gameMaster.fulfill')}
                  </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleEndRound}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold text-lg transition-all"
          >
            {t('gameMaster.endRound')}
          </button>
        </div>
      )}
    </div>
  );
}
