/**
 * Round Repository - Data access layer
 */

import { Round, IRound } from '../models/Round';

export class RoundRepository {
  async getById(id: string): Promise<IRound | null> {
    return Round.findById(id);
  }

  async getBySessionId(sessionId: string): Promise<IRound[]> {
    return Round.find({ sessionId }).sort({ endedAt: -1 });
  }

  async getLeaderboard(limit: number = 50): Promise<IRound[]> {
    return Round.find({ endedAt: { $exists: true } })
      .sort({ score: -1, endedAt: -1 })
      .limit(limit);
  }

  async delete(id: string): Promise<void> {
    await Round.findByIdAndDelete(id);
  }
}
