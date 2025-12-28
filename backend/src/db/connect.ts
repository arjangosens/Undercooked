import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';

let isConnected = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  return mongoose;
}
