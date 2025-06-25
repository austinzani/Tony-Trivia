import React from 'react';
import { Info } from 'lucide-react';

interface MediaAccessibilityInfoProps {
  mediaType: 'audio' | 'video';
  className?: string;
}

export const MediaAccessibilityInfo: React.FC<MediaAccessibilityInfoProps> = ({
  mediaType,
  className = '',
}) => {
  return (
    <div
      className={`sr-only ${className}`}
      role="region"
      aria-label="Keyboard navigation instructions"
    >
      <h3>Keyboard Controls for {mediaType}:</h3>
      <ul>
        <li>Press Space or Enter to play/pause</li>
        <li>Press Left Arrow to rewind 5 seconds</li>
        <li>Press Right Arrow to forward 5 seconds</li>
        <li>Press M to mute/unmute</li>
        {mediaType === 'video' && (
          <li>Double-click or press F to toggle fullscreen</li>
        )}
      </ul>
    </div>
  );
};

export const AccessibilityHelpButton: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-electric-700 bg-electric-50 hover:bg-electric-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 ${className}`}
      aria-label="Show accessibility help"
    >
      <Info className="w-4 h-4" />
      <span>Accessibility Help</span>
    </button>
  );
};

export const AccessibilityHelpModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-help-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2
            id="accessibility-help-title"
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Accessibility Features
          </h2>

          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Media Player Controls
              </h3>
              <ul className="space-y-1 text-gray-600">
                <li>• <kbd>Space</kbd> or <kbd>Enter</kbd> - Play/Pause</li>
                <li>• <kbd>←</kbd> - Rewind 5 seconds</li>
                <li>• <kbd>→</kbd> - Forward 5 seconds</li>
                <li>• <kbd>M</kbd> - Mute/Unmute</li>
                <li>• <kbd>F</kbd> - Fullscreen (video only)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Screen Reader Support
              </h3>
              <ul className="space-y-1 text-gray-600">
                <li>• All images include descriptive alt text</li>
                <li>• Audio content includes transcripts</li>
                <li>• Video content includes captions and transcripts</li>
                <li>• Form controls are properly labeled</li>
                <li>• Status updates are announced via ARIA live regions</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Navigation
              </h3>
              <ul className="space-y-1 text-gray-600">
                <li>• <kbd>Tab</kbd> - Navigate between interactive elements</li>
                <li>• <kbd>Shift + Tab</kbd> - Navigate backwards</li>
                <li>• <kbd>Escape</kbd> - Close modals and menus</li>
                <li>• Focus indicators are visible on all interactive elements</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Visual Accessibility
              </h3>
              <ul className="space-y-1 text-gray-600">
                <li>• All text meets WCAG AA contrast standards</li>
                <li>• Color is never the only indicator of information</li>
                <li>• Animations respect prefers-reduced-motion settings</li>
                <li>• Text can be resized up to 200% without loss of functionality</li>
              </ul>
            </section>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 bg-electric-600 text-white font-semibold rounded-lg hover:bg-electric-700 transition-colors focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};