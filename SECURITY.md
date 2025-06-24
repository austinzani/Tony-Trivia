# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Tony Trivia application, focusing on secure headers and Content Security Policy (CSP) configuration.

## Overview

The application implements multiple layers of security through HTTP headers, Content Security Policy, and runtime monitoring. These measures protect against common web vulnerabilities including XSS, clickjacking, MIME sniffing, and other security threats.

## Implemented Security Headers

### 1. Content Security Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Configuration**:
- **Development**: More permissive to allow hot reloading and dev tools
- **Production**: Strict policy allowing only necessary resources

**Key Directives**:
- `default-src 'self'`: Only allow resources from the same origin by default
- `script-src`: Control JavaScript execution sources
- `style-src`: Control CSS sources
- `img-src`: Control image sources
- `connect-src`: Control network connections (APIs, WebSockets)
- `frame-ancestors 'none'`: Prevent embedding in iframes

### 2. X-Frame-Options

**Purpose**: Prevents clickjacking attacks by controlling iframe embedding.

**Value**: `DENY` - Completely prevents the page from being displayed in any iframe.

### 3. X-Content-Type-Options

**Purpose**: Prevents MIME type sniffing attacks.

**Value**: `nosniff` - Forces browsers to respect the declared content type.

### 4. Referrer-Policy

**Purpose**: Controls how much referrer information is sent with requests.

**Value**: `strict-origin-when-cross-origin` - Sends full URL for same-origin requests, only origin for cross-origin HTTPS requests.

### 5. Permissions-Policy

**Purpose**: Restricts access to browser features and APIs.

**Configuration**: Disables unnecessary features like camera, microphone, geolocation, etc.

### 6. X-XSS-Protection

**Purpose**: Enables browser's built-in XSS protection (legacy support).

**Value**: `1; mode=block` - Enables protection and blocks suspicious content.

### 7. Strict-Transport-Security (HSTS)

**Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks.

**Value**: `max-age=31536000; includeSubDomains; preload` - 1 year duration with subdomain inclusion.

### 8. X-DNS-Prefetch-Control

**Purpose**: Controls DNS prefetching to prevent information leakage.

**Value**: `off` - Disables DNS prefetching.

## Deployment Configuration

### Vercel Deployment

Create `vercel.json` in the project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://supabase.com https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://supabase.com https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content"
        },
        // ... other headers
      ]
    }
  ]
}
```

### Netlify Deployment

Create `netlify.toml` in the project root:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; ..."
    X-Frame-Options = "DENY"
    # ... other headers
```

## Usage in Application

### Basic Security Monitoring

```typescript
import { useSecurity } from './hooks/useSecurity';

function App() {
  const { cspValid, violations, isChecking } = useSecurity();
  
  if (!cspValid && violations.length > 0) {
    console.warn('Security violations detected:', violations);
  }
  
  return <div>Your app content</div>;
}
```

### Development Monitoring

```typescript
import { useSecurityMonitor } from './hooks/useSecurity';

function DevSecurityPanel() {
  const { 
    cspValid, 
    violations, 
    clearViolations, 
    runSecurityCheck 
  } = useSecurityMonitor();
  
  return (
    <div className="dev-panel">
      <h3>Security Status</h3>
      <p>CSP Valid: {cspValid ? '✅' : '❌'}</p>
      <p>Violations: {violations.length}</p>
      <button onClick={clearViolations}>Clear Violations</button>
      <button onClick={runSecurityCheck}>Run Check</button>
    </div>
  );
}
```

### Production Monitoring

```typescript
import { useProductionSecurity } from './hooks/useSecurity';

function App() {
  const { violations, cspValid } = useProductionSecurity();
  
  // Critical violations are automatically logged
  // You can integrate with your monitoring service here
  
  return <div>Your app content</div>;
}
```

## Security Headers Utilities

### Generate CSP for Different Environments

```typescript
import { generateCSP, getSecurityHeaders } from './utils/securityHeaders';

// Get CSP for current environment
const csp = generateCSP(process.env.NODE_ENV === 'production' ? 'production' : 'development');

// Get all security headers
const headers = getSecurityHeaders('production');
```

### Custom Server Integration

```typescript
import { securityHeadersMiddleware } from './utils/securityHeaders';

// Express.js example
app.use(securityHeadersMiddleware('production'));
```

## Testing Security Headers

### Automated Testing

Use tools like:
- **securityheaders.com**: Online security headers analyzer
- **Mozilla Observatory**: Comprehensive security assessment
- **OWASP ZAP**: Security testing proxy

### Manual Testing

1. Open browser developer tools
2. Check Network tab for response headers
3. Monitor Console for CSP violations
4. Use the built-in security monitoring hooks

### Validation Scripts

```bash
# Check headers with curl
curl -I https://your-domain.com

# Use online tools
open https://securityheaders.com/?q=your-domain.com
```

## Common Issues and Solutions

### CSP Violations

**Issue**: Inline scripts or styles causing violations
**Solution**: 
- Use nonces for critical inline content
- Move inline scripts to external files
- Use CSS-in-JS libraries that support CSP

**Issue**: Third-party resources blocked
**Solution**: Add specific domains to appropriate CSP directives

### Development vs Production

**Issue**: Different behavior between environments
**Solution**: Use environment-specific CSP configurations provided in the utilities

### Browser Compatibility

**Issue**: Older browsers not supporting newer headers
**Solution**: The implementation includes fallback headers like X-XSS-Protection for legacy support

## Security Best Practices

1. **Regular Updates**: Review and update security headers as the application evolves
2. **Monitoring**: Implement CSP violation reporting to catch issues early
3. **Testing**: Regularly test with security scanning tools
4. **Documentation**: Keep security documentation up-to-date
5. **Training**: Ensure team members understand security implications

## Integration with Supabase

The CSP configuration specifically allows:
- Supabase API endpoints (`https://supabase.com`, `https://*.supabase.co`)
- WebSocket connections for real-time features (`wss://*.supabase.co`)
- Proper authentication headers and CORS handling

## Compliance

These security measures help with compliance for:
- **OWASP Top 10**: Addresses injection, broken authentication, and security misconfiguration
- **PCI DSS**: Supports secure data transmission requirements
- **GDPR**: Helps protect user data through technical measures

## Monitoring and Alerting

In production, consider implementing:
- CSP violation reporting endpoints
- Security header monitoring dashboards
- Automated alerts for security issues
- Regular security audits and penetration testing

## Contributing

When adding new features:
1. Check if new domains need to be added to CSP
2. Test with security headers enabled
3. Update security documentation
4. Run security validation tests
5. Consider security implications of new dependencies

---

For questions or security concerns, please contact the security team or create an issue in the repository. 