import dotenv from 'dotenv';
dotenv.config();

export const PORT: number = process.env.PORT ? Number(process.env.PORT) : 3000;
export const MONGO_URI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/undercooked';
