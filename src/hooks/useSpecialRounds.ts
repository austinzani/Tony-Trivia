import { useState, useEffect, useCallback, useRef } from 'react';
import { SpecialRoundManager } from '../services/specialRoundManager';
import {
  SpecialRound,
  SpecialRoundType,
  SpecialRoundEvent,
  SpecialRoundEventType,
  WagerRound,
  WagerPhase,
  PictureRound,
  BonusRound,
  LightningRound,
  AudioRound,
  VideoRound,
  TeamChallengeRound,
  SpecialRoundConfig,
  SpecialRoundMetrics
} from '../types/specialRounds';

// Main Special Rounds Hook
export interface UseSpecialRoundsOptions {
  autoStartRounds?: boolean;
  enableEventLogging?: boolean;
  persistState?: boolean;
}

export interface UseSpecialRoundsReturn {
  // State
  currentSpecialRound: SpecialRound | null;
  isSpecialRoundActive: boolean;
  specialRoundType: SpecialRoundType | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startSpecialRound: (specialRound: SpecialRound) => Promise<void>;
  endSpecialRound: () => Promise<void>;
  
  // Configuration
  getSpecialRoundConfig: (type: SpecialRoundType) => SpecialRoundConfig | undefined;
  updateSpecialRoundConfig: (type: SpecialRoundType, config: Partial<SpecialRoundConfig>) => void;
  
  // Metrics
  getSpecialRoundMetrics: (roundId: string) => SpecialRoundMetrics | null;
  
  // Event Management
  addEventListener: (type: SpecialRoundEventType, listener: (event: SpecialRoundEvent) => void) => void;
  removeEventListener: (type: SpecialRoundEventType, listener: (event: SpecialRoundEvent) => void) => void;
}

export const useSpecialRounds = (
  specialRoundManager: SpecialRoundManager,
  options: UseSpecialRoundsOptions = {}
): UseSpecialRoundsReturn => {
  const [currentSpecialRound, setCurrentSpecialRound] = useState<SpecialRound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventListenersRef = useRef<Map<SpecialRoundEventType, Set<(event: SpecialRoundEvent) => void>>>(new Map());

  useEffect(() => {
    // Set initial state
    setCurrentSpecialRound(specialRoundManager.getCurrentSpecialRound());

    // Set up event listeners for state updates
    const handleRoundStarted = (event: SpecialRoundEvent) => {
      setCurrentSpecialRound(event.data?.round || null);
      setError(null);
    };

    const handleRoundEnded = (event: SpecialRoundEvent) => {
      setCurrentSpecialRound(null);
      setError(null);
    };

    specialRoundManager.addEventListener(SpecialRoundEventType.ROUND_STARTED, handleRoundStarted);
    specialRoundManager.addEventListener(SpecialRoundEventType.ROUND_ENDED, handleRoundEnded);

    return () => {
      specialRoundManager.removeEventListener(SpecialRoundEventType.ROUND_STARTED, handleRoundStarted);
      specialRoundManager.removeEventListener(SpecialRoundEventType.ROUND_ENDED, handleRoundEnded);
    };
  }, [specialRoundManager]);

  const startSpecialRound = useCallback(async (specialRound: SpecialRound) => {
    try {
      setIsLoading(true);
      setError(null);
      await specialRoundManager.startSpecialRound(specialRound);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start special round';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [specialRoundManager]);

  const endSpecialRound = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await specialRoundManager.endSpecialRound();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end special round';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [specialRoundManager]);

  const getSpecialRoundConfig = useCallback((type: SpecialRoundType) => {
    return specialRoundManager.getSpecialRoundConfig(type);
  }, [specialRoundManager]);

  const updateSpecialRoundConfig = useCallback((type: SpecialRoundType, config: Partial<SpecialRoundConfig>) => {
    specialRoundManager.updateSpecialRoundConfig(type, config);
  }, [specialRoundManager]);

  const getSpecialRoundMetrics = useCallback((roundId: string) => {
    return specialRoundManager.getSpecialRoundMetrics(roundId);
  }, [specialRoundManager]);

  const addEventListener = useCallback((type: SpecialRoundEventType, listener: (event: SpecialRoundEvent) => void) => {
    if (!eventListenersRef.current.has(type)) {
      eventListenersRef.current.set(type, new Set());
    }
    eventListenersRef.current.get(type)!.add(listener);
    specialRoundManager.addEventListener(type, listener);
  }, [specialRoundManager]);

  const removeEventListener = useCallback((type: SpecialRoundEventType, listener: (event: SpecialRoundEvent) => void) => {
    const listeners = eventListenersRef.current.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
    specialRoundManager.removeEventListener(type, listener);
  }, [specialRoundManager]);

  return {
    currentSpecialRound,
    isSpecialRoundActive: currentSpecialRound !== null,
    specialRoundType: currentSpecialRound?.specialType || null,
    isLoading,
    error,
    startSpecialRound,
    endSpecialRound,
    getSpecialRoundConfig,
    updateSpecialRoundConfig,
    getSpecialRoundMetrics,
    addEventListener,
    removeEventListener
  };
};

// Wager Round Hook
export interface UseWagerRoundReturn {
  wagerRound: WagerRound | null;
  currentPhase: WagerPhase | null;
  timeRemaining: number;
  canSubmitWager: boolean;
  hasSubmittedWager: boolean;
  isWagerLocked: boolean;
  
  submitWager: (participantId: string, amount: number) => Promise<void>;
  lockWager: (participantId: string) => Promise<void>;
  advancePhase: () => Promise<void>;
}

export const useWagerRound = (
  specialRoundManager: SpecialRoundManager,
  participantId: string
): UseWagerRoundReturn => {
  const [wagerRound, setWagerRound] = useState<WagerRound | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.WAGER) {
      setWagerRound(currentRound as WagerRound);
    } else {
      setWagerRound(null);
    }
  }, [specialRoundManager]);

  useEffect(() => {
    if (!wagerRound?.currentWagerDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, wagerRound.currentWagerDeadline!.getTime() - Date.now());
      setTimeRemaining(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [wagerRound?.currentWagerDeadline]);

  const submitWager = useCallback(async (participantId: string, amount: number) => {
    await specialRoundManager.submitWager(participantId, amount);
  }, [specialRoundManager]);

  const lockWager = useCallback(async (participantId: string) => {
    await specialRoundManager.lockWager(participantId);
  }, [specialRoundManager]);

  const advancePhase = useCallback(async () => {
    await specialRoundManager.advanceWagerPhase();
  }, [specialRoundManager]);

  const currentSubmission = wagerRound?.wagerSubmissions.get(participantId);

  return {
    wagerRound,
    currentPhase: wagerRound?.wagerPhase || null,
    timeRemaining,
    canSubmitWager: wagerRound?.wagerPhase === WagerPhase.WAGER_SUBMISSION && !currentSubmission?.isLocked,
    hasSubmittedWager: !!currentSubmission,
    isWagerLocked: currentSubmission?.isLocked || false,
    submitWager,
    lockWager,
    advancePhase
  };
};

// Picture Round Hook
export interface UsePictureRoundReturn {
  pictureRound: PictureRound | null;
  currentQuestion: any; // Would be from question manager
  imageLoadingStatus: Map<string, any>;
  
  preloadImages: () => Promise<void>;
  onImageLoad: (questionId: string) => void;
  onImageError: (questionId: string, error: string) => void;
}

export const usePictureRound = (
  specialRoundManager: SpecialRoundManager
): UsePictureRoundReturn => {
  const [pictureRound, setPictureRound] = useState<PictureRound | null>(null);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.PICTURE) {
      setPictureRound(currentRound as PictureRound);
    } else {
      setPictureRound(null);
    }
  }, [specialRoundManager]);

  const preloadImages = useCallback(async () => {
    if (pictureRound) {
      await specialRoundManager.preloadImages(pictureRound);
    }
  }, [specialRoundManager, pictureRound]);

  const onImageLoad = useCallback((questionId: string) => {
    // This would typically update the loading status
    console.log(`Image loaded for question ${questionId}`);
  }, []);

  const onImageError = useCallback((questionId: string, error: string) => {
    console.error(`Image error for question ${questionId}:`, error);
  }, []);

  return {
    pictureRound,
    currentQuestion: null, // Would come from question manager
    imageLoadingStatus: pictureRound?.imageLoadingStatus || new Map(),
    preloadImages,
    onImageLoad,
    onImageError
  };
};

// Bonus Round Hook
export interface UseBonusRoundReturn {
  bonusRound: BonusRound | null;
  participantStatus: any | null;
  bonusScore: any | null;
  isEliminated: boolean;
  currentStreak: number;
  
  updateProgress: (participantId: string, isCorrect: boolean, timeTaken?: number) => Promise<void>;
}

export const useBonusRound = (
  specialRoundManager: SpecialRoundManager,
  participantId: string
): UseBonusRoundReturn => {
  const [bonusRound, setBonusRound] = useState<BonusRound | null>(null);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.BONUS) {
      setBonusRound(currentRound as BonusRound);
    } else {
      setBonusRound(null);
    }
  }, [specialRoundManager]);

  const updateProgress = useCallback(async (participantId: string, isCorrect: boolean, timeTaken?: number) => {
    await specialRoundManager.updateBonusProgress(participantId, isCorrect, timeTaken);
  }, [specialRoundManager]);

  const participantStatus = bonusRound?.participantStatus.get(participantId);
  const bonusScore = bonusRound?.bonusScores.get(participantId);

  return {
    bonusRound,
    participantStatus,
    bonusScore,
    isEliminated: participantStatus?.isEliminated || false,
    currentStreak: participantStatus?.consecutiveCorrect || 0,
    updateProgress
  };
};

// Lightning Round Hook
export interface UseLightningRoundReturn {
  lightningRound: LightningRound | null;
  participantProgress: any | null;
  timeRemaining: number;
  isComplete: boolean;
  currentScore: number;
  
  submitAnswer: (participantId: string, answer: string, isCorrect: boolean) => void;
}

export const useLightningRound = (
  specialRoundManager: SpecialRoundManager,
  participantId: string
): UseLightningRoundReturn => {
  const [lightningRound, setLightningRound] = useState<LightningRound | null>(null);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.LIGHTNING) {
      setLightningRound(currentRound as LightningRound);
    } else {
      setLightningRound(null);
    }
  }, [specialRoundManager]);

  const submitAnswer = useCallback((participantId: string, answer: string, isCorrect: boolean) => {
    if (!lightningRound) return;

    const progress = lightningRound.participantProgress.get(participantId);
    if (!progress || progress.isComplete) return;

    progress.questionsAnswered++;
    if (isCorrect) {
      progress.correctAnswers++;
      progress.currentScore += lightningRound.settings.pointsPerCorrect;
    } else {
      progress.incorrectAnswers++;
      progress.currentScore -= lightningRound.settings.penaltyPerIncorrect;
    }

    // Check if participant has completed all questions
    if (progress.questionsAnswered >= lightningRound.settings.questionCount) {
      progress.isComplete = true;
      progress.completedAt = new Date();
    }
  }, [lightningRound]);

  const participantProgress = lightningRound?.participantProgress.get(participantId);

  return {
    lightningRound,
    participantProgress,
    timeRemaining: participantProgress?.timeRemaining || 0,
    isComplete: participantProgress?.isComplete || false,
    currentScore: participantProgress?.currentScore || 0,
    submitAnswer
  };
};

// Audio Round Hook
export interface UseAudioRoundReturn {
  audioRound: AudioRound | null;
  currentQuestion: any; // Would be from question manager
  audioLoadingStatus: Map<string, any>;
  playbackStatus: Map<string, any>;
  
  playAudio: (questionId: string, participantId: string) => void;
  pauseAudio: (questionId: string, participantId: string) => void;
}

export const useAudioRound = (
  specialRoundManager: SpecialRoundManager,
  participantId: string
): UseAudioRoundReturn => {
  const [audioRound, setAudioRound] = useState<AudioRound | null>(null);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.AUDIO) {
      setAudioRound(currentRound as AudioRound);
    } else {
      setAudioRound(null);
    }
  }, [specialRoundManager]);

  const playAudio = useCallback((questionId: string, participantId: string) => {
    // Implementation would handle audio playback
    console.log(`Playing audio for question ${questionId}, participant ${participantId}`);
  }, []);

  const pauseAudio = useCallback((questionId: string, participantId: string) => {
    // Implementation would handle audio pause
    console.log(`Pausing audio for question ${questionId}, participant ${participantId}`);
  }, []);

  return {
    audioRound,
    currentQuestion: null, // Would come from question manager
    audioLoadingStatus: audioRound?.audioLoadingStatus || new Map(),
    playbackStatus: audioRound?.playbackStatus || new Map(),
    playAudio,
    pauseAudio
  };
};

// Team Challenge Round Hook
export interface UseTeamChallengeRoundReturn {
  teamChallengeRound: TeamChallengeRound | null;
  teamSubmission: any | null;
  isDiscussionPhase: boolean;
  timeRemaining: number;
  canSubmitAnswer: boolean;
  
  sendDiscussionMessage: (participantId: string, message: string) => void;
  submitTeamAnswer: (teamId: string, captainId: string, answer: string) => void;
}

export const useTeamChallengeRound = (
  specialRoundManager: SpecialRoundManager,
  participantId: string,
  teamId: string,
  isCaptain: boolean
): UseTeamChallengeRoundReturn => {
  const [teamChallengeRound, setTeamChallengeRound] = useState<TeamChallengeRound | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const currentRound = specialRoundManager.getCurrentSpecialRound();
    if (currentRound?.specialType === SpecialRoundType.TEAM_CHALLENGE) {
      setTeamChallengeRound(currentRound as TeamChallengeRound);
    } else {
      setTeamChallengeRound(null);
    }
  }, [specialRoundManager]);

  useEffect(() => {
    if (!teamChallengeRound?.discussionDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, teamChallengeRound.discussionDeadline!.getTime() - Date.now());
      setTimeRemaining(Math.ceil(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [teamChallengeRound?.discussionDeadline]);

  const sendDiscussionMessage = useCallback((participantId: string, message: string) => {
    if (!teamChallengeRound) return;

    const teamSubmission = teamChallengeRound.teamSubmissions.get(teamId);
    if (!teamSubmission) return;

    const discussionEntry = {
      participantId,
      message,
      timestamp: new Date(),
      type: 'message' as const
    };

    if (!teamSubmission.discussionLog) {
      teamSubmission.discussionLog = [];
    }
    teamSubmission.discussionLog.push(discussionEntry);
  }, [teamChallengeRound, teamId]);

  const submitTeamAnswer = useCallback((teamId: string, captainId: string, answer: string) => {
    if (!teamChallengeRound) return;

    const teamSubmission = {
      teamId,
      captainId,
      answer,
      submittedAt: new Date(),
      discussionLog: teamChallengeRound.teamSubmissions.get(teamId)?.discussionLog || []
    };

    teamChallengeRound.teamSubmissions.set(teamId, teamSubmission);
  }, [teamChallengeRound]);

  const teamSubmission = teamChallengeRound?.teamSubmissions.get(teamId);
  const settings = teamChallengeRound?.settings;

  return {
    teamChallengeRound,
    teamSubmission,
    isDiscussionPhase: teamChallengeRound?.discussionPhase || false,
    timeRemaining,
    canSubmitAnswer: !settings?.teamCaptainOnly || isCaptain,
    sendDiscussionMessage,
    submitTeamAnswer
  };
};

// Utility hook for special round events
export interface UseSpecialRoundEventsReturn {
  events: SpecialRoundEvent[];
  addEventFilter: (type: SpecialRoundEventType) => void;
  removeEventFilter: (type: SpecialRoundEventType) => void;
  clearEvents: () => void;
}

export const useSpecialRoundEvents = (
  specialRoundManager: SpecialRoundManager,
  maxEvents: number = 100
): UseSpecialRoundEventsReturn => {
  const [events, setEvents] = useState<SpecialRoundEvent[]>([]);
  const [eventFilters, setEventFilters] = useState<Set<SpecialRoundEventType>>(new Set());

  useEffect(() => {
    const handleEvent = (event: SpecialRoundEvent) => {
      if (eventFilters.size === 0 || eventFilters.has(event.type)) {
        setEvents(prev => {
          const newEvents = [event, ...prev].slice(0, maxEvents);
          return newEvents;
        });
      }
    };

    // Listen to all event types
    Object.values(SpecialRoundEventType).forEach(eventType => {
      specialRoundManager.addEventListener(eventType, handleEvent);
    });

    return () => {
      Object.values(SpecialRoundEventType).forEach(eventType => {
        specialRoundManager.removeEventListener(eventType, handleEvent);
      });
    };
  }, [specialRoundManager, eventFilters, maxEvents]);

  const addEventFilter = useCallback((type: SpecialRoundEventType) => {
    setEventFilters(prev => new Set(prev).add(type));
  }, []);

  const removeEventFilter = useCallback((type: SpecialRoundEventType) => {
    setEventFilters(prev => {
      const newFilters = new Set(prev);
      newFilters.delete(type);
      return newFilters;
    });
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    addEventFilter,
    removeEventFilter,
    clearEvents
  };
}; 