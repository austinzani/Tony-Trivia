import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GamepadIcon,
  Users,
  Clock,
  Trophy,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface GameRoomSettings {
  name: string;
  maxTeams: number;
  roundsTotal: number;
  timePerRound: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'general' | 'sports' | 'entertainment' | 'science' | 'history';
  isPrivate: boolean;
}

interface CreateGameRoomFormProps {
  onSubmit: (settings: GameRoomSettings) => void;
  isLoading?: boolean;
  className?: string;
}

export function CreateGameRoomForm({
  onSubmit,
  isLoading = false,
  className = '',
}: CreateGameRoomFormProps) {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<GameRoomSettings>({
    name: '',
    maxTeams: 6,
    roundsTotal: 3,
    timePerRound: 60,
    difficulty: 'medium',
    category: 'general',
    isPrivate: false,
  });
  const [errors, setErrors] = useState<Partial<GameRoomSettings>>({});

  const handleInputChange = (field: keyof GameRoomSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<GameRoomSettings> = {};

    if (stepNumber === 1) {
      if (!settings.name.trim()) {
        newErrors.name = 'Room name is required';
      } else if (settings.name.length < 3) {
        newErrors.name = 'Room name must be at least 3 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(step)) {
      onSubmit(settings);
    }
  };

  const difficultyOptions = [
    {
      value: 'easy',
      label: 'Casual',
      color: 'from-energy-green-400 to-energy-green-500',
      icon: '😎',
    },
    {
      value: 'medium',
      label: 'Challenge',
      color: 'from-energy-orange-400 to-energy-orange-500',
      icon: '🔥',
    },
    {
      value: 'hard',
      label: 'Expert',
      color: 'from-energy-red-400 to-energy-red-500',
      icon: '💀',
    },
  ];

  const categoryOptions = [
    { value: 'general', label: 'General Knowledge', icon: '🧠' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'science', label: 'Science', icon: '🔬' },
    { value: 'history', label: 'History', icon: '🏛️' },
  ];

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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric-blue-500 to-plasma-purple-500"
          >
            <GamepadIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-black text-gray-900">
            Create Your Game
          </h2>
          <p className="text-gray-600">Set up an epic trivia battle!</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map(stepNumber => (
            <motion.div
              key={stepNumber}
              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                stepNumber <= step
                  ? 'bg-gradient-to-br from-electric-blue-500 to-plasma-purple-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
              animate={{ scale: stepNumber === step ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {stepNumber < step ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                stepNumber
              )}
            </motion.div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="relative min-h-[400px] overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Room Details
                  </h3>
                  <p className="text-gray-600">
                    Give your game room a memorable name
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Room Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-lg font-medium transition-colors focus:outline-none focus:ring-4 ${
                        errors.name
                          ? 'border-energy-red-500 focus:border-energy-red-500 focus:ring-energy-red-200'
                          : 'border-gray-300 focus:border-electric-blue-500 focus:ring-electric-blue-200'
                      }`}
                      placeholder="Epic Trivia Battle"
                      maxLength={30}
                    />
                    {errors.name && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-2 text-energy-red-500"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errors.name}</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Max Teams
                    </label>
                    <select
                      value={settings.maxTeams}
                      onChange={e =>
                        handleInputChange('maxTeams', parseInt(e.target.value))
                      }
                      className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-medium focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
                    >
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>
                          {num} Teams
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Privacy
                    </label>
                    <div className="flex rounded-xl border-2 border-gray-300 p-1">
                      <button
                        type="button"
                        onClick={() => handleInputChange('isPrivate', false)}
                        className={`flex-1 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
                          !settings.isPrivate
                            ? 'bg-electric-blue-500 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('isPrivate', true)}
                        className={`flex-1 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
                          settings.isPrivate
                            ? 'bg-electric-blue-500 text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Private
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Game Settings
                  </h3>
                  <p className="text-gray-600">
                    Configure the gameplay experience
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Trophy className="mr-1 inline h-4 w-4" />
                      Rounds
                    </label>
                    <select
                      value={settings.roundsTotal}
                      onChange={e =>
                        handleInputChange(
                          'roundsTotal',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-medium focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>
                          {num} Round{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Clock className="mr-1 inline h-4 w-4" />
                      Time per Round
                    </label>
                    <select
                      value={settings.timePerRound}
                      onChange={e =>
                        handleInputChange(
                          'timePerRound',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-medium focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
                    >
                      {[30, 45, 60, 90, 120].map(seconds => (
                        <option key={seconds} value={seconds}>
                          {seconds}s
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {difficultyOptions.map(option => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleInputChange('difficulty', option.value)
                        }
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`rounded-xl border-2 p-4 text-center transition-all ${
                          settings.difficulty === option.value
                            ? 'border-electric-blue-500 bg-gradient-to-br from-electric-blue-50 to-plasma-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl">{option.icon}</div>
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    Category
                  </h3>
                  <p className="text-gray-600">Choose your trivia domain</p>
                </div>

                <div className="space-y-3">
                  {categoryOptions.map(option => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleInputChange('category', option.value)
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                        settings.category === option.value
                          ? 'border-electric-blue-500 bg-gradient-to-r from-electric-blue-50 to-plasma-purple-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{option.icon}</div>
                        <div className="font-medium">{option.label}</div>
                        {settings.category === option.value && (
                          <CheckCircle className="ml-auto h-5 w-5 text-electric-blue-500" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {step > 1 && (
            <motion.button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              Back
            </motion.button>
          )}

          {step < 3 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 rounded-xl bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 py-3 font-bold text-white transition-all hover:from-electric-blue-600 hover:to-plasma-purple-600 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
            >
              Next <Zap className="ml-2 inline h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.05 } : {}}
              whileTap={!isLoading ? { scale: 0.95 } : {}}
              className="flex-1 rounded-xl bg-gradient-to-r from-energy-green-500 to-energy-green-600 py-3 font-bold text-white transition-all hover:from-energy-green-600 hover:to-energy-green-700 focus:outline-none focus:ring-4 focus:ring-energy-green-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating...
                </div>
              ) : (
                <>
                  Create Game <Trophy className="ml-2 inline h-4 w-4" />
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}
