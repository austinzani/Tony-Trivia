import type { AnswerSubmission } from './answerSubmissionManager';
import { AnswerSubmissionManager } from './answerSubmissionManager';
import { RoundManager } from './roundManager';

export interface PlayerScore {
  playerId: string;
  playerName: string;
  totalScore: number;
  roundScores: Map<string, number>; // roundId -> score
  questionScores: Map<string, QuestionScore>; // questionId -> QuestionScore
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  accuracy: number; // percentage
  averagePointValue: number;
  rank: number;
  lastUpdated: Date;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  totalScore: number;
  roundScores: Map<string, number>; // roundId -> score
  playerScores: Map<string, PlayerScore>; // playerId -> PlayerScore
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  accuracy: number;
  averagePointValue: number;
  rank: number;
  lastUpdated: Date;
}

export interface QuestionScore {
  questionId: string;
  submissionId: string;
  answer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  pointsAttempted: number;
  timeTaken?: number; // seconds
  bonusPoints?: number;
  penaltyPoints?: number;
  scoredAt: Date;
}

export interface ScoreUpdate {
  playerId?: string;
  teamId?: string;
  questionId: string;
  submissionId: string;
  previousScore: number;
  newScore: number;
  pointsAwarded: number;
  isCorrect: boolean;
  timestamp: Date;
}

export interface LeaderboardEntry {
  id: string; // playerId or teamId
  name: string;
  score: number;
  rank: number;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  type: 'player' | 'team';
}

export interface ScoringRules {
  correctAnswerMultiplier: number;
  incorrectAnswerPenalty: number; // percentage of points lost
  timeBonus: boolean;
  timeBonusThreshold: number; // seconds
  timeBonusMultiplier: number;
  streakBonus: boolean;
  streakBonusThreshold: number; // consecutive correct answers
  streakBonusPoints: number;
  roundMultiplier: Map<string, number>; // roundId -> multiplier
  questionTypeMultiplier: Map<string, number>; // questionType -> multiplier
}

export interface ScoreEvent {
  type: ScoreEventType;
  timestamp: Date;
  playerId?: string;
  teamId?: string;
  questionId?: string;
  submissionId?: string;
  data?: any;
}

export const ScoreEventType = {
  SCORE_UPDATED: 'score_updated',
  PLAYER_SCORED: 'player_scored',
  TEAM_SCORED: 'team_scored',
  LEADERBOARD_UPDATED: 'leaderboard_updated',
  STREAK_ACHIEVED: 'streak_achieved',
  BONUS_AWARDED: 'bonus_awarded',
  PENALTY_APPLIED: 'penalty_applied',
  ROUND_COMPLETED: 'round_completed'
} as const;

export type ScoreEventType = typeof ScoreEventType[keyof typeof ScoreEventType];

export type ScoreEventListener = (event: ScoreEvent) => void;

export interface ScoreManagerOptions {
  enableTimeBonus?: boolean;
  enableStreakBonus?: boolean;
  enableTeamScoring?: boolean;
  autoUpdateLeaderboard?: boolean;
  persistScores?: boolean;
  scoringRules?: Partial<ScoringRules>;
}

export class ScoreManager {
  private playerScores: Map<string, PlayerScore> = new Map();
  private teamScores: Map<string, TeamScore> = new Map();
  private questionScores: Map<string, QuestionScore> = new Map();
  private scoreUpdates: ScoreUpdate[] = [];
  private listeners: Map<ScoreEventType, Set<ScoreEventListener>> = new Map();
  private scoringRules: ScoringRules;
  private options: Required<ScoreManagerOptions>;
  
  private submissionManager: AnswerSubmissionManager;
  private roundManager: RoundManager;

  constructor(
    submissionManager: AnswerSubmissionManager,
    roundManager: RoundManager,
    options: ScoreManagerOptions = {}
  ) {
    this.submissionManager = submissionManager;
    this.roundManager = roundManager;
    
    this.options = {
      enableTimeBonus: true,
      enableStreakBonus: true,
      enableTeamScoring: false,
      autoUpdateLeaderboard: true,
      persistScores: true,
      ...options
    };

    this.scoringRules = this.createDefaultScoringRules(options.scoringRules);
    this.setupEventListeners();
  }

  private createDefaultScoringRules(customRules?: Partial<ScoringRules>): ScoringRules {
    return {
      correctAnswerMultiplier: 1.0,
      incorrectAnswerPenalty: 0.0, // No penalty by default
      timeBonus: this.options.enableTimeBonus,
      timeBonusThreshold: 10, // 10 seconds
      timeBonusMultiplier: 1.2,
      streakBonus: this.options.enableStreakBonus,
      streakBonusThreshold: 3, // 3 consecutive correct answers
      streakBonusPoints: 5,
      roundMultiplier: new Map(),
      questionTypeMultiplier: new Map([
        ['multiple-choice', 1.0],
        ['open-ended', 1.5],
        ['true-false', 0.8]
      ]),
      ...customRules
    };
  }

  private setupEventListeners(): void {
    // Listen to submission events to automatically calculate scores
    this.submissionManager.addEventListener('submission_created', (event) => {
      if (event.data?.submission) {
        this.processSubmissionScore(event.data.submission);
      }
    });

    this.submissionManager.addEventListener('submission_updated', (event) => {
      if (event.data?.newSubmission) {
        this.processSubmissionScore(event.data.newSubmission);
      }
    });
  }

  // Score Calculation
  public processSubmissionScore(submission: AnswerSubmission): QuestionScore {
    const currentRound = this.roundManager.getCurrentRound();
    if (!currentRound) {
      throw new Error('No active round found');
    }

    const question = currentRound.questions.find(q => q.id === submission.questionId);
    if (!question) {
      throw new Error(`Question ${submission.questionId} not found in current round`);
    }

    const isCorrect = this.isAnswerCorrect(submission.answer, question.correctAnswer);
    const basePoints = submission.pointValue;
    let pointsAwarded = 0;
    let bonusPoints = 0;
    let penaltyPoints = 0;

    if (isCorrect) {
      // Calculate base points with multipliers
      pointsAwarded = basePoints * this.scoringRules.correctAnswerMultiplier;
      
      // Apply question type multiplier
      const questionTypeMultiplier = this.scoringRules.questionTypeMultiplier.get(question.type) || 1.0;
      pointsAwarded *= questionTypeMultiplier;

      // Apply round multiplier
      const roundMultiplier = this.scoringRules.roundMultiplier.get(currentRound.id) || 1.0;
      pointsAwarded *= roundMultiplier;

      // Calculate bonuses
      bonusPoints = this.calculateBonusPoints(submission.participantId, question.id);
      pointsAwarded += bonusPoints;
    } else {
      // Apply penalty for incorrect answers
      penaltyPoints = basePoints * this.scoringRules.incorrectAnswerPenalty;
      pointsAwarded = -penaltyPoints;
    }

    // Round to nearest integer
    pointsAwarded = Math.round(pointsAwarded);

    const questionScore: QuestionScore = {
      questionId: submission.questionId,
      submissionId: submission.submissionId,
      answer: submission.answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsAwarded,
      pointsAttempted: basePoints,
      bonusPoints,
      penaltyPoints,
      scoredAt: new Date()
    };

    // Store question score
    this.questionScores.set(submission.questionId, questionScore);

    // Update player score
    this.updatePlayerScore(submission.participantId, questionScore);

    // Update team score if team scoring is enabled
    if (this.options.enableTeamScoring) {
      this.updateTeamScore(submission.participantId, questionScore);
    }

    // Emit events
    this.emitEvent(ScoreEventType.SCORE_UPDATED, {
      playerId: submission.participantId,
      questionId: submission.questionId,
      submissionId: submission.submissionId,
      data: { questionScore, pointsAwarded }
    });

    if (isCorrect) {
      this.emitEvent(ScoreEventType.PLAYER_SCORED, {
        playerId: submission.participantId,
        questionId: submission.questionId,
        data: { questionScore }
      });
    }

    if (bonusPoints > 0) {
      this.emitEvent(ScoreEventType.BONUS_AWARDED, {
        playerId: submission.participantId,
        questionId: submission.questionId,
        data: { bonusPoints, type: 'streak_bonus' }
      });
    }

    if (this.options.autoUpdateLeaderboard) {
      this.updateLeaderboards();
    }

    return questionScore;
  }

  private isAnswerCorrect(submittedAnswer: string, correctAnswer: string): boolean {
    // Normalize answers for comparison
    const normalize = (answer: string) => answer.trim().toLowerCase();
    return normalize(submittedAnswer) === normalize(correctAnswer);
  }

  private calculateBonusPoints(playerId: string, questionId: string): number {
    let bonusPoints = 0;

    if (this.scoringRules.streakBonus) {
      const streak = this.getCurrentStreak(playerId);
      if (streak >= this.scoringRules.streakBonusThreshold) {
        bonusPoints += this.scoringRules.streakBonusPoints;
        
        this.emitEvent(ScoreEventType.STREAK_ACHIEVED, {
          playerId,
          questionId,
          data: { streak, bonusPoints }
        });
      }
    }

    // Time bonus would be calculated here if we had timing data
    // This would require integration with a timer system

    return bonusPoints;
  }

  private getCurrentStreak(playerId: string): number {
    const playerScore = this.playerScores.get(playerId);
    if (!playerScore) return 0;

    let streak = 0;
    const sortedScores = Array.from(playerScore.questionScores.values())
      .sort((a, b) => b.scoredAt.getTime() - a.scoredAt.getTime());

    for (const score of sortedScores) {
      if (score.isCorrect) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Player Score Management
  private updatePlayerScore(playerId: string, questionScore: QuestionScore): void {
    let playerScore = this.playerScores.get(playerId);
    
    if (!playerScore) {
      playerScore = this.createPlayerScore(playerId);
      this.playerScores.set(playerId, playerScore);
    }

    const previousScore = playerScore.totalScore;

    // Update question scores
    playerScore.questionScores.set(questionScore.questionId, questionScore);

    // Update round score
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      const currentRoundScore = playerScore.roundScores.get(currentRound.id) || 0;
      playerScore.roundScores.set(currentRound.id, currentRoundScore + questionScore.pointsAwarded);
    }

    // Recalculate total score
    playerScore.totalScore = Array.from(playerScore.questionScores.values())
      .reduce((total, score) => total + score.pointsAwarded, 0);

    // Update statistics
    this.updatePlayerStatistics(playerScore);

    // Create score update record
    const scoreUpdate: ScoreUpdate = {
      playerId,
      questionId: questionScore.questionId,
      submissionId: questionScore.submissionId,
      previousScore,
      newScore: playerScore.totalScore,
      pointsAwarded: questionScore.pointsAwarded,
      isCorrect: questionScore.isCorrect,
      timestamp: new Date()
    };

    this.scoreUpdates.push(scoreUpdate);
  }

  private createPlayerScore(playerId: string): PlayerScore {
    return {
      playerId,
      playerName: playerId, // This would be fetched from a player service
      totalScore: 0,
      roundScores: new Map(),
      questionScores: new Map(),
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalQuestions: 0,
      accuracy: 0,
      averagePointValue: 0,
      rank: 0,
      lastUpdated: new Date()
    };
  }

  private updatePlayerStatistics(playerScore: PlayerScore): void {
    const questionScores = Array.from(playerScore.questionScores.values());
    
    playerScore.correctAnswers = questionScores.filter(score => score.isCorrect).length;
    playerScore.incorrectAnswers = questionScores.filter(score => !score.isCorrect).length;
    playerScore.totalQuestions = questionScores.length;
    
    playerScore.accuracy = playerScore.totalQuestions > 0 
      ? (playerScore.correctAnswers / playerScore.totalQuestions) * 100 
      : 0;
    
    playerScore.averagePointValue = questionScores.length > 0
      ? questionScores.reduce((sum, score) => sum + score.pointsAttempted, 0) / questionScores.length
      : 0;
    
    playerScore.lastUpdated = new Date();
  }

  // Team Score Management
  private updateTeamScore(playerId: string, questionScore: QuestionScore): void {
    // This would require team information from a team service
    // For now, we'll skip team scoring implementation
    // but the structure is here for future implementation
  }

  // Leaderboard Management
  public getPlayerLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = Array.from(this.playerScores.values())
      .map(playerScore => ({
        id: playerScore.playerId,
        name: playerScore.playerName,
        score: playerScore.totalScore,
        rank: 0, // Will be set below
        accuracy: playerScore.accuracy,
        correctAnswers: playerScore.correctAnswers,
        totalQuestions: playerScore.totalQuestions,
        type: 'player' as const
      }))
      .sort((a, b) => {
        // Sort by score descending, then by accuracy descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.accuracy - a.accuracy;
      });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  public getTeamLeaderboard(): LeaderboardEntry[] {
    // Similar implementation for teams
    return Array.from(this.teamScores.values())
      .map(teamScore => ({
        id: teamScore.teamId,
        name: teamScore.teamName,
        score: teamScore.totalScore,
        rank: 0,
        accuracy: teamScore.accuracy,
        correctAnswers: teamScore.correctAnswers,
        totalQuestions: teamScore.totalQuestions,
        type: 'team' as const
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  private updateLeaderboards(): void {
    // Update player ranks
    const playerLeaderboard = this.getPlayerLeaderboard();
    playerLeaderboard.forEach(entry => {
      const playerScore = this.playerScores.get(entry.id);
      if (playerScore) {
        playerScore.rank = entry.rank;
      }
    });

    // Update team ranks
    const teamLeaderboard = this.getTeamLeaderboard();
    teamLeaderboard.forEach(entry => {
      const teamScore = this.teamScores.get(entry.id);
      if (teamScore) {
        teamScore.rank = entry.rank;
      }
    });

    this.emitEvent(ScoreEventType.LEADERBOARD_UPDATED, {
      data: { playerLeaderboard, teamLeaderboard }
    });
  }

  // Getters
  public getPlayerScore(playerId: string): PlayerScore | undefined {
    return this.playerScores.get(playerId);
  }

  public getTeamScore(teamId: string): TeamScore | undefined {
    return this.teamScores.get(teamId);
  }

  public getQuestionScore(questionId: string): QuestionScore | undefined {
    return this.questionScores.get(questionId);
  }

  public getAllPlayerScores(): PlayerScore[] {
    return Array.from(this.playerScores.values());
  }

  public getAllTeamScores(): TeamScore[] {
    return Array.from(this.teamScores.values());
  }

  public getScoreUpdates(): ScoreUpdate[] {
    return [...this.scoreUpdates];
  }

  public getPlayerRoundScore(playerId: string, roundId: string): number {
    const playerScore = this.playerScores.get(playerId);
    return playerScore?.roundScores.get(roundId) || 0;
  }

  public getTopPlayers(limit: number = 10): LeaderboardEntry[] {
    return this.getPlayerLeaderboard().slice(0, limit);
  }

  public getTopTeams(limit: number = 10): LeaderboardEntry[] {
    return this.getTeamLeaderboard().slice(0, limit);
  }

  // Utility Methods
  public calculateTotalPossibleScore(): number {
    const currentRound = this.roundManager.getCurrentRound();
    if (!currentRound) return 0;

    return currentRound.questions.reduce((total, question) => {
      return total + Math.max(...currentRound.pointValues);
    }, 0);
  }

  public getAverageScore(): number {
    const scores = Array.from(this.playerScores.values()).map(p => p.totalScore);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  public getScoreDistribution(): { min: number; max: number; average: number; median: number } {
    const scores = Array.from(this.playerScores.values()).map(p => p.totalScore).sort((a, b) => a - b);
    
    if (scores.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const min = scores[0];
    const max = scores[scores.length - 1];
    const average = this.getAverageScore();
    const median = scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];

    return { min, max, average, median };
  }

  // Event System
  public addEventListener(type: ScoreEventType, listener: ScoreEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: ScoreEventType, listener: ScoreEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public removeAllEventListeners(type?: ScoreEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  private emitEvent(type: ScoreEventType, data: Partial<ScoreEvent>): void {
    const event: ScoreEvent = {
      type,
      timestamp: new Date(),
      playerId: data.playerId,
      teamId: data.teamId,
      questionId: data.questionId,
      submissionId: data.submissionId,
      data: data.data
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in score event listener for ${type}:`, error);
        }
      });
    }
  }

  // State Management
  public reset(): void {
    this.playerScores.clear();
    this.teamScores.clear();
    this.questionScores.clear();
    this.scoreUpdates.length = 0;
  }

  public exportState(): {
    playerScores: PlayerScore[];
    teamScores: TeamScore[];
    questionScores: QuestionScore[];
    scoreUpdates: ScoreUpdate[];
  } {
    return {
      playerScores: Array.from(this.playerScores.values()),
      teamScores: Array.from(this.teamScores.values()),
      questionScores: Array.from(this.questionScores.values()),
      scoreUpdates: [...this.scoreUpdates]
    };
  }

  public importState(state: {
    playerScores: PlayerScore[];
    teamScores: TeamScore[];
    questionScores: QuestionScore[];
    scoreUpdates: ScoreUpdate[];
  }): void {
    this.reset();
    
    state.playerScores.forEach(score => {
      this.playerScores.set(score.playerId, score);
    });
    
    state.teamScores.forEach(score => {
      this.teamScores.set(score.teamId, score);
    });
    
    state.questionScores.forEach(score => {
      this.questionScores.set(score.questionId, score);
    });
    
    this.scoreUpdates.push(...state.scoreUpdates);
  }
} 