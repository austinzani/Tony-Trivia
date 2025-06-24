import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Star, Shield } from 'lucide-react';
import MobileCard from './MobileCard';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role?: 'captain' | 'member';
  score?: number;
  isOnline?: boolean;
}

interface MobileTeamDisplayProps {
  teamName: string;
  teamScore: number;
  members: TeamMember[];
  rank?: number;
  variant?: 'compact' | 'full' | 'selection';
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

const MobileTeamDisplay: React.FC<MobileTeamDisplayProps> = ({
  teamName,
  teamScore,
  members,
  rank,
  variant = 'full',
  isSelected = false,
  onSelect,
  className = '',
}) => {
  const captain = members.find(m => m.role === 'captain');
  const onlineCount = members.filter(m => m.isOnline).length;

  const renderCompact = () => (
    <MobileCard
      variant="team"
      padding="sm"
      interactive={!!onSelect}
      active={isSelected}
      onClick={onSelect}
      className={className}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {rank && (
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${rank === 1 ? 'bg-energy-yellow text-electric-900' :
                rank === 2 ? 'bg-gray-300 text-gray-700' :
                rank === 3 ? 'bg-orange-400 text-white' :
                'bg-gray-100 text-gray-600'}
            `}>
              {rank}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {teamName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{members.length} members</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-electric-600">
            {teamScore.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">points</div>
        </div>
      </div>
    </MobileCard>
  );

  const renderFull = () => (
    <MobileCard
      variant="game"
      padding="md"
      interactive={!!onSelect}
      active={isSelected}
      onClick={onSelect}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
            {teamName}
          </h3>
          {captain && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Crown className="w-4 h-4 text-energy-yellow" />
              <span>Captain: {captain.name}</span>
            </div>
          )}
        </div>
        {rank && (
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${rank === 1 ? 'bg-energy-yellow text-electric-900 shadow-yellow' :
              rank === 2 ? 'bg-gray-300 text-gray-700' :
              rank === 3 ? 'bg-orange-400 text-white' :
              'bg-gray-100 text-gray-600'}
          `}>
            {rank}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="bg-gradient-to-r from-electric-500 to-plasma-500 text-white rounded-game p-3 mb-4">
        <div className="text-xs opacity-90">Team Score</div>
        <div className="text-2xl font-bold">
          {teamScore.toLocaleString()}
        </div>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span className="font-medium">Team Members</span>
          <span className="text-xs">{onlineCount}/{members.length} online</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {members.slice(0, 4).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 bg-gray-50 rounded-game p-2"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-400 to-plasma-400 flex items-center justify-center text-white font-semibold text-xs">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                {member.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-energy-green rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">
                  {member.name}
                </div>
                {member.role === 'captain' && (
                  <Crown className="w-3 h-3 text-energy-yellow" />
                )}
              </div>
            </div>
          ))}
        </div>
        {members.length > 4 && (
          <div className="text-center text-xs text-gray-500 pt-1">
            +{members.length - 4} more members
          </div>
        )}
      </div>
    </MobileCard>
  );

  const renderSelection = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`cursor-pointer ${className}`}
    >
      <MobileCard
        variant={isSelected ? 'game' : 'default'}
        padding="md"
        className={`
          border-2 transition-all duration-200
          ${isSelected 
            ? 'border-electric-500 shadow-electric' 
            : 'border-transparent hover:border-electric-200'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${isSelected 
                ? 'bg-gradient-to-br from-electric-500 to-plasma-500 text-white' 
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{teamName}</h4>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{members.length} members</span>
                <span>•</span>
                <span>{teamScore} pts</span>
              </div>
            </div>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-electric-500 text-white rounded-full p-2"
            >
              <Shield className="w-5 h-5" />
            </motion.div>
          )}
        </div>
      </MobileCard>
    </motion.div>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'selection':
      return renderSelection();
    case 'full':
    default:
      return renderFull();
  }
};

export default MobileTeamDisplay;