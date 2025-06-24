import React, { useState, useRef, KeyboardEvent } from 'react';
import { EmojiPicker } from './EmojiPicker';

interface ChatInputProps {
  onSendMessage: (message: string, type: 'text' | 'emoji') => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onSendMessage(emoji, 'emoji');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div 
      className="chat-input-container"
      role="form"
      aria-label="Send message"
      style={{
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--color-electric-200)',
        background: 'white',
        borderRadius: '0 0 1rem 1rem',
      }}
    >
      <div 
        className="input-wrapper"
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            disabled={disabled}
            maxLength={500}
            aria-label="Chat message"
            aria-describedby={message.length > 400 ? "char-count" : undefined}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: '0.5rem',
              border: '2px solid var(--color-electric-200)',
              fontSize: 'var(--text-md)',
              outline: 'none',
              transition: 'all var(--transition-fast)',
              background: disabled ? 'var(--color-electric-50)' : 'white',
              color: disabled ? 'var(--color-neutral)' : 'var(--color-electric-900)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-electric-400)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-electric-200)';
              e.target.style.boxShadow = 'none';
            }}
          />
          
          {/* Character count */}
          {message.length > 400 && (
            <span 
              id="char-count"
              aria-live="polite"
              style={{
                position: 'absolute',
                right: 'var(--space-sm)',
                bottom: '-20px',
                fontSize: 'var(--text-xs)',
                color: message.length > 480 
                  ? 'var(--color-energy-red)' 
                  : 'var(--color-neutral)',
              }}
            >
              {message.length}/500 characters
            </span>
          )}
        </div>
        
        {/* Emoji button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="btn-game-secondary"
          style={{
            padding: 'var(--space-sm)',
            width: '40px',
            height: '40px',
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Add emoji"
        >
          😊
        </button>
        
        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="btn-game-primary"
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: '0.5rem',
            fontSize: 'var(--text-md)',
            fontWeight: '600',
            minWidth: '80px',
            opacity: disabled || !message.trim() ? 0.5 : 1,
            cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker 
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};