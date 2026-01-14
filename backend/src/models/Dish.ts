import mongoose, { Schema, Document } from 'mongoose';

export interface IDish extends Document {
  key: string; // Identifier like "CLASSIC_BURGER"
  name: string; // Dutch name
  icon: string; // emoji or icon identifier
  ingredients: string[]; // ingredient keys
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const DishSchema = new Schema<IDish>({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  ingredients: [{ type: String, required: true }],
  totalPoints: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
});

export const Dish = mongoose.model<IDish>('Dish', DishSchema);
