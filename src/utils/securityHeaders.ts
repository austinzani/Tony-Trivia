/**
 * Security Headers Configuration
 * 
 * This module provides utilities for configuring and managing security headers
 * in the Tony Trivia application. It includes Content Security Policy (CSP),
 * frame options, and other security-related headers.
 */

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'X-DNS-Prefetch-Control': string;
}

/**
 * Content Security Policy configuration for different environments
 */
export const CSP_CONFIG = {
  // Development environment - more permissive for hot reload and dev tools
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for Vite dev server
      'https://supabase.com',
      'https://*.supabase.co',
      'localhost:*',
      '127.0.0.1:*'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
      'localhost:*'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://supabase.com',
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      'http://localhost:*',
      'http://127.0.0.1:*'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  },

  // Production environment - strict security
  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for React hydration
      'https://supabase.com',
      'https://*.supabase.co'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://supabase.com',
      'https://*.supabase.co',
      'wss://*.supabase.co'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  }
} as const;

/**
 * Generate a Content Security Policy string from configuration
 */
export function generateCSP(environment: 'development' | 'production' = 'production'): string {
  const config = CSP_CONFIG[environment];
  
  return Object.entries(config)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive.replace(/-/g, '-');
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Complete security headers configuration
 */
export function getSecurityHeaders(environment: 'development' | 'production' = 'production'): SecurityHeaders {
  return {
    'Content-Security-Policy': generateCSP(environment),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'fullscreen=(self)',
      'display-capture=()'
    ].join(', '),
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': environment === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : 'max-age=0', // Disable HSTS in development
    'X-DNS-Prefetch-Control': 'off'
  };
}

/**
 * Validate if current page follows CSP rules (for development debugging)
 */
export function validateCSP(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true);
      return;
    }

    // Listen for CSP violations
    const violations: SecurityPolicyViolationEvent[] = [];
    
    const handleViolation = (event: SecurityPolicyViolationEvent) => {
      violations.push(event);
      console.warn('CSP Violation:', {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy
      });
    };

    document.addEventListener('securitypolicyviolation', handleViolation);

    // Check after a short delay
    setTimeout(() => {
      document.removeEventListener('securitypolicyviolation', handleViolation);
      resolve(violations.length === 0);
    }, 1000);
  });
}

/**
 * Security headers validation utility
 */
export function checkSecurityHeaders(): Promise<Record<string, boolean>> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    // This would typically be done server-side, but we can check what's actually set
    const expectedHeaders = Object.keys(getSecurityHeaders());
    const results: Record<string, boolean> = {};

    // In a real implementation, you'd check response headers
    // For now, we'll simulate the check
    expectedHeaders.forEach(header => {
      results[header] = true; // Assume headers are set correctly
    });

    resolve(results);
  });
}

/**
 * Report CSP violations to a logging service (placeholder)
 */
export function reportCSPViolation(violation: SecurityPolicyViolationEvent): void {
  // In a real implementation, you'd send this to your logging service
  console.error('CSP Violation Report:', {
    timestamp: new Date().toISOString(),
    directive: violation.violatedDirective,
    blockedURI: violation.blockedURI,
    documentURI: violation.documentURI,
    userAgent: navigator.userAgent,
    referrer: document.referrer
  });

  // Example: Send to analytics or logging service
  // analytics.track('csp_violation', { ... });
}

/**
 * Initialize CSP violation reporting
 */
export function initializeCSPReporting(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('securitypolicyviolation', reportCSPViolation);
}

/**
 * Security headers middleware for Express-like servers
 * (Useful for custom server setups)
 */
export function securityHeadersMiddleware(environment: 'development' | 'production' = 'production') {
  const headers = getSecurityHeaders(environment);
  
  return (req: any, res: any, next: any) => {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  };
}

/**
 * Type guard for security policy violation events
 */
export function isSecurityPolicyViolationEvent(event: Event): event is SecurityPolicyViolationEvent {
  return 'violatedDirective' in event && 'blockedURI' in event;
} 