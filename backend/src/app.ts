import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import gameRouter from './routes/game';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/game', gameRouter);

export default app;