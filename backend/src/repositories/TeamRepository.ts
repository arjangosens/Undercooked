/**
 * Team Repository - Data access layer
 */

import { Team, ITeam } from '../models/Team';

export class TeamRepository {
  async getAll(): Promise<ITeam[]> {
    return Team.find();
  }

  async getById(id: string): Promise<ITeam | null> {
    return Team.findById(id);
  }

  async create(name: string): Promise<ITeam> {
    const team = new Team({ name });
    return team.save();
  }

  async update(id: string, data: Partial<ITeam>): Promise<ITeam | null> {
    return Team.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await Team.findByIdAndDelete(id);
  }
}
