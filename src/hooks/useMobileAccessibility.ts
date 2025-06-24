import { useEffect, useRef, useCallback } from 'react';

interface UseMobileAccessibilityOptions {
  enableFocusTrap?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  announceOnMount?: string;
  preventScroll?: boolean;
}

export const useMobileAccessibility = (options: UseMobileAccessibilityOptions = {}) => {
  const {
    enableFocusTrap = false,
    autoFocus = false,
    restoreFocus = true,
    announceOnMount,
    preventScroll = false,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Store previous focus
  useEffect(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [restoreFocus]);

  // Auto focus first focusable element
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [autoFocus]);

  // Screen reader announcement
  useEffect(() => {
    if (announceOnMount) {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = announceOnMount;
      document.body.appendChild(announcement);
      announcementRef.current = announcement;

      // Remove after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          document.body.removeChild(announcementRef.current);
          announcementRef.current = null;
        }
      }, 1000);
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
      }
    };
  }, [announceOnMount]);

  // Prevent body scroll on mobile
  useEffect(() => {
    if (preventScroll) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        window.scrollTo(0, scrollY);
      };
    }
  }, [preventScroll]);

  // Focus trap implementation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableFocusTrap || !containerRef.current) return;

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    // Escape key handling
    if (event.key === 'Escape' && containerRef.current) {
      const escapeEvent = new CustomEvent('escape', { bubbles: true });
      containerRef.current.dispatchEvent(escapeEvent);
    }
  }, [enableFocusTrap]);

  useEffect(() => {
    if (enableFocusTrap) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableFocusTrap, handleKeyDown]);

  // Announce to screen reader
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    containerRef,
    announce,
  };
};

// Helper function to get focusable elements
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

// Screen reader only class for Tailwind
export const srOnly = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';