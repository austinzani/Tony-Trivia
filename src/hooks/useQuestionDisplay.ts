import { useState, useEffect, useCallback, useRef } from 'react';
import { Question } from '../types/game';

export interface UseQuestionDisplayOptions {
  question: Question;
  autoPlayMedia?: boolean;
  pauseMediaOnAnswer?: boolean;
  enableKeyboardNavigation?: boolean;
  announceMediaEvents?: boolean;
  onMediaLoad?: () => void;
  onMediaError?: (error: string) => void;
  onMediaPlay?: () => void;
  onMediaPause?: () => void;
  onMediaEnded?: () => void;
  onAnswerSelected?: (answer: string) => void;
}

export interface UseQuestionDisplayReturn {
  // State
  isMediaLoading: boolean;
  mediaError: string | null;
  isMediaPlaying: boolean;
  selectedAnswer: string | null;
  
  // Media controls
  playMedia: () => Promise<void>;
  pauseMedia: () => void;
  restartMedia: () => void;
  
  // Answer handling
  selectAnswer: (answer: string) => void;
  clearAnswer: () => void;
  
  // Event handlers for QuestionDisplay
  handleMediaLoad: () => void;
  handleMediaError: (error: string) => void;
  handleMediaPlay: () => void;
  handleMediaPause: () => void;
  handleMediaEnded: () => void;
  
  // Accessibility
  announceToScreenReader: (message: string) => void;
  focusQuestion: () => void;
  
  // Keyboard navigation
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

export function useQuestionDisplay(options: UseQuestionDisplayOptions): UseQuestionDisplayReturn {
  const {
    question,
    autoPlayMedia = false,
    pauseMediaOnAnswer = true,
    enableKeyboardNavigation = true,
    announceMediaEvents = true,
    onMediaLoad,
    onMediaError,
    onMediaPlay,
    onMediaPause,
    onMediaEnded,
    onAnswerSelected
  } = options;

  // State
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Refs
  const mediaElementRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const questionRef = useRef<HTMLDivElement | null>(null);
  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setIsMediaLoading(question.mediaUrl ? true : false);
    setMediaError(null);
    setIsMediaPlaying(false);
    setSelectedAnswer(null);
  }, [question.id]);

  // Auto-play media if enabled
  useEffect(() => {
    if (autoPlayMedia && question.mediaUrl && !isMediaLoading && !mediaError) {
      playMedia();
    }
  }, [question.id, autoPlayMedia, isMediaLoading, mediaError]);

  // Media control functions
  const playMedia = useCallback(async (): Promise<void> => {
    const mediaElement = mediaElementRef.current;
    if (!mediaElement) return;

    try {
      await mediaElement.play();
    } catch (error) {
      console.error('Error playing media:', error);
      setMediaError('Failed to play media');
    }
  }, []);

  const pauseMedia = useCallback((): void => {
    const mediaElement = mediaElementRef.current;
    if (!mediaElement) return;

    mediaElement.pause();
  }, []);

  const restartMedia = useCallback((): void => {
    const mediaElement = mediaElementRef.current;
    if (!mediaElement) return;

    mediaElement.currentTime = 0;
    if (isMediaPlaying) {
      playMedia();
    }
  }, [isMediaPlaying, playMedia]);

  // Answer handling
  const selectAnswer = useCallback((answer: string): void => {
    setSelectedAnswer(answer);
    onAnswerSelected?.(answer);

    if (pauseMediaOnAnswer && isMediaPlaying) {
      pauseMedia();
    }

    // Announce selection to screen readers
    if (announceMediaEvents) {
      announceToScreenReader(`Selected answer: ${answer}`);
    }
  }, [pauseMediaOnAnswer, isMediaPlaying, pauseMedia, onAnswerSelected, announceMediaEvents]);

  const clearAnswer = useCallback((): void => {
    setSelectedAnswer(null);
    
    if (announceMediaEvents) {
      announceToScreenReader('Answer cleared');
    }
  }, [announceMediaEvents]);

  // Event handlers for QuestionDisplay component
  const handleMediaLoad = useCallback((): void => {
    setIsMediaLoading(false);
    setMediaError(null);
    onMediaLoad?.();

    if (announceMediaEvents) {
      announceToScreenReader('Media loaded successfully');
    }
  }, [onMediaLoad, announceMediaEvents]);

  const handleMediaError = useCallback((error: string): void => {
    setIsMediaLoading(false);
    setMediaError(error);
    setIsMediaPlaying(false);
    onMediaError?.(error);

    if (announceMediaEvents) {
      announceToScreenReader(`Media error: ${error}`);
    }
  }, [onMediaError, announceMediaEvents]);

  const handleMediaPlay = useCallback((): void => {
    setIsMediaPlaying(true);
    onMediaPlay?.();

    if (announceMediaEvents) {
      announceToScreenReader('Media playing');
    }
  }, [onMediaPlay, announceMediaEvents]);

  const handleMediaPause = useCallback((): void => {
    setIsMediaPlaying(false);
    onMediaPause?.();

    if (announceMediaEvents) {
      announceToScreenReader('Media paused');
    }
  }, [onMediaPause, announceMediaEvents]);

  const handleMediaEnded = useCallback((): void => {
    setIsMediaPlaying(false);
    onMediaEnded?.();

    if (announceMediaEvents) {
      announceToScreenReader('Media ended');
    }
  }, [onMediaEnded, announceMediaEvents]);

  // Accessibility functions
  const announceToScreenReader = useCallback((message: string): void => {
    if (!announcementRef.current) {
      // Create announcement element if it doesn't exist
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
      announcementRef.current = announcement;
    }

    const announcement = announcementRef.current;
    announcement.textContent = message;

    // Clear the message after a short delay
    setTimeout(() => {
      if (announcement.textContent === message) {
        announcement.textContent = '';
      }
    }, 1000);
  }, []);

  const focusQuestion = useCallback((): void => {
    questionRef.current?.focus();
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (!enableKeyboardNavigation) return;

    const { key, ctrlKey, metaKey } = event;

    // Media controls
    if (question.mediaUrl) {
      if (key === ' ' && (ctrlKey || metaKey)) {
        event.preventDefault();
        if (isMediaPlaying) {
          pauseMedia();
        } else {
          playMedia();
        }
        return;
      }

      if (key === 'r' && (ctrlKey || metaKey)) {
        event.preventDefault();
        restartMedia();
        return;
      }
    }

    // Answer selection for multiple choice questions
    if (question.type === 'multiple-choice' && question.options) {
      const optionKeys = ['1', '2', '3', '4', 'a', 'b', 'c', 'd'];
      const keyIndex = optionKeys.indexOf(key.toLowerCase());
      
      if (keyIndex !== -1) {
        const optionIndex = keyIndex < 4 ? keyIndex : keyIndex - 4;
        if (optionIndex < question.options.length) {
          event.preventDefault();
          selectAnswer(question.options[optionIndex]);
        }
      }
    }

    // Clear answer
    if (key === 'Escape' && selectedAnswer) {
      event.preventDefault();
      clearAnswer();
    }
  }, [
    enableKeyboardNavigation,
    question.mediaUrl,
    question.type,
    question.options,
    isMediaPlaying,
    selectedAnswer,
    pauseMedia,
    playMedia,
    restartMedia,
    selectAnswer,
    clearAnswer
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, []);

  return {
    // State
    isMediaLoading,
    mediaError,
    isMediaPlaying,
    selectedAnswer,
    
    // Media controls
    playMedia,
    pauseMedia,
    restartMedia,
    
    // Answer handling
    selectAnswer,
    clearAnswer,
    
    // Event handlers
    handleMediaLoad,
    handleMediaError,
    handleMediaPlay,
    handleMediaPause,
    handleMediaEnded,
    
    // Accessibility
    announceToScreenReader,
    focusQuestion,
    
    // Keyboard navigation
    handleKeyDown
  };
}

// Helper hook for managing multiple questions
export interface UseQuestionSequenceOptions {
  questions: Question[];
  currentQuestionIndex?: number;
  autoAdvance?: boolean;
  onQuestionChange?: (question: Question, index: number) => void;
  onSequenceComplete?: () => void;
}

export interface UseQuestionSequenceReturn {
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  progress: number;
  
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  resetSequence: () => void;
}

export function useQuestionSequence(options: UseQuestionSequenceOptions): UseQuestionSequenceReturn {
  const {
    questions,
    currentQuestionIndex = 0,
    autoAdvance = false,
    onQuestionChange,
    onSequenceComplete
  } = options;

  const [currentIndex, setCurrentIndex] = useState(currentQuestionIndex);

  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Update index when prop changes
  useEffect(() => {
    setCurrentIndex(currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Trigger callbacks when question changes
  useEffect(() => {
    if (currentQuestion) {
      onQuestionChange?.(currentQuestion, currentIndex);
    }
  }, [currentQuestion, currentIndex, onQuestionChange]);

  const nextQuestion = useCallback((): void => {
    if (isLastQuestion) {
      onSequenceComplete?.();
      return;
    }

    setCurrentIndex(prev => Math.min(prev + 1, totalQuestions - 1));
  }, [isLastQuestion, totalQuestions, onSequenceComplete]);

  const previousQuestion = useCallback((): void => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const goToQuestion = useCallback((index: number): void => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  }, [totalQuestions]);

  const resetSequence = useCallback((): void => {
    setCurrentIndex(0);
  }, []);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    progress,
    
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetSequence
  };
} 