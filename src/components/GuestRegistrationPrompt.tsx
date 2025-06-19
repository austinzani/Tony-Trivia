import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './AnimatedButton';
import { useGuestAuth } from '../hooks/useGuestAuth';
import { useGuestPrompt, useAppActions } from '../stores/useAppStore';

interface GuestRegistrationPromptProps {
  onRegister?: () => void;
  onDismiss?: () => void;
}

export default function GuestRegistrationPrompt({
  onRegister,
  onDismiss,
}: GuestRegistrationPromptProps) {
  const { show, context } = useGuestPrompt();
  const { hideGuestRegistrationPrompt, extendGuestSession } = useAppActions();
  const {
    guestSession,
    getSessionTimeRemaining,
    extendGuestSession: extendSession,
  } = useGuestAuth();
  const [isExtending, setIsExtending] = useState(false);

  const handleDismiss = () => {
    hideGuestRegistrationPrompt();
    onDismiss?.();
  };

  const handleRegister = () => {
    hideGuestRegistrationPrompt();
    onRegister?.();
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    const success = extendSession();
    if (success) {
      hideGuestRegistrationPrompt();
    }
    setIsExtending(false);
  };

  if (!show || !guestSession) return null;

  // Get context-specific content
  const getContextContent = () => {
    switch (context) {
      case 'game-end':
        return {
          icon: '🎉',
          title: 'Great Game!',
          subtitle: 'Want to save your progress?',
          benefits: [
            'Keep your high scores forever',
            'Unlock exclusive achievements',
            'Join tournaments and leaderboards',
            'Get personalized trivia recommendations',
          ],
          primaryAction: 'Save My Progress',
          urgency: false,
        };

      case 'achievement':
        return {
          icon: '🏆',
          title: 'Achievement Unlocked!',
          subtitle: 'Create an account to keep your achievements',
          benefits: [
            'Permanent achievement collection',
            'Share achievements with friends',
            'Unlock special rewards',
            'Track your trivia journey',
          ],
          primaryAction: 'Keep My Achievements',
          urgency: false,
        };

      case 'session-expiring':
        return {
          icon: '⏰',
          title: 'Session Expiring Soon',
          subtitle: `Only ${getSessionTimeRemaining()} minutes left`,
          benefits: [
            'Never lose your progress again',
            'Unlimited session time',
            'Access from any device',
            'Backup your game data',
          ],
          primaryAction: 'Create Permanent Account',
          urgency: true,
        };

      default:
        return {
          icon: '🎯',
          title: 'Enjoying Tony Trivia?',
          subtitle: 'Create an account for the full experience',
          benefits: [
            'Save your progress',
            'Compete with friends',
            'Unlock achievements',
            'Join tournaments',
          ],
          primaryAction: 'Create Account',
          urgency: false,
        };
    }
  };

  const content = getContextContent();
  const gameData = guestSession.user.gameData;

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleDismiss}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-6">
            <motion.div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ${
                content.urgency
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gradient-to-r from-electric-400 to-plasma-500'
              }`}
              animate={
                content.urgency
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {
                      scale: [1, 1.05, 1],
                    }
              }
              transition={{
                duration: content.urgency ? 1 : 2,
                repeat: Infinity,
              }}
            >
              {content.icon}
            </motion.div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-2">
              {content.title}
            </h2>

            <p className="text-gray-600">{content.subtitle}</p>
          </motion.div>

          {/* Stats Display */}
          {gameData && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4 mb-6"
            >
              <p className="text-sm font-semibold text-electric-700 mb-2">
                📊 Your Progress So Far:
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-plasma-600">
                    {gameData.gamesPlayed}
                  </div>
                  <div className="text-gray-600">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-electric-600">
                    {gameData.totalScore}
                  </div>
                  <div className="text-gray-600">Total Score</div>
                </div>
              </div>
              {gameData.achievements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-electric-200">
                  <p className="text-xs text-electric-600 font-medium">
                    🏆 {gameData.achievements.length} Achievement
                    {gameData.achievements.length !== 1 ? 's' : ''} Earned
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div variants={itemVariants} className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              ✨ Benefits of Creating an Account:
            </p>
            <ul className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  variants={itemVariants}
                  className="flex items-center text-sm text-gray-600"
                >
                  <span className="text-electric-500 mr-2">•</span>
                  {benefit}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="space-y-3">
            <AnimatedButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleRegister}
              className="font-semibold"
            >
              🚀 {content.primaryAction}
            </AnimatedButton>

            {/* Session-specific actions */}
            {context === 'session-expiring' && (
              <AnimatedButton
                variant="secondary"
                size="md"
                fullWidth
                loading={isExtending}
                onClick={handleExtendSession}
                className="font-medium"
              >
                {isExtending ? '⏳ Extending...' : '⏰ Extend Session (24h)'}
              </AnimatedButton>
            )}

            <div className="flex space-x-2">
              <AnimatedButton
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleDismiss}
              >
                Maybe Later
              </AnimatedButton>

              {context !== 'session-expiring' && (
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={handleDismiss}
                >
                  Continue as Guest
                </AnimatedButton>
              )}
            </div>
          </motion.div>

          {/* Urgency indicator */}
          {content.urgency && (
            <motion.div variants={itemVariants} className="mt-4 text-center">
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Your session will expire soon. Create an account to keep
                playing!
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
