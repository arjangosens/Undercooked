/**
 * Dish Repository - Data access layer
 */

import { Dish, IDish } from '../models/Dish';

export class DishRepository {
  async getAll(): Promise<IDish[]> {
    return Dish.find();
  }

  async getById(id: string): Promise<IDish | null> {
    return Dish.findById(id);
  }

  async getByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<IDish[]> {
    return Dish.find({ difficulty });
  }
}
