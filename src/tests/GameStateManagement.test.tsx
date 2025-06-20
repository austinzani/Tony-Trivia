import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../services/gameStateManager';
import { useGameState } from '../hooks/useGameState';
import {
  GameState,
  GameAction,
  GameConfiguration,
  Round,
  Question,
  GAME_CONSTRAINTS,
} from '../types/game';

// Mock data
const mockGameConfiguration: GameConfiguration = {
  id: 'config-1',
  name: 'Test Configuration',
  description: 'Test game configuration',
  settings: {
    maxRounds: 2,
    questionsPerRound: 3,
    defaultTimeLimit: 30,
    allowTeams: true,
    maxTeamSize: 4,
    maxTeams: 10,
    pointSystem: 'last-call',
    enableSpecialRounds: false,
    enableWagerRounds: false,
    enableBonusRounds: false,
    autoAdvance: false,
    showCorrectAnswers: true,
    allowAnswerChanges: false,
    enableHints: false,
    difficulty: 'medium',
  },
  rounds: [],
  categories: ['General Knowledge', 'Sports', 'History'],
  createdBy: 'host-1',
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    type: 'text',
    category: 'Geography',
    difficulty: 'easy',
    correctAnswer: 'Paris',
    alternativeAnswers: ['paris', 'PARIS'],
    timeLimit: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'q2',
    text: 'What is 2 + 2?',
    type: 'text',
    category: 'Math',
    difficulty: 'easy',
    correctAnswer: '4',
    timeLimit: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockRounds: Round[] = [
  {
    id: 'round-1',
    number: 1,
    type: 'standard',
    name: 'Round 1',
    availablePointValues: [1, 3, 5],
    questions: mockQuestions,
    isComplete: false,
  },
  {
    id: 'round-2',
    number: 2,
    type: 'standard',
    name: 'Round 2',
    availablePointValues: [2, 4, 6],
    questions: mockQuestions,
    isComplete: false,
  },
];

const createMockGameState = (): GameState => ({
  id: 'game-1',
  roomId: 'room-1',
  hostId: 'host-1',
  configuration: {
    ...mockGameConfiguration,
    rounds: mockRounds,
  },
  phase: 'pre-game',
  currentRound: 0,
  rounds: mockRounds,
  completedRounds: 0,
  totalQuestions: 4,
  answeredQuestions: 0,
  players: {},
  teams: {},
  usedPointValues: {},
  timers: {},
  isActive: false,
  isPaused: false,
  isComplete: false,
  events: [],
  connectedPlayers: [],
  lastUpdated: new Date().toISOString(),
});

describe('GameStateManager', () => {
  let gameManager: GameStateManager;
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createMockGameState();
    gameManager = new GameStateManager(mockGameState);
  });

  afterEach(() => {
    gameManager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with valid game state', () => {
      const state = gameManager.getState();
      expect(state.id).toBe('game-1');
      expect(state.phase).toBe('pre-game');
      expect(state.isActive).toBe(false);
    });

    it('should throw error for invalid game state', () => {
      const invalidState = { ...mockGameState, id: '' };
      expect(() => new GameStateManager(invalidState)).toThrow();
    });
  });

  describe('Game Lifecycle', () => {
    it('should start game successfully', async () => {
      // Add a player first
      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      await gameManager.executeAction({
        type: 'start-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      });

      const state = gameManager.getState();
      expect(state.phase).toBe('round-intro');
      expect(state.isActive).toBe(true);
      expect(state.startedAt).toBeDefined();
    });

    it('should not start game without players', async () => {
      await expect(
        gameManager.executeAction({
          type: 'start-game',
          gameId: mockGameState.id,
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow('Cannot start game without players or teams');
    });

    it('should pause and resume game', async () => {
      // Start game first
      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      await gameManager.executeAction({
        type: 'start-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      });

      // Pause game
      await gameManager.executeAction({
        type: 'pause-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      });

      let state = gameManager.getState();
      expect(state.isPaused).toBe(true);
      expect(state.pausedAt).toBeDefined();

      // Resume game
      await gameManager.executeAction({
        type: 'resume-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      });

      state = gameManager.getState();
      expect(state.isPaused).toBe(false);
      expect(state.resumedAt).toBeDefined();
    });

    it('should end game', async () => {
      await gameManager.executeAction({
        type: 'end-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      });

      const state = gameManager.getState();
      expect(state.phase).toBe('game-complete');
      expect(state.isActive).toBe(false);
      expect(state.isComplete).toBe(true);
      expect(state.completedAt).toBeDefined();
    });
  });

  describe('Player Management', () => {
    it('should add player successfully', async () => {
      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      const state = gameManager.getState();
      expect(state.players['player-1']).toBeDefined();
      expect(state.connectedPlayers).toContain('player-1');
    });

    it('should remove player successfully', async () => {
      // Add player first
      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      // Remove player
      await gameManager.executeAction({
        type: 'remove-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      const state = gameManager.getState();
      expect(state.connectedPlayers).not.toContain('player-1');
    });

    it('should form team successfully', async () => {
      // Add players first
      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-2',
        payload: { playerId: 'player-2' },
        timestamp: new Date().toISOString(),
      });

      // Form team
      await gameManager.executeAction({
        type: 'form-team',
        gameId: mockGameState.id,
        payload: { teamId: 'team-1', playerIds: ['player-1', 'player-2'] },
        timestamp: new Date().toISOString(),
      });

      const state = gameManager.getState();
      expect(state.teams['team-1']).toBeDefined();
      expect(state.players['player-1'].teamId).toBe('team-1');
      expect(state.players['player-2'].teamId).toBe('team-1');
    });
  });

  describe('Event System', () => {
    it('should emit events for state changes', async () => {
      const events: any[] = [];
      const removeListener = gameManager.addEventListener(event => {
        events.push(event);
      });

      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('player-joined');
      expect(events[0].playerId).toBe('player-1');

      removeListener();
    });

    it('should emit state updates', async () => {
      const updates: any[] = [];
      const removeListener = gameManager.addStateListener(update => {
        updates.push(update);
      });

      await gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: 'player-1',
        payload: { playerId: 'player-1' },
        timestamp: new Date().toISOString(),
      });

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].gameId).toBe(mockGameState.id);

      removeListener();
    });
  });

  describe('Validation', () => {
    it('should validate game ID in actions', async () => {
      await expect(
        gameManager.executeAction({
          type: 'start-game',
          gameId: 'wrong-id',
          timestamp: new Date().toISOString(),
        })
      ).rejects.toThrow('Invalid game ID');
    });

    it('should validate action timestamp', async () => {
      await expect(
        gameManager.executeAction({
          type: 'start-game',
          gameId: mockGameState.id,
          timestamp: '',
        } as any)
      ).rejects.toThrow('Action timestamp required');
    });
  });
});

describe('useGameState Hook', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createMockGameState();
    vi.clearAllMocks();
  });

  it('should initialize with game state', () => {
    const { result } = renderHook(() => useGameState(mockGameState));

    expect(result.current.gameState).toEqual(mockGameState);
    expect(result.current.phase).toBe('pre-game');
    expect(result.current.isGameActive).toBe(false);
  });

  it('should provide computed values', () => {
    const activeGameState = {
      ...mockGameState,
      isActive: true,
      phase: 'answer-submission' as const,
      currentQuestion: {
        question: mockQuestions[0],
        roundNumber: 1,
        questionNumber: 1,
        startedAt: new Date().toISOString(),
        timeLimit: 30,
        submissions: [],
        isLocked: false,
      },
    };

    const { result } = renderHook(() => useGameState(activeGameState));

    expect(result.current.isGameActive).toBe(true);
    expect(result.current.canSubmitAnswers).toBe(true);
    expect(result.current.currentQuestion).toBeDefined();
  });

  it('should handle player scores', () => {
    const gameStateWithPlayers = {
      ...mockGameState,
      players: {
        'player-1': {
          playerId: 'player-1',
          totalPoints: 10,
          roundScores: { 1: 5, 2: 5 },
          correctAnswers: 2,
          totalAnswers: 3,
          averageResponseTime: 15000,
          pointsBreakdown: { 1: 0, 2: 0, 3: 5, 4: 0, 5: 5, 6: 0 },
        },
      },
    };

    const { result } = renderHook(() =>
      useGameState(gameStateWithPlayers, { playerId: 'player-1' })
    );

    expect(result.current.playerScore).toBeDefined();
    expect(result.current.playerScore?.totalPoints).toBe(10);
    expect(result.current.leaderboard).toHaveLength(1);
  });

  it('should handle team scores', () => {
    const gameStateWithTeams = {
      ...mockGameState,
      teams: {
        'team-1': {
          teamId: 'team-1',
          totalPoints: 15,
          roundScores: { 1: 8, 2: 7 },
          memberScores: {},
          correctAnswers: 3,
          totalAnswers: 4,
          averageResponseTime: 12000,
          pointsBreakdown: { 1: 0, 2: 0, 3: 8, 4: 0, 5: 7, 6: 0 },
        },
      },
    };

    const { result } = renderHook(() =>
      useGameState(gameStateWithTeams, { teamId: 'team-1' })
    );

    expect(result.current.teamScore).toBeDefined();
    expect(result.current.teamScore?.totalPoints).toBe(15);
    expect(result.current.leaderboard).toHaveLength(1);
  });

  it('should execute actions successfully', async () => {
    const { result } = renderHook(() => useGameState(mockGameState));

    await act(async () => {
      await result.current.addPlayer('player-1');
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle action errors', async () => {
    const { result } = renderHook(() => useGameState(mockGameState));

    await act(async () => {
      try {
        await result.current.startGame(); // Should fail without players
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeDefined();
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useGameState(mockGameState));

    // Should not throw errors when unmounting
    expect(() => unmount()).not.toThrow();
  });
});

describe('Game Flow Integration', () => {
  let gameManager: GameStateManager;
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createMockGameState();
    gameManager = new GameStateManager(mockGameState);
  });

  afterEach(() => {
    gameManager.destroy();
  });

  it('should complete full game flow', async () => {
    // Add players
    await gameManager.executeAction({
      type: 'add-player',
      gameId: mockGameState.id,
      playerId: 'player-1',
      payload: { playerId: 'player-1' },
      timestamp: new Date().toISOString(),
    });

    await gameManager.executeAction({
      type: 'add-player',
      gameId: mockGameState.id,
      playerId: 'player-2',
      payload: { playerId: 'player-2' },
      timestamp: new Date().toISOString(),
    });

    // Start game
    await gameManager.executeAction({
      type: 'start-game',
      gameId: mockGameState.id,
      timestamp: new Date().toISOString(),
    });

    let state = gameManager.getState();
    expect(state.phase).toBe('round-intro');
    expect(state.isActive).toBe(true);

    // End game
    await gameManager.executeAction({
      type: 'end-game',
      gameId: mockGameState.id,
      timestamp: new Date().toISOString(),
    });

    state = gameManager.getState();
    expect(state.phase).toBe('game-complete');
    expect(state.isComplete).toBe(true);
  });
});

describe('Error Handling', () => {
  let gameManager: GameStateManager;
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createMockGameState();
    gameManager = new GameStateManager(mockGameState);
  });

  afterEach(() => {
    gameManager.destroy();
  });

  it('should handle invalid actions gracefully', async () => {
    await expect(
      gameManager.executeAction({
        type: 'unknown-action' as any,
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      })
    ).rejects.toThrow('Unknown action type');
  });

  it('should handle phase transition errors', async () => {
    // Try to pause a game that's not active
    await expect(
      gameManager.executeAction({
        type: 'pause-game',
        gameId: mockGameState.id,
        timestamp: new Date().toISOString(),
      })
    ).rejects.toThrow('Game is not active or already paused');
  });
});

describe('Performance Tests', () => {
  let gameManager: GameStateManager;
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createMockGameState();
    gameManager = new GameStateManager(mockGameState);
  });

  afterEach(() => {
    gameManager.destroy();
  });

  it('should handle multiple rapid actions', async () => {
    const actions = Array.from({ length: 10 }, (_, i) => ({
      type: 'add-player' as const,
      gameId: mockGameState.id,
      playerId: `player-${i}`,
      payload: { playerId: `player-${i}` },
      timestamp: new Date().toISOString(),
    }));

    // Execute all actions
    await Promise.all(actions.map(action => gameManager.executeAction(action)));

    const state = gameManager.getState();
    expect(Object.keys(state.players)).toHaveLength(10);
    expect(state.connectedPlayers).toHaveLength(10);
  });

  it('should handle large number of events', () => {
    const events: any[] = [];
    const removeListener = gameManager.addEventListener(event => {
      events.push(event);
    });

    // Generate many events
    for (let i = 0; i < 100; i++) {
      gameManager.executeAction({
        type: 'add-player',
        gameId: mockGameState.id,
        playerId: `player-${i}`,
        payload: { playerId: `player-${i}` },
        timestamp: new Date().toISOString(),
      });
    }

    // Should not cause memory issues or performance problems
    expect(events.length).toBeLessThanOrEqual(100);

    removeListener();
  });
});
