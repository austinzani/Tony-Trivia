import React from 'react';

interface ChatHeaderProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  connectionState: {
    isConnected: boolean;
    isSubscribed: boolean;
  };
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isMinimized,
  onToggleMinimize,
  connectionState,
  messageCount
}) => {
  return (
    <div 
      className="chat-header"
      style={{
        padding: 'var(--space-md)',
        background: 'linear-gradient(135deg, var(--color-electric-500), var(--color-plasma-500))',
        color: 'white',
        borderRadius: isMinimized ? '1rem' : '1rem 1rem 0 0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
      }}
      onClick={onToggleMinimize}
    >
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg">Team Chat</h3>
        {messageCount > 0 && isMinimized && (
          <span 
            className="badge badge--new"
            style={{
              background: 'var(--color-energy-yellow)',
              color: 'var(--color-electric-900)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.5rem',
              fontSize: 'var(--text-sm)',
              fontWeight: '600',
            }}
          >
            {messageCount}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div 
          className="connection-indicator"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connectionState.isConnected 
              ? 'var(--color-energy-green)' 
              : 'var(--color-energy-red)',
            boxShadow: connectionState.isConnected
              ? '0 0 8px rgba(6, 214, 160, 0.8)'
              : '0 0 8px rgba(239, 71, 111, 0.8)',
            animation: !connectionState.isConnected ? 'pulse 2s infinite' : 'none',
          }}
          title={connectionState.isConnected ? 'Connected' : 'Reconnecting...'}
        />
        
        <button
          className="minimize-button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            transition: 'background var(--transition-fast)',
          }}
          aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>
    </div>
  );
};