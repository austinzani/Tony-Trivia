import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './AnimatedButton';
import { useGuestAuth } from '../hooks/useGuestAuth';
import { guestAuthService } from '../services/guestAuth';

interface GuestOnboardingProps {
  onSuccess?: () => void;
  onSkip?: () => void;
}

export default function GuestOnboarding({
  onSuccess,
  onSkip,
}: GuestOnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'username' | 'creating'>(
    'welcome'
  );
  const [customUsername, setCustomUsername] = useState('');
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createGuestSession, loading } = useGuestAuth();

  // Generate a new suggested username
  const generateNewUsername = () => {
    const newUsername = guestAuthService.generateRandomUsername();
    setSuggestedUsername(newUsername);
    setCustomUsername(newUsername);
  };

  // Initialize with a suggested username
  React.useEffect(() => {
    generateNewUsername();
  }, []);

  const handleCreateGuestSession = async (username?: string) => {
    setStep('creating');
    setError(null);

    const finalUsername = username || customUsername || suggestedUsername;
    const result = await createGuestSession(finalUsername);

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Failed to create guest session');
      setStep('username');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-lg w-full"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
              {/* Floating Game Icons */}
              <div className="relative mb-8">
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="absolute -top-4 -left-4 text-4xl"
                >
                  🧠
                </motion.div>
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="absolute -top-2 -right-6 text-3xl"
                  style={{ animationDelay: '1s' }}
                >
                  ⚡
                </motion.div>
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="absolute -bottom-2 left-2 text-3xl"
                  style={{ animationDelay: '2s' }}
                >
                  🎯
                </motion.div>

                {/* Main Icon */}
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-electric-400 to-plasma-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto shadow-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  🎮
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent">
                  Welcome to Tony Trivia! 🎉
                </h1>

                <p className="text-lg text-gray-600">
                  Ready to challenge your brain with some epic trivia questions?
                </p>

                <div className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-electric-700">
                    🚀 Quick Start Options:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Jump in as a guest (no signup required!)</li>
                    <li>• Play immediately with a fun username</li>
                    <li>• Convert to full account anytime</li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col space-y-3 mt-8"
              >
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setStep('username')}
                  className="text-lg font-semibold"
                >
                  🎯 Start Playing as Guest
                </AnimatedButton>

                <AnimatedButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  onClick={onSkip}
                  className="text-sm"
                >
                  I'll create an account instead
                </AnimatedButton>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Username Selection Step */}
        {step === 'username' && (
          <motion.div
            key="username"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-lg w-full"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <motion.div variants={itemVariants} className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-electric-400 to-plasma-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
                  🎭
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-2">
                  Choose Your Player Name
                </h2>
                <p className="text-gray-600">
                  Pick a fun username for your trivia adventure!
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                {/* Username Input */}
                <div>
                  <label className="block text-sm font-semibold text-electric-700 mb-2">
                    🏷️ Your Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customUsername}
                      onChange={e => {
                        setCustomUsername(e.target.value);
                        setError(null);
                      }}
                      className="w-full px-4 py-3 border-2 border-electric-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-electric-900 placeholder-electric-400"
                      placeholder="Enter your username"
                      maxLength={20}
                    />
                    <motion.button
                      type="button"
                      onClick={generateNewUsername}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-electric-500 hover:text-plasma-500 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Generate new username"
                    >
                      🎲
                    </motion.button>
                  </div>
                </div>

                {/* Suggested Username */}
                <div className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-electric-700 mb-2">
                    💡 Suggested Username:
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-plasma-600 font-medium">
                      {suggestedUsername}
                    </span>
                    <AnimatedButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomUsername(suggestedUsername)}
                    >
                      Use This
                    </AnimatedButton>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-red-800 text-sm font-medium">
                        ❌ {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    disabled={!customUsername.trim() || loading}
                    onClick={() => handleCreateGuestSession()}
                    className="text-lg font-semibold"
                  >
                    {loading
                      ? '🚀 Creating Your Session...'
                      : '🎮 Start Playing!'}
                  </AnimatedButton>

                  <AnimatedButton
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={() => setStep('welcome')}
                    disabled={loading}
                  >
                    ← Back
                  </AnimatedButton>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Creating Session Step */}
        {step === 'creating' && (
          <motion.div
            key="creating"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-lg w-full"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 bg-gradient-to-r from-electric-400 to-plasma-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-6"
              >
                ⚡
              </motion.div>

              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                Setting Up Your Game Session...
              </h2>

              <p className="text-gray-600 mb-6">
                Just a moment while we prepare your trivia adventure!
              </p>

              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-electric-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
