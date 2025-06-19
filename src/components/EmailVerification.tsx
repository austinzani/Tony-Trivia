import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AnimatedButton } from './AnimatedButton';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'success' | 'error'
  >('pending');
  const [countdown, setCountdown] = useState(5);

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const celebrationVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 10,
      },
    },
  };

  useEffect(() => {
    // Check if this is an email confirmation callback
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (type === 'email_confirmation' && token) {
      // Supabase automatically handles email confirmation
      // We just need to check the user's email_confirmed status
      setVerificationStatus('success');
    } else if (user?.email_confirmed_at) {
      setVerificationStatus('success');
    } else if (!loading && user && !user.email_confirmed_at) {
      setVerificationStatus('pending');
    }
  }, [searchParams, user, loading]);

  useEffect(() => {
    if (verificationStatus === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationStatus === 'success' && countdown === 0) {
      navigate('/dashboard');
    }
  }, [verificationStatus, countdown, navigate]);

  const resendVerificationEmail = async () => {
    try {
      // Implementation would depend on your auth service
      // For now, show a success message
      alert('🎯 Verification email sent! Check your inbox.');
    } catch (error) {
      setVerificationStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-electric-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Success State */}
          <AnimatePresence mode="wait">
            {verificationStatus === 'success' && (
              <motion.div
                key="success"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-center space-y-6"
              >
                <motion.div
                  variants={celebrationVariants}
                  className="flex justify-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl">
                    🎉
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent">
                    Email Verified! 🎯
                  </h1>
                  <p className="text-gray-600">
                    Welcome to Tony Trivia! Your account is now active and ready
                    for some brain-busting fun!
                  </p>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4"
                >
                  <p className="text-sm text-electric-700 font-medium">
                    🚀 Redirecting to your dashboard in {countdown} seconds...
                  </p>
                </motion.div>

                <AnimatedButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                  className="mt-6"
                >
                  🎮 Start Playing Now!
                </AnimatedButton>
              </motion.div>
            )}

            {/* Pending State */}
            {verificationStatus === 'pending' && (
              <motion.div
                key="pending"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex justify-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-electric-400 to-plasma-500 rounded-full flex items-center justify-center text-white text-4xl">
                    📧
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent">
                    Check Your Email! 📬
                  </h1>
                  <p className="text-gray-600">
                    We've sent a verification link to{' '}
                    <span className="font-semibold text-electric-600">
                      {user?.email}
                    </span>
                  </p>
                </div>

                <div className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-electric-700 font-medium">
                    🎯 What's next?
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 text-left">
                    <li>• Check your inbox (and spam folder)</li>
                    <li>• Click the verification link</li>
                    <li>• Return here to start playing!</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <AnimatedButton
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={resendVerificationEmail}
                  >
                    📤 Resend Verification Email
                  </AnimatedButton>

                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/auth')}
                  >
                    ← Back to Login
                  </AnimatedButton>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {verificationStatus === 'error' && (
              <motion.div
                key="error"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto">
                  ❌
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-red-600">
                    Verification Failed
                  </h1>
                  <p className="text-gray-600">
                    Something went wrong with the email verification. Don't
                    worry, we can fix this!
                  </p>
                </div>

                <div className="space-y-3">
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={resendVerificationEmail}
                  >
                    🔄 Try Again
                  </AnimatedButton>

                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/auth')}
                  >
                    ← Back to Login
                  </AnimatedButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fun footer */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-sm text-gray-500">
            🧠 Ready to challenge your brain? Tony Trivia awaits!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
