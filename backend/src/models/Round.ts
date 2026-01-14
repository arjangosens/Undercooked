import mongoose, { Schema, Document } from 'mongoose';

export interface IRound extends Document {
  sessionId: string;
  teamId: string;
  teamName: string;
  score: number;
  strikes: number;
  totalOrders: number;
  completedOrders: number;
  startedAt: Date;
  endedAt?: Date;
}

const RoundSchema = new Schema<IRound>({
  sessionId: { type: String, required: true },
  teamId: { type: String, required: true },
  teamName: { type: String, required: true },
  score: { type: Number, default: 0 },
  strikes: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

// Index for leaderboard queries
RoundSchema.index({ score: -1, endedAt: -1 });
RoundSchema.index({ sessionId: 1 });

export const Round = mongoose.model<IRound>('Round', RoundSchema);
