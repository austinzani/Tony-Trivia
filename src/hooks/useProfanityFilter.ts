import { useState, useCallback, useMemo } from 'react';
import { profanityFilter, ProfanityCheckResult, ProfanityFilterOptions } from '../services/profanityFilter';

export interface ProfanityValidationState {
  isValid: boolean;
  filteredText: string;
  violations: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  suggestions?: string[];
  isChecking: boolean;
  lastChecked: Date | null;
}

export interface UseProfanityFilterOptions extends ProfanityFilterOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * React hook for real-time profanity filtering and validation
 */
export function useProfanityFilter(
  initialText: string = '',
  options: UseProfanityFilterOptions = {}
) {
  const {
    validateOnChange = true,
    debounceMs = 300,
    minLength = 1,
    maxLength = 1000,
    ...filterOptions
  } = options;

  const [validationState, setValidationState] = useState<ProfanityValidationState>({
    isValid: true,
    filteredText: initialText,
    violations: [],
    severity: 'none',
    isChecking: false,
    lastChecked: null
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Validate text using the profanity filter
   */
  const validateText = useCallback(async (text: string): Promise<ProfanityCheckResult> => {
    if (!text || text.length < minLength) {
      return {
        isClean: text.length === 0, // Empty text is clean, but below minLength is not
        filteredText: text,
        violations: text.length > 0 && text.length < minLength ? ['Text too short'] : [],
        severity: 'none'
      };
    }

    if (text.length > maxLength) {
      return {
        isClean: false,
        filteredText: text.substring(0, maxLength),
        violations: ['Text too long'],
        severity: 'mild'
      };
    }

    return profanityFilter.checkText(text, filterOptions);
  }, [filterOptions, minLength, maxLength]);

  /**
   * Check text with debouncing
   */
  const checkText = useCallback((text: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setValidationState(prev => ({ ...prev, isChecking: true }));

    const timer = setTimeout(async () => {
      try {
        const result = await validateText(text);
        
        setValidationState({
          isValid: result.isClean,
          filteredText: result.filteredText,
          violations: result.violations,
          severity: result.severity,
          suggestions: result.suggestions,
          isChecking: false,
          lastChecked: new Date()
        });
      } catch (error) {
        console.error('Profanity check failed:', error);
        setValidationState(prev => ({
          ...prev,
          isChecking: false,
          lastChecked: new Date()
        }));
      }
    }, validateOnChange ? debounceMs : 0);

    setDebounceTimer(timer);
  }, [debounceTimer, debounceMs, validateOnChange, validateText]);

  /**
   * Immediate validation without debouncing
   */
  const validateNow = useCallback(async (text: string): Promise<ProfanityValidationState> => {
    setValidationState(prev => ({ ...prev, isChecking: true }));

    try {
      const result = await validateText(text);
      
      const newState: ProfanityValidationState = {
        isValid: result.isClean,
        filteredText: result.filteredText,
        violations: result.violations,
        severity: result.severity,
        suggestions: result.suggestions,
        isChecking: false,
        lastChecked: new Date()
      };

      setValidationState(newState);
      return newState;
    } catch (error) {
      console.error('Profanity validation failed:', error);
      const errorState: ProfanityValidationState = {
        isValid: false,
        filteredText: text,
        violations: ['Validation error occurred'],
        severity: 'moderate',
        isChecking: false,
        lastChecked: new Date()
      };
      
      setValidationState(errorState);
      return errorState;
    }
  }, [validateText]);

  /**
   * Get formatted error message for display
   */
  const getErrorMessage = useCallback((violations: string[]): string => {
    if (violations.length === 0) return '';
    
    if (violations.length === 1) {
      return violations[0];
    }
    
    return `${violations[0]} (${violations.length - 1} more issue${violations.length > 2 ? 's' : ''})`;
  }, []);

  /**
   * Get suggested alternatives text
   */
  const getSuggestionsText = useCallback((suggestions?: string[]): string => {
    if (!suggestions || suggestions.length === 0) return '';
    
    if (suggestions.length === 1) {
      return `Try: "${suggestions[0]}"`;
    }
    
    return `Try: "${suggestions.slice(0, 2).join('", "')}"${suggestions.length > 2 ? '...' : ''}`;
  }, []);

  /**
   * Clear validation state
   */
  const clearValidation = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    
    setValidationState({
      isValid: true,
      filteredText: '',
      violations: [],
      severity: 'none',
      isChecking: false,
      lastChecked: null
    });
  }, [debounceTimer]);

  // Cleanup on unmount
  useMemo(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    validationState,
    checkText,
    validateNow,
    clearValidation,
    getErrorMessage,
    getSuggestionsText,
    
    // Computed properties for easy access
    isValid: validationState.isValid,
    isChecking: validationState.isChecking,
    hasViolations: validationState.violations.length > 0,
    errorMessage: getErrorMessage(validationState.violations),
    suggestionsText: getSuggestionsText(validationState.suggestions),
    
    // Severity helpers
    isSevere: validationState.severity === 'severe',
    isModerate: validationState.severity === 'moderate',
    isMild: validationState.severity === 'mild'
  };
}

/**
 * Specialized hook for team name validation
 */
export function useTeamNameValidator(initialName: string = '') {
  const filter = useProfanityFilter(initialName, {
    enableGameSpecificFilter: true,
    enableStrictMode: true,
    allowPartialMatches: true,
    validateOnChange: true,
    debounceMs: 500,
    minLength: 2,
    maxLength: 30
  });

  const validateTeamName = useCallback(async (teamName: string) => {
    const result = profanityFilter.validateTeamName(teamName);
    
    const state: ProfanityValidationState = {
      isValid: result.isClean,
      filteredText: result.filteredText,
      violations: result.violations,
      severity: result.severity,
      suggestions: result.suggestions,
      isChecking: false,
      lastChecked: new Date()
    };

    return state;
  }, []);

  return {
    ...filter,
    validateTeamName,
    
    // Team-specific helpers
    isTooShort: filter.validationState.violations.includes('Team name too short'),
    isTooLong: filter.validationState.violations.includes('Team name too long'),
    isImpersonating: filter.validationState.violations.includes('Cannot impersonate system roles')
  };
}

/**
 * Specialized hook for chat message validation
 */
export function useChatValidator() {
  const filter = useProfanityFilter('', {
    enableGameSpecificFilter: false, // More lenient for chat
    enableStrictMode: false,
    allowPartialMatches: false,
    validateOnChange: false, // Manual validation for chat
    debounceMs: 100,
    minLength: 1,
    maxLength: 500
  });

  const validateMessage = useCallback(async (message: string) => {
    const result = profanityFilter.validateChatMessage(message);
    
    const state: ProfanityValidationState = {
      isValid: result.isClean,
      filteredText: result.filteredText,
      violations: result.violations,
      severity: result.severity,
      suggestions: result.suggestions,
      isChecking: false,
      lastChecked: new Date()
    };

    return state;
  }, []);

  return {
    ...filter,
    validateMessage,
    
    // Chat-specific helpers
    canSend: filter.isValid && !filter.isChecking,
    needsModeration: filter.isSevere || filter.isModerate
  };
}

/**
 * Hook for getting profanity filter statistics
 */
export function useProfanityStats() {
  const [stats, setStats] = useState(profanityFilter.getFilterStats());

  const refreshStats = useCallback(() => {
    setStats(profanityFilter.getFilterStats());
  }, []);

  return {
    stats,
    refreshStats
  };
} 