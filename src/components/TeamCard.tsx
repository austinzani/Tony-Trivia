import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Crown,
  UserPlus,
  LogOut,
  MoreVertical,
  Trophy,
  Zap,
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Team {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  logo_url?: string;
  score?: number;
  created_at: string;
  team_members?: TeamMember[];
}

interface TeamCardProps {
  team: Team;
  currentUserId?: string;
  isUserTeam?: boolean;
  canJoin?: boolean;
  maxMembers?: number;
  onJoinTeam?: (teamId: string) => void;
  onLeaveTeam?: (teamId: string) => void;
  onManageTeam?: (teamId: string) => void;
  className?: string;
}

export function TeamCard({
  team,
  currentUserId,
  isUserTeam = false,
  canJoin = false,
  maxMembers = 6,
  onJoinTeam,
  onLeaveTeam,
  onManageTeam,
  className = '',
}: TeamCardProps) {
  const members = team.team_members || [];
  const currentMember = members.find(m => m.user_id === currentUserId);
  const isCaptain = currentMember?.role === 'captain';
  const memberCount = members.length;
  const isFull = memberCount >= maxMembers;

  const teamColors = [
    'from-energy-red-400 to-energy-red-500',
    'from-energy-orange-400 to-energy-orange-500',
    'from-energy-yellow-400 to-energy-yellow-500',
    'from-energy-green-400 to-energy-green-500',
    'from-electric-blue-400 to-electric-blue-500',
    'from-plasma-purple-400 to-plasma-purple-500',
  ];

  const getTeamColor = (teamId: string) => {
    const index = parseInt(teamId.slice(-1), 16) % teamColors.length;
    return teamColors[index];
  };

  const cardVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      scale: 1.02,
      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      className={`relative overflow-hidden rounded-2xl bg-white border-2 ${
        isUserTeam
          ? 'border-electric-blue-300 bg-gradient-to-br from-electric-blue-50 to-plasma-purple-50'
          : 'border-gray-200 hover:border-electric-blue-200'
      } ${className}`}
    >
      {/* Team Color Header */}
      <div className={`h-3 bg-gradient-to-r ${getTeamColor(team.id)}`} />

      {/* Team Badge */}
      {isUserTeam && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="absolute top-4 right-4 bg-gradient-to-r from-energy-green-400 to-energy-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
        >
          <Zap className="h-3 w-3" />
          YOUR TEAM
        </motion.div>
      )}

      <div className="p-6">
        {/* Team Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {team.name}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <Users className="h-4 w-4" />
                {memberCount}/{maxMembers}
              </span>
              {team.score !== undefined && (
                <span className="flex items-center gap-1 text-energy-orange-600 font-semibold">
                  <Trophy className="h-4 w-4" />
                  {team.score} pts
                </span>
              )}
            </div>
          </div>

          {isCaptain && (
            <button
              onClick={() => onManageTeam?.(team.id)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Manage Team"
            >
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Team Members */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Members</h4>
          <div className="space-y-2">
            {members.map(member => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
              >
                <div className="flex-shrink-0">
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      alt={member.profiles.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-electric-blue-400 to-plasma-purple-400 flex items-center justify-center text-white text-sm font-bold">
                      {member.profiles?.username?.charAt(0).toUpperCase() ||
                        '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {member.profiles?.username || 'Unknown'}
                    </span>
                    {member.role === 'captain' && (
                      <Crown className="h-4 w-4 text-energy-yellow-500" />
                    )}
                  </div>
                  {member.profiles?.full_name && (
                    <span className="text-xs text-gray-500 truncate">
                      {member.profiles.full_name}
                    </span>
                  )}
                </div>

                {member.user_id === currentUserId && (
                  <span className="text-xs text-energy-green-600 font-medium">
                    You
                  </span>
                )}
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, maxMembers - memberCount) }).map(
              (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg border-2 border-dashed border-gray-200"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">Open slot</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {canJoin && !isUserTeam && !isFull && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onJoinTeam?.(team.id)}
              className="flex-1 bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-electric-blue-600 hover:to-plasma-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Join Team
            </motion.button>
          )}

          {canJoin && !isUserTeam && isFull && (
            <div className="flex-1 bg-gray-100 text-gray-500 font-medium py-3 px-4 rounded-xl text-center">
              Team Full
            </div>
          )}

          {isUserTeam && !isCaptain && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLeaveTeam?.(team.id)}
              className="flex-1 bg-gradient-to-r from-energy-red-400 to-energy-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-energy-red-500 hover:to-energy-red-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave Team
            </motion.button>
          )}

          {isCaptain && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onManageTeam?.(team.id)}
              className="flex-1 bg-gradient-to-r from-energy-orange-400 to-energy-yellow-400 text-white font-semibold py-3 px-4 rounded-xl hover:from-energy-orange-500 hover:to-energy-yellow-500 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Manage Team
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TeamCard;
