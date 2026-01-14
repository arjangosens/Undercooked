import { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { WebSocketHandler } from './handlers';

let wsHandler: WebSocketHandler | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketHandler {
  const io = new IOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  wsHandler = new WebSocketHandler(io);
  wsHandler.setupHandlers();

  return wsHandler;
}

export function getWebSocketHandler(): WebSocketHandler {
  if (!wsHandler) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return wsHandler;
}

export { WebSocketHandler };
