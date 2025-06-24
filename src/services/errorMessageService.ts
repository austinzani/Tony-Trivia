export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'game-logic'
  | 'real-time'
  | 'system'
  | 'unknown';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorContext {
  category: ErrorCategory;
  severity: ErrorSeverity;
  feature?: string;
  action?: string;
  userId?: string;
  gameId?: string;
  metadata?: Record<string, any>;
}

export interface UserFriendlyError {
  id: string;
  title: string;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    handler: () => void | Promise<void>;
  };
  dismissible: boolean;
  autoHide?: number; // milliseconds
  icon?: string;
  timestamp: Date;
  context: ErrorContext;
}

export interface ErrorTemplate {
  title: string;
  message: string;
  suggestion?: string;
  icon?: string;
  dismissible?: boolean;
  autoHide?: number;
}

export class ErrorMessageService {
  private static instance: ErrorMessageService;
  private errorQueue: UserFriendlyError[] = [];
  private listeners: Set<(errors: UserFriendlyError[]) => void> = new Set();
  private maxQueueSize = 10;

  // Error templates for common scenarios
  private templates: Record<string, ErrorTemplate> = {
    // Network errors
    'network.connection-lost': {
      title: 'Connection Lost',
      message: 'Unable to connect to Tony Trivia servers. Check your internet connection.',
      suggestion: 'Try refreshing the page or check your network settings.',
      icon: '📡',
      dismissible: false,
    },
    'network.slow-connection': {
      title: 'Slow Connection',
      message: 'Your connection seems slow. Some features may be delayed.',
      suggestion: 'Consider switching to a faster network for the best experience.',
      icon: '🐌',
      dismissible: true,
      autoHide: 8000,
    },
    'network.request-failed': {
      title: 'Request Failed',
      message: 'Failed to complete your request. Please try again.',
      suggestion: 'If the problem persists, refresh the page.',
      icon: '⚠️',
      dismissible: true,
    },
    'network.timeout': {
      title: 'Request Timed Out',
      message: 'The request took too long to complete.',
      suggestion: 'Your connection might be slow. Try again in a moment.',
      icon: '⏱️',
      dismissible: true,
    },

    // Authentication errors
    'auth.session-expired': {
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again.',
      suggestion: 'Click below to go to the login page.',
      icon: '🔒',
      dismissible: false,
    },
    'auth.invalid-credentials': {
      title: 'Invalid Credentials',
      message: 'The email or password you entered is incorrect.',
      suggestion: 'Double-check your credentials and try again.',
      icon: '❌',
      dismissible: true,
    },
    'auth.account-locked': {
      title: 'Account Temporarily Locked',
      message: 'Too many failed login attempts. Your account is temporarily locked.',
      suggestion: 'Wait a few minutes before trying again.',
      icon: '🔐',
      dismissible: true,
    },

    // Authorization errors
    'auth.insufficient-permissions': {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      suggestion: 'Contact the game host if you think this is an error.',
      icon: '🚫',
      dismissible: true,
    },
    'auth.host-only': {
      title: 'Host Only Feature',
      message: 'Only the game host can perform this action.',
      suggestion: 'Ask the host to make this change.',
      icon: '👑',
      dismissible: true,
    },

    // Validation errors
    'validation.required-field': {
      title: 'Missing Information',
      message: 'Please fill in all required fields.',
      suggestion: 'Check for any empty fields marked with an asterisk (*).',
      icon: '📝',
      dismissible: true,
    },
    'validation.invalid-email': {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
      suggestion: 'Make sure your email includes @ and a domain (like .com).',
      icon: '📧',
      dismissible: true,
    },
    'validation.password-weak': {
      title: 'Weak Password',
      message: 'Your password doesn\'t meet the security requirements.',
      suggestion: 'Use at least 8 characters with a mix of letters, numbers, and symbols.',
      icon: '🔑',
      dismissible: true,
    },

    // Game logic errors
    'game.already-started': {
      title: 'Game Already Started',
      message: 'This game has already begun.',
      suggestion: 'Wait for the next round or join a different game.',
      icon: '🎮',
      dismissible: true,
    },
    'game.room-full': {
      title: 'Game Room Full',
      message: 'This game room has reached its maximum capacity.',
      suggestion: 'Try joining a different game or wait for a spot to open up.',
      icon: '🏠',
      dismissible: true,
    },
    'game.answer-timeout': {
      title: 'Time\'s Up!',
      message: 'The time limit for this question has expired.',
      suggestion: 'Get ready for the next question!',
      icon: '⏰',
      dismissible: true,
      autoHide: 5000,
    },
    'game.invalid-answer': {
      title: 'Invalid Answer',
      message: 'Your answer couldn\'t be processed.',
      suggestion: 'Make sure you selected a valid option and try again.',
      icon: '❓',
      dismissible: true,
    },

    // Real-time errors
    'realtime.connection-failed': {
      title: 'Real-time Connection Failed',
      message: 'Unable to establish live updates. You may miss real-time changes.',
      suggestion: 'Refresh the page to restore live updates.',
      icon: '📡',
      dismissible: true,
    },
    'realtime.sync-failed': {
      title: 'Sync Failed',
      message: 'Your changes may not be synced with other players.',
      suggestion: 'Check your connection and try again.',
      icon: '🔄',
      dismissible: true,
    },

    // System errors
    'system.maintenance': {
      title: 'Maintenance Mode',
      message: 'Tony Trivia is currently undergoing maintenance.',
      suggestion: 'Please check back in a few minutes. We apologize for the inconvenience.',
      icon: '🔧',
      dismissible: false,
    },
    'system.server-error': {
      title: 'Server Error',
      message: 'Something went wrong on our end.',
      suggestion: 'We\'re working to fix this. Please try again in a moment.',
      icon: '🚨',
      dismissible: true,
    },
    'system.feature-unavailable': {
      title: 'Feature Temporarily Unavailable',
      message: 'This feature is currently unavailable.',
      suggestion: 'We\'re working to restore it. Try again later.',
      icon: '🚧',
      dismissible: true,
    },

    // Default/fallback
    'unknown.generic': {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred.',
      suggestion: 'Try refreshing the page or contact support if the problem continues.',
      icon: '❓',
      dismissible: true,
    },
  };

  private constructor() {}

  static getInstance(): ErrorMessageService {
    if (!ErrorMessageService.instance) {
      ErrorMessageService.instance = new ErrorMessageService();
    }
    return ErrorMessageService.instance;
  }

  // Subscribe to error updates
  subscribe(callback: (errors: UserFriendlyError[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.errorQueue]);
      } catch (error) {
        console.error('Error in error message listener:', error);
      }
    });
  }

  // Create user-friendly error from raw error
  createUserFriendlyError(
    error: Error | string,
    context: ErrorContext,
    customTemplate?: Partial<ErrorTemplate>
  ): UserFriendlyError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const templateKey = this.determineTemplateKey(errorMessage, context);
    const template = this.templates[templateKey] || this.templates['unknown.generic'];

    const userFriendlyError: UserFriendlyError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: customTemplate?.title || template.title,
      message: customTemplate?.message || template.message,
      suggestion: customTemplate?.suggestion || template.suggestion,
      dismissible: customTemplate?.dismissible ?? template.dismissible ?? true,
      autoHide: customTemplate?.autoHide || template.autoHide,
      icon: customTemplate?.icon || template.icon,
      timestamp: new Date(),
      context,
    };

    // Add contextual actions
    if (context.category === 'authentication' && templateKey === 'auth.session-expired') {
      userFriendlyError.action = {
        label: 'Sign In',
        handler: () => {
          window.location.href = '/';
        },
      };
    } else if (context.category === 'network') {
      userFriendlyError.action = {
        label: 'Retry',
        handler: () => {
          window.location.reload();
        },
      };
    }

    return userFriendlyError;
  }

  // Determine the best template for an error
  private determineTemplateKey(errorMessage: string, context: ErrorContext): string {
    const message = errorMessage.toLowerCase();
    const { category, feature, action } = context;

    // Network-related errors
    if (category === 'network') {
      if (message.includes('timeout') || message.includes('timed out')) {
        return 'network.timeout';
      }
      if (message.includes('connection') || message.includes('network')) {
        return 'network.connection-lost';
      }
      if (message.includes('slow') || message.includes('delay')) {
        return 'network.slow-connection';
      }
      return 'network.request-failed';
    }

    // Authentication errors
    if (category === 'authentication') {
      if (message.includes('session') || message.includes('expired')) {
        return 'auth.session-expired';
      }
      if (message.includes('credentials') || message.includes('password') || message.includes('email')) {
        return 'auth.invalid-credentials';
      }
      if (message.includes('locked') || message.includes('attempts')) {
        return 'auth.account-locked';
      }
    }

    // Authorization errors
    if (category === 'authorization') {
      if (message.includes('host') || message.includes('admin')) {
        return 'auth.host-only';
      }
      return 'auth.insufficient-permissions';
    }

    // Validation errors
    if (category === 'validation') {
      if (message.includes('required') || message.includes('missing')) {
        return 'validation.required-field';
      }
      if (message.includes('email')) {
        return 'validation.invalid-email';
      }
      if (message.includes('password')) {
        return 'validation.password-weak';
      }
    }

    // Game logic errors
    if (category === 'game-logic') {
      if (message.includes('started') || message.includes('begun')) {
        return 'game.already-started';
      }
      if (message.includes('full') || message.includes('capacity')) {
        return 'game.room-full';
      }
      if (message.includes('timeout') || message.includes('time')) {
        return 'game.answer-timeout';
      }
      if (message.includes('answer') || message.includes('invalid')) {
        return 'game.invalid-answer';
      }
    }

    // Real-time errors
    if (category === 'real-time') {
      if (message.includes('sync') || message.includes('synchroniz')) {
        return 'realtime.sync-failed';
      }
      return 'realtime.connection-failed';
    }

    // System errors
    if (category === 'system') {
      if (message.includes('maintenance')) {
        return 'system.maintenance';
      }
      if (message.includes('server') || message.includes('500')) {
        return 'system.server-error';
      }
      if (message.includes('unavailable') || message.includes('disabled')) {
        return 'system.feature-unavailable';
      }
    }

    return 'unknown.generic';
  }

  // Add error to queue
  showError(
    error: Error | string,
    context: ErrorContext,
    customTemplate?: Partial<ErrorTemplate>
  ): string {
    const userFriendlyError = this.createUserFriendlyError(error, context, customTemplate);
    
    // Check for duplicates (avoid spam)
    const isDuplicate = this.errorQueue.some(existingError => 
      existingError.title === userFriendlyError.title &&
      existingError.message === userFriendlyError.message &&
      Date.now() - existingError.timestamp.getTime() < 5000 // Within 5 seconds
    );

    if (!isDuplicate) {
      this.errorQueue.push(userFriendlyError);

      // Maintain queue size
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
      }

      // Auto-hide if specified
      if (userFriendlyError.autoHide) {
        setTimeout(() => {
          this.dismissError(userFriendlyError.id);
        }, userFriendlyError.autoHide);
      }

      this.notifyListeners();
    }

    return userFriendlyError.id;
  }

  // Remove error from queue
  dismissError(errorId: string): void {
    const index = this.errorQueue.findIndex(error => error.id === errorId);
    if (index > -1) {
      this.errorQueue.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Clear all errors
  clearAll(): void {
    this.errorQueue = [];
    this.notifyListeners();
  }

  // Clear errors by category
  clearByCategory(category: ErrorCategory): void {
    this.errorQueue = this.errorQueue.filter(error => error.context.category !== category);
    this.notifyListeners();
  }

  // Get current errors
  getErrors(): UserFriendlyError[] {
    return [...this.errorQueue];
  }

  // Add custom template
  addTemplate(key: string, template: ErrorTemplate): void {
    this.templates[key] = template;
  }

  // Update template
  updateTemplate(key: string, updates: Partial<ErrorTemplate>): void {
    if (this.templates[key]) {
      this.templates[key] = { ...this.templates[key], ...updates };
    }
  }

  // Convenience methods for different error types
  showNetworkError(error: Error | string, action?: string): string {
    return this.showError(error, {
      category: 'network',
      severity: 'error',
      action,
    });
  }

  showAuthError(error: Error | string, action?: string): string {
    return this.showError(error, {
      category: 'authentication',
      severity: 'error',
      action,
    });
  }

  showGameError(error: Error | string, gameId?: string, feature?: string): string {
    return this.showError(error, {
      category: 'game-logic',
      severity: 'warning',
      gameId,
      feature,
    });
  }

  showValidationError(error: Error | string, feature?: string): string {
    return this.showError(error, {
      category: 'validation',
      severity: 'warning',
      feature,
    });
  }

  showSystemError(error: Error | string): string {
    return this.showError(error, {
      category: 'system',
      severity: 'critical',
    });
  }

  showInfo(message: string, autoHide = 5000): string {
    return this.showError(message, {
      category: 'system',
      severity: 'info',
    }, {
      title: 'Info',
      icon: 'ℹ️',
      autoHide,
    });
  }

  showSuccess(message: string, autoHide = 3000): string {
    return this.showError(message, {
      category: 'system',
      severity: 'info',
    }, {
      title: 'Success',
      icon: '✅',
      autoHide,
    });
  }
}

// Global instance
export const errorMessageService = ErrorMessageService.getInstance();

export default ErrorMessageService; 