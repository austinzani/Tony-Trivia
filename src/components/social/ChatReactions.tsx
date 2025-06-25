import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ReactionPicker } from './ReactionPicker';
import { ReactionDisplay, FloatingReactions } from './ReactionDisplay';
import { SocialService } from '../../services/socialService';
import { REACTION_CONFIG, type Reaction, type ReactionType } from '../../types/social';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

interface ChatReactionsProps {
  messageId: string;
  gameRoomId: string;
  teamId?: string;
  className?: string;
}

export function ChatReactions({
  messageId,
  gameRoomId,
  teamId,
  className
}: ChatReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUserReaction, setCurrentUserReaction] = useState<ReactionType | undefined>();
  const [newReactions, setNewReactions] = useState<ReactionType[]>([]);

  useEffect(() => {
    loadReactions();

    // Subscribe to real-time updates
    const subscription = SocialService.subscribeToReactions(gameRoomId, (payload) => {
      if (payload.new?.target_id === messageId && payload.new?.target_type === 'chat_message') {
        if (payload.eventType === 'INSERT') {
          setReactions(prev => [...prev, payload.new as Reaction]);
          // Trigger floating animation for others' reactions
          if (payload.new.user_id !== user?.id) {
            setNewReactions(prev => [...prev, payload.new.reaction_type]);
          }
        } else if (payload.eventType === 'DELETE') {
          setReactions(prev => prev.filter(r => r.id !== payload.old.id));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [messageId, gameRoomId, user?.id]);

  const loadReactions = async () => {
    const data = await SocialService.getReactions({
      targetType: 'chat_message',
      targetId: messageId
    });
    setReactions(data);
    
    // Find current user's reaction
    const userReaction = data.find(r => r.user_id === user?.id);
    setCurrentUserReaction(userReaction?.reaction_type);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (!user) return;

    // If user already has this reaction, remove it
    if (currentUserReaction === reactionType) {
      const existingReaction = reactions.find(
        r => r.user_id === user.id && r.reaction_type === reactionType
      );
      if (existingReaction) {
        await SocialService.removeReaction(existingReaction.id);
        setCurrentUserReaction(undefined);
      }
    } else {
      // Remove existing reaction if any
      if (currentUserReaction) {
        const existingReaction = reactions.find(
          r => r.user_id === user.id && r.reaction_type === currentUserReaction
        );
        if (existingReaction) {
          await SocialService.removeReaction(existingReaction.id);
        }
      }

      // Add new reaction
      await SocialService.addReaction({
        gameRoomId,
        targetType: 'chat_message',
        targetId: messageId,
        reactionType,
        teamId
      });
      setCurrentUserReaction(reactionType);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Reaction Picker */}
      <ReactionPicker
        onReaction={handleReaction}
        currentReaction={currentUserReaction}
        compact
      />

      {/* Reaction Display */}
      {reactions.length > 0 && (
        <ReactionDisplay
          reactions={reactions}
          onReactionToggle={handleReaction}
          currentUserReaction={currentUserReaction}
          showNames
          animated
        />
      )}

      {/* Floating Reactions */}
      <FloatingReactions reactions={newReactions} />
    </div>
  );
}

// Quick reaction bar for common reactions
export function QuickReactionBar({
  onReaction,
  className
}: {
  onReaction: (reactionType: ReactionType) => void;
  className?: string;
}) {
  const quickReactions: ReactionType[] = ['like', 'love', 'laugh', 'fire', 'clap'];

  return (
    <div className={cn("flex items-center gap-1 p-2 bg-gray-50 rounded-lg", className)}>
      {quickReactions.map((type) => (
        <motion.button
          key={type}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReaction(type)}
          className="w-8 h-8 rounded hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <span className="text-lg">{REACTION_CONFIG[type].emoji}</span>
        </motion.button>
      ))}
    </div>
  );
}