import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  roundId: string;
  dishId: string;
  dishName: string;
  ingredients: string[];
  points: number;
  status: 'pending' | 'fulfilled' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  fulfilledAt?: Date;
}

const OrderSchema = new Schema<IOrder>({
  roundId: { type: String, required: true },
  dishId: { type: String, required: true },
  dishName: { type: String, required: true },
  ingredients: [{ type: String, required: true }],
  points: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'fulfilled', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  fulfilledAt: { type: Date },
});

// Index for finding active orders
OrderSchema.index({ roundId: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
