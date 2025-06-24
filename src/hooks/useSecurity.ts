import { useEffect, useState } from 'react';
import { 
  initializeCSPReporting, 
  validateCSP, 
  checkSecurityHeaders,
  isSecurityPolicyViolationEvent 
} from '../utils/securityHeaders';

export interface SecurityStatus {
  cspValid: boolean;
  headersValid: Record<string, boolean>;
  violations: SecurityPolicyViolationEvent[];
  isChecking: boolean;
  lastCheck: Date | null;
}

export interface UseSecurityOptions {
  enableViolationReporting?: boolean;
  checkInterval?: number; // in milliseconds
  autoInitialize?: boolean;
}

/**
 * React hook for monitoring application security status
 */
export function useSecurity(options: UseSecurityOptions = {}): SecurityStatus {
  const {
    enableViolationReporting = true,
    checkInterval = 30000, // 30 seconds
    autoInitialize = true
  } = options;

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    cspValid: true,
    headersValid: {},
    violations: [],
    isChecking: false,
    lastCheck: null
  });

  // Initialize CSP violation reporting
  useEffect(() => {
    if (!autoInitialize || typeof window === 'undefined') return;

    if (enableViolationReporting) {
      initializeCSPReporting();
    }

    // Listen for CSP violations and update state
    const handleViolation = (event: Event) => {
      if (isSecurityPolicyViolationEvent(event)) {
        setSecurityStatus(prev => ({
          ...prev,
          violations: [...prev.violations, event],
          cspValid: false
        }));
      }
    };

    document.addEventListener('securitypolicyviolation', handleViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleViolation);
    };
  }, [enableViolationReporting, autoInitialize]);

  // Periodic security checks
  useEffect(() => {
    if (!autoInitialize || typeof window === 'undefined') return;

    const performSecurityCheck = async () => {
      setSecurityStatus(prev => ({ ...prev, isChecking: true }));

      try {
        const [cspValid, headersValid] = await Promise.all([
          validateCSP(),
          checkSecurityHeaders()
        ]);

        setSecurityStatus(prev => ({
          ...prev,
          cspValid,
          headersValid,
          isChecking: false,
          lastCheck: new Date()
        }));
      } catch (error) {
        console.error('Security check failed:', error);
        setSecurityStatus(prev => ({
          ...prev,
          isChecking: false,
          lastCheck: new Date()
        }));
      }
    };

    // Initial check
    performSecurityCheck();

    // Set up periodic checks
    const interval = setInterval(performSecurityCheck, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, autoInitialize]);

  return securityStatus;
}

/**
 * Hook for development-time security monitoring with detailed logging
 */
export function useSecurityMonitor(): SecurityStatus & {
  clearViolations: () => void;
  runSecurityCheck: () => Promise<void>;
} {
  const securityStatus = useSecurity({
    enableViolationReporting: true,
    checkInterval: 10000, // More frequent checks in development
    autoInitialize: true
  });

  const clearViolations = () => {
    setSecurityStatus(prev => ({
      ...prev,
      violations: [],
      cspValid: true
    }));
  };

  const runSecurityCheck = async () => {
    setSecurityStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const [cspValid, headersValid] = await Promise.all([
        validateCSP(),
        checkSecurityHeaders()
      ]);

      setSecurityStatus(prev => ({
        ...prev,
        cspValid,
        headersValid,
        isChecking: false,
        lastCheck: new Date()
      }));

      // Log results in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🔒 Security Check Results');
        console.log('CSP Valid:', cspValid);
        console.log('Headers Valid:', headersValid);
        console.log('Violations:', securityStatus.violations.length);
        console.groupEnd();
      }
    } catch (error) {
      console.error('Security check failed:', error);
      setSecurityStatus(prev => ({
        ...prev,
        isChecking: false,
        lastCheck: new Date()
      }));
    }
  };

  const [, setSecurityStatus] = useState<SecurityStatus>(securityStatus);

  return {
    ...securityStatus,
    clearViolations,
    runSecurityCheck
  };
}

/**
 * Hook for production security monitoring with minimal overhead
 */
export function useProductionSecurity(): Pick<SecurityStatus, 'violations' | 'cspValid'> {
  const { violations, cspValid } = useSecurity({
    enableViolationReporting: true,
    checkInterval: 60000, // Less frequent checks in production
    autoInitialize: true
  });

  // Only report critical violations in production
  useEffect(() => {
    if (violations.length > 0) {
      const criticalViolations = violations.filter(violation => 
        violation.violatedDirective.includes('script-src') ||
        violation.violatedDirective.includes('object-src') ||
        violation.violatedDirective.includes('base-uri')
      );

      if (criticalViolations.length > 0) {
        // In a real app, send to monitoring service
        console.error('Critical CSP violations detected:', criticalViolations);
      }
    }
  }, [violations]);

  return { violations, cspValid };
} 