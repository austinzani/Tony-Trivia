import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_CONFIG, type Reaction, type ReactionType } from '../../types/social';
import { SocialService } from '../../services/socialService';
import { cn } from '../../utils/cn';

interface ReactionDisplayProps {
  reactions: Reaction[];
  onReactionToggle?: (reactionType: ReactionType) => void;
  currentUserReaction?: ReactionType;
  maxDisplay?: number;
  showNames?: boolean;
  animated?: boolean;
  className?: string;
}

interface ReactionGroup {
  type: ReactionType;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

export function ReactionDisplay({
  reactions,
  onReactionToggle,
  currentUserReaction,
  maxDisplay = 3,
  showNames = true,
  animated = true,
  className
}: ReactionDisplayProps) {
  const [reactionGroups, setReactionGroups] = useState<ReactionGroup[]>([]);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  useEffect(() => {
    // Group reactions by type
    const groups = reactions.reduce((acc, reaction) => {
      const existing = acc.find(g => g.type === reaction.reaction_type);
      const userName = reaction.user?.display_name || 'Anonymous';
      
      if (existing) {
        existing.count++;
        existing.users.push(userName);
        if (reaction.reaction_type === currentUserReaction) {
          existing.hasCurrentUser = true;
        }
      } else {
        acc.push({
          type: reaction.reaction_type,
          count: 1,
          users: [userName],
          hasCurrentUser: reaction.reaction_type === currentUserReaction
        });
      }
      
      return acc;
    }, [] as ReactionGroup[]);

    // Sort by count descending
    groups.sort((a, b) => b.count - a.count);
    
    setReactionGroups(groups);
  }, [reactions, currentUserReaction]);

  const displayedGroups = maxDisplay ? reactionGroups.slice(0, maxDisplay) : reactionGroups;
  const remainingCount = reactionGroups.length - displayedGroups.length;
  const totalReactions = reactions.length;

  if (totalReactions === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Reaction Pills */}
      <div className="flex -space-x-1">
        <AnimatePresence mode="popLayout">
          {displayedGroups.map((group, index) => {
            const config = REACTION_CONFIG[group.type];
            
            return (
              <motion.button
                key={group.type}
                layout
                initial={animated ? { scale: 0, opacity: 0 } : undefined}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReactionToggle?.(group.type)}
                onHoverStart={() => setHoveredReaction(group.type)}
                onHoverEnd={() => setHoveredReaction(null)}
                className={cn(
                  "relative flex items-center gap-1 px-2 py-1 rounded-full",
                  "bg-white border-2 shadow-sm transition-all",
                  group.hasCurrentUser 
                    ? "border-electric-400 bg-electric-50" 
                    : "border-gray-200 hover:border-electric-300",
                  onReactionToggle && "cursor-pointer"
                )}
                style={{ zIndex: displayedGroups.length - index }}
              >
                <span className="text-sm">{config.emoji}</span>
                <span className={cn(
                  "text-xs font-medium",
                  group.hasCurrentUser ? "text-electric-700" : "text-gray-700"
                )}>
                  {group.count}
                </span>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredReaction === group.type && showNames && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50"
                    >
                      <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 max-w-xs">
                        <div className="font-semibold mb-1">{config.label}</div>
                        <div className="text-gray-300">
                          {group.users.slice(0, 3).join(', ')}
                          {group.users.length > 3 && ` and ${group.users.length - 3} more`}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Remaining count */}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs text-gray-500 font-medium"
        >
          +{remainingCount}
        </motion.div>
      )}

      {/* Total count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-gray-600 ml-1"
      >
        {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
      </motion.div>
    </div>
  );
}

// Floating reactions animation component
export function FloatingReactions({ 
  reactions,
  duration = 3000 
}: { 
  reactions: ReactionType[];
  duration?: number;
}) {
  const [floatingReactions, setFloatingReactions] = useState<{
    id: string;
    type: ReactionType;
    startTime: number;
  }[]>([]);

  useEffect(() => {
    reactions.forEach((type, index) => {
      setTimeout(() => {
        const id = `${type}-${Date.now()}`;
        setFloatingReactions(prev => [...prev, { id, type, startTime: Date.now() }]);
        
        // Remove after animation
        setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, duration);
      }, index * 100);
    });
  }, [reactions, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {floatingReactions.map(({ id, type }) => {
          const config = REACTION_CONFIG[type];
          const randomX = Math.random() * 200 - 100;
          
          return (
            <motion.div
              key={id}
              initial={{ 
                x: window.innerWidth / 2 + randomX,
                y: window.innerHeight - 100,
                scale: 0,
                opacity: 0 
              }}
              animate={{ 
                y: window.innerHeight / 2,
                scale: [0, 1.5, 1],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ 
                duration: duration / 1000,
                ease: "easeOut"
              }}
              className="absolute text-4xl"
            >
              {config.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}