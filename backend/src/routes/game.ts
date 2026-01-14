import { Router, Request, Response } from 'express';
import { GameLogicService } from '../services/GameLogicService';
import { TeamRepository } from '../repositories/TeamRepository';
import { RoundRepository } from '../repositories/RoundRepository';
import { GameSessionRepository } from '../repositories/GameSessionRepository';
import { getWebSocketHandler } from '../websocket';

const router = Router();

const teamRepo = new TeamRepository();
const roundRepo = new RoundRepository();
const sessionRepo = new GameSessionRepository();
let gameLogicService: GameLogicService;

// Initialize game logic service once WebSocket is ready
setTimeout(() => {
  gameLogicService = new GameLogicService(getWebSocketHandler());
}, 100);

/**
 * Create a new game session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const session = await sessionRepo.create(name || 'Game Session');
    res.json({ sessionId: session._id });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * Get all teams
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const teams = await teamRepo.getAll();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * Create a new team
 */
router.post('/teams', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const team = await teamRepo.create(name);
    res.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

/**
 * Update a team
 */
router.put('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;
    const updated = await teamRepo.update(teamId, { name } as any);
    res.json(updated);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

/**
 * Delete a team
 */
router.delete('/teams/:teamId', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    await teamRepo.delete(teamId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

/**
 * Start a new round for a team
 */
router.post('/rounds/start', async (req: Request, res: Response) => {
  try {
    const { sessionId, teamId, teamName } = req.body;

    if (!gameLogicService) {
      return res.status(500).json({ error: 'Game service not ready' });
    }

    const gameState = await gameLogicService.startRound(sessionId, teamId, teamName);
    res.json({ roundId: gameState.roundId, gameState });
  } catch (error) {
    console.error('Error starting round:', error);
    res.status(500).json({ error: 'Failed to start round' });
  }
});

/**
 * Fulfill an order
 */
router.post('/orders/:orderId/fulfill', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { sessionId } = req.body;

    if (!gameLogicService) {
      return res.status(500).json({ error: 'Game service not ready' });
    }

    await gameLogicService.fulfillOrder(sessionId, orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error fulfilling order:', error);
    res.status(500).json({ error: 'Failed to fulfill order' });
  }
});

/**
 * End current round
 */
router.post('/rounds/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!gameLogicService) {
      return res.status(500).json({ error: 'Game service not ready' });
    }

    const round = await gameLogicService.endRound(sessionId);
    res.json({ round });
  } catch (error) {
    console.error('Error ending round:', error);
    res.status(500).json({ error: 'Failed to end round' });
  }
});

/**
 * Get leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const rounds = await roundRepo.getLeaderboard(limit);
    res.json(rounds);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * Get round results for a session
 */
router.get('/sessions/:sessionId/rounds', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const rounds = await roundRepo.getBySessionId(sessionId);
    res.json(rounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

/**
 * Delete a round result
 */
router.delete('/rounds/:roundId', async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    await roundRepo.delete(roundId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({ error: 'Failed to delete round' });
  }
});

export default router;
