const API_URL = (import.meta.env.DEV as boolean) ? 'http://localhost:3000/api' : '/api';

export const gameApi = {
  // Sessions
  createSession: async (name: string) => {
    const res = await fetch(`${API_URL}/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  // Teams
  getTeams: async () => {
    const res = await fetch(`${API_URL}/game/teams`);
    return res.json();
  },

  createTeam: async (name: string) => {
    const res = await fetch(`${API_URL}/game/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  updateTeam: async (id: string, name: string) => {
    const res = await fetch(`${API_URL}/game/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  deleteTeam: async (id: string) => {
    const res = await fetch(`${API_URL}/game/teams/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Rounds
  startRound: async (sessionId: string, teamId: string, teamName: string) => {
    const res = await fetch(`${API_URL}/game/rounds/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, teamId, teamName }),
    });
    return res.json();
  },

  endRound: async (sessionId: string) => {
    const res = await fetch(`${API_URL}/game/rounds/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.json();
  },

  getSessionRounds: async (sessionId: string) => {
    const res = await fetch(`${API_URL}/game/sessions/${sessionId}/rounds`);
    return res.json();
  },

  // Orders
  fulfillOrder: async (sessionId: string, orderId: string) => {
    const res = await fetch(`${API_URL}/game/orders/${orderId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.json();
  },

  // Leaderboard
  getLeaderboard: async (limit: number = 50) => {
    const res = await fetch(`${API_URL}/game/leaderboard?limit=${limit}`);
    return res.json();
  },

  deleteRound: async (roundId: string) => {
    const res = await fetch(`${API_URL}/game/rounds/${roundId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
