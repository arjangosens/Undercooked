import { Router } from 'express';
import { connectDB } from '../db/connect';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected!' });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'unavailable' });
  }
});

export default router;
