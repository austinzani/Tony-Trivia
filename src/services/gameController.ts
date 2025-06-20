import { GameStateManager } from './gameStateManager';
import { RoundManager } from './roundManager';
import { ScoreManager } from './scoreManager';
import { SpecialRoundManager } from './specialRoundManager';
import { AnswerSubmissionManager } from './answerSubmissionManager';
import { GameTimer } from './gameTimer';
import {
  GameControllerState,
  GameControllerOptions,
  GameControllerEvent,
  GameControllerEventType,
  GameControllerEventListener,
  GameProgressionPhase,
  GameProgressionState,
  QuestionProgressionState,
  RoundProgressionState,
  PauseResumeState,
  ErrorState,
  GameProgressionMetrics,
  PhaseTransition,
  TransitionTrigger,
  AdvanceOptions,
  ValidationResult,
  PhaseValidationContext,
  PhaseHandler,
  PhaseHandlerRegistry,
  GameFlowConfiguration
} from '../types/gameController';
import { GameState, GamePhase, Round, Question } from '../types/game';
import { SpecialRoundType } from '../types/specialRounds';

export class GameController {
  private gameStateManager: GameStateManager;
  private roundManager: RoundManager;
  private scoreManager: ScoreManager;
  private specialRoundManager: SpecialRoundManager;
  private answerSubmissionManager: AnswerSubmissionManager;
  private gameTimer: GameTimer;
  
  private state: GameControllerState;
  private options: GameControllerOptions;
  private eventListeners: Map<GameControllerEventType, Set<GameControllerEventListener>> = new Map();
  private phaseHandlers: PhaseHandlerRegistry = {};
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isDestroyed = false;

  constructor(
    gameStateManager: GameStateManager,
    roundManager: RoundManager,
    scoreManager: ScoreManager,
    specialRoundManager: SpecialRoundManager,
    answerSubmissionManager: AnswerSubmissionManager,
    gameTimer: GameTimer,
    options: GameControllerOptions
  ) {
    this.gameStateManager = gameStateManager;
    this.roundManager = roundManager;
    this.scoreManager = scoreManager;
    this.specialRoundManager = specialRoundManager;
    this.answerSubmissionManager = answerSubmissionManager;
    this.gameTimer = gameTimer;
    this.options = options;

    this.state = this.initializeState();
    this.setupPhaseHandlers();
    this.setupEventListeners();
  }

  private initializeState(): GameControllerState {
    const now = new Date();
    
    return {
      gameId: this.options.gameId,
      isInitialized: false,
      isActive: false,
      progression: {
        currentPhase: GameProgressionPhase.INITIALIZATION,
        previousPhase: null,
        phaseStartTime: now,
        isTransitioning: false,
        transitionDuration: 500,
        canAdvance: false,
        autoAdvance: false,
        nextPhase: null
      },
      questionProgression: {
        currentQuestionIndex: 0,
        totalQuestions: 0,
        questionsAnswered: 0,
        questionsSkipped: 0,
        questionsRemaining: 0,
        averageAnswerTime: 0,
        isLastQuestion: false,
        canSkip: this.options.configuration.allowSkipQuestions,
        canGoBack: false
      },
      roundProgression: {
        currentRoundIndex: 0,
        totalRounds: this.options.configuration.totalRounds,
        roundsCompleted: 0,
        roundsRemaining: this.options.configuration.totalRounds,
        currentRoundType: 'regular',
        isLastRound: false,
        roundStartTime: now,
        estimatedRoundDuration: 0
      },
      pauseResume: {
        isPaused: false,
        pauseCount: 0,
        totalPauseDuration: 0,
        canResume: true
      },
      error: {
        hasError: false,
        recoveryAttempts: 0,
        canRecover: true
      },
      metrics: {
        gameStartTime: now,
        totalPhaseTransitions: 0,
        averagePhaseTransitionTime: 0,
        longestPhase: { phase: GameProgressionPhase.INITIALIZATION, duration: 0 },
        shortestPhase: { phase: GameProgressionPhase.INITIALIZATION, duration: Infinity },
        errorCount: 0,
        pauseCount: 0,
        totalPauseDuration: 0,
        participantEngagement: {
          averageResponseTime: 0,
          completionRate: 0,
          dropoffPoints: []
        }
      },
      configuration: this.options.configuration,
      transitionHistory: [],
      eventLog: []
    };
  }

  private setupEventListeners(): void {
    // Listen to game state changes
    this.gameStateManager.addEventListener('phase_changed', (event) => {
      this.handleGamePhaseChange(event.data?.phase);
    });

    // Listen to round manager events
    this.roundManager.addEventListener('round_started', (event) => {
      this.handleRoundStarted(event.data?.round);
    });

    this.roundManager.addEventListener('round_ended', (event) => {
      this.handleRoundEnded(event.data?.round);
    });

    // Listen to answer submission events
    this.answerSubmissionManager.addEventListener('submission_completed', (event) => {
      this.handleAnswerSubmitted(event.data);
    });

    // Listen to special round events
    this.specialRoundManager.addEventListener('round_started', (event) => {
      this.handleSpecialRoundStarted(event.data?.round);
    });

    this.specialRoundManager.addEventListener('round_ended', (event) => {
      this.handleSpecialRoundEnded(event.data?.round);
    });
  }

  private setupPhaseHandlers(): void {
    // Initialize phase handlers for each game progression phase
    this.phaseHandlers[GameProgressionPhase.INITIALIZATION] = {
      phase: GameProgressionPhase.INITIALIZATION,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async () => {
        await this.initializeGame();
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.PRE_GAME,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.PRE_GAME] = {
      phase: GameProgressionPhase.PRE_GAME,
      canEnter: (context) => this.validateGameReady(context),
      onEnter: async () => {
        await this.prepareGame();
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.ROUND_INTRO,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => false
    };

    this.phaseHandlers[GameProgressionPhase.ROUND_INTRO] = {
      phase: GameProgressionPhase.ROUND_INTRO,
      canEnter: (context) => this.validateRoundReady(context),
      onEnter: async (context) => {
        await this.startRound(context);
      },
      onExit: async () => {},
      getNextPhase: (context) => {
        return this.shouldStartSpecialRound(context) 
          ? GameProgressionPhase.SPECIAL_ROUND 
          : GameProgressionPhase.QUESTION_DISPLAY;
      },
      getTimeLimit: () => this.options.configuration.roundIntroTime,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.QUESTION_DISPLAY] = {
      phase: GameProgressionPhase.QUESTION_DISPLAY,
      canEnter: (context) => this.validateQuestionReady(context),
      onEnter: async (context) => {
        await this.displayQuestion(context);
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.ANSWER_COLLECTION,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.ANSWER_COLLECTION] = {
      phase: GameProgressionPhase.ANSWER_COLLECTION,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.startAnswerCollection(context);
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.ANSWER_REVIEW,
      getTimeLimit: () => this.options.configuration.questionTimeLimit,
      shouldAutoAdvance: () => !this.options.configuration.requireAllAnswers
    };

    this.phaseHandlers[GameProgressionPhase.ANSWER_REVIEW] = {
      phase: GameProgressionPhase.ANSWER_REVIEW,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.reviewAnswers(context);
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.SCORING,
      getTimeLimit: () => this.options.configuration.answerReviewTime,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.SCORING] = {
      phase: GameProgressionPhase.SCORING,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.calculateScores(context);
      },
      onExit: async () => {},
      getNextPhase: (context) => {
        if (this.state.questionProgression.isLastQuestion) {
          return GameProgressionPhase.ROUND_RESULTS;
        }
        return GameProgressionPhase.QUESTION_DISPLAY;
      },
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.ROUND_RESULTS] = {
      phase: GameProgressionPhase.ROUND_RESULTS,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.showRoundResults(context);
      },
      onExit: async () => {},
      getNextPhase: (context) => {
        if (this.state.roundProgression.isLastRound) {
          return GameProgressionPhase.FINAL_RESULTS;
        }
        return this.shouldShowIntermission(context) 
          ? GameProgressionPhase.INTERMISSION 
          : GameProgressionPhase.ROUND_INTRO;
      },
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => false
    };

    this.phaseHandlers[GameProgressionPhase.SPECIAL_ROUND] = {
      phase: GameProgressionPhase.SPECIAL_ROUND,
      canEnter: (context) => this.validateSpecialRoundReady(context),
      onEnter: async (context) => {
        await this.startSpecialRound(context);
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.ROUND_RESULTS,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => false
    };

    this.phaseHandlers[GameProgressionPhase.INTERMISSION] = {
      phase: GameProgressionPhase.INTERMISSION,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async () => {
        await this.startIntermission();
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.ROUND_INTRO,
      getTimeLimit: () => this.options.configuration.intermissionTime,
      shouldAutoAdvance: () => true
    };

    this.phaseHandlers[GameProgressionPhase.FINAL_RESULTS] = {
      phase: GameProgressionPhase.FINAL_RESULTS,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.showFinalResults(context);
      },
      onExit: async () => {},
      getNextPhase: () => GameProgressionPhase.GAME_COMPLETE,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => false
    };

    this.phaseHandlers[GameProgressionPhase.GAME_COMPLETE] = {
      phase: GameProgressionPhase.GAME_COMPLETE,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async () => {
        await this.completeGame();
      },
      onExit: async () => {},
      getNextPhase: () => null,
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => false
    };

    this.phaseHandlers[GameProgressionPhase.ERROR_STATE] = {
      phase: GameProgressionPhase.ERROR_STATE,
      canEnter: () => ({ isValid: true, errors: [], warnings: [], canProceed: true }),
      onEnter: async (context) => {
        await this.handleErrorState(context);
      },
      onExit: async () => {},
      getNextPhase: (context) => this.getErrorRecoveryPhase(context),
      getTimeLimit: () => undefined,
      shouldAutoAdvance: () => this.options.configuration.errorRecoveryMode === 'auto'
    };
  }

  // Public API Methods
  public async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      throw new Error('Game controller is already initialized');
    }

    try {
      await this.transitionToPhase(GameProgressionPhase.INITIALIZATION);
      this.state.isInitialized = true;
      this.emitEvent(GameControllerEventType.GAME_INITIALIZED, { gameId: this.state.gameId });
    } catch (error) {
      await this.handleError('Failed to initialize game controller', error);
      throw error;
    }
  }

  public async startGame(): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Game controller must be initialized before starting');
    }

    if (this.state.isActive) {
      throw new Error('Game is already active');
    }

    try {
      this.state.isActive = true;
      this.state.metrics.gameStartTime = new Date();
      await this.transitionToPhase(GameProgressionPhase.PRE_GAME);
      this.emitEvent(GameControllerEventType.GAME_STARTED, { gameId: this.state.gameId });
    } catch (error) {
      this.state.isActive = false;
      await this.handleError('Failed to start game', error);
      throw error;
    }
  }

  public async pauseGame(reason?: string): Promise<void> {
    if (!this.state.isActive || this.state.pauseResume.isPaused) {
      throw new Error('Cannot pause game in current state');
    }

    if (!this.options.configuration.enablePauseResume) {
      throw new Error('Pause/resume is not enabled for this game');
    }

    try {
      this.state.pauseResume.isPaused = true;
      this.state.pauseResume.pauseStartTime = new Date();
      this.state.pauseResume.pauseReason = reason;
      this.state.pauseResume.pauseCount++;

      // Pause all timers
      this.gameTimer.pauseAll();
      this.pausePhaseTimers();

      this.emitEvent(GameControllerEventType.GAME_PAUSED, { 
        gameId: this.state.gameId, 
        reason 
      });
    } catch (error) {
      await this.handleError('Failed to pause game', error);
      throw error;
    }
  }

  public async resumeGame(): Promise<void> {
    if (!this.state.pauseResume.isPaused || !this.state.pauseResume.canResume) {
      throw new Error('Cannot resume game in current state');
    }

    try {
      const pauseDuration = this.state.pauseResume.pauseStartTime 
        ? (Date.now() - this.state.pauseResume.pauseStartTime.getTime()) / 1000
        : 0;

      this.state.pauseResume.isPaused = false;
      this.state.pauseResume.totalPauseDuration += pauseDuration;
      this.state.pauseResume.pauseStartTime = undefined;
      this.state.pauseResume.pauseReason = undefined;

      // Resume all timers
      this.gameTimer.resumeAll();
      this.resumePhaseTimers();

      this.emitEvent(GameControllerEventType.GAME_RESUMED, { 
        gameId: this.state.gameId,
        pauseDuration 
      });
    } catch (error) {
      await this.handleError('Failed to resume game', error);
      throw error;
    }
  }

  public async endGame(): Promise<void> {
    if (!this.state.isActive) {
      throw new Error('No active game to end');
    }

    try {
      this.state.isActive = false;
      this.state.metrics.gameEndTime = new Date();
      this.state.metrics.totalGameDuration = 
        (this.state.metrics.gameEndTime.getTime() - this.state.metrics.gameStartTime.getTime()) / 1000;

      await this.transitionToPhase(GameProgressionPhase.GAME_COMPLETE);
      this.emitEvent(GameControllerEventType.GAME_ENDED, { 
        gameId: this.state.gameId,
        duration: this.state.metrics.totalGameDuration 
      });
    } catch (error) {
      await this.handleError('Failed to end game', error);
      throw error;
    }
  }

  public async advancePhase(options: AdvanceOptions = {}): Promise<void> {
    if (this.state.pauseResume.isPaused && !options.force) {
      throw new Error('Cannot advance phase while game is paused');
    }

    if (this.state.progression.isTransitioning && !options.force) {
      throw new Error('Phase transition already in progress');
    }

    try {
      const currentHandler = this.phaseHandlers[this.state.progression.currentPhase];
      if (!currentHandler) {
        throw new Error(`No handler found for phase: ${this.state.progression.currentPhase}`);
      }

      const context = this.createValidationContext(this.state.progression.currentPhase);
      const nextPhase = currentHandler.getNextPhase(context);

      if (!nextPhase) {
        throw new Error(`No next phase defined for: ${this.state.progression.currentPhase}`);
      }

      await this.transitionToPhase(nextPhase, {
        triggerType: options.triggerType || TransitionTrigger.USER_ACTION,
        skipValidation: options.skipValidation,
        customTransitionTime: options.customTransitionTime,
        metadata: options.metadata
      });
    } catch (error) {
      await this.handleError('Failed to advance phase', error);
      throw error;
    }
  }

  public async skipQuestion(): Promise<void> {
    if (!this.options.configuration.allowSkipQuestions) {
      throw new Error('Question skipping is not allowed');
    }

    if (this.state.progression.currentPhase !== GameProgressionPhase.ANSWER_COLLECTION) {
      throw new Error('Can only skip questions during answer collection phase');
    }

    try {
      this.state.questionProgression.questionsSkipped++;
      this.updateQuestionProgression();
      
      this.emitEvent(GameControllerEventType.QUESTION_SKIPPED, {
        gameId: this.state.gameId,
        questionIndex: this.state.questionProgression.currentQuestionIndex
      });

      await this.advancePhase({ triggerType: TransitionTrigger.USER_ACTION });
    } catch (error) {
      await this.handleError('Failed to skip question', error);
      throw error;
    }
  }

  // Phase Implementation Methods
  private async initializeGame(): Promise<void> {
    // Initialize all managers
    await this.gameStateManager.initialize();
    
    // Set up initial game configuration
    const gameConfig = {
      totalRounds: this.options.configuration.totalRounds,
      questionsPerRound: this.options.configuration.questionsPerRound,
      enableSpecialRounds: this.options.configuration.enableSpecialRounds
    };

    await this.gameStateManager.updateConfiguration(gameConfig);
    
    // Initialize progression state
    this.updateQuestionProgression();
    this.updateRoundProgression();

    if (this.options.debugMode) {
      console.log('Game controller initialized:', this.state);
    }
  }

  private async prepareGame(): Promise<void> {
    // Validate game is ready to start
    const gameState = this.gameStateManager.getState();
    if (!gameState.participants || gameState.participants.length === 0) {
      throw new Error('No participants found');
    }

    // Prepare first round
    await this.roundManager.prepareRound(0);
    
    // Set up initial timers if needed
    this.setupPhaseTimers();
  }

  private async startRound(context: PhaseValidationContext): Promise<void> {
    const roundIndex = this.state.roundProgression.currentRoundIndex;
    const round = await this.roundManager.getCurrentRound();
    
    if (!round) {
      throw new Error(`No round found at index ${roundIndex}`);
    }

    this.state.roundProgression.roundStartTime = new Date();
    this.state.roundProgression.currentRoundType = 'regular';
    
    await this.roundManager.startRound(round);
    
    this.emitEvent(GameControllerEventType.ROUND_STARTED, {
      gameId: this.state.gameId,
      round: roundIndex,
      roundType: this.state.roundProgression.currentRoundType
    });
  }

  private async displayQuestion(context: PhaseValidationContext): Promise<void> {
    const questionIndex = this.state.questionProgression.currentQuestionIndex;
    const currentRound = await this.roundManager.getCurrentRound();
    
    if (!currentRound || !currentRound.questions[questionIndex]) {
      throw new Error(`No question found at index ${questionIndex}`);
    }

    const question = currentRound.questions[questionIndex];
    await this.gameStateManager.setActiveQuestion(question);
    
    this.emitEvent(GameControllerEventType.QUESTION_DISPLAYED, {
      gameId: this.state.gameId,
      question: questionIndex,
      questionId: question.id
    });
  }

  private async startAnswerCollection(context: PhaseValidationContext): Promise<void> {
    // Start answer collection timer
    const timeLimit = this.options.configuration.questionTimeLimit;
    if (timeLimit > 0) {
      this.gameTimer.startTimer('answer-collection', timeLimit * 1000, () => {
        this.handleAnswerTimeExpired();
      });
    }

    // Initialize answer submission tracking
    await this.answerSubmissionManager.startNewQuestion();
  }

  private async reviewAnswers(context: PhaseValidationContext): Promise<void> {
    // Stop answer collection
    this.gameTimer.stopTimer('answer-collection');
    
    // Lock all submissions
    await this.answerSubmissionManager.lockAllSubmissions();
    
    // Show correct answer if configured
    const gameState = this.gameStateManager.getState();
    if (gameState.activeQuestion) {
      await this.gameStateManager.revealAnswer(gameState.activeQuestion.id);
    }
  }

  private async calculateScores(context: PhaseValidationContext): Promise<void> {
    // Calculate scores for current question
    await this.scoreManager.calculateQuestionScores();
    
    this.state.questionProgression.questionsAnswered++;
    this.updateQuestionProgression();
    
    this.emitEvent(GameControllerEventType.SCORING_COMPLETED, {
      gameId: this.state.gameId,
      question: this.state.questionProgression.currentQuestionIndex
    });
  }

  private async showRoundResults(context: PhaseValidationContext): Promise<void> {
    // Calculate final round scores
    await this.scoreManager.calculateRoundScores();
    
    this.state.roundProgression.roundsCompleted++;
    this.state.roundProgression.roundsRemaining--;
    this.updateRoundProgression();
    
    this.emitEvent(GameControllerEventType.ROUND_COMPLETED, {
      gameId: this.state.gameId,
      round: this.state.roundProgression.currentRoundIndex
    });
  }

  private async startSpecialRound(context: PhaseValidationContext): Promise<void> {
    const specialRoundType = this.determineSpecialRoundType();
    const specialRound = await this.createSpecialRound(specialRoundType);
    
    this.state.roundProgression.currentRoundType = 'special';
    this.state.roundProgression.specialRoundType = specialRoundType;
    
    await this.specialRoundManager.startSpecialRound(specialRound);
    
    this.emitEvent(GameControllerEventType.SPECIAL_ROUND_STARTED, {
      gameId: this.state.gameId,
      specialRoundType
    });
  }

  private async startIntermission(): Promise<void> {
    // Prepare next round during intermission
    const nextRoundIndex = this.state.roundProgression.currentRoundIndex + 1;
    if (nextRoundIndex < this.state.roundProgression.totalRounds) {
      await this.roundManager.prepareRound(nextRoundIndex);
    }
  }

  private async showFinalResults(context: PhaseValidationContext): Promise<void> {
    // Calculate final game scores
    await this.scoreManager.calculateFinalScores();
    
    // Update metrics
    this.updateFinalMetrics();
  }

  private async completeGame(): Promise<void> {
    // Clean up resources
    this.clearAllTimers();
    
    // Save final state if needed
    if (this.options.enableMetrics) {
      await this.saveFinalMetrics();
    }
  }

  private async handleErrorState(context: PhaseValidationContext): Promise<void> {
    this.state.error.recoveryAttempts++;
    
    if (this.state.error.recoveryAttempts > this.options.configuration.maxRetries) {
      this.state.error.canRecover = false;
      throw new Error('Maximum recovery attempts exceeded');
    }

    this.emitEvent(GameControllerEventType.RECOVERY_ATTEMPTED, {
      gameId: this.state.gameId,
      attempt: this.state.error.recoveryAttempts,
      error: this.state.error.errorMessage
    });
  }

  // Transition and Validation Methods
  private async transitionToPhase(
    targetPhase: GameProgressionPhase, 
    options: Partial<PhaseTransition> = {}
  ): Promise<void> {
    const startTime = Date.now();
    const fromPhase = this.state.progression.currentPhase;
    
    try {
      this.state.progression.isTransitioning = true;
      this.state.progression.transitionStartTime = new Date();

      // Validate transition
      const context = this.createValidationContext(targetPhase);
      const handler = this.phaseHandlers[targetPhase];
      
      if (!handler) {
        throw new Error(`No handler found for phase: ${targetPhase}`);
      }

      if (!options.skipValidation) {
        const validation = handler.canEnter(context);
        if (!validation.isValid) {
          throw new Error(`Cannot enter phase ${targetPhase}: ${validation.errors.join(', ')}`);
        }
      }

      // Execute exit handler for current phase
      const currentHandler = this.phaseHandlers[fromPhase];
      if (currentHandler) {
        await currentHandler.onExit(context);
      }

      // Update phase state
      this.state.progression.previousPhase = fromPhase;
      this.state.progression.currentPhase = targetPhase;
      this.state.progression.phaseStartTime = new Date();
      this.state.progression.nextPhase = handler.getNextPhase(context);
      this.state.progression.autoAdvance = handler.shouldAutoAdvance(context);
      this.state.progression.phaseTimeLimit = handler.getTimeLimit(context);

      // Execute enter handler for new phase
      await handler.onEnter(context);

      // Set up auto-advance timer if needed
      if (this.state.progression.autoAdvance && this.state.progression.phaseTimeLimit) {
        this.setupAutoAdvanceTimer();
      }

      // Record transition
      const duration = Date.now() - startTime;
      const transition: PhaseTransition = {
        fromPhase,
        toPhase: targetPhase,
        trigger: options.trigger || TransitionTrigger.AUTOMATIC,
        timestamp: new Date(),
        duration,
        success: true,
        metadata: options.metadata
      };

      this.state.transitionHistory.push(transition);
      this.updateMetrics(transition);

      this.emitEvent(GameControllerEventType.PHASE_TRANSITION_COMPLETED, {
        gameId: this.state.gameId,
        phase: targetPhase,
        fromPhase,
        duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const transition: PhaseTransition = {
        fromPhase,
        toPhase: targetPhase,
        trigger: options.trigger || TransitionTrigger.AUTOMATIC,
        timestamp: new Date(),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.state.transitionHistory.push(transition);
      this.updateMetrics(transition);

      this.emitEvent(GameControllerEventType.PHASE_TRANSITION_FAILED, {
        gameId: this.state.gameId,
        phase: targetPhase,
        fromPhase,
        error: transition.error
      });

      throw error;
    } finally {
      this.state.progression.isTransitioning = false;
      this.state.progression.transitionStartTime = undefined;
    }
  }

  // Helper Methods
  private createValidationContext(targetPhase: GameProgressionPhase): PhaseValidationContext {
    return {
      currentPhase: this.state.progression.currentPhase,
      targetPhase,
      gameState: this.gameStateManager.getState(),
      progressionState: this.state.progression,
      questionState: this.state.questionProgression,
      roundState: this.state.roundProgression,
      configuration: this.state.configuration
    };
  }

  private validateGameReady(context: PhaseValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.gameState.participants || context.gameState.participants.length === 0) {
      errors.push('No participants found');
    }

    if (!context.gameState.configuration) {
      errors.push('Game configuration not set');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  private validateRoundReady(context: PhaseValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (context.roundState.currentRoundIndex >= context.roundState.totalRounds) {
      errors.push('Round index exceeds total rounds');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  private validateQuestionReady(context: PhaseValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (context.questionState.currentQuestionIndex >= context.questionState.totalQuestions) {
      errors.push('Question index exceeds total questions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  private validateSpecialRoundReady(context: PhaseValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context.configuration.enableSpecialRounds) {
      errors.push('Special rounds are not enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0
    };
  }

  private shouldStartSpecialRound(context: PhaseValidationContext): boolean {
    if (!context.configuration.enableSpecialRounds) return false;
    
    const roundNumber = context.roundState.currentRoundIndex + 1;
    return roundNumber % context.configuration.specialRoundFrequency === 0;
  }

  private shouldShowIntermission(context: PhaseValidationContext): boolean {
    return context.configuration.intermissionTime > 0 && 
           !context.roundState.isLastRound;
  }

  private determineSpecialRoundType(): SpecialRoundType {
    // Simple rotation through special round types
    const types = [SpecialRoundType.WAGER, SpecialRoundType.BONUS, SpecialRoundType.LIGHTNING];
    const index = this.state.roundProgression.currentRoundIndex % types.length;
    return types[index];
  }

  private async createSpecialRound(type: SpecialRoundType): Promise<any> {
    // This would create a special round based on the type
    // Implementation would depend on the specific special round requirements
    return {
      id: `special-round-${Date.now()}`,
      type: 'special',
      specialType: type,
      title: `${type} Round`,
      description: `Special ${type} round`,
      questions: []
    };
  }

  private getErrorRecoveryPhase(context: PhaseValidationContext): GameProgressionPhase | null {
    // Determine recovery phase based on error context
    switch (this.state.error.recoveryStrategy) {
      case 'retry':
        return context.progressionState.previousPhase || GameProgressionPhase.PRE_GAME;
      case 'skip':
        return this.phaseHandlers[context.currentPhase]?.getNextPhase(context) || null;
      case 'restart':
        return GameProgressionPhase.PRE_GAME;
      default:
        return null;
    }
  }

  private updateQuestionProgression(): void {
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      this.state.questionProgression.totalQuestions = currentRound.questions.length;
      this.state.questionProgression.questionsRemaining = 
        this.state.questionProgression.totalQuestions - this.state.questionProgression.currentQuestionIndex - 1;
      this.state.questionProgression.isLastQuestion = 
        this.state.questionProgression.currentQuestionIndex >= this.state.questionProgression.totalQuestions - 1;
    }
  }

  private updateRoundProgression(): void {
    this.state.roundProgression.isLastRound = 
      this.state.roundProgression.currentRoundIndex >= this.state.roundProgression.totalRounds - 1;
  }

  private updateMetrics(transition: PhaseTransition): void {
    this.state.metrics.totalPhaseTransitions++;
    
    if (transition.success) {
      const avgTransitionTime = this.state.metrics.averagePhaseTransitionTime;
      const totalTransitions = this.state.metrics.totalPhaseTransitions;
      this.state.metrics.averagePhaseTransitionTime = 
        (avgTransitionTime * (totalTransitions - 1) + transition.duration) / totalTransitions;
    } else {
      this.state.metrics.errorCount++;
    }
  }

  private updateFinalMetrics(): void {
    const now = new Date();
    this.state.metrics.gameEndTime = now;
    this.state.metrics.totalGameDuration = 
      (now.getTime() - this.state.metrics.gameStartTime.getTime()) / 1000;
  }

  private async saveFinalMetrics(): Promise<void> {
    // Implementation would save metrics to storage
    if (this.options.debugMode) {
      console.log('Final game metrics:', this.state.metrics);
    }
  }

  // Timer Management
  private setupPhaseTimers(): void {
    // Set up any initial timers needed
  }

  private setupAutoAdvanceTimer(): void {
    if (this.state.progression.phaseTimeLimit) {
      const timerId = `auto-advance-${this.state.progression.currentPhase}`;
      const timeout = setTimeout(() => {
        this.handleAutoAdvance();
      }, this.state.progression.phaseTimeLimit * 1000);
      
      this.timers.set(timerId, timeout);
    }
  }

  private pausePhaseTimers(): void {
    // Implementation would pause phase-specific timers
  }

  private resumePhaseTimers(): void {
    // Implementation would resume phase-specific timers
  }

  private clearAllTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  // Event Handlers
  private handleGamePhaseChange(phase: GamePhase): void {
    // Handle game state phase changes
  }

  private handleRoundStarted(round: Round): void {
    // Update progression state when round starts
    this.state.questionProgression.currentQuestionIndex = 0;
    this.updateQuestionProgression();
  }

  private handleRoundEnded(round: Round): void {
    // Update progression state when round ends
    this.state.roundProgression.currentRoundIndex++;
    this.updateRoundProgression();
  }

  private handleAnswerSubmitted(data: any): void {
    // Check if all required answers are submitted
    if (this.shouldAdvanceAfterAnswers()) {
      this.advancePhase({ triggerType: TransitionTrigger.AUTOMATIC });
    }
  }

  private handleSpecialRoundStarted(round: any): void {
    this.emitEvent(GameControllerEventType.SPECIAL_ROUND_STARTED, {
      gameId: this.state.gameId,
      specialRoundType: round.specialType
    });
  }

  private handleSpecialRoundEnded(round: any): void {
    this.emitEvent(GameControllerEventType.SPECIAL_ROUND_COMPLETED, {
      gameId: this.state.gameId,
      specialRoundType: round.specialType
    });
  }

  private handleAnswerTimeExpired(): void {
    this.advancePhase({ triggerType: TransitionTrigger.TIMER_EXPIRY });
  }

  private handleAutoAdvance(): void {
    if (this.state.progression.autoAdvance && !this.state.progression.isTransitioning) {
      this.advancePhase({ triggerType: TransitionTrigger.AUTOMATIC });
    }
  }

  private shouldAdvanceAfterAnswers(): boolean {
    // Logic to determine if we should advance after receiving answers
    return !this.options.configuration.requireAllAnswers;
  }

  private async handleError(message: string, error: any): Promise<void> {
    this.state.error.hasError = true;
    this.state.error.errorMessage = message;
    this.state.error.errorTimestamp = new Date();
    this.state.error.errorPhase = this.state.progression.currentPhase;

    this.emitEvent(GameControllerEventType.ERROR_OCCURRED, {
      gameId: this.state.gameId,
      error: message,
      phase: this.state.progression.currentPhase
    });

    if (this.options.configuration.errorRecoveryMode === 'auto') {
      await this.transitionToPhase(GameProgressionPhase.ERROR_STATE);
    }
  }

  // Event System
  public addEventListener(type: GameControllerEventType, listener: GameControllerEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  public removeEventListener(type: GameControllerEventType, listener: GameControllerEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emitEvent(type: GameControllerEventType, data: Partial<GameControllerEvent> = {}): void {
    const event: GameControllerEvent = {
      type,
      timestamp: new Date(),
      gameId: this.state.gameId,
      ...data
    };

    if (this.options.enableEventLogging) {
      this.state.eventLog.push(event);
    }

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Public Getters
  public getState(): GameControllerState {
    return { ...this.state };
  }

  public getCurrentPhase(): GameProgressionPhase {
    return this.state.progression.currentPhase;
  }

  public getMetrics(): GameProgressionMetrics {
    return { ...this.state.metrics };
  }

  public isActive(): boolean {
    return this.state.isActive;
  }

  public isPaused(): boolean {
    return this.state.pauseResume.isPaused;
  }

  public canAdvance(): boolean {
    return this.state.progression.canAdvance && !this.state.progression.isTransitioning;
  }

  // Cleanup
  public destroy(): void {
    if (this.isDestroyed) return;

    this.clearAllTimers();
    this.eventListeners.clear();
    this.isDestroyed = true;
  }
} 