/**
 * WebSocket event types and payloads
 * Used for type-safe Socket.io event communication
 */

export enum GameEvent {
  // Game lifecycle
  GAME_STARTED = 'game:started',
  GAME_ENDED = 'game:ended',
  ROUND_STARTED = 'round:started',
  ROUND_ENDED = 'round:ended',
  COUNTDOWN_TICK = 'countdown:tick',

  // Orders
  ORDER_ADDED = 'order:added',
  ORDER_FULFILLED = 'order:fulfilled',
  ORDER_FAILED = 'order:failed',

  // Game state
  SCORE_UPDATED = 'score:updated',
  STRIKE_ADDED = 'strike:added',
  STATE_UPDATED = 'state:updated',

  // Team management
  TEAM_SELECTED = 'team:selected',
}

export interface GameState {
  sessionId: string;
  currentTeamId: string;
  currentTeamName: string;
  score: number;
  strikes: number;
  orderCount: number;
  completedOrders: number;
  elapsedTime: number; // in seconds
  status: 'waiting' | 'countdown' | 'playing' | 'ended';
  countdownRemaining?: number;
  orders: Order[];
  roundId: string;
}

export interface Order {
  id: string;
  dishId: string;
  dishName: string;
  dishIcon: string;
  ingredients: string[];
  createdAt: number; // timestamp
  expiresAt: number; // timestamp (30 seconds from creation)
  points: number;
}

export interface CountdownPayload {
  secondsRemaining: number;
}

export interface OrderFulfilledPayload {
  orderId: string;
  points: number;
  newScore: number;
}

export interface OrderFailedPayload {
  orderId: string;
  reason: 'timeout' | 'manual';
}

export interface StrikeAddedPayload {
  strikes: number;
  maxStrikes: number;
  gameEnded: boolean;
}

export interface RoundEndedPayload {
  roundId: string;
  teamId: string;
  teamName: string;
  finalScore: number;
  totalOrders: number;
  completedOrders: number;
  strikes: number;
}
