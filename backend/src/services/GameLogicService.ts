/**
 * Game Logic Service - Core game mechanics
 * Implements SOLID principles with dependency injection
 */

import { GameState, Order, GameEvent } from '../websocket/events';
import { Round, IRound } from '../models/Round';
import { Order as OrderModel, IOrder } from '../models/Order';
import { Dish } from '../models/Dish';
import { DISHES, DISH_KEYS } from '../data/burgers';
import { WebSocketHandler } from '../websocket/handlers';

const MAX_STRIKES = 3;
const ORDER_DURATION = 30; // seconds
const INITIAL_ORDER_DELAY = 6; // seconds before first order
const COUNTDOWN_SECONDS = 10; // countdown before round starts
const MIN_ORDERS_CONCURRENT = 1;
const MAX_ORDERS_CONCURRENT = 6; // upper cap; we ramp up over time

export class GameLogicService {
  private wsHandler: WebSocketHandler;
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  private orderTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(wsHandler: WebSocketHandler) {
    this.wsHandler = wsHandler;
  }

  /**
   * Initialize and start a new round
   */
  async startRound(
    sessionId: string,
    teamId: string,
    teamName: string
  ): Promise<GameState> {
    // Create round in database
    const round = new Round({
      sessionId,
      teamId,
      teamName,
      score: 0,
      strikes: 0,
      totalOrders: 0,
      completedOrders: 0,
    });
    await round.save();

    const gameState: GameState = {
      sessionId,
      currentTeamId: teamId,
      currentTeamName: teamName,
      score: 0,
      strikes: 0,
      orderCount: 0,
      completedOrders: 0,
      elapsedTime: 0,
      status: 'countdown',
      countdownRemaining: COUNTDOWN_SECONDS,
      orders: [],
      roundId: round._id.toString(),
    };

    this.wsHandler.setGameState(sessionId, gameState);

    // Broadcast countdown start
    this.wsHandler.broadcastGameState(gameState);

    // Run countdown then start play
    this.runCountdown(sessionId, gameState, round);

    return gameState;
  }

  private runCountdown(sessionId: string, gameState: GameState, round: IRound) {
    let remaining = COUNTDOWN_SECONDS;
    const timer = setInterval(() => {
      remaining -= 1;
      gameState.countdownRemaining = remaining;
      this.wsHandler.broadcastGameState(gameState);
      if (remaining <= 0) {
        clearInterval(timer);
        gameState.status = 'playing';
        gameState.countdownRemaining = undefined;
        // Reset elapsed time baseline to the moment play starts
        const startAt = new Date();
        round.startedAt = startAt as any;
        gameState.elapsedTime = 0;
        void Round.findByIdAndUpdate(gameState.roundId, { startedAt: startAt });
        // Start the round timer (updates elapsed time)
        this.startRoundTimer(sessionId, gameState, round);
        // Start generating orders after initial delay
        this.scheduleNextOrder(sessionId, gameState, round, INITIAL_ORDER_DELAY);
      }
    }, 1000);
  }

  /**
   * Handle order fulfillment
   */
  async fulfillOrder(sessionId: string, orderId: string): Promise<void> {
    const gameState = this.wsHandler.getGameState(sessionId);
    if (!gameState || gameState.status !== 'playing') return;

    const order = gameState.orders.find((o) => o.id === orderId);
    if (!order) return;

    // Check if order is still valid (not expired)
    const isExpired = Date.now() > order.expiresAt;
    if (isExpired) {
      await this.addStrike(sessionId);
      return;
    }

    // Update game state
    gameState.score += order.points;
    gameState.completedOrders += 1;
    gameState.orders = gameState.orders.filter((o) => o.id !== orderId);

    // Clear order timer
    const timerKey = `order-${orderId}`;
    if (this.orderTimers.has(timerKey)) {
      clearTimeout(this.orderTimers.get(timerKey)!);
      this.orderTimers.delete(timerKey);
    }

    // Broadcast immediately after removing order
    this.wsHandler.broadcastGameState(gameState);
    this.wsHandler.getIO().emit(GameEvent.ORDER_FULFILLED);

    // Update database asynchronously
    await OrderModel.findByIdAndUpdate(orderId, { status: 'fulfilled' });
    await Round.findByIdAndUpdate(gameState.roundId, {
      $inc: { score: order.points, completedOrders: 1 },
    });
  }

  /**
   * Add a strike and check for game over
   */
  private async addStrike(sessionId: string): Promise<void> {
    const gameState = this.wsHandler.getGameState(sessionId);
    if (!gameState) return;

    gameState.strikes += 1;

    // Update database
    const round = await Round.findByIdAndUpdate(gameState.roundId, {
      $inc: { strikes: 1 },
    });

    if (gameState.strikes >= MAX_STRIKES) {
      this.endRound(sessionId);
    } else {
      this.wsHandler.broadcastGameState(gameState);
    }
  }

  /**
   * End the current round
   */
  async endRound(sessionId: string): Promise<IRound | null> {
    const gameState = this.wsHandler.getGameState(sessionId);
    if (!gameState) return null;

    // Clear all timers
    this.clearAllTimers(sessionId);

    // Update round status
    gameState.status = 'ended';
    const round = await Round.findByIdAndUpdate(gameState.roundId, {
      endedAt: new Date(),
    });

    // Clean up orders for this round from the database
    await OrderModel.deleteMany({ roundId: gameState.roundId });

    this.wsHandler.broadcastGameState(gameState);
    this.wsHandler.clearGameState(sessionId);

    return round;
  }

  /**
   * Start the round timer (updates elapsed time every second)
   */
  private startRoundTimer(sessionId: string, gameState: GameState, round: IRound): void {
    const timerKey = `round-${sessionId}`;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - round.startedAt.getTime()) / 1000);
      gameState.elapsedTime = elapsed;

      // Broadcast periodically
      if (elapsed % 2 === 0) {
        this.wsHandler.broadcastGameState(gameState);
      }
    }, 1000);

    this.roundTimers.set(timerKey, interval as unknown as NodeJS.Timeout);
  }

  /**
   * Schedule the next order to appear
   */
  private scheduleNextOrder(
    sessionId: string,
    gameState: GameState,
    round: IRound,
    delaySeconds: number
  ): void {
    const timeout = setTimeout(() => {
      this.addOrder(sessionId, gameState, round);
    }, delaySeconds * 1000);

    const timerKey = `order-schedule-${sessionId}`;
    this.orderTimers.set(timerKey, timeout);
  }

  /**
   * Add a new order to the queue
   */
  private async addOrder(
    sessionId: string,
    gameState: GameState,
    round: IRound
  ): Promise<void> {
    if (gameState.status !== 'playing') return;

    // Enforce concurrency limit that ramps up over time
    const concurrentLimit = this.getConcurrentLimit(gameState.elapsedTime);
    if (gameState.orders.length >= concurrentLimit) {
      const retryDelay = 2;
      this.scheduleNextOrder(sessionId, gameState, round, retryDelay);
      return;
    }

    // Determine difficulty with a weighted mix so earlier dishes can still appear later
    const difficulty = this.selectDifficulty(gameState.elapsedTime, gameState.orders.length);
    const possibleDishes = DISH_KEYS.filter((key) => DISHES[key].difficulty === difficulty);

    if (possibleDishes.length === 0) return;

    // Pick a random dish
    const dishKey = possibleDishes[Math.floor(Math.random() * possibleDishes.length)];
    const dishData = DISHES[dishKey];

    // Create order
    const now = Date.now();
    const expiresAt = now + ORDER_DURATION * 1000;

    const orderDoc = new OrderModel({
      roundId: round._id.toString(),
      dishId: dishKey,
      dishName: dishData.name,
      ingredients: dishData.ingredients,
      points: dishData.ingredients.length,
      status: 'pending',
      expiresAt: new Date(expiresAt),
    });
    await orderDoc.save();

    const order: Order = {
      id: orderDoc._id.toString(),
      dishId: dishKey,
      dishName: dishData.name,
        dishIcon: dishData.icon,
      ingredients: dishData.ingredients,
      createdAt: now,
      expiresAt,
      points: dishData.ingredients.length,
    };

    gameState.orders.push(order);
    gameState.orderCount += 1;

    // Update database
    await Round.findByIdAndUpdate(round._id, {
      $inc: { totalOrders: 1 },
    });

    // Set timer for order expiration
    this.setOrderExpirationTimer(sessionId, order);

    // Broadcast events
    this.wsHandler.getIO().emit(GameEvent.ORDER_ADDED);
    this.wsHandler.broadcastGameState(gameState);

    // Schedule next order
    const nextDelay = this.calculateNextOrderDelay(gameState.elapsedTime);
    this.scheduleNextOrder(sessionId, gameState, round, nextDelay);
  }

  /**
   * Set timer for when order expires
   */
  private setOrderExpirationTimer(sessionId: string, order: Order): void {
    const timeUntilExpiry = order.expiresAt - Date.now();
    if (timeUntilExpiry <= 0) return;

    const timeout = setTimeout(async () => {
      const gameState = this.wsHandler.getGameState(sessionId);
      if (!gameState) return;

      // Check if order still exists
      const orderExists = gameState.orders.some((o) => o.id === order.id);
      if (!orderExists) return;

      // Remove order from queue first and broadcast immediately
      gameState.orders = gameState.orders.filter((o) => o.id !== order.id);
      this.wsHandler.broadcastGameState(gameState);

      // Mark as expired in DB
      await OrderModel.findByIdAndUpdate(order.id, { status: 'expired' });

      // Add strike
      await this.addStrike(sessionId);

      // Emit event
      this.wsHandler.getIO().emit(GameEvent.ORDER_FAILED);
    }, timeUntilExpiry);

    const timerKey = `order-${order.id}`;
    this.orderTimers.set(timerKey, timeout);
  }

  /**
   * Calculate difficulty based on elapsed time
   */
  private selectDifficulty(
    elapsedSeconds: number,
    currentOrderCount: number
  ): 'easy' | 'medium' | 'hard' {
    // Base mixes keep earlier burgers in rotation while slowly biasing to harder ones over longer rounds
    let mix = { easy: 0.75, medium: 0.25, hard: 0 }; // first 5 minutes, no hard

    if (elapsedSeconds >= 1200) {
      // 20m+
      mix = { easy: 0.15, medium: 0.35, hard: 0.5 };
    } else if (elapsedSeconds >= 900) {
      // 15-20m
      mix = { easy: 0.2, medium: 0.4, hard: 0.4 };
    } else if (elapsedSeconds >= 600) {
      // 10-15m
      mix = { easy: 0.3, medium: 0.45, hard: 0.25 };
    } else if (elapsedSeconds >= 300) {
      // 5-10m
      mix = { easy: 0.45, medium: 0.4, hard: 0.15 };
    }

    // Slightly boost difficulty when multiple orders are already active; only after 5 minutes
    if (elapsedSeconds >= 300) {
      const pressure = Math.max(0, currentOrderCount - 1);
      mix.hard += Math.min(0.15, pressure * 0.03);
      mix.medium += Math.min(0.1, pressure * 0.02);
    }

    // Normalize and pick
    const total = mix.easy + mix.medium + mix.hard;
    const roll = Math.random() * total;

    if (roll < mix.easy) return 'easy';
    if (roll < mix.easy + mix.medium) return 'medium';
    return 'hard';
  }

  /**
   * Calculate delay for next order
   */
  private calculateNextOrderDelay(elapsedSeconds: number): number {
    // Keep it manageable
    if (elapsedSeconds < 30) return 8;
    if (elapsedSeconds < 60) return 6;
    return 5;
  }

  /**
   * Gradually increase concurrent orders
   */
  private getConcurrentLimit(elapsedSeconds: number): number {
    if (elapsedSeconds < 120) return 1; // first 2 minutes
    if (elapsedSeconds < 300) return 2; // 2-5 minutes
    if (elapsedSeconds < 600) return 3; // 5-10 minutes
    if (elapsedSeconds < 900) return 4; // 10-15 minutes
    if (elapsedSeconds < 1200) return 5; // 15-20 minutes
    return MAX_ORDERS_CONCURRENT; // 6 after 20 minutes
  }

  /**
   * Clear all timers for a session
   */
  private clearAllTimers(sessionId: string): void {
    // Clear round timer
    const roundTimerKey = `round-${sessionId}`;
    if (this.roundTimers.has(roundTimerKey)) {
      clearInterval(this.roundTimers.get(roundTimerKey)! as unknown as NodeJS.Timeout);
      this.roundTimers.delete(roundTimerKey);
    }

    // Clear all order timers for this session
    const keysToDelete = Array.from(this.orderTimers.keys()).filter((key) =>
      key.startsWith(`order-schedule-${sessionId}`) || key.includes(sessionId)
    );

    keysToDelete.forEach((key) => {
      clearTimeout(this.orderTimers.get(key)!);
      this.orderTimers.delete(key);
    });
  }
}
