import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Monitor,
  Plus,
  Settings,
  Users,
  Trophy,
  Play,
  Gamepad2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import GameForm from '../components/GameForm';
import GameList from '../components/GameList';
import PageTransition from '../components/PageTransition';
import AnimatedButton from '../components/AnimatedButton';
import HostControlsLayout from '../components/host/HostControlsLayout';
import { useAuth } from '../hooks/useAuth';

export default function Host() {
  const [searchParams] = useSearchParams();
  const [currentGameId, setCurrentGameId] = useState<string | null>(
    searchParams.get('gameId')
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Mock form submission handler
  const handleGameSubmit = async (data: any) => {
    console.log('Game creation data:', data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate a mock game ID and switch to host controls
    const newGameId = Math.random().toString(36).substr(2, 6).toUpperCase();
    setCurrentGameId(newGameId);
    setShowCreateForm(false);

    alert(
      `Game "${data.name}" created successfully!\nGame Code: ${newGameId}\nSwitching to Host Controls...`
    );
  };

  const handleJoinExistingGame = (gameId: string) => {
    setCurrentGameId(gameId);
  };

  const handleExitHostMode = () => {
    setCurrentGameId(null);
    setShowCreateForm(false);
  };

  // If we have a game ID, show the host controls
  if (currentGameId) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="container mx-auto px-4 py-6">
            {/* Exit Host Mode Button */}
            <div className="mb-6">
              <button
                onClick={handleExitHostMode}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Host Mode</span>
              </button>
            </div>

            {/* Host Controls Interface */}
            <HostControlsLayout
              gameId={currentGameId}
              className="w-full max-w-7xl mx-auto"
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  // Show the host dashboard/setup interface
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
                <Monitor className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Host Dashboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isAuthenticated
                ? `Welcome back, ${user?.displayName || 'Host'}! Create or manage your trivia games.`
                : 'Create exciting trivia games and manage your sessions with powerful host controls.'}
            </p>
          </motion.header>

          {/* Quick Stats / Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Game Controls</h3>
                  <p className="text-sm text-gray-600">
                    Advanced hosting features
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    Team Management
                  </h3>
                  <p className="text-sm text-gray-600">
                    Real-time coordination
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Live Scoring</h3>
                  <p className="text-sm text-gray-600">
                    Competitive leaderboards
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Create New Game Section */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Create New Game
                    </h2>
                    <div className="flex items-center text-sm text-blue-600">
                      <Sparkles className="w-4 h-4 mr-1" />
                      <span>Live Controls</span>
                    </div>
                  </div>

                  {showCreateForm ? (
                    <div className="space-y-4">
                      <GameForm onSubmit={handleGameSubmit} />
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="w-full py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Start Your Trivia Game
                        </h3>
                        <p className="text-gray-600 text-sm mb-6">
                          Configure your game settings and get a unique game
                          code for participants
                        </p>
                      </div>

                      <AnimatedButton
                        variant="primary"
                        onClick={() => setShowCreateForm(true)}
                        className="w-full"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Game
                      </AnimatedButton>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex space-x-4">
                  <Link to="/" className="flex-1">
                    <AnimatedButton variant="secondary" className="w-full">
                      ← Back to Home
                    </AnimatedButton>
                  </Link>
                  <Link to="/game" className="flex-1">
                    <AnimatedButton variant="primary" className="w-full">
                      Join Game Instead
                    </AnimatedButton>
                  </Link>
                </div>
              </div>

              {/* Active Games and Tips Section */}
              <div className="space-y-6">
                {/* Active Games List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Active Games
                    </h3>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Live Updates
                    </div>
                  </div>
                  <GameList onJoinAsHost={handleJoinExistingGame} />
                </div>

                {/* Hosting Tips */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-blue-600" />
                    Hosting Tips
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Set appropriate time limits based on question difficulty',
                      'Choose diverse categories to engage all players',
                      'Monitor team formation for balanced gameplay',
                      'Use the live leaderboard to maintain competitive energy',
                      'Review answers carefully for fair scoring',
                    ].map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{tip}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Host Features Preview */}
                {!isAuthenticated && (
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">
                      Unlock Advanced Host Features
                    </h3>
                    <p className="text-purple-100 text-sm mb-4">
                      Create an account to access game analytics, custom
                      categories, and enhanced controls.
                    </p>
                    <Link to="/auth">
                      <AnimatedButton
                        variant="secondary"
                        className="bg-white text-purple-600 hover:bg-gray-100"
                      >
                        Sign Up Now
                      </AnimatedButton>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
