export enum GameEvent {
  GAME_STARTED = 'game:started',
  GAME_ENDED = 'game:ended',
  ROUND_STARTED = 'round:started',
  ROUND_ENDED = 'round:ended',
  COUNTDOWN_TICK = 'countdown:tick',
  ORDER_ADDED = 'order:added',
  ORDER_FULFILLED = 'order:fulfilled',
  ORDER_FAILED = 'order:failed',
  SCORE_UPDATED = 'score:updated',
  STRIKE_ADDED = 'strike:added',
  STATE_UPDATED = 'state:updated',
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
  elapsedTime: number;
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
  createdAt: number;
  expiresAt: number;
  points: number;
}

export interface Team {
  _id: string;
  name: string;
}

export interface Round {
  _id: string;
  sessionId: string;
  teamId: string;
  teamName: string;
  score: number;
  strikes: number;
  totalOrders: number;
  completedOrders: number;
  startedAt: string;
  endedAt?: string;
}
