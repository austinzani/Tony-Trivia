import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ThumbsUp, Smile } from 'lucide-react';
import { REACTION_CONFIG, type ReactionType } from '../../types/social';
import { cn } from '../../utils/cn';

interface ReactionPickerProps {
  onReaction: (reactionType: ReactionType) => void;
  currentReaction?: ReactionType;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function ReactionPicker({
  onReaction,
  currentReaction,
  disabled = false,
  compact = false,
  className
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReactionClick = (reactionType: ReactionType) => {
    onReaction(reactionType);
    setIsOpen(false);
  };

  const triggerIcon = currentReaction ? (
    <span className="text-xl">{REACTION_CONFIG[currentReaction].emoji}</span>
  ) : (
    <Heart className={cn("w-5 h-5", compact ? "w-4 h-4" : "")} />
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          "bg-white/90 backdrop-blur-sm border-2",
          compact ? "w-8 h-8" : "w-10 h-10",
          currentReaction 
            ? "border-electric-400 text-electric-600" 
            : "border-gray-200 text-gray-600 hover:border-electric-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {triggerIcon}
      </motion.button>

      {/* Reaction Picker Popup */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2",
              "bg-white rounded-2xl shadow-2xl border border-gray-100",
              "p-2 flex gap-1"
            )}
          >
            {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(
              ([type, config]) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onHoverStart={() => setHoveredReaction(type)}
                  onHoverEnd={() => setHoveredReaction(null)}
                  onClick={() => handleReactionClick(type)}
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center",
                    "hover:bg-gray-100 transition-colors",
                    currentReaction === type && "bg-electric-100"
                  )}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  
                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredReaction === type && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap"
                      >
                        {config.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}