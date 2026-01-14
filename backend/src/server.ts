import { createServer } from 'http';
import app from './app';
import { PORT } from './config/env';
import { initializeWebSocket } from './websocket';
import { connectDB } from './db/connect';

const httpServer = createServer(app);

// Initialize WebSocket
initializeWebSocket(httpServer);

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
