import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AnimatedButton } from './AnimatedButton';

interface PasswordResetProps {
  onBack?: () => void;
}

export default function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('🚫 Please enter a valid email address');
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setMessage(
        result.message || '📧 Password reset email sent successfully!'
      );
      setIsSubmitted(true);
    } else {
      setError(
        result.error?.message || '❌ Failed to send password reset email'
      );
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
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  if (isSubmitted) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-2xl border border-primary-100 p-8 backdrop-blur-sm">
          <motion.div className="text-center mb-8" variants={itemVariants}>
            {/* Success Icon with Animation */}
            <motion.div
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6 shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              <motion.svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>

            <motion.h2
              className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-3"
              variants={itemVariants}
            >
              📧 Check Your Email
            </motion.h2>

            <motion.p
              className="text-electric-700 text-lg"
              variants={itemVariants}
            >
              We've sent a password reset link to
            </motion.p>
            <motion.p
              className="text-plasma-600 font-semibold text-lg mt-1"
              variants={itemVariants}
            >
              {email}
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {message && (
              <motion.div
                className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-400 rounded-lg shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-green-800 font-medium">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="space-y-6" variants={itemVariants}>
            <motion.div
              className="text-center p-4 bg-gradient-to-r from-electric-50 to-plasma-50 rounded-lg border border-electric-200"
              variants={itemVariants}
            >
              <p className="text-electric-700 text-sm">
                📬 Didn't receive the email? Check your spam folder or try
                again.
              </p>
            </motion.div>

            <div className="flex flex-col space-y-3">
              <AnimatedButton
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => {
                  setIsSubmitted(false);
                  setMessage(null);
                  setError(null);
                }}
                className="font-semibold"
              >
                🔄 Try Again
              </AnimatedButton>

              {onBack && (
                <AnimatedButton
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={onBack}
                  className="font-semibold"
                >
                  ← Back to Sign In
                </AnimatedButton>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-2xl border border-primary-100 p-8 backdrop-blur-sm">
        <motion.div className="text-center mb-8" variants={itemVariants}>
          {/* Reset Icon */}
          <motion.div
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-electric-400 to-electric-600 mb-6 shadow-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
          >
            <motion.svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-3"
            variants={itemVariants}
          >
            🔐 Reset Password
          </motion.h2>

          <motion.p
            className="text-electric-700 text-lg"
            variants={itemVariants}
          >
            Enter your email address and we'll send you a link to reset your
            password.
          </motion.p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-lg shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-800 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-electric-700 mb-2"
            >
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border-2 border-electric-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-electric-900 placeholder-electric-400"
              placeholder="Enter your email address"
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              className="font-semibold text-lg"
            >
              {loading ? '📤 Sending Reset Link...' : '🚀 Send Reset Link'}
            </AnimatedButton>
          </motion.div>
        </form>

        {onBack && (
          <motion.div className="mt-8 text-center" variants={itemVariants}>
            <button
              type="button"
              onClick={onBack}
              className="text-electric-600 hover:text-plasma-600 font-semibold transition-colors duration-200 flex items-center justify-center mx-auto group"
            >
              <motion.span
                className="mr-2"
                animate={{ x: [-2, 0, -2] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ←
              </motion.span>
              <span className="group-hover:underline">Back to Sign In</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
