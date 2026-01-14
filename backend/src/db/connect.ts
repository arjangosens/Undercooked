import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import { seedGameData } from '../data/seed';

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
  isConnected = true;

  // Seed game data
  try {
    await seedGameData();
  } catch (error) {
    console.error('Failed to seed game data:', error);
  }

  return mongoose;
}
