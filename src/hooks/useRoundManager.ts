import { useState, useEffect, useCallback, useRef } from 'react';
import { RoundManager } from '../services/roundManager';
import type { RoundConfiguration, RoundValidationResult, RoundProgressInfo } from '../services/roundManager';
import type { Round, PointValue, Question } from '../types/game';

export interface UseRoundManagerOptions {
  initialRounds?: Round[];
  autoStart?: boolean;
  onRoundChange?: (round: Round | null) => void;
  onPointUsed?: (participantId: string, pointValue: PointValue, roundNumber: number) => void;
  onRoundComplete?: (roundNumber: number) => void;
  onAllRoundsComplete?: () => void;
}

export interface UseRoundManagerReturn {
  // State
  currentRound: Round | null;
  currentRoundNumber: number;
  totalRounds: number;
  isLastRound: boolean;
  allRounds: Round[];
  
  // Round management
  startRound: (roundNumber?: number) => Promise<boolean>;
  completeRound: (roundNumber?: number) => Promise<boolean>;
  advanceToNextRound: () => Promise<boolean>;
  goToPreviousRound: () => boolean;
  goToRound: (roundNumber: number) => boolean;
  resetRound: (roundNumber: number) => boolean;
  resetAllRounds: () => void;
  
  // Point value management
  getAvailablePointValues: (roundNumber?: number) => PointValue[];
  getUsedPointValues: (participantId: string, roundNumber?: number) => PointValue[];
  getRemainingPointValues: (participantId: string, roundNumber?: number) => PointValue[];
  canUsePointValue: (participantId: string, pointValue: PointValue, roundNumber?: number) => boolean;
  usePointValue: (participantId: string, pointValue: PointValue, roundNumber?: number) => Promise<boolean>;
  releasePointValue: (participantId: string, pointValue: PointValue, roundNumber?: number) => boolean;
  
  // Validation
  validatePointSelection: (participantId: string, pointValue: PointValue, roundNumber?: number) => RoundValidationResult;
  validateRoundCompletion: (roundNumber?: number) => RoundValidationResult;
  
  // Progress tracking
  getRoundProgress: (roundNumber?: number) => RoundProgressInfo;
  getAllRoundProgress: () => RoundProgressInfo[];
  getParticipantRoundStats: (participantId: string) => Record<number, {
    pointsUsed: PointValue[];
    pointsRemaining: PointValue[];
    totalPointsUsed: number;
    questionsAnswered: number;
  }>;
  
  // Utility
  clearParticipant: (participantId: string) => void;
  exportState: () => any;
  importState: (state: any) => void;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useRoundManager(options: UseRoundManagerOptions = {}): UseRoundManagerReturn {
  const {
    initialRounds = [],
    autoStart = false,
    onRoundChange,
    onPointUsed,
    onRoundComplete,
    onAllRoundsComplete
  } = options;

  // State
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [isLastRound, setIsLastRound] = useState(false);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const roundManagerRef = useRef<RoundManager | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize RoundManager
  useEffect(() => {
    try {
      setError(null);
      roundManagerRef.current = new RoundManager(initialRounds);
      updateState();
      
      if (autoStart && initialRounds.length > 0) {
        roundManagerRef.current.startRound(1);
        updateState();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize round manager');
    }
  }, [initialRounds, autoStart]);

  // Update component state from RoundManager
  const updateState = useCallback(() => {
    if (!roundManagerRef.current) return;

    const manager = roundManagerRef.current;
    const newCurrentRound = manager.getCurrentRound();
    const newCurrentRoundNumber = manager.getCurrentRoundNumber();
    const newTotalRounds = manager.getTotalRounds();
    const newIsLastRound = manager.isLastRound();
    const newAllRounds = manager.getAllRounds();

    setCurrentRound(newCurrentRound);
    setCurrentRoundNumber(newCurrentRoundNumber);
    setTotalRounds(newTotalRounds);
    setIsLastRound(newIsLastRound);
    setAllRounds(newAllRounds);

    // Trigger callback if round changed
    if (onRoundChange && newCurrentRound !== currentRound) {
      onRoundChange(newCurrentRound);
    }
  }, [currentRound, onRoundChange]);

  // Round management methods
  const startRound = useCallback(async (roundNumber?: number): Promise<boolean> => {
    if (!roundManagerRef.current) return false;

    setIsLoading(true);
    setError(null);

    try {
      const success = roundManagerRef.current.startRound(roundNumber);
      if (success) {
        updateState();
      } else {
        setError('Failed to start round');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start round';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  const completeRound = useCallback(async (roundNumber?: number): Promise<boolean> => {
    if (!roundManagerRef.current) return false;

    setIsLoading(true);
    setError(null);

    try {
      const targetRound = roundNumber || currentRoundNumber;
      const success = roundManagerRef.current.completeRound(roundNumber);
      
      if (success) {
        updateState();
        
        // Trigger completion callbacks
        if (onRoundComplete) {
          onRoundComplete(targetRound);
        }
        
        // Check if all rounds are complete
        const allRoundsProgress = roundManagerRef.current.getAllRoundProgress();
        const allComplete = allRoundsProgress.every(progress => progress.roundComplete);
        
        if (allComplete && onAllRoundsComplete) {
          onAllRoundsComplete();
        }
      } else {
        setError('Failed to complete round');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete round';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentRoundNumber, updateState, onRoundComplete, onAllRoundsComplete]);

  const advanceToNextRound = useCallback(async (): Promise<boolean> => {
    if (!roundManagerRef.current) return false;

    setIsLoading(true);
    setError(null);

    try {
      const success = roundManagerRef.current.advanceToNextRound();
      if (success) {
        updateState();
      } else {
        setError('Cannot advance to next round');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to advance to next round';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateState]);

  const goToPreviousRound = useCallback((): boolean => {
    if (!roundManagerRef.current) return false;

    const success = roundManagerRef.current.goToPreviousRound();
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  const goToRound = useCallback((roundNumber: number): boolean => {
    if (!roundManagerRef.current) return false;

    const success = roundManagerRef.current.goToRound(roundNumber);
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  const resetRound = useCallback((roundNumber: number): boolean => {
    if (!roundManagerRef.current) return false;

    const success = roundManagerRef.current.resetRound(roundNumber);
    if (success) {
      updateState();
    }
    return success;
  }, [updateState]);

  const resetAllRounds = useCallback((): void => {
    if (!roundManagerRef.current) return;

    roundManagerRef.current.resetAllRounds();
    updateState();
  }, [updateState]);

  // Point value management methods
  const getAvailablePointValues = useCallback((roundNumber?: number): PointValue[] => {
    if (!roundManagerRef.current) return [];
    return roundManagerRef.current.getAvailablePointValues(roundNumber);
  }, []);

  const getUsedPointValues = useCallback((participantId: string, roundNumber?: number): PointValue[] => {
    if (!roundManagerRef.current) return [];
    return roundManagerRef.current.getUsedPointValues(participantId, roundNumber);
  }, []);

  const getRemainingPointValues = useCallback((participantId: string, roundNumber?: number): PointValue[] => {
    if (!roundManagerRef.current) return [];
    return roundManagerRef.current.getRemainingPointValues(participantId, roundNumber);
  }, []);

  const canUsePointValue = useCallback((participantId: string, pointValue: PointValue, roundNumber?: number): boolean => {
    if (!roundManagerRef.current) return false;
    return roundManagerRef.current.canUsePointValue(participantId, pointValue, roundNumber);
  }, []);

  const usePointValue = useCallback(async (participantId: string, pointValue: PointValue, roundNumber?: number): Promise<boolean> => {
    if (!roundManagerRef.current) return false;

    setError(null);

    try {
      const success = roundManagerRef.current.usePointValue(participantId, pointValue, roundNumber);
      
      if (success && onPointUsed) {
        const targetRound = roundNumber || currentRoundNumber;
        onPointUsed(participantId, pointValue, targetRound);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to use point value';
      setError(errorMessage);
      return false;
    }
  }, [currentRoundNumber, onPointUsed]);

  const releasePointValue = useCallback((participantId: string, pointValue: PointValue, roundNumber?: number): boolean => {
    if (!roundManagerRef.current) return false;
    return roundManagerRef.current.releasePointValue(participantId, pointValue, roundNumber);
  }, []);

  // Validation methods
  const validatePointSelection = useCallback((participantId: string, pointValue: PointValue, roundNumber?: number): RoundValidationResult => {
    if (!roundManagerRef.current) {
      return { isValid: false, error: 'Round manager not initialized' };
    }
    return roundManagerRef.current.validatePointSelection(participantId, pointValue, roundNumber);
  }, []);

  const validateRoundCompletion = useCallback((roundNumber?: number): RoundValidationResult => {
    if (!roundManagerRef.current) {
      return { isValid: false, error: 'Round manager not initialized' };
    }
    return roundManagerRef.current.validateRoundCompletion(roundNumber);
  }, []);

  // Progress tracking methods
  const getRoundProgress = useCallback((roundNumber?: number): RoundProgressInfo => {
    if (!roundManagerRef.current) {
      return {
        currentRound: 0,
        totalRounds: 0,
        questionsAnswered: 0,
        questionsRemaining: 0,
        pointsUsed: {},
        roundComplete: false,
        canAdvance: false
      };
    }
    return roundManagerRef.current.getRoundProgress(roundNumber);
  }, []);

  const getAllRoundProgress = useCallback((): RoundProgressInfo[] => {
    if (!roundManagerRef.current) return [];
    return roundManagerRef.current.getAllRoundProgress();
  }, []);

  const getParticipantRoundStats = useCallback((participantId: string) => {
    if (!roundManagerRef.current) return {};
    return roundManagerRef.current.getParticipantRoundStats(participantId);
  }, []);

  // Utility methods
  const clearParticipant = useCallback((participantId: string): void => {
    if (!roundManagerRef.current) return;
    roundManagerRef.current.clearParticipant(participantId);
  }, []);

  const exportState = useCallback(() => {
    if (!roundManagerRef.current) return null;
    return roundManagerRef.current.exportState();
  }, []);

  const importState = useCallback((state: any): void => {
    if (!roundManagerRef.current) return;
    
    try {
      roundManagerRef.current.importState(state);
      updateState();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import state';
      setError(errorMessage);
    }
  }, [updateState]);

  return {
    // State
    currentRound,
    currentRoundNumber,
    totalRounds,
    isLastRound,
    allRounds,
    
    // Round management
    startRound,
    completeRound,
    advanceToNextRound,
    goToPreviousRound,
    goToRound,
    resetRound,
    resetAllRounds,
    
    // Point value management
    getAvailablePointValues,
    getUsedPointValues,
    getRemainingPointValues,
    canUsePointValue,
    usePointValue,
    releasePointValue,
    
    // Validation
    validatePointSelection,
    validateRoundCompletion,
    
    // Progress tracking
    getRoundProgress,
    getAllRoundProgress,
    getParticipantRoundStats,
    
    // Utility
    clearParticipant,
    exportState,
    importState,
    
    // Loading and error states
    isLoading,
    error
  };
}

// Helper hooks for specific use cases
export function useLastCallTriviaRounds(
  round1Questions: Question[],
  round2Questions: Question[],
  options: UseRoundManagerOptions = {}
): UseRoundManagerReturn {
  const rounds = RoundManager.createLastCallTriviaRounds(round1Questions, round2Questions);
  return useRoundManager({ ...options, initialRounds: rounds });
}

export function useCustomRounds(
  configurations: RoundConfiguration[],
  options: UseRoundManagerOptions = {}
): UseRoundManagerReturn {
  const rounds = RoundManager.createCustomRounds(configurations);
  return useRoundManager({ ...options, initialRounds: rounds });
} 