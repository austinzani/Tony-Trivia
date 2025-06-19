import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  edgeFunctionService, 
  GameStateRequest, 
  GameStateResponse,
  ValidateAnswerRequest,
  AnswerValidationResponse,
  CalculateScoresRequest,
  ScoreCalculationResponse,
  PointUsageRequest,
  PointUsageResponse,
  StartRoundRequest,
  StartRoundResponse
} from '../services/edgeFunctions';

// Query keys for React Query caching
export const edgeFunctionKeys = {
  scores: (gameId: string) => ['edge-functions', 'scores', gameId] as const,
  pointBalance: (teamId: string) => ['edge-functions', 'points', teamId] as const,
  gameState: (gameId: string) => ['edge-functions', 'game-state', gameId] as const,
  healthCheck: () => ['edge-functions', 'health'] as const,
};

// Game State Management Hooks
export function useGameStateManagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GameStateRequest) => edgeFunctionService.manageGameState(request),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.gameState(variables.gameId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.scores(variables.gameId) 
      });
    },
  });
}

export function useStartGame() {
  const gameStateMutation = useGameStateManagement();

  return useMutation({
    mutationFn: ({ gameId, hostId }: { gameId: string; hostId: string }) =>
      edgeFunctionService.startGame(gameId, hostId),
    onSuccess: gameStateMutation.onSuccess,
  });
}

export function usePauseGame() {
  const gameStateMutation = useGameStateManagement();

  return useMutation({
    mutationFn: ({ gameId, hostId }: { gameId: string; hostId: string }) =>
      edgeFunctionService.pauseGame(gameId, hostId),
    onSuccess: gameStateMutation.onSuccess,
  });
}

export function useResumeGame() {
  const gameStateMutation = useGameStateManagement();

  return useMutation({
    mutationFn: ({ gameId, hostId }: { gameId: string; hostId: string }) =>
      edgeFunctionService.resumeGame(gameId, hostId),
    onSuccess: gameStateMutation.onSuccess,
  });
}

export function useEndGame() {
  const gameStateMutation = useGameStateManagement();

  return useMutation({
    mutationFn: ({ gameId, hostId }: { gameId: string; hostId: string }) =>
      edgeFunctionService.endGame(gameId, hostId),
    onSuccess: gameStateMutation.onSuccess,
  });
}

// Answer Validation Hooks
export function useValidateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ValidateAnswerRequest) => 
      edgeFunctionService.validateAnswer(request),
    onSuccess: (data, variables) => {
      // Invalidate scores after answer validation
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.scores(variables.gameId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.pointBalance(variables.teamId) 
      });
    },
  });
}

export function useSubmitTeamAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      questionId,
      answer,
      pointsWagered,
      gameId,
    }: {
      teamId: string;
      questionId: string;
      answer: string;
      pointsWagered: number;
      gameId: string;
    }) => edgeFunctionService.submitTeamAnswer(teamId, questionId, answer, pointsWagered, gameId),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.scores(variables.gameId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.pointBalance(variables.teamId) 
      });
    },
  });
}

// Score Calculation Hooks
export function useCalculateScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CalculateScoresRequest) => 
      edgeFunctionService.calculateScores(request),
    onSuccess: (data, variables) => {
      // Update the scores cache
      queryClient.setQueryData(
        edgeFunctionKeys.scores(variables.gameId),
        data
      );
    },
  });
}

export function useLiveScores(gameId: string, enabled = true) {
  return useQuery({
    queryKey: edgeFunctionKeys.scores(gameId),
    queryFn: () => edgeFunctionService.calculateLiveScores(gameId),
    enabled: enabled && !!gameId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useCalculateRoundScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, roundId }: { gameId: string; roundId: string }) =>
      edgeFunctionService.calculateRoundScores(gameId, roundId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        edgeFunctionKeys.scores(variables.gameId),
        data
      );
    },
  });
}

export function useCalculateFinalScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId }: { gameId: string }) =>
      edgeFunctionService.calculateFinalScores(gameId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        edgeFunctionKeys.scores(variables.gameId),
        data
      );
    },
  });
}

// Point Usage Management Hooks
export function usePointUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PointUsageRequest) => 
      edgeFunctionService.handlePointUsage(request),
    onSuccess: (data, variables) => {
      // Update point balance cache
      queryClient.setQueryData(
        edgeFunctionKeys.pointBalance(variables.teamId),
        data
      );
    },
  });
}

export function useWagerPoints() {
  const pointUsageMutation = usePointUsage();

  return useMutation({
    mutationFn: ({
      teamId,
      gameId,
      pointValue,
      questionId,
    }: {
      teamId: string;
      gameId: string;
      pointValue: number;
      questionId?: string;
    }) => edgeFunctionService.wagerPoints(teamId, gameId, pointValue, questionId),
    onSuccess: pointUsageMutation.onSuccess,
  });
}

export function useRefundPoints() {
  const pointUsageMutation = usePointUsage();

  return useMutation({
    mutationFn: ({
      teamId,
      gameId,
      pointValue,
      questionId,
    }: {
      teamId: string;
      gameId: string;
      pointValue: number;
      questionId?: string;
    }) => edgeFunctionService.refundPoints(teamId, gameId, pointValue, questionId),
    onSuccess: pointUsageMutation.onSuccess,
  });
}

export function usePointBalance(teamId: string, enabled = true) {
  return useQuery({
    queryKey: edgeFunctionKeys.pointBalance(teamId),
    queryFn: () => edgeFunctionService.checkPointBalance(teamId, ''), // gameId not needed for balance check
    enabled: enabled && !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useResetTeamPoints() {
  const pointUsageMutation = usePointUsage();

  return useMutation({
    mutationFn: ({ teamId, gameId }: { teamId: string; gameId: string }) =>
      edgeFunctionService.resetTeamPoints(teamId, gameId),
    onSuccess: pointUsageMutation.onSuccess,
  });
}

// Round Management Hooks
export function useStartGameRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: StartRoundRequest) => 
      edgeFunctionService.startGameRound(request),
    onSuccess: (data, variables) => {
      // Invalidate game state and scores
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.gameState(variables.gameId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: edgeFunctionKeys.scores(variables.gameId) 
      });
    },
  });
}

// Health Check Hook
export function useEdgeFunctionHealth() {
  return useQuery({
    queryKey: edgeFunctionKeys.healthCheck(),
    queryFn: () => edgeFunctionService.healthCheck(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

// Composite hooks for common workflows
export function useGameManagement(gameId: string, hostId: string) {
  const startGame = useStartGame();
  const pauseGame = usePauseGame();
  const resumeGame = useResumeGame();
  const endGame = useEndGame();
  const startRound = useStartGameRound();
  const calculateFinalScores = useCalculateFinalScores();

  return {
    startGame: () => startGame.mutate({ gameId, hostId }),
    pauseGame: () => pauseGame.mutate({ gameId, hostId }),
    resumeGame: () => resumeGame.mutate({ gameId, hostId }),
    endGame: () => endGame.mutate({ gameId, hostId }),
    startRound: (request: Omit<StartRoundRequest, 'gameId' | 'hostId'>) =>
      startRound.mutate({ ...request, gameId, hostId }),
    calculateFinalScores: () => calculateFinalScores.mutate({ gameId }),
    
    // Loading states
    isStartingGame: startGame.isPending,
    isPausingGame: pauseGame.isPending,
    isResumingGame: resumeGame.isPending,
    isEndingGame: endGame.isPending,
    isStartingRound: startRound.isPending,
    isCalculatingScores: calculateFinalScores.isPending,
    
    // Error states
    startGameError: startGame.error,
    pauseGameError: pauseGame.error,
    resumeGameError: resumeGame.error,
    endGameError: endGame.error,
    startRoundError: startRound.error,
    calculateScoresError: calculateFinalScores.error,
  };
}

export function useTeamAnswering(teamId: string, gameId: string) {
  const submitAnswer = useSubmitTeamAnswer();
  const validateAnswer = useValidateAnswer();
  const wagerPoints = useWagerPoints();
  const pointBalance = usePointBalance(teamId);

  return {
    submitAnswer: (questionId: string, answer: string, pointsWagered: number) =>
      submitAnswer.mutate({ teamId, questionId, answer, pointsWagered, gameId }),
    validateAnswer: (request: Omit<ValidateAnswerRequest, 'teamId' | 'gameId'>) =>
      validateAnswer.mutate({ ...request, teamId, gameId }),
    wagerPoints: (pointValue: number, questionId?: string) =>
      wagerPoints.mutate({ teamId, gameId, pointValue, questionId }),
    
    // Data
    pointBalance: pointBalance.data,
    
    // Loading states
    isSubmittingAnswer: submitAnswer.isPending,
    isValidatingAnswer: validateAnswer.isPending,
    isWageringPoints: wagerPoints.isPending,
    isLoadingBalance: pointBalance.isLoading,
    
    // Error states
    submitAnswerError: submitAnswer.error,
    validateAnswerError: validateAnswer.error,
    wagerPointsError: wagerPoints.error,
    pointBalanceError: pointBalance.error,
  };
} 