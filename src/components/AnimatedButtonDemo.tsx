import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedButton from './AnimatedButton';

// Mock icons for demonstration
const PlayIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1M9 16h1m4 0h1M9 8h1m4 0h1M15 18h3a2 2 0 002-2V8a2 2 0 00-2-2h-3m-6 0H9a2 2 0 00-2 2v8a2 2 0 002 2h3m6 0h6m-6 0V9m-6 9V9"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default function AnimatedButtonDemo() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const simulateLoading = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }, 3000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-display-lg font-bold bg-gradient-to-br from-electric-600 to-plasma-600 bg-clip-text text-transparent">
          Tony Trivia Button Components
        </h1>
        <p className="text-lg text-neutral max-w-2xl mx-auto">
          Showcase of animated button variants following the Tony Trivia design
          system
        </p>
      </motion.div>

      {/* Button Variants */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-electric-800 mb-6">
          Button Variants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary */}
          <div className="space-y-4 p-6 bg-white rounded-card shadow-game">
            <h3 className="font-medium text-electric-700">Primary</h3>
            <div className="space-y-3">
              <AnimatedButton
                variant="primary"
                onClick={() => simulateLoading('primary')}
              >
                Start Game
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                icon={<PlayIcon />}
                loading={loadingStates.primaryWithIcon}
                onClick={() => simulateLoading('primaryWithIcon')}
              >
                Join Game
              </AnimatedButton>
              <AnimatedButton variant="primary" disabled>
                Disabled
              </AnimatedButton>
            </div>
          </div>

          {/* Secondary */}
          <div className="space-y-4 p-6 bg-white rounded-card shadow-game">
            <h3 className="font-medium text-electric-700">Secondary</h3>
            <div className="space-y-3">
              <AnimatedButton variant="secondary">View Rules</AnimatedButton>
              <AnimatedButton
                variant="secondary"
                icon={<UserIcon />}
                iconPosition="left"
              >
                Edit Profile
              </AnimatedButton>
              <AnimatedButton variant="secondary" disabled>
                Disabled
              </AnimatedButton>
            </div>
          </div>

          {/* Ghost */}
          <div className="space-y-4 p-6 bg-white rounded-card shadow-game">
            <h3 className="font-medium text-electric-700">Ghost</h3>
            <div className="space-y-3">
              <AnimatedButton variant="ghost">Cancel</AnimatedButton>
              <AnimatedButton variant="ghost" icon={<PlusIcon />}>
                Add Player
              </AnimatedButton>
              <AnimatedButton variant="ghost" disabled>
                Disabled
              </AnimatedButton>
            </div>
          </div>

          {/* Danger */}
          <div className="space-y-4 p-6 bg-white rounded-card shadow-game">
            <h3 className="font-medium text-electric-700">Danger</h3>
            <div className="space-y-3">
              <AnimatedButton variant="danger">Delete Game</AnimatedButton>
              <AnimatedButton
                variant="danger"
                icon={<TrashIcon />}
                loading={loadingStates.danger}
                onClick={() => simulateLoading('danger')}
              >
                Remove Player
              </AnimatedButton>
              <AnimatedButton variant="danger" disabled>
                Disabled
              </AnimatedButton>
            </div>
          </div>

          {/* Success */}
          <div className="space-y-4 p-6 bg-white rounded-card shadow-game">
            <h3 className="font-medium text-electric-700">Success</h3>
            <div className="space-y-3">
              <AnimatedButton variant="success">Submit Answer</AnimatedButton>
              <AnimatedButton
                variant="success"
                icon={<CheckIcon />}
                iconPosition="right"
              >
                Confirm
              </AnimatedButton>
              <AnimatedButton variant="success" disabled>
                Disabled
              </AnimatedButton>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Button Sizes */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-electric-800 mb-6">
          Button Sizes
        </h2>

        <div className="space-y-6 p-6 bg-white rounded-card shadow-game">
          <div className="flex flex-wrap items-center gap-4">
            <AnimatedButton variant="primary" size="sm">
              Small
            </AnimatedButton>
            <AnimatedButton variant="primary" size="md">
              Medium
            </AnimatedButton>
            <AnimatedButton variant="primary" size="lg">
              Large
            </AnimatedButton>
            <AnimatedButton variant="primary" size="xl">
              Extra Large
            </AnimatedButton>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <AnimatedButton variant="secondary" size="sm" icon={<UserIcon />}>
              Small
            </AnimatedButton>
            <AnimatedButton variant="secondary" size="md" icon={<UserIcon />}>
              Medium
            </AnimatedButton>
            <AnimatedButton variant="secondary" size="lg" icon={<UserIcon />}>
              Large
            </AnimatedButton>
            <AnimatedButton variant="secondary" size="xl" icon={<UserIcon />}>
              Extra Large
            </AnimatedButton>
          </div>
        </div>
      </motion.section>

      {/* Full Width Examples */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-electric-800 mb-6">
          Full Width & Loading States
        </h2>

        <div className="space-y-4 p-6 bg-white rounded-card shadow-game max-w-md">
          <AnimatedButton
            variant="primary"
            fullWidth
            loading={loadingStates.fullWidth}
            onClick={() => simulateLoading('fullWidth')}
          >
            Create New Game
          </AnimatedButton>

          <AnimatedButton
            variant="secondary"
            fullWidth
            icon={<UserIcon />}
            loading={loadingStates.fullWidthSecondary}
            onClick={() => simulateLoading('fullWidthSecondary')}
          >
            Join Existing Game
          </AnimatedButton>

          <AnimatedButton
            variant="success"
            fullWidth
            icon={<CheckIcon />}
            iconPosition="right"
          >
            Ready to Play
          </AnimatedButton>
        </div>
      </motion.section>

      {/* Interactive Demo */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <h2 className="text-xl font-semibold text-electric-800 mb-6">
          Interactive Game Flow Demo
        </h2>

        <div className="bg-gradient-to-br from-electric-50 to-plasma-50 p-8 rounded-card space-y-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium text-electric-800">
              Game Lobby
            </h3>
            <p className="text-neutral">
              Click buttons to see loading states and interactions
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <AnimatedButton
              variant="primary"
              size="lg"
              icon={<PlayIcon />}
              loading={loadingStates.gameStart}
              onClick={() => simulateLoading('gameStart')}
            >
              Start Game
            </AnimatedButton>

            <AnimatedButton
              variant="secondary"
              size="lg"
              icon={<UserIcon />}
              loading={loadingStates.addPlayer}
              onClick={() => simulateLoading('addPlayer')}
            >
              Add Player
            </AnimatedButton>

            <AnimatedButton variant="ghost" size="lg">
              Settings
            </AnimatedButton>

            <AnimatedButton
              variant="danger"
              size="lg"
              icon={<TrashIcon />}
              loading={loadingStates.endGame}
              onClick={() => simulateLoading('endGame')}
            >
              End Game
            </AnimatedButton>
          </div>
        </div>
      </motion.section>

      {/* Code Usage Example */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <h2 className="text-xl font-semibold text-electric-800 mb-6">
          Usage Examples
        </h2>

        <div className="bg-electric-900 text-electric-50 p-6 rounded-card overflow-x-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {`// Basic usage
<AnimatedButton variant="primary">
  Start Game
</AnimatedButton>

// With icon and loading state
<AnimatedButton 
  variant="primary"
  icon={<PlayIcon />}
  loading={isLoading}
  onClick={handleStartGame}
>
  Join Game
</AnimatedButton>

// Full width with custom size
<AnimatedButton 
  variant="success"
  size="lg"
  fullWidth
  icon={<CheckIcon />}
  iconPosition="right"
>
  Submit Answer
</AnimatedButton>`}
          </pre>
        </div>
      </motion.section>
    </div>
  );
}
