/**
 * Database seeding for initial game data
 * Called on startup to ensure dishes and ingredients exist
 */

import { Ingredient, IIngredient } from '../models/Ingredient';
import { Dish, IDish } from '../models/Dish';
import { INGREDIENTS, DISHES } from './burgers';

export async function seedGameData(): Promise<void> {
  try {
    // Seed ingredients
    for (const [key, ingredientData] of Object.entries(INGREDIENTS)) {
      const exists = await Ingredient.findOne({ key });
      if (!exists) {
        const ingredient = new Ingredient({
          key,
          name: ingredientData.name,
          icon: ingredientData.icon,
          points: ingredientData.points,
        });
        await ingredient.save();
        console.log(`Seeded ingredient: ${ingredientData.name}`);
      }
    }

    // Seed dishes
    for (const [key, dishData] of Object.entries(DISHES)) {
      const exists = await Dish.findOne({ key });
      if (!exists) {
        const dish = new Dish({
          key,
          name: dishData.name,
          icon: dishData.icon,
          ingredients: dishData.ingredients,
          totalPoints: dishData.ingredients.length,
          difficulty: dishData.difficulty,
        });
        await dish.save();
        console.log(`Seeded dish: ${dishData.name}`);
      }
    }

    console.log('Game data seeding completed');
  } catch (error) {
    console.error('Error seeding game data:', error);
    throw error;
  }
}
