import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
