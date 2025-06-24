import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/database';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useAuth } from '../../hooks/useAuth';

interface ChatWindowProps {
  gameRoomId: string;
  teamId?: string;
  isHost?: boolean;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  gameRoomId, 
  teamId, 
  isHost = false,
  className = '' 
}) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    connectionState
  } = useChatMessages(gameRoomId, teamId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, type: 'text' | 'emoji' = 'text') => {
    if (!user) return;
    
    await sendMessage({
      message,
      message_type: type,
      user_id: user.id,
      team_id: teamId,
      game_room_id: gameRoomId
    });
  };

  return (
    <div 
      className={`card-game ${isMinimized ? 'chat-minimized' : 'chat-expanded'} ${className}`}
      role="region"
      aria-label="Team chat"
      aria-expanded={!isMinimized}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMinimized ? 'auto' : '400px',
        maxHeight: '80vh',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        transition: 'all var(--transition-normal)',
      }}
    >
      <ChatHeader 
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        connectionState={connectionState}
        messageCount={messages.length}
      />
      
      {!isMinimized && (
        <>
          <div 
            className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {error && (
              <div 
                className="error-message mb-4"
                role="alert"
                aria-live="assertive"
              >
                <span>Oops! Chat connection got a bit mixed up</span>
              </div>
            )}
            
            <ChatMessageList 
              messages={messages}
              currentUserId={user?.id}
              isHost={isHost}
            />
            
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
          
          <ChatInput 
            onSendMessage={handleSendMessage}
            disabled={!connectionState.isConnected || isLoading}
          />
        </>
      )}
    </div>
  );
};