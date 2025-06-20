import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Palette,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CreateTeamFormData {
  name: string;
  maxMembers: number;
  color: string;
  description?: string;
}

interface CreateTeamFormProps {
  onSubmit: (teamData: CreateTeamFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  gameRoomId: string;
  existingTeamNames?: string[];
  className?: string;
}

export function CreateTeamForm({
  onSubmit,
  onCancel,
  isLoading = false,
  gameRoomId,
  existingTeamNames = [],
  className = '',
}: CreateTeamFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateTeamFormData>({
    name: '',
    maxMembers: 4,
    color: 'electric-blue',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<CreateTeamFormData>>({});

  const teamColors = [
    {
      id: 'electric-blue',
      name: 'Electric Blue',
      gradient: 'from-electric-blue-400 to-electric-blue-500',
      bg: 'bg-electric-blue-500',
    },
    {
      id: 'plasma-purple',
      name: 'Plasma Purple',
      gradient: 'from-plasma-purple-400 to-plasma-purple-500',
      bg: 'bg-plasma-purple-500',
    },
    {
      id: 'energy-red',
      name: 'Energy Red',
      gradient: 'from-energy-red-400 to-energy-red-500',
      bg: 'bg-energy-red-500',
    },
    {
      id: 'energy-orange',
      name: 'Energy Orange',
      gradient: 'from-energy-orange-400 to-energy-orange-500',
      bg: 'bg-energy-orange-500',
    },
    {
      id: 'energy-yellow',
      name: 'Energy Yellow',
      gradient: 'from-energy-yellow-400 to-energy-yellow-500',
      bg: 'bg-energy-yellow-500',
    },
    {
      id: 'energy-green',
      name: 'Energy Green',
      gradient: 'from-energy-green-400 to-energy-green-500',
      bg: 'bg-energy-green-500',
    },
  ];

  const teamNameSuggestions = [
    'Quiz Wizards',
    'Brain Busters',
    'Trivia Titans',
    'Knowledge Knights',
    'Answer Aces',
    'Fact Finders',
    'Smart Squad',
    'Wisdom Warriors',
    'Mental Giants',
    'Think Tank',
    'IQ Heroes',
    'Clever Crew',
  ].filter(name => !existingTeamNames.includes(name));

  const handleInputChange = (field: keyof CreateTeamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<CreateTeamFormData> = {};

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Team name is required';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Team name must be at least 2 characters';
      } else if (formData.name.length > 30) {
        newErrors.name = 'Team name must be less than 30 characters';
      } else if (existingTeamNames.includes(formData.name.trim())) {
        newErrors.name = 'This team name is already taken';
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

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(step)) {
      await onSubmit(formData);
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric-blue-500 to-plasma-purple-500"
          >
            <Users className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="mb-2 text-3xl font-black text-gray-900">
            Create Your Team
          </h2>
          <p className="text-gray-600">Build your trivia dream team!</p>
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
                    Team Name
                  </h3>
                  <p className="text-gray-600">
                    Choose a memorable name for your team
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Team Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-lg font-medium transition-colors focus:outline-none focus:ring-4 ${
                        errors.name
                          ? 'border-energy-red-500 focus:border-energy-red-500 focus:ring-energy-red-200'
                          : 'border-gray-300 focus:border-electric-blue-500 focus:ring-electric-blue-200'
                      }`}
                      placeholder="Enter team name..."
                      maxLength={30}
                    />
                    {errors.name && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-2 text-sm text-energy-red-600"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Name Suggestions */}
                {teamNameSuggestions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quick Suggestions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {teamNameSuggestions.slice(0, 6).map(suggestion => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleInputChange('name', suggestion)}
                          className="rounded-lg border-2 border-gray-200 p-2 text-sm font-medium text-gray-700 hover:border-electric-blue-300 hover:bg-electric-blue-50 transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
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
                    Team Settings
                  </h3>
                  <p className="text-gray-600">
                    Configure your team size and preferences
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Maximum Team Members
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[2, 4, 6].map(size => (
                      <motion.button
                        key={size}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleInputChange('maxMembers', size)}
                        className={`rounded-xl border-2 p-4 text-center transition-colors ${
                          formData.maxMembers === size
                            ? 'border-electric-blue-500 bg-electric-blue-50 text-electric-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Users className="mx-auto mb-2 h-6 w-6" />
                        <div className="text-lg font-bold">{size}</div>
                        <div className="text-xs text-gray-600">
                          {size === 2 ? 'Duo' : size === 4 ? 'Squad' : 'Team'}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Team Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-electric-blue-500 focus:outline-none focus:ring-4 focus:ring-electric-blue-200"
                    placeholder="Tell others about your team..."
                    rows={3}
                    maxLength={100}
                  />
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
                    Team Color
                  </h3>
                  <p className="text-gray-600">
                    Choose your team's signature color
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {teamColors.map(color => (
                    <motion.button
                      key={color.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('color', color.id)}
                      className={`relative rounded-xl border-3 p-4 transition-all ${
                        formData.color === color.id
                          ? 'border-gray-800 shadow-lg'
                          : 'border-gray-200'
                      }`}
                    >
                      <div
                        className={`h-12 w-full rounded-lg bg-gradient-to-r ${color.gradient} mb-2`}
                      />
                      <div className="text-sm font-medium text-gray-900">
                        {color.name}
                      </div>
                      {formData.color === color.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-energy-green-500 flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Team Preview */}
                <div className="rounded-xl border-2 border-gray-200 p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Team Preview
                  </h4>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-full bg-gradient-to-r ${teamColors.find(c => c.id === formData.color)?.gradient} flex items-center justify-center`}
                    >
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {formData.name || 'Your Team'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Up to {formData.maxMembers} members
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-gray-400 transition-colors"
          >
            Cancel
          </motion.button>

          {step < 3 ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-6 py-3 font-semibold text-white hover:from-electric-blue-600 hover:to-plasma-purple-600 transition-all"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-energy-green-400 to-energy-green-500 px-6 py-3 font-semibold text-white hover:from-energy-green-500 hover:to-energy-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create Team
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateTeamForm;
