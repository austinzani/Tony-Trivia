import React from 'react';
import { ChatMessage } from '../../types/database';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  isHost: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isOwnMessage,
  isHost
}) => {
  const getMessageStyle = () => {
    switch (message.message_type) {
      case 'system':
        return {
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          color: 'var(--color-electric-900)',
          border: '1px solid var(--color-energy-yellow)',
          textAlign: 'center' as const,
          fontStyle: 'italic',
        };
      case 'game_event':
        return {
          background: 'linear-gradient(135deg, var(--color-electric-100), var(--color-electric-200))',
          color: 'var(--color-electric-800)',
          border: '1px solid var(--color-electric-300)',
          textAlign: 'center' as const,
          fontWeight: '600',
        };
      case 'emoji':
        return {
          background: 'transparent',
          fontSize: '2rem',
          padding: '0',
        };
      default:
        return isOwnMessage ? {
          background: 'linear-gradient(135deg, var(--color-electric-500), var(--color-electric-600))',
          color: 'white',
          marginLeft: 'auto',
        } : {
          background: 'white',
          color: 'var(--color-electric-900)',
          border: '1px solid var(--color-electric-200)',
          marginRight: 'auto',
        };
    }
  };

  const baseStyle = {
    padding: message.message_type === 'emoji' ? '0' : 'var(--space-sm) var(--space-md)',
    borderRadius: '0.75rem',
    marginBottom: 'var(--space-sm)',
    maxWidth: '70%',
    wordWrap: 'break-word' as const,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'transform var(--transition-fast)',
    ...getMessageStyle(),
  };

  return (
    <div 
      className={`chat-message ${message.message_type}`}
      role="article"
      aria-label={`Message from ${message.user?.display_name || 'Unknown user'} at ${new Date(message.created_at).toLocaleTimeString()}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: 'var(--space-sm)',
        animation: 'messageSlideIn 0.3s ease-out',
      }}
    >
      {/* User/Team info */}
      {!isOwnMessage && message.message_type === 'text' && (
        <div 
          className="message-meta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-xs)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-neutral)',
          }}
        >
          {message.user?.avatar_url && (
            <img 
              src={message.user.avatar_url} 
              alt={message.user.display_name}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid var(--color-electric-200)',
              }}
            />
          )}
          <span style={{ fontWeight: '500' }}>
            {message.user?.display_name || 'Anonymous'}
          </span>
          {message.team && (
            <span 
              className="team-badge"
              style={{
                fontSize: 'var(--text-xs)',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                background: 'var(--color-plasma-100)',
                color: 'var(--color-plasma-700)',
                fontWeight: '600',
              }}
            >
              {message.team.name}
            </span>
          )}
        </div>
      )}
      
      {/* Message content */}
      <div 
        className="message-content"
        style={baseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {message.message}
      </div>
      
      {/* Timestamp for own messages */}
      {isOwnMessage && (
        <div 
          className="message-time"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-neutral)',
            marginTop: '0.125rem',
          }}
        >
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}
    </div>
  );
};