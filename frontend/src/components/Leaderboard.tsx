import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Round } from '../types/game';
import { gameApi } from '../api/gameApi';

export function Leaderboard() {
  const { t } = useTranslation();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await gameApi.getLeaderboard(50);
        setRounds(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (roundId: string) => {
    if (!window.confirm(t('leaderboard.confirm'))) return;

    try {
      await gameApi.deleteRound(roundId);
      setRounds(rounds.filter((r) => r._id !== roundId));
    } catch (error) {
      console.error('Error deleting round:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-lg">
        <div className="text-2xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-lg">
      <h2 className="text-3xl font-bold text-purple-800 mb-6">{t('leaderboard.title')}</h2>

      {rounds.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-lg">{t('leaderboard.noResults')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-lg">
            <thead>
              <tr className="bg-purple-200 text-purple-900 font-bold">
                <th className="p-4 text-left">{t('leaderboard.rank')}</th>
                <th className="p-4 text-left">{t('leaderboard.team')}</th>
                <th className="p-4 text-right">{t('leaderboard.score')}</th>
                <th className="p-4 text-right">{t('leaderboard.completed')}</th>
                <th className="p-4 text-left">{t('leaderboard.date')}</th>
                <th className="p-4 text-center">{t('leaderboard.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round, index) => (
                <tr
                  key={round._id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}
                >
                  <td className="p-4 font-bold text-lg text-purple-700">#{index + 1}</td>
                  <td className="p-4 font-bold text-gray-800">{round.teamName}</td>
                  <td className="p-4 text-right font-bold text-yellow-600 text-lg">
                    {round.score}
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    {round.completedOrders}/{round.totalOrders}
                  </td>
                  <td className="p-4 text-gray-600">
                    {round.endedAt
                      ? new Date(round.endedAt).toLocaleDateString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(round._id)}
                      className="bg-red-400 hover:bg-red-600 text-white px-3 py-1 rounded transition-all"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
