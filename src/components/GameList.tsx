import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileCard, MobileButton } from './ui';
import {
  Gamepad2,
  Users,
  Clock,
  Crown,
  Play,
  Monitor,
  Eye,
  ChevronRight,
} from 'lucide-react';

interface GameListProps {
  onJoinAsHost?: (gameId: string) => void;
  showHostOptions?: boolean;
  className?: string;
}

interface MockGame {
  id: string;
  name: string;
  host: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'active' | 'completed';
  created: string;
  category: string;
}

const mockGames: MockGame[] = [
  {
    id: 'GAME01',
    name: 'Friday Night Trivia',
    host: 'Alex Johnson',
    playerCount: 12,
    maxPlayers: 20,
    status: 'active',
    created: '2 hours ago',
    category: 'Mixed',
  },
  {
    id: 'GAME02',
    name: 'Science Quiz Championship',
    host: 'Dr. Sarah Lee',
    playerCount: 8,
    maxPlayers: 16,
    status: 'waiting',
    created: '30 minutes ago',
    category: 'Science',
  },
  {
    id: 'GAME03',
    name: 'Movie Madness',
    host: 'Mike Chen',
    playerCount: 15,
    maxPlayers: 24,
    status: 'active',
    created: '1 hour ago',
    category: 'Entertainment',
  },
  {
    id: 'GAME04',
    name: 'Sports Spectacular',
    host: 'Jessica Brown',
    playerCount: 6,
    maxPlayers: 12,
    status: 'waiting',
    created: '15 minutes ago',
    category: 'Sports',
  },
];

export default function GameList({
  onJoinAsHost,
  showHostOptions = !!onJoinAsHost,
  className = '',
}: GameListProps) {
  const [games, setGames] = useState<MockGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setGames(mockGames);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'waiting':
        return <Clock className="w-3 h-3" />;
      case 'completed':
        return <Eye className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const handleGameClick = (game: MockGame) => {
    if (onJoinAsHost) {
      onJoinAsHost(game.id);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {showHostOptions ? 'Available Games to Host' : 'Active Games'}
          </h3>
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>

        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24 sm:w-32" />
                <div className="h-3 bg-gray-300 rounded w-20 sm:w-24" />
              </div>
              <div className="h-8 w-16 bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {showHostOptions ? 'Available Games to Host' : 'Active Games'}
        </h3>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {games.length} games
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            No Active Games
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            {showHostOptions
              ? 'Create a new game to start hosting!'
              : 'Check back later for active games to join.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-white rounded-lg border border-gray-200 p-3 sm:p-4 transition-all duration-200
                ${
                  showHostOptions
                    ? 'hover:border-blue-300 hover:shadow-md cursor-pointer group'
                    : 'hover:shadow-sm'
                }
              `}
              onClick={() => handleGameClick(game)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {game.name}
                      </h4>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {game.id}
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(game.status)}`}
                    >
                      {getStatusIcon(game.status)}
                      <span className="capitalize">{game.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span>{game.host}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {game.playerCount}/{game.maxPlayers}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{game.created}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {game.category}
                      </span>

                      {showHostOptions && (
                        <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                          <Monitor className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Host</span>
                          <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar for player capacity */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Players</span>
                  <span>
                    {Math.round((game.playerCount / game.maxPlayers) * 100)}%
                    full
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      game.playerCount / game.maxPlayers > 0.8
                        ? 'bg-red-500'
                        : game.playerCount / game.maxPlayers > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${(game.playerCount / game.maxPlayers) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Additional Info for Host Mode */}
      {showHostOptions && games.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Monitor className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Host Mode</h4>
              <p className="text-sm text-blue-700">
                Click on any game to take over hosting duties. You'll get full
                host controls including game flow management, answer review, and
                scoring controls.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
