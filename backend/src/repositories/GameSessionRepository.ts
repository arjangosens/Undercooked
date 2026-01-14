/**
 * Game Session Repository - Data access layer
 */

import { GameSession, IGameSession } from '../models/GameSession';

export class GameSessionRepository {
  async getById(id: string): Promise<IGameSession | null> {
    return GameSession.findById(id);
  }

  async create(name: string): Promise<IGameSession> {
    const session = new GameSession({ name, rounds: [] });
    return session.save();
  }

  async addRound(sessionId: string, roundId: string): Promise<IGameSession | null> {
    return GameSession.findByIdAndUpdate(
      sessionId,
      { $push: { rounds: roundId } },
      { new: true }
    );
  }
}
