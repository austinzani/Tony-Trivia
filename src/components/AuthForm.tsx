import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AnimatedButton } from './AnimatedButton';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSuccess?: () => void;
}

// Move InputField component outside to prevent recreation on every render
const InputField = ({
  type,
  id,
  name,
  value,
  placeholder,
  label,
  icon,
  required = false,
  onChange,
  onFocus,
  onBlur,
  fieldErrors,
  focusedField,
}: {
  type: string;
  id: string;
  name: string;
  value: string;
  placeholder: string;
  label: string;
  icon: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: (fieldName: string) => void;
  onBlur: (fieldName: string) => void;
  fieldErrors: Record<string, string>;
  focusedField: string | null;
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-electric-700 mb-1"
      >
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => onFocus(name)}
          onBlur={() => onBlur(name)}
          className={`w-full px-4 py-3 border-2 rounded-game font-medium transition-all duration-200 
            ${
              fieldErrors[name]
                ? 'border-energy-red bg-energy-red/5 focus:border-energy-red focus:bg-energy-red/10'
                : focusedField === name
                  ? 'border-electric-500 bg-electric-50/50 shadow-electric'
                  : 'border-gray-300 bg-white hover:border-electric-300'
            } 
            focus:outline-none focus:ring-0`}
          placeholder={placeholder}
          required={required}
          aria-invalid={fieldErrors[name] ? 'true' : 'false'}
          aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
        />
        <AnimatePresence>
          {focusedField === name && !fieldErrors[name] && (
            <motion.div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-electric-500 animate-pulse">✨</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {fieldErrors[name] && (
          <motion.p
            id={`${name}-error`}
            className="text-energy-red text-sm font-medium"
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alert"
          >
            {fieldErrors[name]}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AuthForm({
  mode,
  onModeChange,
  onSuccess,
}: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signIn, signUp, loading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);

    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = (fieldName: string) => {
    setFocusedField(null);
    validateField(fieldName);
  };

  const validateField = (fieldName: string) => {
    const errors: Record<string, string> = {};
    const value = formData[fieldName as keyof typeof formData];

    switch (fieldName) {
      case 'email':
        if (!value) {
          errors.email = '🎯 Email is required to join the game!';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errors.email = '🎮 Please enter a valid email address!';
        }
        break;
      case 'password':
        if (!value) {
          errors.password = '🔐 Password is required!';
        } else if (value.length < 6) {
          errors.password = '🛡️ Password needs at least 6 characters!';
        }
        break;
      case 'confirmPassword':
        if (mode === 'signup' && value !== formData.password) {
          errors.confirmPassword = "🔒 Passwords don't match!";
        }
        break;
      case 'displayName':
        if (mode === 'signup' && !value.trim()) {
          errors.displayName = '🏆 Choose a display name!';
        }
        break;
    }

    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const fields = ['email', 'password'];
    if (mode === 'signup') {
      fields.push('confirmPassword', 'displayName');
    }

    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      setLocalError('🎯 Please fix the errors above to continue!');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'signin') {
        const result = await signIn({
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          setSuccessMessage('🎉 Welcome back to Tony Trivia!');
          onSuccess?.();
        } else {
          setLocalError(
            result.error?.message ||
              '❌ Sign in failed - check your credentials and try again!'
          );
        }
      } else {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        });

        if (result.success) {
          if (result.requiresConfirmation) {
            setSuccessMessage(
              result.message ||
                '📧 Check your email for verification - we sent you a magic link!'
            );
          } else {
            setSuccessMessage(
              '🎊 Welcome to Tony Trivia! Your account is ready!'
            );
            onSuccess?.();
          }
        } else {
          setLocalError(
            result.error?.message ||
              '❌ Account creation failed - please try again!'
          );
        }
      }
    } catch (error) {
      setLocalError('⚡ Something unexpected happened - please try again!');
      console.error('Auth form error:', error);
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
        ease: [0.68, -0.55, 0.265, 1.55],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.68, -0.55, 0.265, 1.55],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="card-game bg-gradient-to-br from-white to-electric-50/30 border-2 border-electric-200 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          className="text-center mb-8 relative"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-electric-500/10 to-plasma-500/10 rounded-t-card -mx-6 -mt-6 mb-4"></div>
          <div className="relative pt-4">
            <motion.div
              className="inline-flex items-center gap-2 mb-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.68, -0.55, 0.265, 1.55],
              }}
            >
              <span className="text-3xl">🎯</span>
              <h2 className="text-display-md bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent font-bold">
                {mode === 'signin' ? 'Welcome Back!' : 'Join the Game!'}
              </h2>
              <span className="text-3xl">🎮</span>
            </motion.div>
            <motion.p
              className="text-gray-600 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {mode === 'signin'
                ? 'Ready for another round of trivia excitement?'
                : 'Create your player profile and start competing!'}
            </motion.p>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {localError && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-energy-red/10 to-energy-red/5 border-l-4 border-energy-red rounded-r-lg"
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-energy-red font-semibold text-sm">
                {localError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-energy-green/10 to-energy-green/5 border-l-4 border-energy-green rounded-r-lg"
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="alert"
              aria-live="polite"
            >
              <p className="text-energy-green font-semibold text-sm">
                {successMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <InputField
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                placeholder="Choose your game name"
                label="Player Name"
                icon="🏆"
                required={mode === 'signup'}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                fieldErrors={fieldErrors}
                focusedField={focusedField}
              />
            )}
          </AnimatePresence>

          <InputField
            type="email"
            id="email"
            name="email"
            value={formData.email}
            placeholder="your.email@example.com"
            label="Email Address"
            icon="📧"
            required
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            fieldErrors={fieldErrors}
            focusedField={focusedField}
          />

          <InputField
            type="password"
            id="password"
            name="password"
            value={formData.password}
            placeholder="Enter a secure password"
            label="Password"
            icon="🔐"
            required
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            fieldErrors={fieldErrors}
            focusedField={focusedField}
          />

          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <InputField
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                placeholder="Confirm your password"
                label="Confirm Password"
                icon="🔒"
                required={mode === 'signup'}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                fieldErrors={fieldErrors}
                focusedField={focusedField}
              />
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              icon={
                loading ? undefined : (
                  <span>{mode === 'signin' ? '🚀' : '🎊'}</span>
                )
              }
              className="text-lg font-bold py-4"
            >
              {loading
                ? mode === 'signin'
                  ? 'Signing In...'
                  : 'Creating Account...'
                : mode === 'signin'
                  ? 'Sign In & Play!'
                  : 'Join Tony Trivia!'}
            </AnimatedButton>
          </motion.div>
        </motion.form>

        {/* Mode Switch */}
        <motion.div
          className="mt-8 text-center p-4 bg-gradient-to-r from-gray-50 to-electric-50/30 rounded-game border border-gray-200"
          variants={itemVariants}
        >
          <p className="text-gray-600 mb-3 font-medium">
            {mode === 'signin'
              ? '🆕 New to Tony Trivia?'
              : '🔄 Already have an account?'}
          </p>
          <AnimatedButton
            type="button"
            variant="secondary"
            onClick={() =>
              onModeChange(mode === 'signin' ? 'signup' : 'signin')
            }
            icon={<span>{mode === 'signin' ? '✨' : '⚡'}</span>}
            className="px-6 py-2 font-semibold"
          >
            {mode === 'signin' ? 'Create Account' : 'Sign In Instead'}
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
