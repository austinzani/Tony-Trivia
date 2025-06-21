import type { 
  GameState, 
  GamePhase, 
  GameAction, 
  GameEvent, 
  GameStateUpdate,
  ActiveQuestion,
  PlayerScore,
  TeamScore,
  Round
} from '../types/game';
import { 
  isValidGamePhase 
} from '../types/game';

export type GameStateListener = (update: GameStateUpdate) => void;
export type GameEventListener = (event: GameEvent) => void;

export class GameStateManager {
  private state: GameState;
  private stateListeners: Set<GameStateListener> = new Set();
  private eventListeners: Set<GameEventListener> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(initialState: GameState) {
    this.state = { ...initialState };
    this.validateState();
  }

  // State access methods
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  getPhase(): GamePhase {
    return this.state.phase;
  }

  getCurrentRound(): Round | undefined {
    return this.state.rounds[this.state.currentRound - 1];
  }

  getCurrentQuestion(): ActiveQuestion | undefined {
    return this.state.currentQuestion;
  }

  getPlayerScore(playerId: string): PlayerScore | undefined {
    return this.state.players[playerId];
  }

  getTeamScore(teamId: string): TeamScore | undefined {
    return this.state.teams[teamId];
  }

  // Event listeners
  addStateListener(listener: GameStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  addEventListener(listener: GameEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  // Core game actions
  async executeAction(action: GameAction): Promise<void> {
    try {
      await this.validateAction(action);
      
      switch (action.type) {
        case 'start-game':
          await this.startGame(action);
          break;
        case 'pause-game':
          await this.pauseGame(action);
          break;
        case 'resume-game':
          await this.resumeGame(action);
          break;
        case 'end-game':
          await this.endGame(action);
          break;
        case 'start-round':
          await this.startRound(action);
          break;
        case 'end-round':
          await this.endRound(action);
          break;
        case 'present-question':
          await this.presentQuestion(action);
          break;
        case 'submit-answer':
          await this.submitAnswer(action);
          break;
        case 'lock-answers':
          await this.lockAnswers(action);
          break;
        case 'reveal-answers':
          await this.revealAnswers(action);
          break;
        case 'advance-question':
          await this.advanceQuestion(action);
          break;
        case 'skip-question':
          await this.skipQuestion(action);
          break;
        case 'update-timer':
          await this.updateTimer(action);
          break;
        case 'add-player':
          await this.addPlayer(action);
          break;
        case 'remove-player':
          await this.removePlayer(action);
          break;
        case 'form-team':
          await this.formTeam(action);
          break;
        case 'update-settings':
          await this.updateSettings(action);
          break;
        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }
    } catch (error) {
      console.error('Error executing game action:', error);
      this.emitEvent({
        id: this.generateId(),
        type: 'game-ended',
        gameId: this.state.id,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Game lifecycle methods
  private async startGame(_action: GameAction): Promise<void> {
    if (this.state.phase !== 'pre-game') {
      throw new Error('Game can only be started from pre-game phase');
    }

    if (Object.keys(this.state.players).length === 0 && Object.keys(this.state.teams).length === 0) {
      throw new Error('Cannot start game without players or teams');
    }

    const updates: Partial<GameState> = {
      phase: 'round-intro',
      isActive: true,
      startedAt: new Date().toISOString(),
      currentRound: 1,
      lastUpdated: new Date().toISOString()
    };

    this.updateState(updates);
    
    this.emitEvent({
      id: this.generateId(),
      type: 'game-started',
      gameId: this.state.id,
      timestamp: new Date().toISOString()
    });

    // Auto-advance to first round if configured
    if (this.state.configuration.settings.autoAdvance) {
      setTimeout(() => {
        this.executeAction({
          type: 'start-round',
          gameId: this.state.id,
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }
  }

  private async pauseGame(_action: GameAction): Promise<void> {
    if (!this.state.isActive || this.state.isPaused) {
      throw new Error('Game is not active or already paused');
    }

    this.pauseAllTimers();

    const updates: Partial<GameState> = {
      isPaused: true,
      pausedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.updateState(updates);
    
    this.emitEvent({
      id: this.generateId(),
      type: 'game-paused',
      gameId: this.state.id,
      timestamp: new Date().toISOString()
    });
  }

  private async endGame(_action: GameAction): Promise<void> {
    this.clearAllTimers();

    const updates: Partial<GameState> = {
      phase: 'game-complete',
      isActive: false,
      isComplete: true,
      completedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.updateState(updates);
    
    this.emitEvent({
      id: this.generateId(),
      type: 'game-ended',
      gameId: this.state.id,
      timestamp: new Date().toISOString()
    });
  }

  // State management helpers
  private updateState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
    
    this.emitStateUpdate({
      type: 'phase-change',
      gameId: this.state.id,
      data: updates,
      timestamp: new Date().toISOString()
    });

    this.validateState();
  }

  private emitStateUpdate(update: GameStateUpdate): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  private emitEvent(event: GameEvent): void {
    // Add to events history
    this.state.events.push(event);
    
    // Notify listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private validateState(): void {
    if (!isValidGamePhase(this.state.phase)) {
      throw new Error(`Invalid game phase: ${this.state.phase}`);
    }
    
    if (this.state.currentRound < 0 || this.state.currentRound > this.state.rounds.length) {
      throw new Error(`Invalid current round: ${this.state.currentRound}`);
    }
  }

  private async validateAction(action: GameAction): Promise<void> {
    if (!action.gameId || action.gameId !== this.state.id) {
      throw new Error('Invalid game ID in action');
    }
    
    if (!action.timestamp) {
      throw new Error('Action must have timestamp');
    }
  }

  private pauseAllTimers(): void {
    Object.values(this.state.timers).forEach(timer => {
      if (timer.isActive && !timer.isPaused) {
        timer.isPaused = true;
        timer.pausedAt = new Date().toISOString();
      }
    });
  }

  private clearAllTimers(): void {
    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
    this.timers.clear();
    
    Object.values(this.state.timers).forEach(timer => {
      timer.isActive = false;
      timer.endedAt = new Date().toISOString();
    });
  }

  private async resumeGame(_action: GameAction): Promise<void> {
    // Implementation for resuming game
  }

  private async startRound(_action: GameAction): Promise<void> {
    // Implementation for starting round
  }

  private async endRound(_action: GameAction): Promise<void> {
    // Implementation for ending round
  }

  private async presentQuestion(_action: GameAction): Promise<void> {
    // Implementation for presenting question
  }

  private async submitAnswer(_action: GameAction): Promise<void> {
    // Implementation for submitting answer
  }

  private async lockAnswers(_action: GameAction): Promise<void> {
    // Implementation for locking answers
  }

  private async revealAnswers(_action: GameAction): Promise<void> {
    // Implementation for revealing answers
  }

  private async advanceQuestion(_action: GameAction): Promise<void> {
    // Implementation for advancing question
  }

  private async skipQuestion(_action: GameAction): Promise<void> {
    // Implementation for skipping question
  }

  private async updateTimer(_action: GameAction): Promise<void> {
    // Implementation for updating timer
  }

  private async addPlayer(_action: GameAction): Promise<void> {
    // Implementation for adding player
  }

  private async removePlayer(_action: GameAction): Promise<void> {
    // Implementation for removing player
  }

  private async formTeam(_action: GameAction): Promise<void> {
    // Implementation for forming team
  }

  private async updateSettings(_action: GameAction): Promise<void> {
    // Implementation for updating settings
  }

  destroy(): void {
    this.clearAllTimers();
    this.stateListeners.clear();
    this.eventListeners.clear();
  }
} 