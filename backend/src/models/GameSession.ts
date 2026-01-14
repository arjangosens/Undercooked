import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  name: string;
  rounds: string[]; // Round IDs
  createdAt: Date;
  updatedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>({
  name: { type: String, required: true },
  rounds: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema);
