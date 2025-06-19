import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './AnimatedButton';
import type { AvatarOption } from '../types/profile';

interface AvatarSelectorProps {
  currentAvatar?: string;
  userLevel: number;
  userAchievements: string[];
  onAvatarSelect: (avatarUrl: string) => void;
  onUpload?: (file: File) => void;
}

// Gaming-themed avatar collection
const AVATAR_OPTIONS: AvatarOption[] = [
  // Default/Common Avatars
  {
    id: 'brain-1',
    name: 'Smart Brain',
    url: '🧠',
    category: 'default',
    rarity: 'common',
  },
  {
    id: 'lightning-1',
    name: 'Lightning Bolt',
    url: '⚡',
    category: 'default',
    rarity: 'common',
  },
  {
    id: 'target-1',
    name: 'Bullseye',
    url: '🎯',
    category: 'default',
    rarity: 'common',
  },
  {
    id: 'gamepad-1',
    name: 'Gamer',
    url: '🎮',
    category: 'gaming',
    rarity: 'common',
  },

  // Gaming Avatars
  {
    id: 'wizard-1',
    name: 'Trivia Wizard',
    url: '🧙‍♂️',
    category: 'gaming',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 5 },
  },
  {
    id: 'ninja-1',
    name: 'Quiz Ninja',
    url: '🥷',
    category: 'gaming',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 8 },
  },
  {
    id: 'robot-1',
    name: 'Answer Bot',
    url: '🤖',
    category: 'gaming',
    rarity: 'epic',
    unlockRequirement: { type: 'achievement', value: 'tech-master' },
  },
  {
    id: 'alien-1',
    name: 'Brain Alien',
    url: '👽',
    category: 'gaming',
    rarity: 'epic',
    unlockRequirement: { type: 'level', value: 15 },
  },

  // Animal Avatars
  {
    id: 'owl-1',
    name: 'Wise Owl',
    url: '🦉',
    category: 'animals',
    rarity: 'rare',
    unlockRequirement: { type: 'games', value: 50 },
  },
  {
    id: 'fox-1',
    name: 'Clever Fox',
    url: '🦊',
    category: 'animals',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 10 },
  },
  {
    id: 'dolphin-1',
    name: 'Smart Dolphin',
    url: '🐬',
    category: 'animals',
    rarity: 'epic',
    unlockRequirement: { type: 'achievement', value: 'marine-biologist' },
  },

  // Special/Legendary Avatars
  {
    id: 'crown-1',
    name: 'Trivia King',
    url: '👑',
    category: 'gaming',
    rarity: 'legendary',
    unlockRequirement: { type: 'level', value: 25 },
  },
  {
    id: 'diamond-1',
    name: 'Diamond Mind',
    url: '💎',
    category: 'abstract',
    rarity: 'legendary',
    unlockRequirement: { type: 'achievement', value: 'perfect-streak' },
  },
  {
    id: 'fire-1',
    name: 'Quiz Master',
    url: '🔥',
    category: 'gaming',
    rarity: 'legendary',
    unlockRequirement: { type: 'score', value: 1000 },
  },

  // Abstract Avatars
  {
    id: 'star-1',
    name: 'Rising Star',
    url: '⭐',
    category: 'abstract',
    rarity: 'rare',
    unlockRequirement: { type: 'level', value: 12 },
  },
  {
    id: 'rocket-1',
    name: 'Knowledge Rocket',
    url: '🚀',
    category: 'abstract',
    rarity: 'epic',
    unlockRequirement: { type: 'games', value: 100 },
  },
  {
    id: 'trophy-1',
    name: 'Champion',
    url: '🏆',
    category: 'gaming',
    rarity: 'epic',
    unlockRequirement: { type: 'achievement', value: 'tournament-winner' },
  },
];

const AvatarCard: React.FC<{
  avatar: AvatarOption;
  isSelected: boolean;
  isUnlocked: boolean;
  onClick: () => void;
}> = ({ avatar, isSelected, isUnlocked, onClick }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  const rarityBorders = {
    common: 'border-gray-300',
    rare: 'border-blue-300',
    epic: 'border-purple-300',
    legendary: 'border-yellow-300',
  };

  return (
    <motion.div
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-electric-500 bg-electric-50'
          : isUnlocked
            ? `${rarityBorders[avatar.rarity]} bg-white hover:bg-gray-50`
            : 'border-gray-200 bg-gray-100'
      }`}
      onClick={isUnlocked ? onClick : undefined}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      layout
    >
      {/* Rarity Badge */}
      <div
        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r ${rarityColors[avatar.rarity]} flex items-center justify-center`}
      >
        <div className="text-white text-xs font-bold">
          {avatar.rarity === 'common'
            ? 'C'
            : avatar.rarity === 'rare'
              ? 'R'
              : avatar.rarity === 'epic'
                ? 'E'
                : 'L'}
        </div>
      </div>

      {/* Avatar Display */}
      <div
        className={`text-6xl text-center mb-3 ${!isUnlocked ? 'grayscale opacity-50' : ''}`}
      >
        {avatar.url}
      </div>

      {/* Avatar Name */}
      <div
        className={`text-sm font-semibold text-center ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}
      >
        {avatar.name}
      </div>

      {/* Lock Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <div className="text-2xl">🔒</div>
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-electric-500 rounded-full flex items-center justify-center text-white text-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
};

const CategoryFilter: React.FC<{
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}> = ({ categories, activeCategory, onCategoryChange }) => {
  const categoryIcons = {
    all: '🌟',
    default: '⭐',
    gaming: '🎮',
    animals: '🦊',
    abstract: '💫',
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(category => (
        <AnimatedButton
          key={category}
          variant={activeCategory === category ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className="capitalize"
        >
          <span className="mr-2">
            {categoryIcons[category as keyof typeof categoryIcons]}
          </span>
          {category}
        </AnimatedButton>
      ))}
    </div>
  );
};

export default function AvatarSelector({
  currentAvatar,
  userLevel,
  userAchievements,
  onAvatarSelect,
  onUpload,
}: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentAvatar || AVATAR_OPTIONS[0].url
  );
  const [showUpload, setShowUpload] = useState(false);

  // Check if avatar is unlocked
  const isAvatarUnlocked = (avatar: AvatarOption): boolean => {
    if (!avatar.unlockRequirement) return true;

    const { type, value } = avatar.unlockRequirement;

    switch (type) {
      case 'level':
        return userLevel >= (value as number);
      case 'achievement':
        return userAchievements.includes(value as string);
      case 'games':
        // This would need to be passed as a prop in a real implementation
        return userLevel >= 5; // Simplified for demo
      case 'score':
        // This would need to be passed as a prop in a real implementation
        return userLevel >= 10; // Simplified for demo
      default:
        return false;
    }
  };

  // Filter avatars by category
  const filteredAvatars = AVATAR_OPTIONS.filter(
    avatar => selectedCategory === 'all' || avatar.category === selectedCategory
  );

  // Get unique categories
  const categories = [
    'all',
    ...Array.from(new Set(AVATAR_OPTIONS.map(a => a.category))),
  ];

  const handleAvatarSelect = (avatar: AvatarOption) => {
    if (isAvatarUnlocked(avatar)) {
      setSelectedAvatar(avatar.url);
      onAvatarSelect(avatar.url);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
      setShowUpload(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-2">
          🎭 Choose Your Avatar
        </h3>
        <p className="text-gray-600">
          Express yourself with a unique avatar! Unlock more by leveling up and
          earning achievements.
        </p>
      </div>

      {/* Current Avatar Preview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center">
        <div className="text-8xl mb-4">{selectedAvatar}</div>
        <div className="text-lg font-semibold text-gray-700">
          Current Selection
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        activeCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Avatar Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        {filteredAvatars.map(avatar => (
          <motion.div key={avatar.id} variants={itemVariants}>
            <AvatarCard
              avatar={avatar}
              isSelected={selectedAvatar === avatar.url}
              isUnlocked={isAvatarUnlocked(avatar)}
              onClick={() => handleAvatarSelect(avatar)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Upload Custom Avatar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <h4 className="text-lg font-semibold text-electric-700 mb-4">
          📸 Custom Avatar
        </h4>

        {!showUpload ? (
          <AnimatedButton
            variant="secondary"
            onClick={() => setShowUpload(true)}
            className="w-full"
          >
            Upload Custom Avatar
          </AnimatedButton>
        ) : (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full p-3 border-2 border-electric-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowUpload(false)}
                className="flex-1"
              >
                Cancel
              </AnimatedButton>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Supported formats: JPG, PNG, GIF (max 2MB)
            </p>
          </div>
        )}
      </div>

      {/* Unlock Progress */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <h4 className="text-lg font-semibold text-electric-700 mb-4">
          🔓 Unlock Progress
        </h4>

        <div className="space-y-3">
          {AVATAR_OPTIONS.filter(a => !isAvatarUnlocked(a))
            .slice(0, 3)
            .map(avatar => {
              const req = avatar.unlockRequirement!;
              let progressText = '';

              switch (req.type) {
                case 'level':
                  progressText = `Reach Level ${req.value} (Current: ${userLevel})`;
                  break;
                case 'achievement':
                  progressText = `Unlock "${req.value}" achievement`;
                  break;
                case 'games':
                  progressText = `Play ${req.value} games`;
                  break;
                case 'score':
                  progressText = `Reach ${req.value} total score`;
                  break;
              }

              return (
                <div
                  key={avatar.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl grayscale opacity-50">
                      {avatar.url}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {avatar.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {progressText}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                    {avatar.rarity}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
