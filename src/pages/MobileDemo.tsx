import React, { useState } from 'react';
import { 
  MobileButton, 
  MobileCard, 
  MobileNav, 
  MobileModal, 
  MobileInput, 
  MobileLoader,
  MobileErrorDisplay,
  MobileScoreDisplay,
  MobileTeamDisplay
} from '../components/ui';
import { Home, Users, Trophy, Settings, Mail, Lock, Search } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function MobileDemo() {
  const [activeNav, setActiveNav] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [showError, setShowError] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'teams', label: 'Teams', icon: Users, badge: 3 },
    { id: 'scores', label: 'Scores', icon: Trophy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const mockTeam = {
    teamName: 'Quiz Masters',
    teamScore: 2450,
    members: [
      { id: '1', name: 'John Doe', role: 'captain' as const, score: 850, isOnline: true },
      { id: '2', name: 'Jane Smith', role: 'member' as const, score: 600, isOnline: true },
      { id: '3', name: 'Bob Johnson', role: 'member' as const, score: 500, isOnline: false },
      { id: '4', name: 'Alice Brown', role: 'member' as const, score: 500, isOnline: true },
    ],
    rank: 2,
  };

  const handleInputValidation = (value: string) => {
    setInputValue(value);
    if (value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-electric-50 to-plasma-50 pb-20">
        <div className="safe-padding-top safe-padding-left safe-padding-right">
          {/* Header */}
          <header className="bg-white shadow-sm mobile-padding py-4 mb-6">
            <h1 className="text-2xl font-bold text-electric-900">
              Mobile Components Demo
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Tony Trivia Mobile UI Showcase
            </p>
          </header>

          <div className="mobile-padding space-y-6">
            {/* Buttons Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Buttons</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <MobileButton variant="primary" size="sm">Small</MobileButton>
                  <MobileButton variant="primary" size="md">Medium</MobileButton>
                  <MobileButton variant="primary" size="lg">Large</MobileButton>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MobileButton variant="primary" icon={Trophy}>Primary</MobileButton>
                  <MobileButton variant="secondary" icon={Users}>Secondary</MobileButton>
                  <MobileButton variant="success" icon={Trophy}>Success</MobileButton>
                  <MobileButton variant="danger" icon={Trophy}>Danger</MobileButton>
                </div>
                <MobileButton variant="primary" loading fullWidth>
                  Loading State
                </MobileButton>
                <MobileButton variant="secondary" disabled fullWidth>
                  Disabled State
                </MobileButton>
              </div>
            </section>

            {/* Cards Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Cards</h2>
              <div className="space-y-3">
                <MobileCard variant="default" padding="md">
                  <h3 className="font-semibold mb-2">Default Card</h3>
                  <p className="text-sm text-gray-600">This is a basic card with medium padding.</p>
                </MobileCard>
                
                <MobileCard variant="game" padding="md" interactive>
                  <h3 className="font-semibold mb-2">Game Card (Interactive)</h3>
                  <p className="text-sm text-gray-600">Tap this card to see the interaction effect.</p>
                </MobileCard>

                <MobileCard variant="elevated" padding="lg">
                  <h3 className="font-semibold mb-2">Elevated Card</h3>
                  <p className="text-sm text-gray-600">This card has a stronger shadow for emphasis.</p>
                </MobileCard>
              </div>
            </section>

            {/* Input Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Inputs</h2>
              <div className="space-y-4">
                <MobileInput
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  icon={Mail}
                  value={inputValue}
                  onChange={(e) => handleInputValidation(e.target.value)}
                  error={inputError}
                  hint="We'll never share your email"
                />
                
                <MobileInput
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  icon={Lock}
                  iconPosition="left"
                  variant="game"
                />

                <MobileInput
                  label="Search"
                  type="search"
                  placeholder="Search for teams..."
                  icon={Search}
                  iconPosition="right"
                />

                <MobileInput
                  label="Disabled Input"
                  placeholder="This input is disabled"
                  disabled
                />
              </div>
            </section>

            {/* Modal Demo */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Modal</h2>
              <MobileButton 
                variant="primary" 
                onClick={() => setIsModalOpen(true)}
                fullWidth
              >
                Open Modal
              </MobileButton>
              
              <MobileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
              >
                <div className="p-4 space-y-4">
                  <p className="text-gray-600">
                    This is a full-screen modal optimized for mobile devices. 
                    It includes safe area padding and smooth animations.
                  </p>
                  <MobileButton 
                    variant="primary" 
                    onClick={() => setIsModalOpen(false)}
                    fullWidth
                  >
                    Close Modal
                  </MobileButton>
                </div>
              </MobileModal>
            </section>

            {/* Loader Section */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Loaders</h2>
              <div className="grid grid-cols-3 gap-4">
                <MobileCard padding="md" className="flex items-center justify-center h-24">
                  <MobileLoader variant="spinner" size="md" />
                </MobileCard>
                <MobileCard padding="md" className="flex items-center justify-center h-24">
                  <MobileLoader variant="dots" size="md" />
                </MobileCard>
                <MobileCard padding="md" className="flex items-center justify-center h-24">
                  <MobileLoader variant="game" />
                </MobileCard>
              </div>
              <MobileCard padding="md" className="mt-3">
                <MobileLoader variant="spinner" size="sm" text="Loading questions..." />
              </MobileCard>
            </section>

            {/* Error Display */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Error States</h2>
              <MobileButton 
                variant="danger" 
                onClick={() => setShowError(!showError)}
                fullWidth
              >
                {showError ? 'Hide' : 'Show'} Error Display
              </MobileButton>
              
              {showError && (
                <div className="mt-3">
                  <MobileErrorDisplay
                    error="Unable to connect to game server"
                    errorType="network"
                    onRetry={() => setShowError(false)}
                    playful={true}
                  />
                </div>
              )}
            </section>

            {/* Score Display */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Score Displays</h2>
              <div className="space-y-3">
                <MobileScoreDisplay 
                  score={1250} 
                  previousScore={1000}
                  rank={3}
                  totalPlayers={25}
                  variant="full"
                />
                
                <MobileScoreDisplay 
                  score={850} 
                  previousScore={900}
                  variant="compact"
                />
                
                <MobileScoreDisplay 
                  score={2100} 
                  rank={1}
                  variant="leaderboard"
                />
              </div>
            </section>

            {/* Team Display */}
            <section>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Team Displays</h2>
              <div className="space-y-3">
                <MobileTeamDisplay 
                  {...mockTeam}
                  variant="full"
                />
                
                <MobileTeamDisplay 
                  {...mockTeam}
                  variant="compact"
                />
                
                <MobileTeamDisplay 
                  {...mockTeam}
                  variant="selection"
                  isSelected={selectedTeam === 'quiz-masters'}
                  onSelect={() => setSelectedTeam(
                    selectedTeam === 'quiz-masters' ? null : 'quiz-masters'
                  )}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          items={navItems}
          activeId={activeNav}
          onItemClick={setActiveNav}
        />
      </div>
    </PageTransition>
  );
}