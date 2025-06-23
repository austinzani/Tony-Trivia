export interface TimerConfiguration {
  duration: number; // Duration in seconds
  warningThreshold?: number; // Warning threshold in seconds (default: 10)
  criticalThreshold?: number; // Critical threshold in seconds (default: 5)
  autoStart?: boolean; // Auto-start timer on creation (default: false)
  precision?: number; // Update interval in milliseconds (default: 100)
  enableSound?: boolean; // Enable sound effects (default: true)
  enableVisualFeedback?: boolean; // Enable visual feedback (default: true)
}

export interface TimerState {
  timeRemaining: number;
  totalDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
  progress: number; // 0-100 percentage
  phase: TimerPhase;
}

export const TimerPhase = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EXPIRED: 'expired'
} as const;

export type TimerPhase = typeof TimerPhase[keyof typeof TimerPhase];

export interface TimerEvent {
  type: TimerEventType;
  timestamp: number;
  timeRemaining: number;
  phase: TimerPhase;
}

export const TimerEventType = {
  STARTED: 'started',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  STOPPED: 'stopped',
  TICK: 'tick',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EXPIRED: 'expired',
  RESET: 'reset'
} as const;

export type TimerEventType = typeof TimerEventType[keyof typeof TimerEventType];

export type TimerEventListener = (event: TimerEvent) => void;

export class GameTimer {
  private config: Required<TimerConfiguration>;
  private state: TimerState;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Map<TimerEventType, Set<TimerEventListener>> = new Map();
  private startTime: number = 0;
  private pausedTime: number = 0;
  private totalPausedDuration: number = 0;

  constructor(config: TimerConfiguration) {
    this.config = {
      duration: config.duration,
      warningThreshold: config.warningThreshold ?? 10,
      criticalThreshold: config.criticalThreshold ?? 5,
      autoStart: config.autoStart ?? false,
      precision: config.precision ?? 100,
      enableSound: config.enableSound ?? true,
      enableVisualFeedback: config.enableVisualFeedback ?? true
    };

    this.state = this.createInitialState();

    if (this.config.autoStart) {
      this.start();
    }
  }

  private createInitialState(): TimerState {
    return {
      timeRemaining: this.config.duration,
      totalDuration: this.config.duration,
      isRunning: false,
      isPaused: false,
      isExpired: false,
      progress: 0,
      phase: TimerPhase.NORMAL
    };
  }

  // Public API Methods
  public start(): void {
    if (this.state.isRunning) {
      return;
    }

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.startTime = Date.now();
    this.totalPausedDuration = 0;

    this.startInterval();
    this.emitEvent(TimerEventType.STARTED);
  }

  public pause(): void {
    if (!this.state.isRunning || this.state.isPaused) {
      return;
    }

    this.state.isPaused = true;
    this.pausedTime = Date.now();
    this.stopInterval();
    this.emitEvent(TimerEventType.PAUSED);
  }

  public resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) {
      return;
    }

    this.state.isPaused = false;
    this.totalPausedDuration += Date.now() - this.pausedTime;
    this.startInterval();
    this.emitEvent(TimerEventType.RESUMED);
  }

  public stop(): void {
    if (!this.state.isRunning) {
      return;
    }

    this.state.isRunning = false;
    this.state.isPaused = false;
    this.stopInterval();
    this.emitEvent(TimerEventType.STOPPED);
  }

  public reset(newDuration?: number): void {
    this.stop();
    
    if (newDuration !== undefined) {
      this.config.duration = newDuration;
    }

    this.state = this.createInitialState();
    this.emitEvent(TimerEventType.RESET);
  }

  public addTime(seconds: number): void {
    if (this.state.isExpired) {
      return;
    }

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining + seconds);
    this.state.totalDuration += seconds;
    this.updateState();
  }

  public subtractTime(seconds: number): void {
    if (this.state.isExpired) {
      return;
    }

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - seconds);
    this.updateState();

    if (this.state.timeRemaining === 0) {
      this.handleExpiration();
    }
  }

  // Event System
  public addEventListener(type: TimerEventType, listener: TimerEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: TimerEventType, listener: TimerEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public removeAllEventListeners(type?: TimerEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  // Getters
  public getState(): Readonly<TimerState> {
    return { ...this.state };
  }

  public getConfiguration(): Readonly<TimerConfiguration> {
    return { ...this.config };
  }

  public getTimeRemaining(): number {
    return this.state.timeRemaining;
  }

  public getProgress(): number {
    return this.state.progress;
  }

  public getPhase(): TimerPhase {
    return this.state.phase;
  }

  public isRunning(): boolean {
    return this.state.isRunning;
  }

  public isPaused(): boolean {
    return this.state.isPaused;
  }

  public isExpired(): boolean {
    return this.state.isExpired;
  }

  // Format time for display
  public formatTime(includeMilliseconds: boolean = false): string {
    const totalSeconds = Math.ceil(this.state.timeRemaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (includeMilliseconds && this.state.timeRemaining < 10) {
      const milliseconds = Math.floor((this.state.timeRemaining % 1) * 10);
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Private Methods
  private startInterval(): void {
    this.stopInterval();
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.config.precision);
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (!this.state.isRunning || this.state.isPaused || this.state.isExpired) {
      return;
    }

    const now = Date.now();
    const elapsed = (now - this.startTime - this.totalPausedDuration) / 1000;
    const newTimeRemaining = Math.max(0, this.config.duration - elapsed);

    this.state.timeRemaining = newTimeRemaining;
    this.updateState();

    this.emitEvent(TimerEventType.TICK);

    if (newTimeRemaining === 0) {
      this.handleExpiration();
    }
  }

  private updateState(): void {
    // Update progress
    this.state.progress = ((this.config.duration - this.state.timeRemaining) / this.config.duration) * 100;

    // Update phase
    const previousPhase = this.state.phase;
    
    if (this.state.timeRemaining === 0) {
      this.state.phase = TimerPhase.EXPIRED;
    } else if (this.state.timeRemaining <= this.config.criticalThreshold) {
      this.state.phase = TimerPhase.CRITICAL;
    } else if (this.state.timeRemaining <= this.config.warningThreshold) {
      this.state.phase = TimerPhase.WARNING;
    } else {
      this.state.phase = TimerPhase.NORMAL;
    }

    // Emit phase change events
    if (previousPhase !== this.state.phase) {
      switch (this.state.phase) {
        case TimerPhase.WARNING:
          this.emitEvent(TimerEventType.WARNING);
          break;
        case TimerPhase.CRITICAL:
          this.emitEvent(TimerEventType.CRITICAL);
          break;
      }
    }
  }

  private handleExpiration(): void {
    this.state.isExpired = true;
    this.state.isRunning = false;
    this.state.timeRemaining = 0;
    this.state.progress = 100;
    this.state.phase = TimerPhase.EXPIRED;
    
    this.stopInterval();
    this.emitEvent(TimerEventType.EXPIRED);
  }

  private emitEvent(type: TimerEventType): void {
    const event: TimerEvent = {
      type,
      timestamp: Date.now(),
      timeRemaining: this.state.timeRemaining,
      phase: this.state.phase
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in timer event listener for ${type}:`, error);
        }
      });
    }
  }

  // Cleanup
  public destroy(): void {
    this.stop();
    this.removeAllEventListeners();
  }

  // Static factory methods
  public static createQuestionTimer(duration: number): GameTimer {
    return new GameTimer({
      duration,
      warningThreshold: Math.min(10, duration * 0.3),
      criticalThreshold: Math.min(5, duration * 0.15),
      autoStart: false,
      precision: 100,
      enableSound: true,
      enableVisualFeedback: true
    });
  }

  public static createRoundTimer(duration: number): GameTimer {
    return new GameTimer({
      duration,
      warningThreshold: Math.min(30, duration * 0.1),
      criticalThreshold: Math.min(10, duration * 0.05),
      autoStart: false,
      precision: 1000, // Less frequent updates for longer timers
      enableSound: true,
      enableVisualFeedback: true
    });
  }

  public static createGameTimer(duration: number): GameTimer {
    return new GameTimer({
      duration,
      warningThreshold: Math.min(300, duration * 0.05), // 5 minutes or 5%
      criticalThreshold: Math.min(60, duration * 0.02), // 1 minute or 2%
      autoStart: false,
      precision: 5000, // 5 second updates for very long timers
      enableSound: false, // Usually no sound for game-wide timers
      enableVisualFeedback: true
    });
  }
} 