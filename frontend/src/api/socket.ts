import { io, Socket } from 'socket.io-client';
import { GameState, GameEvent } from '../types/game';

class SocketIOClient {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      const url = (import.meta.env.DEV as boolean) ? 'http://localhost:3000' : window.location.origin;
      this.socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: GameEvent | string, callback: (data: any) => void): void {
    if (!this.socket) this.connect();
    this.socket!.on(event, callback);
  }

  off(event: GameEvent | string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket) this.connect();
    this.socket!.emit(event, data);
  }

  getSocket(): Socket {
    if (!this.socket) this.connect();
    return this.socket!;
  }
}

export const socketClient = new SocketIOClient();
