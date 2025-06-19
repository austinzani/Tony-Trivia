import { supabase } from './supabase';

// Type definitions for Edge Function requests and responses
export interface GameStateRequest {
  action: 'start' | 'pause' | 'resume' | 'end' | 'next_round';
  gameId: string;
  hostId: string;
  roundData?: {
    roundNumber: number;
    roundType: string;
    timeLimit: number;
  };
}

export interface GameStateResponse {
  success: boolean;
  gameState: {
    status: string;
    currentRound: number;
    roundStatus: string;
    timeRemaining: number;
  };
  message: string;
}

export interface ValidateAnswerRequest {
  teamId: string;
  questionId: string;
  submittedAnswer: string;
  pointsWagered: number;
  gameId: string;
}

export interface AnswerValidationResponse {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
  explanation?: string;
  similarity?: number;
}

export interface CalculateScoresRequest {
  gameId: string;
  roundId?: string;
  action: 'round_end' | 'game_end' | 'live_update';
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  totalScore: number;
  roundScore?: number;
  rank: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface ScoreCalculationResponse {
  teams: TeamScore[];
  gameStats: {
    totalQuestions: number;
    averageScore: number;
    highestScore: number;
    completedRounds: number;
  };
}

export interface PointUsageRequest {
  teamId: string;
  action: 'wager' | 'refund' | 'check_balance' | 'reset';
  pointValue: number;
  questionId?: string;
  gameId: string;
}

export interface PointUsageResponse {
  success: boolean;
  remainingPoints: number;
  usedPoints: number;
  availablePoints: { [key: number]: number };
  message?: string;
}

export interface StartRoundRequest {
  gameId: string;
  hostId: string;
  roundNumber: number;
  roundType: 'standard' | 'picture' | 'wager' | 'lightning';
  timeLimit: number;
  questions: {
    text: string;
    correctAnswer: string;
    questionType: 'multiple_choice' | 'short_answer' | 'true_false';
    acceptPartial?: boolean;
    explanation?: string;
    options?: string[];
  }[];
}

export interface StartRoundResponse {
  success: boolean;
  roundId: string;
  questionIds: string[];
  gameState: {
    currentRound: number;
    roundStatus: string;
    timeLimit: number;
    questionsCount: number;
  };
  message: string;
}

// Edge Function service class
export class EdgeFunctionService {
  private async callEdgeFunction<TRequest, TResponse>(
    functionName: string,
    payload: TRequest
  ): Promise<TResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) {
        throw new Error(`Edge Function ${functionName} error: ${error.message}`);
      }

      return data as TResponse;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // Game State Management
  async manageGameState(request: GameStateRequest): Promise<GameStateResponse> {
    return this.callEdgeFunction<GameStateRequest, GameStateResponse>(
      'manage-game-state',
      request
    );
  }

  async startGame(gameId: string, hostId: string): Promise<GameStateResponse> {
    return this.manageGameState({
      action: 'start',
      gameId,
      hostId,
    });
  }

  async pauseGame(gameId: string, hostId: string): Promise<GameStateResponse> {
    return this.manageGameState({
      action: 'pause',
      gameId,
      hostId,
    });
  }

  async resumeGame(gameId: string, hostId: string): Promise<GameStateResponse> {
    return this.manageGameState({
      action: 'resume',
      gameId,
      hostId,
    });
  }

  async endGame(gameId: string, hostId: string): Promise<GameStateResponse> {
    return this.manageGameState({
      action: 'end',
      gameId,
      hostId,
    });
  }

  // Answer Validation
  async validateAnswer(request: ValidateAnswerRequest): Promise<AnswerValidationResponse> {
    return this.callEdgeFunction<ValidateAnswerRequest, AnswerValidationResponse>(
      'validate-answers',
      request
    );
  }

  // Score Calculation
  async calculateScores(request: CalculateScoresRequest): Promise<ScoreCalculationResponse> {
    return this.callEdgeFunction<CalculateScoresRequest, ScoreCalculationResponse>(
      'calculate-scores',
      request
    );
  }

  async calculateLiveScores(gameId: string): Promise<ScoreCalculationResponse> {
    return this.calculateScores({
      gameId,
      action: 'live_update',
    });
  }

  async calculateRoundScores(gameId: string, roundId: string): Promise<ScoreCalculationResponse> {
    return this.calculateScores({
      gameId,
      roundId,
      action: 'round_end',
    });
  }

  async calculateFinalScores(gameId: string): Promise<ScoreCalculationResponse> {
    return this.calculateScores({
      gameId,
      action: 'game_end',
    });
  }

  // Point Usage Management
  async handlePointUsage(request: PointUsageRequest): Promise<PointUsageResponse> {
    return this.callEdgeFunction<PointUsageRequest, PointUsageResponse>(
      'handle-point-usage',
      request
    );
  }

  async wagerPoints(
    teamId: string,
    gameId: string,
    pointValue: number,
    questionId?: string
  ): Promise<PointUsageResponse> {
    return this.handlePointUsage({
      teamId,
      gameId,
      action: 'wager',
      pointValue,
      questionId,
    });
  }

  async refundPoints(
    teamId: string,
    gameId: string,
    pointValue: number,
    questionId?: string
  ): Promise<PointUsageResponse> {
    return this.handlePointUsage({
      teamId,
      gameId,
      action: 'refund',
      pointValue,
      questionId,
    });
  }

  async checkPointBalance(teamId: string, gameId: string): Promise<PointUsageResponse> {
    return this.handlePointUsage({
      teamId,
      gameId,
      action: 'check_balance',
      pointValue: 0, // Not used for balance check
    });
  }

  async resetTeamPoints(teamId: string, gameId: string): Promise<PointUsageResponse> {
    return this.handlePointUsage({
      teamId,
      gameId,
      action: 'reset',
      pointValue: 0, // Not used for reset
    });
  }

  // Round Management
  async startGameRound(request: StartRoundRequest): Promise<StartRoundResponse> {
    return this.callEdgeFunction<StartRoundRequest, StartRoundResponse>(
      'start-game-round',
      request
    );
  }

  // Convenience methods for common operations
  async submitTeamAnswer(
    teamId: string,
    questionId: string,
    answer: string,
    pointsWagered: number,
    gameId: string
  ): Promise<{
    validation: AnswerValidationResponse;
    pointsUsage: PointUsageResponse;
  }> {
    // First wager the points
    const pointsUsage = await this.wagerPoints(teamId, gameId, pointsWagered, questionId);

    try {
      // Then validate the answer
      const validation = await this.validateAnswer({
        teamId,
        questionId,
        submittedAnswer: answer,
        pointsWagered,
        gameId,
      });

      return { validation, pointsUsage };
    } catch (error) {
      // If validation fails, refund the points
      await this.refundPoints(teamId, gameId, pointsWagered, questionId);
      throw error;
    }
  }

  // Health check for Edge Functions
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const functions = [
      'manage-game-state',
      'validate-answers',
      'calculate-scores',
      'handle-point-usage',
      'start-game-round',
    ];

    const results: { [key: string]: boolean } = {};

    for (const func of functions) {
      try {
        // Try a minimal request to test if function is responsive
        await supabase.functions.invoke(func, {
          body: { action: 'health_check' },
        });
        results[func] = true;
      } catch (error) {
        console.warn(`Health check failed for ${func}:`, error);
        results[func] = false;
      }
    }

    return results;
  }
}

// Create and export a singleton instance
export const edgeFunctionService = new EdgeFunctionService();

// Export individual convenience functions
export const {
  manageGameState,
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  validateAnswer,
  calculateScores,
  calculateLiveScores,
  calculateRoundScores,
  calculateFinalScores,
  handlePointUsage,
  wagerPoints,
  refundPoints,
  checkPointBalance,
  resetTeamPoints,
  startGameRound,
  submitTeamAnswer,
  healthCheck,
} = edgeFunctionService; 