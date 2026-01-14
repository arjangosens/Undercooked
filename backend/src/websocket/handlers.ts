import { Socket, Server } from 'socket.io';
import { GameEvent, GameState } from './events';

/**
 * WebSocket event handlers
 * Manages Socket.io connections and game state broadcasts
 */

export class WebSocketHandler {
  private io: Server;
  private gameStates = new Map<string, GameState>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(io: Server) {
    this.io = io;
  }

  setupHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Game master events
      socket.on('game:start-round', (data) => this.handleStartRound(socket, data));
      socket.on('game:fulfill-order', (data) => this.handleFulfillOrder(socket, data));
      socket.on('game:end-round', (data) => this.handleEndRound(socket, data));

      // Team selection
      socket.on('team:select', (data) => this.handleTeamSelect(socket, data));
    });
  }

  private handleStartRound(socket: Socket, data: any) {
    // Implementation in game logic layer
  }

  private handleFulfillOrder(socket: Socket, data: any) {
    // Implementation in game logic layer
  }

  private handleEndRound(socket: Socket, data: any) {
    // Implementation in game logic layer
  }

  private handleTeamSelect(socket: Socket, data: any) {
    // Implementation in game logic layer
  }

  /**
   * Broadcast game state to all connected clients
   */
  public broadcastGameState(gameState: GameState) {
    this.io.emit(GameEvent.STATE_UPDATED, gameState);
  }

  /**
   * Broadcast to game master and display clients
   */
  public broadcastToGameRoom(sessionId: string, event: string, data: any) {
    this.io.to(`game-${sessionId}`).emit(event, data);
  }

  /**
   * Store game state
   */
  public setGameState(sessionId: string, state: GameState) {
    this.gameStates.set(sessionId, state);
  }

  /**
   * Retrieve game state
   */
  public getGameState(sessionId: string): GameState | undefined {
    return this.gameStates.get(sessionId);
  }

  /**
   * Clear game state
   */
  public clearGameState(sessionId: string) {
    this.gameStates.delete(sessionId);
    // Clear any associated timers
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }
  }

  /**
   * Get IO instance for manual emissions
   */
  public getIO(): Server {
    return this.io;
  }
}
