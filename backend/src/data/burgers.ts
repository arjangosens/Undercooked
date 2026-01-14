/**
 * Hardcoded burger dishes and ingredients in Dutch
 * Used to seed the database or for static configuration
 */

export const INGREDIENTS = {
  BROODJE: { name: 'Broodje', icon: '🍞', points: 1 },
  KAAS: { name: 'Kaas', icon: '🧀', points: 1 },
  VLEES: { name: 'Vlees', icon: '🥩', points: 1 },
  SLA: { name: 'Sla', icon: '🥬', points: 1 },
  TOMAAT: { name: 'Tomaat', icon: '🍅', points: 1 },
  UI: { name: 'Ui', icon: '🧅', points: 1 },
  BACON: { name: 'Bacon', icon: '🥓', points: 1 },
};

export const DISHES = {
  BASIS_BURGER: {
    name: 'Basic Burger',
    icon: '🍔',
    ingredients: ['BROODJE', 'VLEES', 'SLA'],
    difficulty: 'easy' as const,
  },
  KAAS_KLASSIEKER: {
    name: 'Cheese Burger',
    icon: '🧀',
    ingredients: ['BROODJE', 'VLEES', 'KAAS', 'SLA'],
    difficulty: 'medium' as const,
  },
  TUINBURGER: {
    name: 'Tuinburger',
    icon: '🥗',
    ingredients: ['BROODJE', 'VLEES', 'SLA', 'TOMAAT', 'UI'],
    difficulty: 'medium' as const,
  },
  BACON_BURGER: {
    name: 'Bacon Burger',
    icon: '🥓',
    ingredients: ['BROODJE', 'VLEES', 'BACON', 'KAAS', 'SLA'],
    difficulty: 'medium' as const,
  },
  DUBBELE_DELUXE: {
    name: 'Dubbele Deluxe',
    icon: '🤩',
    ingredients: ['BROODJE', 'VLEES', 'VLEES', 'KAAS', 'SLA', 'TOMAAT', 'UI', 'BACON'],
    difficulty: 'hard' as const,
  },
};

export const INGREDIENT_KEYS = Object.keys(INGREDIENTS) as Array<keyof typeof INGREDIENTS>;
export const DISH_KEYS = Object.keys(DISHES) as Array<keyof typeof DISHES>;
