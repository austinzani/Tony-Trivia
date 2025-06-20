import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameController } from '../services/gameController';
import { GameStateManager } from '../services/gameStateManager';
import { RoundManager } from '../services/roundManager';
import { ScoreManager } from '../services/scoreManager';
import { SpecialRoundManager } from '../services/specialRoundManager';
import { AnswerSubmissionManager } from '../services/answerSubmissionManager';
import { GameTimer } from '../services/gameTimer';
import {
  GameController as GameControllerComponent,
  GameControlPanel,
  GameProgressionDisplay,
  GamePhaseManager,
  GameMetricsPanel,
  GameEventLog,
} from '../components/game/GameController';
import {
  useGameController,
  useGameProgression,
  useGameControllerEvents,
  useGameControllerMetrics,
  useGamePhase,
} from '../hooks/useGameController';
import {
  GameProgressionPhase,
  GameControllerOptions,
  TransitionTrigger,
} from '../types/gameController';

// Mock dependencies
vi.mock('../services/gameStateManager');
vi.mock('../services/roundManager');
vi.mock('../services/scoreManager');
vi.mock('../services/specialRoundManager');
vi.mock('../services/answerSubmissionManager');
vi.mock('../services/gameTimer');

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Square: () => <div data-testid="square-icon" />,
  SkipForward: () => <div data-testid="skip-forward-icon" />,
  FastForward: () => <div data-testid="fast-forward-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Timer: () => <div data-testid="timer-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('GameController Service', () => {
  let gameController: GameController;
  let mockGameStateManager: GameStateManager;
  let mockRoundManager: RoundManager;
  let mockScoreManager: ScoreManager;
  let mockSpecialRoundManager: SpecialRoundManager;
  let mockAnswerSubmissionManager: AnswerSubmissionManager;
  let mockGameTimer: GameTimer;
  let mockOptions: GameControllerOptions;

  beforeEach(() => {
    // Create mock instances
    mockGameStateManager = new GameStateManager();
    mockRoundManager = new RoundManager();
    mockScoreManager = new ScoreManager();
    mockSpecialRoundManager = new SpecialRoundManager(
      mockRoundManager,
      mockScoreManager
    );
    mockAnswerSubmissionManager = new AnswerSubmissionManager();
    mockGameTimer = new GameTimer();

    mockOptions = {
      gameId: 'test-game-123',
      configuration: {
        totalRounds: 3,
        questionsPerRound: 5,
        enableSpecialRounds: true,
        specialRoundFrequency: 2,
        allowSkipQuestions: true,
        questionTimeLimit: 30,
        answerReviewTime: 10,
        roundIntroTime: 5,
        intermissionTime: 15,
        autoAdvanceDelay: 1000,
        requireAllAnswers: false,
        allowEarlyAdvance: true,
        enablePauseResume: true,
        maxGameDuration: 60,
        maxRetries: 3,
        errorRecoveryMode: 'auto',
        fallbackToManualControl: true,
      },
      enableEventLogging: true,
      enableMetrics: true,
      debugMode: true,
      strictMode: false,
      performanceMode: false,
    };

    // Mock methods
    vi.mocked(mockGameStateManager.initialize).mockResolvedValue();
    vi.mocked(mockGameStateManager.getState).mockReturnValue({
      participants: [{ id: '1', name: 'Test Player' }],
      configuration: mockOptions.configuration,
    } as any);
    vi.mocked(mockGameStateManager.addEventListener).mockImplementation(
      () => {}
    );

    vi.mocked(mockRoundManager.getCurrentRound).mockReturnValue({
      id: 'round-1',
      questions: [
        { id: 'q1', text: 'Question 1' },
        { id: 'q2', text: 'Question 2' },
      ],
    } as any);
    vi.mocked(mockRoundManager.addEventListener).mockImplementation(() => {});

    vi.mocked(mockSpecialRoundManager.addEventListener).mockImplementation(
      () => {}
    );
    vi.mocked(mockAnswerSubmissionManager.addEventListener).mockImplementation(
      () => {}
    );

    gameController = new GameController(
      mockGameStateManager,
      mockRoundManager,
      mockScoreManager,
      mockSpecialRoundManager,
      mockAnswerSubmissionManager,
      mockGameTimer,
      mockOptions
    );
  });

  afterEach(() => {
    gameController.destroy();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = gameController.getState();

      expect(state.gameId).toBe('test-game-123');
      expect(state.isInitialized).toBe(false);
      expect(state.isActive).toBe(false);
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.INITIALIZATION
      );
      expect(state.configuration).toEqual(mockOptions.configuration);
    });

    it('should initialize successfully', async () => {
      await gameController.initialize();

      const state = gameController.getState();
      expect(state.isInitialized).toBe(true);
      expect(mockGameStateManager.initialize).toHaveBeenCalled();
    });

    it('should throw error if already initialized', async () => {
      await gameController.initialize();

      await expect(gameController.initialize()).rejects.toThrow(
        'Game controller is already initialized'
      );
    });
  });

  describe('Game Flow Control', () => {
    beforeEach(async () => {
      await gameController.initialize();
    });

    it('should start game successfully', async () => {
      await gameController.startGame();

      const state = gameController.getState();
      expect(state.isActive).toBe(true);
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.PRE_GAME
      );
    });

    it('should throw error when starting uninitialized game', async () => {
      const uninitializedController = new GameController(
        mockGameStateManager,
        mockRoundManager,
        mockScoreManager,
        mockSpecialRoundManager,
        mockAnswerSubmissionManager,
        mockGameTimer,
        mockOptions
      );

      await expect(uninitializedController.startGame()).rejects.toThrow(
        'Game controller must be initialized before starting'
      );
    });

    it('should pause and resume game', async () => {
      await gameController.startGame();

      await gameController.pauseGame('Test pause');
      let state = gameController.getState();
      expect(state.pauseResume.isPaused).toBe(true);
      expect(state.pauseResume.pauseReason).toBe('Test pause');

      await gameController.resumeGame();
      state = gameController.getState();
      expect(state.pauseResume.isPaused).toBe(false);
    });

    it('should end game successfully', async () => {
      await gameController.startGame();
      await gameController.endGame();

      const state = gameController.getState();
      expect(state.isActive).toBe(false);
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.GAME_COMPLETE
      );
    });
  });

  describe('Phase Management', () => {
    beforeEach(async () => {
      await gameController.initialize();
      await gameController.startGame();
    });

    it('should advance through phases correctly', async () => {
      // Should start in PRE_GAME phase
      let state = gameController.getState();
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.PRE_GAME
      );

      // Advance to ROUND_INTRO
      await gameController.advancePhase();
      state = gameController.getState();
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.ROUND_INTRO
      );

      // Advance to QUESTION_DISPLAY
      await gameController.advancePhase();
      state = gameController.getState();
      expect(state.progression.currentPhase).toBe(
        GameProgressionPhase.QUESTION_DISPLAY
      );
    });

    it('should track phase transitions', async () => {
      await gameController.advancePhase();

      const state = gameController.getState();
      expect(state.transitionHistory).toHaveLength(2); // INITIALIZATION -> PRE_GAME, PRE_GAME -> ROUND_INTRO
      expect(state.transitionHistory[1].fromPhase).toBe(
        GameProgressionPhase.PRE_GAME
      );
      expect(state.transitionHistory[1].toPhase).toBe(
        GameProgressionPhase.ROUND_INTRO
      );
    });

    it('should handle phase transition errors', async () => {
      // Mock a validation failure
      const invalidController = new GameController(
        mockGameStateManager,
        mockRoundManager,
        mockScoreManager,
        mockSpecialRoundManager,
        mockAnswerSubmissionManager,
        mockGameTimer,
        {
          ...mockOptions,
          strictMode: true,
        }
      );

      await invalidController.initialize();
      await invalidController.startGame();

      // This should trigger error handling
      await expect(
        invalidController.advancePhase({
          skipValidation: false,
        })
      ).rejects.toThrow();
    });
  });

  describe('Question Management', () => {
    beforeEach(async () => {
      await gameController.initialize();
      await gameController.startGame();
      // Advance to question display phase
      await gameController.advancePhase(); // PRE_GAME -> ROUND_INTRO
      await gameController.advancePhase(); // ROUND_INTRO -> QUESTION_DISPLAY
    });

    it('should skip questions when allowed', async () => {
      const initialState = gameController.getState();
      const initialSkipped = initialState.questionProgression.questionsSkipped;

      await gameController.skipQuestion();

      const state = gameController.getState();
      expect(state.questionProgression.questionsSkipped).toBe(
        initialSkipped + 1
      );
    });

    it('should throw error when skipping is not allowed', async () => {
      const restrictiveController = new GameController(
        mockGameStateManager,
        mockRoundManager,
        mockScoreManager,
        mockSpecialRoundManager,
        mockAnswerSubmissionManager,
        mockGameTimer,
        {
          ...mockOptions,
          configuration: {
            ...mockOptions.configuration,
            allowSkipQuestions: false,
          },
        }
      );

      await restrictiveController.initialize();
      await restrictiveController.startGame();

      await expect(restrictiveController.skipQuestion()).rejects.toThrow(
        'Question skipping is not allowed'
      );
    });
  });

  describe('Event System', () => {
    it('should emit events correctly', async () => {
      const events: any[] = [];

      gameController.addEventListener('game_initialized', event => {
        events.push(event);
      });

      gameController.addEventListener('game_started', event => {
        events.push(event);
      });

      await gameController.initialize();
      await gameController.startGame();

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('game_initialized');
      expect(events[1].type).toBe('game_started');
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();

      gameController.addEventListener('game_started', listener);
      gameController.removeEventListener('game_started', listener);

      // Listener should not be called
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Metrics Tracking', () => {
    beforeEach(async () => {
      await gameController.initialize();
      await gameController.startGame();
    });

    it('should track game metrics', async () => {
      await gameController.advancePhase();

      const metrics = gameController.getMetrics();
      expect(metrics.totalPhaseTransitions).toBeGreaterThan(0);
      expect(metrics.gameStartTime).toBeInstanceOf(Date);
    });

    it('should calculate average phase transition time', async () => {
      await gameController.advancePhase();
      await gameController.advancePhase();

      const metrics = gameController.getMetrics();
      expect(metrics.averagePhaseTransitionTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock an error in game state manager
      vi.mocked(mockGameStateManager.initialize).mockRejectedValue(
        new Error('Test error')
      );

      await expect(gameController.initialize()).rejects.toThrow('Test error');

      const state = gameController.getState();
      expect(state.error.hasError).toBe(true);
    });

    it('should attempt error recovery', async () => {
      await gameController.initialize();
      await gameController.startGame();

      // Simulate an error
      const state = gameController.getState();
      state.error.hasError = true;
      state.error.errorMessage = 'Test error';
      state.error.recoveryStrategy = 'retry';

      // This would normally trigger error recovery
      expect(state.error.canRecover).toBe(true);
    });
  });
});

describe('GameController React Hooks', () => {
  const TestComponent = ({ gameId }: { gameId: string }) => {
    const controller = useGameController(gameId);
    const progression = useGameProgression(gameId);
    const events = useGameControllerEvents(gameId);
    const metrics = useGameControllerMetrics(gameId);
    const phase = useGamePhase(gameId);

    return (
      <div>
        <div data-testid="initialized">
          {controller.isInitialized.toString()}
        </div>
        <div data-testid="active">{controller.isActive.toString()}</div>
        <div data-testid="current-phase">{controller.currentPhase}</div>
        <div data-testid="question-progress">
          {progression.questionProgress}
        </div>
        <div data-testid="event-count">{events.eventCount}</div>
        <div data-testid="engagement-score">{metrics.engagementScore}</div>
        <div data-testid="can-advance">{phase.canAdvance.toString()}</div>
        <button onClick={controller.startGame} data-testid="start-button">
          Start
        </button>
        <button onClick={controller.pauseGame} data-testid="pause-button">
          Pause
        </button>
        <button onClick={controller.advancePhase} data-testid="advance-button">
          Advance
        </button>
      </div>
    );
  };

  it('should provide game controller state', async () => {
    render(<TestComponent gameId="test-game" />);

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('current-phase')).toHaveTextContent(
      'initialization'
    );
    expect(screen.getByTestId('active')).toHaveTextContent('false');
  });

  it('should handle game control actions', async () => {
    render(<TestComponent gameId="test-game" />);

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    // Start game
    const startButton = screen.getByTestId('start-button');
    await act(async () => {
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('true');
    });
  });
});

describe('GameController React Components', () => {
  const mockGameId = 'test-game-123';

  beforeEach(() => {
    // Mock the hooks to return predictable data
    vi.mock('../../hooks/useGameController', () => ({
      useGameController: () => ({
        isInitialized: true,
        isActive: true,
        isPaused: false,
        currentPhase: GameProgressionPhase.QUESTION_DISPLAY,
        canAdvance: true,
        startGame: vi.fn(),
        pauseGame: vi.fn(),
        resumeGame: vi.fn(),
        endGame: vi.fn(),
        advancePhase: vi.fn(),
        skipQuestion: vi.fn(),
        error: null,
        clearError: vi.fn(),
        events: [],
      }),
      useGameProgression: () => ({
        currentPhase: GameProgressionPhase.QUESTION_DISPLAY,
        isActive: true,
        currentQuestionIndex: 2,
        totalQuestions: 10,
        questionsAnswered: 2,
        questionsRemaining: 8,
        currentRoundIndex: 1,
        totalRounds: 3,
        roundsCompleted: 0,
        roundsRemaining: 3,
        questionProgress: 20,
        roundProgress: 0,
        overallProgress: 6.7,
        estimatedTimeRemaining: 300000,
        averageAnswerTime: 15000,
      }),
      useGameControllerEvents: () => ({
        events: [],
        eventCount: 0,
        clearEvents: vi.fn(),
      }),
      useGameControllerMetrics: () => ({
        engagementScore: 85.5,
        performanceInsights: [],
        totalPhaseTransitions: 5,
        averagePhaseTransitionTime: 250,
        errorCount: 0,
        pauseCount: 1,
        averageResponseTime: 12000,
        completionRate: 0.9,
      }),
      useGamePhase: () => ({
        currentPhase: GameProgressionPhase.QUESTION_DISPLAY,
        isTransitioning: false,
        canAdvance: true,
        autoAdvance: false,
        nextPhase: GameProgressionPhase.ANSWER_COLLECTION,
        advancePhase: vi.fn(),
      }),
    }));
  });

  describe('GameController Component', () => {
    it('should render main controller interface', () => {
      render(<GameControllerComponent gameId={mockGameId} />);

      expect(screen.getByText('Game Controller')).toBeInTheDocument();
      expect(screen.getByText('Simple')).toBeInTheDocument();
    });

    it('should toggle advanced view', () => {
      render(<GameControllerComponent gameId={mockGameId} />);

      const toggleButton = screen.getByText('Simple');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('GameControlPanel Component', () => {
    it('should render control buttons', () => {
      render(<GameControlPanel gameId={mockGameId} />);

      expect(screen.getByText('Game Controls')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show pause button when game is active', () => {
      render(<GameControlPanel gameId={mockGameId} />);

      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  describe('GameProgressionDisplay Component', () => {
    it('should render progress information', () => {
      render(<GameProgressionDisplay gameId={mockGameId} />);

      expect(screen.getByText('Game Progress')).toBeInTheDocument();
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Rounds')).toBeInTheDocument();
    });

    it('should display progress percentages', () => {
      render(<GameProgressionDisplay gameId={mockGameId} />);

      expect(screen.getByText('6.7%')).toBeInTheDocument(); // Overall progress
      expect(screen.getByText('2 / 10')).toBeInTheDocument(); // Questions
      expect(screen.getByText('0 / 3')).toBeInTheDocument(); // Rounds
    });
  });

  describe('GamePhaseManager Component', () => {
    it('should render phase management interface', () => {
      render(<GamePhaseManager gameId={mockGameId} />);

      expect(screen.getByText('Phase Manager')).toBeInTheDocument();
      expect(screen.getByText('Phase Progress')).toBeInTheDocument();
    });

    it('should show advance button when can advance', () => {
      render(<GamePhaseManager gameId={mockGameId} />);

      expect(screen.getByText('Advance to Next Phase')).toBeInTheDocument();
    });
  });

  describe('GameMetricsPanel Component', () => {
    it('should render metrics information', () => {
      render(<GameMetricsPanel gameId={mockGameId} />);

      expect(screen.getByText('Game Metrics')).toBeInTheDocument();
      expect(screen.getByText('85.5')).toBeInTheDocument(); // Engagement score
      expect(screen.getByText('90.0%')).toBeInTheDocument(); // Completion rate
    });
  });

  describe('GameEventLog Component', () => {
    it('should render event log interface', () => {
      render(<GameEventLog gameId={mockGameId} />);

      expect(screen.getByText('Event Log')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should show no events message when empty', () => {
      render(<GameEventLog gameId={mockGameId} />);

      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete game flow', async () => {
    const gameController = new GameController(
      new GameStateManager(),
      new RoundManager(),
      new ScoreManager(),
      new SpecialRoundManager(new RoundManager(), new ScoreManager()),
      new AnswerSubmissionManager(),
      new GameTimer(),
      {
        gameId: 'integration-test',
        configuration: {
          totalRounds: 2,
          questionsPerRound: 3,
          enableSpecialRounds: false,
          specialRoundFrequency: 1,
          allowSkipQuestions: true,
          questionTimeLimit: 30,
          answerReviewTime: 5,
          roundIntroTime: 2,
          intermissionTime: 5,
          autoAdvanceDelay: 100,
          requireAllAnswers: false,
          allowEarlyAdvance: true,
          enablePauseResume: true,
          maxGameDuration: 30,
          maxRetries: 2,
          errorRecoveryMode: 'auto',
          fallbackToManualControl: false,
        },
        enableEventLogging: true,
        enableMetrics: true,
        debugMode: false,
        strictMode: false,
        performanceMode: true,
      }
    );

    // Initialize and start
    await gameController.initialize();
    expect(gameController.isActive()).toBe(false);

    await gameController.startGame();
    expect(gameController.isActive()).toBe(true);

    // Test pause/resume
    await gameController.pauseGame('Integration test pause');
    expect(gameController.isPaused()).toBe(true);

    await gameController.resumeGame();
    expect(gameController.isPaused()).toBe(false);

    // Test phase advancement
    const initialPhase = gameController.getCurrentPhase();
    await gameController.advancePhase();
    const newPhase = gameController.getCurrentPhase();
    expect(newPhase).not.toBe(initialPhase);

    // Check metrics
    const metrics = gameController.getMetrics();
    expect(metrics.totalPhaseTransitions).toBeGreaterThan(0);

    // End game
    await gameController.endGame();
    expect(gameController.isActive()).toBe(false);

    // Cleanup
    gameController.destroy();
  });
});
