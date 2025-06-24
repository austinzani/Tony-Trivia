import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Clock, Zap } from 'lucide-react';

interface GameRoomCardProps {
  room: {
    id: string;
    code: string;
    name: string;
    hostName: string;
    playerCount: number;
    maxPlayers: number;
    status: 'waiting' | 'active' | 'full';
    roundsTotal: number;
    timePerRound: number;
  };
  onJoin: (roomId: string) => void;
  className?: string;
}

export function GameRoomCard({
  room,
  onJoin,
  className = '',
}: GameRoomCardProps) {
  const getStatusConfig = () => {
    switch (room.status) {
      case 'waiting':
        return {
          bgColor: 'from-electric-500 to-electric-600',
          badgeColor: 'bg-energy-green',
          buttonColor: 'bg-electric-500 hover:bg-electric-600',
          statusText: 'Ready to Join',
          icon: <Zap className="w-3 h-3 sm:w-4 sm:h-4" />,
          canJoin: true,
        };
      case 'active':
        return {
          bgColor: 'from-plasma-500 to-plasma-600',
          badgeColor: 'bg-energy-orange',
          buttonColor: 'bg-plasma-500 hover:bg-plasma-600',
          statusText: 'Game in Progress',
          icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
          canJoin: true,
        };
      case 'full':
        return {
          bgColor: 'from-gray-400 to-gray-500',
          badgeColor: 'bg-energy-red',
          buttonColor: 'bg-gray-400 cursor-not-allowed',
          statusText: 'Room Full',
          icon: <Users className="w-3 h-3 sm:w-4 sm:h-4" />,
          canJoin: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-card sm:rounded-2xl bg-gradient-to-br ${statusConfig.bgColor} p-4 sm:p-6 text-white shadow-lg touch-feedback ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-white"></div>
        <div className="absolute -bottom-6 -left-6 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-start justify-between gap-2">
          <div className="flex-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.1,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              className={`inline-flex items-center gap-1 rounded-full ${statusConfig.badgeColor} px-2 sm:px-3 py-1 text-xs font-bold text-white`}
            >
              {statusConfig.icon}
              <span className="hidden sm:inline">{statusConfig.statusText}</span>
              <span className="sm:hidden">
                {room.status === 'waiting' ? 'Open' : 
                 room.status === 'active' ? 'Live' : 'Full'}
              </span>
            </motion.div>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black tracking-wider">
              {room.code}
            </div>
            <div className="text-xs opacity-90">Room Code</div>
          </div>
        </div>

        {/* Room Name */}
        <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold leading-tight line-clamp-2">{room.name}</h3>

        {/* Host Info */}
        <div className="mb-3 sm:mb-4 flex items-center gap-2">
          <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-energy-yellow flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium opacity-90 truncate">
            Host: {room.hostName}
          </span>
        </div>

        {/* Game Stats */}
        <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-base sm:text-lg font-bold">{room.playerCount}</div>
            <div className="text-xs opacity-75">Players</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold">{room.roundsTotal}</div>
            <div className="text-xs opacity-75">Rounds</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold">{room.timePerRound}s</div>
            <div className="text-xs opacity-75">Time</div>
          </div>
        </div>

        {/* Player Count Progress */}
        <div className="mb-3 sm:mb-4">
          <div className="mb-1.5 sm:mb-2 flex justify-between text-xs sm:text-sm">
            <span>Players</span>
            <span>
              {room.playerCount}/{room.maxPlayers}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(room.playerCount / room.maxPlayers) * 100}%`,
              }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full bg-energy-yellow"
            />
          </div>
        </div>

        {/* Join Button */}
        <motion.button
          whileHover={statusConfig.canJoin ? { scale: 1.02 } : {}}
          whileTap={statusConfig.canJoin ? { scale: 0.95 } : {}}
          onClick={() => statusConfig.canJoin && onJoin(room.id)}
          disabled={!statusConfig.canJoin}
          className={`w-full rounded-game ${statusConfig.buttonColor} py-2.5 sm:py-3 min-h-[44px] font-bold text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/50 touch-feedback`}
        >
          {statusConfig.canJoin ? 'Join Room' : 'Room Full'}
        </motion.button>
      </div>
    </motion.div>
  );
}
