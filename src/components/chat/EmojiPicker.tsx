import React, { useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const GAME_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘',
  '😎', '🤓', '🧐', '🤔', '😮', '😲', '😳', '🤯',
  '🎉', '🎊', '🎈', '🎯', '🏆', '🥇', '🥈', '🥉',
  '👏', '👍', '👎', '👊', '✊', '🤝', '🙏', '💪',
  '🔥', '⚡', '✨', '💥', '💫', '⭐', '🌟', '💯',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first emoji button when opened
    setTimeout(() => {
      const firstButton = pickerRef.current?.querySelector('button');
      firstButton?.focus();
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="emoji-picker card-game"
      role="dialog"
      aria-label="Emoji picker"
      aria-modal="true"
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 'var(--space-sm)',
        padding: 'var(--space-md)',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        width: '320px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 100,
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <div 
        className="emoji-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 'var(--space-xs)',
        }}
      >
        {GAME_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="emoji-button"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '0.5rem',
              padding: 'var(--space-xs)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-electric-100)';
              e.currentTarget.style.borderColor = 'var(--color-electric-300)';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label={`Select ${emoji} emoji`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};