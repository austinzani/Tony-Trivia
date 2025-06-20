import { 
  GameState, 
  GamePhase, 
  GameAction, 
  GameEvent, 
  GameStateUpdate,
  ActiveQuestion,
  PlayerAnswer,
  PlayerScore,
  TeamScore,
  GameTimer,
  Question,
  Round,
  GameConfiguration,
  PointValue,
  GAME_CONSTRAINTS,
  isValidGamePhase,
  isValidPointValue
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
  private async startGame(action: GameAction): Promise<void> {
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

  private async pauseGame(action: GameAction): Promise<void> {
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

  private async endGame(action: GameAction): Promise<void> {
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

  // Utility methods
  private updateState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
    
    const stateUpdate: GameStateUpdate = {
      type: 'phase-change',
      gameId: this.state.id,
      data: updates,
      timestamp: new Date().toISOString()
    };

    this.emitStateUpdate(stateUpdate);
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
    this.state.events.push(event);
    
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateState(): void {
    if (!this.state.id || !this.state.roomId || !this.state.hostId) {
      throw new Error('Invalid game state: missing required identifiers');
    }

    if (!isValidGamePhase(this.state.phase)) {
      throw new Error(`Invalid game phase: ${this.state.phase}`);
    }
  }

  private async validateAction(action: GameAction): Promise<void> {
    if (!action.gameId || action.gameId !== this.state.id) {
      throw new Error('Invalid game ID');
    }

    if (!action.timestamp) {
      throw new Error('Action timestamp required');
    }
  }

  private pauseAllTimers(): void {
    Object.values(this.state.timers).forEach(timer => {
      if (timer.isActive) {
        timer.isPaused = true;
        timer.pausedAt = new Date().toISOString();
      }
    });
  }

  private clearAllTimers(): void {
    this.timers.forEach(interval => clearInterval(interval));
    this.timers.clear();
    
    Object.values(this.state.timers).forEach(timer => {
      timer.isActive = false;
      timer.endedAt = new Date().toISOString();
    });
  }

  // Placeholder methods - to be implemented
  private async resumeGame(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async startRound(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async endRound(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async presentQuestion(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async submitAnswer(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async lockAnswers(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async revealAnswers(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async advanceQuestion(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async skipQuestion(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async updateTimer(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async addPlayer(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async removePlayer(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async formTeam(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  private async updateSettings(action: GameAction): Promise<void> {
    // Implementation to be added
    throw new Error('Not implemented');
  }

  destroy(): void {
    this.clearAllTimers();
    this.stateListeners.clear();
    this.eventListeners.clear();
  }
} 