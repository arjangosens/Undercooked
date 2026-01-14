import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
  key: string; // Identifier like "BON", "VLEES"
  name: string; // Dutch name
  icon: string; // emoji or icon identifier
  points: number;
}

const IngredientSchema = new Schema<IIngredient>({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  points: { type: Number, required: true, default: 1 },
});

export const Ingredient = mongoose.model<IIngredient>('Ingredient', IngredientSchema);
