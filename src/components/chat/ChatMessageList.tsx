import React from 'react';
import { ChatMessage } from '../../types/database';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isHost: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  isHost
}) => {
  if (messages.length === 0) {
    return (
      <div 
        className="empty-chat"
        style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          color: 'var(--color-neutral)',
          fontSize: 'var(--text-md)',
        }}
      >
        <p style={{ marginBottom: 'var(--space-sm)' }}>No messages yet!</p>
        <p style={{ fontSize: 'var(--text-sm)', opacity: 0.8 }}>
          Be the first to break the ice
        </p>
      </div>
    );
  }

  // Group messages by time (5-minute intervals)
  const groupedMessages = messages.reduce((groups, message) => {
    const messageTime = new Date(message.created_at);
    const timeKey = new Date(
      messageTime.getFullYear(),
      messageTime.getMonth(),
      messageTime.getDate(),
      messageTime.getHours(),
      Math.floor(messageTime.getMinutes() / 5) * 5
    ).toISOString();
    
    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="chat-messages">
      {Object.entries(groupedMessages).map(([timeKey, groupMessages]) => (
        <div key={timeKey} className="message-group">
          <div 
            className="time-divider"
            style={{
              textAlign: 'center',
              margin: 'var(--space-md) 0',
              position: 'relative',
            }}
          >
            <span 
              style={{
                background: 'white',
                padding: '0 var(--space-sm)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-neutral)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {new Date(timeKey).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'var(--color-electric-200)',
                transform: 'translateY(-50%)',
                zIndex: 0,
              }}
            />
          </div>
          
          {groupMessages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwnMessage={message.user_id === currentUserId}
              isHost={isHost}
            />
          ))}
        </div>
      ))}
    </div>
  );
};