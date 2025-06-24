import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import AnimatedButton from './AnimatedButton';
import {
  SecuritySchemas,
  rateLimiters,
  validateSecurely,
} from '../utils/security';

export interface AuthFormProps {
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
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { signIn, signUp, loading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
    setIsRateLimited(false);

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
        const emailValidation = validateSecurely(SecuritySchemas.email, value);
        if (!emailValidation.success) {
          errors.email = emailValidation.error;
        }
        break;

      case 'password':
        const passwordValidation = validateSecurely(
          SecuritySchemas.password,
          value
        );
        if (!passwordValidation.success) {
          errors.password = passwordValidation.error;
        }
        break;

      case 'confirmPassword':
        if (mode === 'signup' && value !== formData.password) {
          errors.confirmPassword = "🔒 Passwords don't match!";
        }
        break;

      case 'displayName':
        if (mode === 'signup') {
          const nameValidation = validateSecurely(
            SecuritySchemas.displayName,
            value
          );
          if (!nameValidation.success) {
            errors.displayName = `🏆 ${nameValidation.error}`;
          }
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
    setIsRateLimited(false);

    // Check rate limiting for login attempts
    const clientId = `auth_${mode}_${Date.now() % 1000000}`; // Simple client identifier
    if (!rateLimiters.loginAttempt.isAllowed(clientId)) {
      setIsRateLimited(true);
      setLocalError(
        '⏰ Too many attempts. Please wait a few minutes before trying again.'
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Validate all fields with security schemas
    const emailValidation = validateSecurely(
      SecuritySchemas.email,
      formData.email
    );
    if (!emailValidation.success) {
      setLocalError(`📧 ${emailValidation.error}`);
      return;
    }

    const passwordValidation = validateSecurely(
      SecuritySchemas.password,
      formData.password
    );
    if (!passwordValidation.success) {
      setLocalError(`🔐 ${passwordValidation.error}`);
      return;
    }

    if (mode === 'signup') {
      const nameValidation = validateSecurely(
        SecuritySchemas.displayName,
        formData.displayName
      );
      if (!nameValidation.success) {
        setLocalError(`🏆 ${nameValidation.error}`);
        return;
      }
    }

    try {
      if (mode === 'signin') {
        const result = await signIn({
          email: emailValidation.data,
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
          email: emailValidation.data,
          password: formData.password,
          displayName:
            validateSecurely(SecuritySchemas.displayName, formData.displayName)
              .data || formData.displayName,
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

  // Show rate limit warning
  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        setIsRateLimited(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRateLimited]);

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
    <motion.div
      className="min-h-[500px] bg-gradient-to-br from-electric-50 to-electric-100 rounded-game p-8 border-2 border-electric-200"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-3xl font-bold text-electric-700 mb-2">
            {mode === 'signin' ? '🎮 Welcome Back!' : '🎊 Join the Fun!'}
          </h2>
          <p className="text-electric-600">
            {mode === 'signin'
              ? 'Ready for another round of trivia?'
              : 'Create your account and start playing!'}
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="p-4 bg-energy-green-100 border border-energy-green-300 rounded-game text-energy-green-800 text-center font-medium"
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {successMessage}
            </motion.div>
          )}
          {localError && (
            <motion.div
              className={`p-4 border rounded-game text-center font-medium ${
                isRateLimited
                  ? 'bg-energy-orange-100 border-energy-orange-300 text-energy-orange-800'
                  : 'bg-energy-red-100 border-energy-red-300 text-energy-red-800'
              }`}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {localError}
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

          {/* Security Notice */}
          {mode === 'signup' && (
            <motion.div
              variants={itemVariants}
              className="p-3 bg-electric-100 border border-electric-200 rounded-lg text-sm text-electric-700"
            >
              🔒 Your data is protected with industry-standard security measures
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading || isRateLimited}
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
                : isRateLimited
                  ? 'Please Wait...'
                  : mode === 'signin'
                    ? 'Sign In & Play!'
                    : 'Join Tony Trivia!'}
            </AnimatedButton>
          </motion.div>
        </motion.form>

        {/* Mode Switch */}
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-electric-600 mb-4">
            {mode === 'signin'
              ? "New to Tony Trivia? Let's get you started!"
              : 'Already have an account? Welcome back!'}
          </p>
          <AnimatedButton
            variant="outline"
            onClick={() =>
              onModeChange(mode === 'signin' ? 'signup' : 'signin')
            }
            icon={<span>{mode === 'signin' ? '✨' : '👋'}</span>}
            className="font-semibold"
          >
            {mode === 'signin' ? 'Create Account' : 'Sign In'}
          </AnimatedButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
