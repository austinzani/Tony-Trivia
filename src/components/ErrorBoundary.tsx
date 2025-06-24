import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AnimatedButton } from './AnimatedButton';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

// Default fallback component
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6">
        🚨
      </div>

      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Oops! Something went wrong
      </h1>

      <p className="text-gray-600 mb-6">
        The Tony Trivia app encountered an unexpected error. Don't worry, we're
        here to help!
      </p>

      <div className="space-y-4">
        <AnimatedButton
          variant="primary"
          onClick={resetError}
          className="w-full"
        >
          🔄 Try Again
        </AnimatedButton>

        <AnimatedButton
          variant="ghost"
          onClick={() => (window.location.href = '/')}
          className="w-full"
        >
          🏠 Go Home
        </AnimatedButton>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            🔧 Error Details (Development)
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs font-mono text-left overflow-auto max-h-40">
            <div className="mb-2">
              <strong>Error:</strong> {error.message}
            </div>
            {error.stack && (
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  </div>
);

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for monitoring
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Implement error logging service integration
    // Examples: Sentry, LogRocket, Bugsnag, etc.

    // For now, we'll just log to console in production
    console.error('Production Error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
