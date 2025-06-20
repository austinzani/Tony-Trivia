import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Copy,
  Trophy,
  Clock,
  Zap,
  Star,
  BarChart3,
  Award,
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  team?: string;
  score: number;
  status: 'online' | 'offline' | 'away';
  isHost?: boolean;
}

interface Team {
  id: string;
  name: string;
  members: Player[];
  score: number;
  color: string;
  captain?: string;
}

interface GameState {
  phase: 'lobby' | 'playing' | 'review' | 'finished';
  currentRound: number;
  totalRounds: number;
  questionNumber: number;
  timeRemaining: number;
  isActive: boolean;
}

interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  settings: {
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    timePerQuestion: number;
    pointsToWin: number;
  };
  createdAt: string;
}

interface GameRoomDashboardProps {
  room: GameRoom;
  players: Player[];
  teams: Team[];
  gameState: GameState;
  isHost: boolean;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResetGame: () => void;
  className?: string;
}

export function GameRoomDashboard({
  room,
  players,
  teams,
  gameState,
  isHost,
  onStartGame,
  onPauseGame,
  onResetGame,
  className = '',
}: GameRoomDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'settings'>(
    'overview'
  );
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code');
    }
  };

  const getPhaseInfo = () => {
    switch (gameState.phase) {
      case 'lobby':
        return {
          icon: Users,
          text: 'Waiting for Players',
          color: 'text-energy-yellow-500',
        };
      case 'playing':
        return {
          icon: Zap,
          text: 'Game Active',
          color: 'text-energy-green-500',
        };
      case 'review':
        return {
          icon: Clock,
          text: 'Reviewing Answers',
          color: 'text-electric-blue-500',
        };
      case 'finished':
        return {
          icon: Trophy,
          text: 'Game Complete',
          color: 'text-plasma-purple-500',
        };
      default:
        return { icon: Clock, text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const getDifficultyConfig = () => {
    switch (room.settings.difficulty) {
      case 'easy':
        return { icon: '😎', color: 'text-energy-green-500' };
      case 'medium':
        return { icon: '🔥', color: 'text-energy-orange-500' };
      case 'hard':
        return { icon: '💀', color: 'text-energy-red-500' };
    }
  };

  const phaseInfo = getPhaseInfo();
  const difficultyConfig = getDifficultyConfig();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`mx-auto max-w-6xl ${className}`}>
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Crown className="h-6 w-6 text-energy-yellow-400" />
              <h1 className="text-2xl font-black lg:text-3xl">{room.name}</h1>
              <div
                className={`flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold`}
              >
                <phaseInfo.icon className="h-4 w-4" />
                {phaseInfo.text}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span>Room Code: {room.code}</span>
              <span>•</span>
              <span>
                {players.length}/{room.maxPlayers} Players
              </span>
              <span>•</span>
              <span>
                Round {gameState.currentRound}/{gameState.totalRounds}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={copyRoomCode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-bold transition-colors hover:bg-white/30"
            >
              {copied ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-energy-green-400"
                  >
                    ✓
                  </motion.div>
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Share Code
                </>
              )}
            </motion.button>

            {isHost && (
              <div className="flex gap-2">
                {gameState.phase === 'lobby' && (
                  <motion.button
                    onClick={onStartGame}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-energy-green-500 px-4 py-2 font-bold text-white transition-colors hover:bg-energy-green-600"
                  >
                    <Play className="h-4 w-4" />
                    Start Game
                  </motion.button>
                )}

                {gameState.phase === 'playing' && (
                  <motion.button
                    onClick={onPauseGame}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-xl bg-energy-orange-500 px-4 py-2 font-bold text-white transition-colors hover:bg-energy-orange-600"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </motion.button>
                )}

                <motion.button
                  onClick={onResetGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-bold transition-colors hover:bg-white/30"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {gameState.phase === 'playing' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl bg-white p-4 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold text-gray-900">
              Question {gameState.questionNumber}
            </span>
            <span className="text-sm text-gray-600">
              {gameState.timeRemaining}s remaining
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-energy-green-500 to-energy-yellow-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(gameState.timeRemaining / 60) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 rounded-xl bg-white p-2 shadow-lg">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Current Standings */}
              <div className="lg:col-span-2">
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Trophy className="h-5 w-5 text-energy-yellow-500" />
                    Current Standings
                  </h3>
                  <div className="space-y-3">
                    {teams
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5)
                      .map((team, index) => (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-4 rounded-lg p-3 ${
                            index === 0
                              ? 'bg-gradient-to-r from-energy-yellow-100 to-energy-orange-100 border-2 border-energy-yellow-300'
                              : 'bg-gray-50'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                              index === 0
                                ? 'bg-energy-yellow-500'
                                : index === 1
                                  ? 'bg-gray-400'
                                  : index === 2
                                    ? 'bg-energy-orange-500'
                                    : 'bg-gray-300'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">
                              {team.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {team.members.length} members
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              {team.score}
                            </div>
                            <div className="text-sm text-gray-600">points</div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Room Details */}
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-lg font-bold">Room Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Difficulty</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{difficultyConfig.icon}</span>
                        <span className="font-medium capitalize">
                          {room.settings.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Category</span>
                      <span className="font-medium">
                        {room.settings.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time per Question</span>
                      <span className="font-medium">
                        {room.settings.timePerQuestion}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Player Count */}
                <div className="rounded-xl bg-gradient-to-br from-electric-blue-500 to-plasma-purple-500 p-6 text-white">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-lg font-bold">Active Players</span>
                  </div>
                  <div className="text-3xl font-black">
                    {players.filter(p => p.status === 'online').length}
                  </div>
                  <div className="text-sm opacity-80">
                    of {room.maxPlayers} max
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {teams.map(team => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-white p-6 shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      {team.name}
                    </h3>
                    <div className="text-2xl font-black text-electric-blue-600">
                      {team.score}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {team.members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              member.status === 'online'
                                ? 'bg-energy-green-500'
                                : member.status === 'away'
                                  ? 'bg-energy-yellow-500'
                                  : 'bg-gray-400'
                            }`}
                          />
                          <span className="font-medium">{member.name}</span>
                          {team.captain === member.id && (
                            <Star className="h-4 w-4 text-energy-yellow-500" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {member.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isHost && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-6 text-xl font-bold">Game Settings</h3>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Difficulty Level
                  </label>
                  <select className="w-full rounded-lg border-2 border-gray-300 p-3 focus:border-electric-blue-500 focus:outline-none">
                    <option value="easy">😎 Easy</option>
                    <option value="medium">🔥 Medium</option>
                    <option value="hard">💀 Hard</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Time per Question
                  </label>
                  <select className="w-full rounded-lg border-2 border-gray-300 p-3 focus:border-electric-blue-500 focus:outline-none">
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="90">1.5 minutes</option>
                    <option value="120">2 minutes</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-6 py-3 font-bold text-white transition-all hover:from-electric-blue-600 hover:to-plasma-purple-600"
                >
                  Save Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg border-2 border-gray-300 px-6 py-3 font-bold text-gray-700 transition-all hover:border-gray-400"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
