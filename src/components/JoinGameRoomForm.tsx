import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Trophy,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Crown,
  Hash,
} from 'lucide-react';

interface GameRoomInfo {
  id: string;
  code: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'active' | 'full';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  roundsTotal: number;
  timePerRound: number;
}

interface JoinGameRoomFormProps {
  onJoin: (roomCode: string, playerName: string) => void;
  onCodeVerify?: (code: string) => Promise<GameRoomInfo | null>;
  isLoading?: boolean;
  className?: string;
}

export function JoinGameRoomForm({
  onJoin,
  onCodeVerify,
  isLoading = false,
  className = '',
}: JoinGameRoomFormProps) {
  const [step, setStep] = useState<'code' | 'player' | 'preview'>('code');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameInfo, setGameInfo] = useState<GameRoomInfo | null>(null);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    const newCode = roomCode.split('');
    newCode[index] = value.toUpperCase();
    const updatedCode = newCode.join('');
    setRoomCode(updatedCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 characters are entered
    if (updatedCode.length === 6 && onCodeVerify) {
      verifyCode(updatedCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    if (!onCodeVerify || code.length !== 6) return;

    setIsVerifying(true);
    setError('');

    try {
      const info = await onCodeVerify(code);
      if (info) {
        setGameInfo(info);
        setStep('player');
      } else {
        setError('Room not found. Please check the code and try again.');
      }
    } catch (err) {
      setError('Failed to verify room code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'code' && roomCode.length === 6) {
      if (onCodeVerify) {
        verifyCode(roomCode);
      } else {
        setStep('player');
      }
    } else if (step === 'player' && playerName.trim()) {
      setStep('preview');
    } else if (step === 'preview') {
      onJoin(roomCode, playerName.trim());
    }
  };

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return {
          icon: '😎',
          color: 'text-energy-green-500',
          bg: 'bg-energy-green-100',
        };
      case 'medium':
        return {
          icon: '🔥',
          color: 'text-energy-orange-500',
          bg: 'bg-energy-orange-100',
        };
      case 'hard':
        return {
          icon: '💀',
          color: 'text-energy-red-500',
          bg: 'bg-energy-red-100',
        };
      default:
        return { icon: '🎯', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 300 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -300 },
  };

  return (
    <div className={`mx-auto max-w-lg ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-plasma-purple-500 to-electric-blue-500"
          >
            <Hash className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-black text-gray-900">
            Join the Battle
          </h2>
          <p className="text-gray-600">
            Enter your game code and get ready to compete!
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[
            { step: 'code', label: 'Code', icon: Hash },
            { step: 'player', label: 'Player', icon: Users },
            { step: 'preview', label: 'Ready', icon: Trophy },
          ].map((item, index) => {
            const isActive = step === item.step;
            const isCompleted =
              (step === 'player' && item.step === 'code') ||
              (step === 'preview' &&
                (item.step === 'code' || item.step === 'player'));

            return (
              <motion.div
                key={item.step}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                  isCompleted
                    ? 'bg-energy-green-500 text-white'
                    : isActive
                      ? 'bg-gradient-to-br from-plasma-purple-500 to-electric-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Form Steps */}
        <div className="relative min-h-[400px] overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Room Code */}
            {step === 'code' && (
              <motion.div
                key="code-step"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Enter Room Code
                  </h3>
                  <p className="text-gray-600">
                    Get the 6-character code from your host
                  </p>
                </div>

                <div className="flex justify-center space-x-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <motion.input
                      key={index}
                      ref={el => (codeInputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={roomCode[index] || ''}
                      onChange={e => handleCodeChange(index, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(index, e)}
                      className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold uppercase transition-all focus:outline-none focus:ring-4 ${
                        error
                          ? 'border-energy-red-500 focus:border-energy-red-500 focus:ring-energy-red-200'
                          : 'border-gray-300 focus:border-electric-blue-500 focus:ring-electric-blue-200'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-energy-red-500"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {isVerifying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-plasma-purple-500"
                  >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-plasma-purple-500 border-t-transparent"></div>
                    <span className="text-sm">Verifying room...</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Player Name */}
            {step === 'player' && (
              <motion.div
                key="player-step"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Choose Your Name
                  </h3>
                  <p className="text-gray-600">
                    What should other players call you?
                  </p>
                </div>

                {gameInfo && (
                  <div className="rounded-xl bg-gradient-to-r from-electric-blue-50 to-plasma-purple-50 p-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-900">
                        {gameInfo.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Hosted by {gameInfo.hostName}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-lg font-medium transition-colors focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
                    placeholder="Enter your name"
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview & Join */}
            {step === 'preview' && gameInfo && (
              <motion.div
                key="preview-step"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Ready to Join?
                  </h3>
                  <p className="text-gray-600">Review the game details below</p>
                </div>

                <div className="space-y-4">
                  {/* Game Info Card */}
                  <div className="rounded-xl border-2 border-electric-blue-200 bg-gradient-to-r from-electric-blue-50 to-plasma-purple-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-lg font-bold text-gray-900">
                        {gameInfo.name}
                      </h4>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-electric-blue-600">
                        {gameInfo.code}
                      </div>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-energy-yellow-500" />
                      <span className="text-sm text-gray-600">
                        Host: {gameInfo.hostName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {gameInfo.playerCount}/{gameInfo.maxPlayers}
                        </div>
                        <div className="text-xs text-gray-600">Players</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {gameInfo.roundsTotal}
                        </div>
                        <div className="text-xs text-gray-600">Rounds</div>
                      </div>
                    </div>
                  </div>

                  {/* Game Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white border-2 border-gray-200 p-3 text-center">
                      <div className="text-sm text-gray-600 mb-1">
                        Difficulty
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">
                          {getDifficultyConfig(gameInfo.difficulty).icon}
                        </span>
                        <span className="font-medium capitalize">
                          {gameInfo.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white border-2 border-gray-200 p-3 text-center">
                      <div className="text-sm text-gray-600 mb-1">
                        Time Limit
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {gameInfo.timePerRound}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Player Name Display */}
                  <div className="rounded-xl bg-gradient-to-r from-energy-green-50 to-energy-green-100 border-2 border-energy-green-200 p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      You'll join as
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {playerName}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step !== 'code' && (
            <motion.button
              type="button"
              onClick={() => {
                if (step === 'player') setStep('code');
                if (step === 'preview') setStep('player');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              Back
            </motion.button>
          )}

          <motion.button
            type="submit"
            disabled={
              isLoading ||
              isVerifying ||
              (step === 'code' && roomCode.length !== 6) ||
              (step === 'player' && !playerName.trim())
            }
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            className="flex-1 rounded-xl bg-gradient-to-r from-plasma-purple-500 to-electric-blue-500 py-3 font-bold text-white transition-all hover:from-plasma-purple-600 hover:to-electric-blue-600 focus:outline-none focus:ring-4 focus:ring-plasma-purple-200 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Joining...
              </div>
            ) : step === 'preview' ? (
              <>
                Join Game <Trophy className="ml-2 inline h-4 w-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-2 inline h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
