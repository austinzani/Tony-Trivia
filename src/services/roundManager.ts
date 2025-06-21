import type {
  Round,
  RoundType,
  PointValue,
  Question
} from '../types/game';
import { GAME_CONSTRAINTS } from '../types/game';

export interface RoundConfiguration {
  number: number;
  type: RoundType;
  name: string;
  description?: string;
  availablePointValues: PointValue[];
  questions: Question[];
  timeLimit?: number;
  maxQuestions?: number;
  specialRules?: Record<string, any>;
}

export interface PointUsageTracker {
  playerId?: string;
  teamId?: string;
  usedPoints: PointValue[];
  roundNumber: number;
}

export interface RoundValidationResult {
  isValid: boolean;
  error?: string;
  availablePoints?: PointValue[];
}

export interface RoundProgressInfo {
  currentRound: number;
  totalRounds: number;
  questionsAnswered: number;
  questionsRemaining: number;
  pointsUsed: Record<string, PointValue[]>; // participantId -> used points
  roundComplete: boolean;
  canAdvance: boolean;
}

export class RoundManager {
  private rounds: Round[] = [];
  private currentRoundIndex: number = 0;
  private pointUsageMap: Map<string, Map<number, PointValue[]>> = new Map(); // participantId -> roundNumber -> usedPoints
  private roundStartTimes: Map<number, string> = new Map();
  private roundEndTimes: Map<number, string> = new Map();

  constructor(rounds: Round[] = []) {
    this.rounds = rounds;
    this.validateRounds();
  }

  // Round initialization and configuration
  static createLastCallTriviaRounds(
    round1Questions: Question[],
    round2Questions: Question[],
    customConfig?: Partial<RoundConfiguration>[]
  ): Round[] {
    const defaultRounds: RoundConfiguration[] = [
      {
        number: 1,
        type: 'standard',
        name: 'Round 1',
        description: 'First round with point values 1, 3, 5',
        availablePointValues: GAME_CONSTRAINTS.LAST_CALL_ROUND_1_POINTS as unknown as PointValue[],
        questions: round1Questions,
        timeLimit: 300, // 5 minutes
        maxQuestions: round1Questions.length
      },
      {
        number: 2,
        type: 'standard',
        name: 'Round 2',
        description: 'Second round with point values 2, 4, 6',
        availablePointValues: GAME_CONSTRAINTS.LAST_CALL_ROUND_2_POINTS as unknown as PointValue[],
        questions: round2Questions,
        timeLimit: 300, // 5 minutes
        maxQuestions: round2Questions.length
      }
    ];

    // Apply custom configurations if provided
    if (customConfig) {
      customConfig.forEach((config, index) => {
        if (defaultRounds[index]) {
          defaultRounds[index] = { ...defaultRounds[index], ...config };
        }
      });
    }

    return defaultRounds.map(config => ({
      id: `round-${config.number}`,
      number: config.number,
      type: config.type,
      name: config.name,
      description: config.description,
      availablePointValues: config.availablePointValues,
      questions: config.questions,
      timeLimit: config.timeLimit,
      maxQuestions: config.maxQuestions,
      specialRules: config.specialRules,
      isComplete: false
    }));
  }

  static createCustomRounds(configurations: RoundConfiguration[]): Round[] {
    return configurations.map(config => ({
      id: `round-${config.number}`,
      number: config.number,
      type: config.type,
      name: config.name,
      description: config.description,
      availablePointValues: config.availablePointValues,
      questions: config.questions,
      timeLimit: config.timeLimit,
      maxQuestions: config.maxQuestions,
      specialRules: config.specialRules,
      isComplete: false
    }));
  }

  // Round access methods
  getCurrentRound(): Round | null {
    return this.rounds[this.currentRoundIndex] || null;
  }

  getRound(roundNumber: number): Round | null {
    return this.rounds.find(round => round.number === roundNumber) || null;
  }

  getAllRounds(): Round[] {
    return [...this.rounds];
  }

  getTotalRounds(): number {
    return this.rounds.length;
  }

  getCurrentRoundNumber(): number {
    const currentRound = this.getCurrentRound();
    return currentRound ? currentRound.number : 0;
  }

  isLastRound(): boolean {
    return this.currentRoundIndex >= this.rounds.length - 1;
  }

  // Point value management
  getAvailablePointValues(roundNumber?: number): PointValue[] {
    const round = roundNumber ? this.getRound(roundNumber) : this.getCurrentRound();
    return round ? [...round.availablePointValues] : [];
  }

  getUsedPointValues(participantId: string, roundNumber?: number): PointValue[] {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const participantUsage = this.pointUsageMap.get(participantId);
    return participantUsage?.get(targetRound) || [];
  }

  getRemainingPointValues(participantId: string, roundNumber?: number): PointValue[] {
    const available = this.getAvailablePointValues(roundNumber);
    const used = this.getUsedPointValues(participantId, roundNumber);
    return available.filter(point => !used.includes(point));
  }

  canUsePointValue(participantId: string, pointValue: PointValue, roundNumber?: number): boolean {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);
    
    if (!round) return false;
    if (!round.availablePointValues.includes(pointValue)) return false;
    
    const usedPoints = this.getUsedPointValues(participantId, targetRound);
    return !usedPoints.includes(pointValue);
  }

  usePointValue(participantId: string, pointValue: PointValue, roundNumber?: number): boolean {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    
    if (!this.canUsePointValue(participantId, pointValue, targetRound)) {
      return false;
    }

    // Initialize maps if needed
    if (!this.pointUsageMap.has(participantId)) {
      this.pointUsageMap.set(participantId, new Map());
    }

    const participantUsage = this.pointUsageMap.get(participantId)!;
    if (!participantUsage.has(targetRound)) {
      participantUsage.set(targetRound, []);
    }

    // Add the point value to used points
    const usedPoints = participantUsage.get(targetRound)!;
    usedPoints.push(pointValue);

    return true;
  }

  releasePointValue(participantId: string, pointValue: PointValue, roundNumber?: number): boolean {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const participantUsage = this.pointUsageMap.get(participantId);
    
    if (!participantUsage) return false;
    
    const roundUsage = participantUsage.get(targetRound);
    if (!roundUsage) return false;

    const pointIndex = roundUsage.indexOf(pointValue);
    if (pointIndex === -1) return false;

    roundUsage.splice(pointIndex, 1);
    return true;
  }

  // Validation methods
  validatePointSelection(
    participantId: string, 
    pointValue: PointValue, 
    roundNumber?: number
  ): RoundValidationResult {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);

    if (!round) {
      return {
        isValid: false,
        error: `Round ${targetRound} not found`
      };
    }

    if (!round.availablePointValues.includes(pointValue)) {
      return {
        isValid: false,
        error: `Point value ${pointValue} not available in round ${targetRound}`,
        availablePoints: round.availablePointValues
      };
    }

    const usedPoints = this.getUsedPointValues(participantId, targetRound);
    if (usedPoints.includes(pointValue)) {
      return {
        isValid: false,
        error: `Point value ${pointValue} already used in round ${targetRound}`,
        availablePoints: this.getRemainingPointValues(participantId, targetRound)
      };
    }

    return { isValid: true };
  }

  validateRoundCompletion(roundNumber?: number): RoundValidationResult {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);

    if (!round) {
      return {
        isValid: false,
        error: `Round ${targetRound} not found`
      };
    }

    // Check if round has questions
    if (!round.questions || round.questions.length === 0) {
      return {
        isValid: false,
        error: `Round ${targetRound} has no questions`
      };
    }

    // Check if round is already complete
    if (round.isComplete) {
      return {
        isValid: false,
        error: `Round ${targetRound} is already complete`
      };
    }

    return { isValid: true };
  }

  // Round progression
  startRound(roundNumber?: number): boolean {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);

    if (!round) return false;

    const validation = this.validateRoundCompletion(targetRound);
    if (!validation.isValid) return false;

    // Set round start time
    this.roundStartTimes.set(targetRound, new Date().toISOString());
    round.startedAt = new Date().toISOString();

    return true;
  }

  completeRound(roundNumber?: number): boolean {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);

    if (!round) return false;

    // Mark round as complete
    round.isComplete = true;
    round.completedAt = new Date().toISOString();
    this.roundEndTimes.set(targetRound, new Date().toISOString());

    return true;
  }

  advanceToNextRound(): boolean {
    if (this.isLastRound()) return false;

    const currentRound = this.getCurrentRound();
    if (currentRound && !currentRound.isComplete) {
      this.completeRound();
    }

    this.currentRoundIndex++;
    return true;
  }

  goToPreviousRound(): boolean {
    if (this.currentRoundIndex <= 0) return false;
    this.currentRoundIndex--;
    return true;
  }

  goToRound(roundNumber: number): boolean {
    const roundIndex = this.rounds.findIndex(round => round.number === roundNumber);
    if (roundIndex === -1) return false;

    this.currentRoundIndex = roundIndex;
    return true;
  }

  // Progress tracking
  getRoundProgress(roundNumber?: number): RoundProgressInfo {
    const targetRound = roundNumber || this.getCurrentRoundNumber();
    const round = this.getRound(targetRound);

    if (!round) {
      return {
        currentRound: 0,
        totalRounds: this.rounds.length,
        questionsAnswered: 0,
        questionsRemaining: 0,
        pointsUsed: {},
        roundComplete: false,
        canAdvance: false
      };
    }

    // Calculate points used for all participants in this round
    const pointsUsed: Record<string, PointValue[]> = {};
    for (const [participantId, roundMap] of this.pointUsageMap.entries()) {
      const usedInRound = roundMap.get(targetRound) || [];
      if (usedInRound.length > 0) {
        pointsUsed[participantId] = [...usedInRound];
      }
    }

    return {
      currentRound: targetRound,
      totalRounds: this.rounds.length,
      questionsAnswered: 0, // This would be tracked by the game state manager
      questionsRemaining: round.questions.length,
      pointsUsed,
      roundComplete: round.isComplete,
      canAdvance: round.isComplete && !this.isLastRound()
    };
  }

  getAllRoundProgress(): RoundProgressInfo[] {
    return this.rounds.map(round => this.getRoundProgress(round.number));
  }

  // Statistics and analysis
  getParticipantRoundStats(participantId: string): Record<number, {
    pointsUsed: PointValue[];
    pointsRemaining: PointValue[];
    totalPointsUsed: number;
    questionsAnswered: number;
  }> {
    const stats: Record<number, any> = {};

    this.rounds.forEach(round => {
      const usedPoints = this.getUsedPointValues(participantId, round.number);
      const remainingPoints = this.getRemainingPointValues(participantId, round.number);
      const totalPointsUsed = usedPoints.reduce((sum, point) => sum + point, 0);

      stats[round.number] = {
        pointsUsed: usedPoints,
        pointsRemaining: remainingPoints,
        totalPointsUsed,
        questionsAnswered: usedPoints.length
      };
    });

    return stats;
  }

  getRoundDuration(roundNumber: number): number | null {
    const startTime = this.roundStartTimes.get(roundNumber);
    const endTime = this.roundEndTimes.get(roundNumber);

    if (!startTime || !endTime) return null;

    return new Date(endTime).getTime() - new Date(startTime).getTime();
  }

  // Utility methods
  resetRound(roundNumber: number): boolean {
    const round = this.getRound(roundNumber);
    if (!round) return false;

    // Reset round state
    round.isComplete = false;
    round.startedAt = undefined;
    round.completedAt = undefined;

    // Clear timing data
    this.roundStartTimes.delete(roundNumber);
    this.roundEndTimes.delete(roundNumber);

    // Clear point usage for this round
    for (const participantUsage of this.pointUsageMap.values()) {
      participantUsage.delete(roundNumber);
    }

    return true;
  }

  resetAllRounds(): void {
    this.rounds.forEach(round => {
      round.isComplete = false;
      round.startedAt = undefined;
      round.completedAt = undefined;
    });

    this.currentRoundIndex = 0;
    this.pointUsageMap.clear();
    this.roundStartTimes.clear();
    this.roundEndTimes.clear();
  }

  clearParticipant(participantId: string): void {
    this.pointUsageMap.delete(participantId);
  }

  // Export/Import for persistence
  exportState(): {
    rounds: Round[];
    currentRoundIndex: number;
    pointUsage: Record<string, Record<number, PointValue[]>>;
    roundStartTimes: Record<number, string>;
    roundEndTimes: Record<number, string>;
  } {
    // Convert Maps to plain objects for serialization
    const pointUsage: Record<string, Record<number, PointValue[]>> = {};
    for (const [participantId, roundMap] of this.pointUsageMap.entries()) {
      pointUsage[participantId] = {};
      for (const [roundNumber, points] of roundMap.entries()) {
        pointUsage[participantId][roundNumber] = [...points];
      }
    }

    const roundStartTimes: Record<number, string> = {};
    for (const [roundNumber, time] of this.roundStartTimes.entries()) {
      roundStartTimes[roundNumber] = time;
    }

    const roundEndTimes: Record<number, string> = {};
    for (const [roundNumber, time] of this.roundEndTimes.entries()) {
      roundEndTimes[roundNumber] = time;
    }

    return {
      rounds: [...this.rounds],
      currentRoundIndex: this.currentRoundIndex,
      pointUsage,
      roundStartTimes,
      roundEndTimes
    };
  }

  importState(state: {
    rounds: Round[];
    currentRoundIndex: number;
    pointUsage: Record<string, Record<number, PointValue[]>>;
    roundStartTimes: Record<number, string>;
    roundEndTimes: Record<number, string>;
  }): void {
    this.rounds = [...state.rounds];
    this.currentRoundIndex = state.currentRoundIndex;

    // Convert plain objects back to Maps
    this.pointUsageMap.clear();
    for (const [participantId, roundData] of Object.entries(state.pointUsage)) {
      const roundMap = new Map<number, PointValue[]>();
      for (const [roundNumber, points] of Object.entries(roundData)) {
        roundMap.set(parseInt(roundNumber), [...points]);
      }
      this.pointUsageMap.set(participantId, roundMap);
    }

    this.roundStartTimes.clear();
    for (const [roundNumber, time] of Object.entries(state.roundStartTimes)) {
      this.roundStartTimes.set(parseInt(roundNumber), time);
    }

    this.roundEndTimes.clear();
    for (const [roundNumber, time] of Object.entries(state.roundEndTimes)) {
      this.roundEndTimes.set(parseInt(roundNumber), time);
    }

    this.validateRounds();
  }

  // Private validation methods
  private validateRounds(): void {
    if (this.rounds.length === 0) {
      throw new Error('No rounds configured');
    }

    // Validate round numbers are sequential
    const sortedRounds = [...this.rounds].sort((a, b) => a.number - b.number);
    for (let i = 0; i < sortedRounds.length; i++) {
      if (sortedRounds[i].number !== i + 1) {
        throw new Error(`Round numbers must be sequential starting from 1. Found gap at round ${i + 1}`);
      }
    }

    // Validate point values
    this.rounds.forEach(round => {
      if (!round.availablePointValues || round.availablePointValues.length === 0) {
        throw new Error(`Round ${round.number} has no available point values`);
      }

      round.availablePointValues.forEach(point => {
        if (![1, 2, 3, 4, 5, 6].includes(point)) {
          throw new Error(`Invalid point value ${point} in round ${round.number}`);
        }
      });
    });

    // Validate Last Call Trivia format if using standard rounds
    const lastCallRounds = this.rounds.filter(round => round.type === 'standard');
    if (lastCallRounds.length >= 2) {
      const round1 = lastCallRounds.find(r => r.number === 1);
      const round2 = lastCallRounds.find(r => r.number === 2);

      if (round1 && !this.arraysEqual(round1.availablePointValues.sort(), [1, 3, 5])) {
        console.warn('Round 1 does not follow Last Call Trivia format (expected: 1, 3, 5)');
      }

      if (round2 && !this.arraysEqual(round2.availablePointValues.sort(), [2, 4, 6])) {
        console.warn('Round 2 does not follow Last Call Trivia format (expected: 2, 4, 6)');
      }
    }
  }

  private arraysEqual(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
} 