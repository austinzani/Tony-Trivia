import React, { useState } from 'react';
import './index.css';
import { AnimatedButton } from './components/AnimatedButton';
import AuthForm from './components/AuthForm';
import PasswordReset from './components/PasswordReset';
import EmailVerification from './components/EmailVerification';
import GuestOnboarding from './components/GuestOnboarding';
import GuestRegistrationPrompt from './components/GuestRegistrationPrompt';
import ProfileManagement from './components/ProfileManagement';
import { useUser, useIsGuest, useGuestPrompt } from './stores/useAppStore';
import { useGuestAuth } from './hooks/useGuestAuth';
import { useProfile } from './hooks/useProfile';

function App() {
  const [activeDemo, setActiveDemo] = useState<
    | 'buttons'
    | 'auth'
    | 'password-reset'
    | 'email-verification'
    | 'guest-onboarding'
    | 'profile-management'
    | null
  >('profile-management');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const user = useUser();
  const isGuest = useIsGuest();
  const guestPrompt = useGuestPrompt();
  const { guestSession, recordGuestGameCompletion } = useGuestAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile(
    user?.id || 'user-456'
  );

  // Demo functions for guest features
  const simulateGameCompletion = () => {
    if (guestSession) {
      recordGuestGameCompletion(Math.floor(Math.random() * 100));
    }
  };

  const simulateAchievement = () => {
    // This would normally be triggered by actual game events
    const { showGuestRegistrationPrompt } =
      require('./stores/useAppStore').useAppActions();
    showGuestRegistrationPrompt('achievement');
  };

  const renderActiveDemo = () => {
    switch (activeDemo) {
      case 'buttons':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                🎮 AnimatedButton Showcase
              </h2>
              <p className="text-gray-600 text-lg">
                Interactive buttons with Tony Trivia's signature style
              </p>
            </div>

            {/* Variant Showcase */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-electric-700 mb-6">
                🎨 Button Variants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatedButton variant="primary" className="font-semibold">
                  🚀 Primary Action
                </AnimatedButton>
                <AnimatedButton variant="secondary" className="font-semibold">
                  ⚡ Secondary Action
                </AnimatedButton>
                <AnimatedButton variant="ghost" className="font-semibold">
                  👻 Ghost Button
                </AnimatedButton>
                <AnimatedButton variant="success" className="font-semibold">
                  ✅ Success State
                </AnimatedButton>
                <AnimatedButton variant="danger" className="font-semibold">
                  ❌ Danger Zone
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  disabled
                  className="font-semibold"
                >
                  😴 Disabled
                </AnimatedButton>
              </div>
            </div>

            {/* Size Showcase */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-electric-700 mb-6">
                📏 Button Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <AnimatedButton variant="primary" size="sm">
                  🤏 Small
                </AnimatedButton>
                <AnimatedButton variant="primary" size="md">
                  📱 Medium
                </AnimatedButton>
                <AnimatedButton variant="primary" size="lg">
                  💻 Large
                </AnimatedButton>
                <AnimatedButton variant="primary" size="xl">
                  🖥️ Extra Large
                </AnimatedButton>
              </div>
            </div>

            {/* Interactive Features */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-electric-700 mb-6">
                ⚡ Interactive Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <AnimatedButton
                    variant="primary"
                    loading
                    fullWidth
                    className="font-semibold"
                  >
                    ⏳ Loading State
                  </AnimatedButton>
                  <AnimatedButton
                    variant="secondary"
                    icon="🎯"
                    fullWidth
                    className="font-semibold"
                  >
                    Button with Icon
                  </AnimatedButton>
                </div>
                <div className="space-y-4">
                  <AnimatedButton
                    variant="success"
                    fullWidth
                    onClick={() => alert('🎉 Button clicked!')}
                    className="font-semibold"
                  >
                    🎊 Click Me!
                  </AnimatedButton>
                  <AnimatedButton
                    variant="ghost"
                    fullWidth
                    className="font-semibold hover:bg-gradient-to-r hover:from-electric-500 hover:to-plasma-500 hover:text-white transition-all duration-300"
                  >
                    ✨ Hover Effect
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                🔐 Authentication System
              </h2>
              <p className="text-gray-600 text-lg">
                Secure login and registration with Tony Trivia styling
              </p>
            </div>

            <div className="flex justify-center space-x-4 mb-6">
              <AnimatedButton
                variant={authMode === 'login' ? 'primary' : 'ghost'}
                onClick={() => setAuthMode('login')}
              >
                🔑 Login Demo
              </AnimatedButton>
              <AnimatedButton
                variant={authMode === 'register' ? 'primary' : 'ghost'}
                onClick={() => setAuthMode('register')}
              >
                📝 Register Demo
              </AnimatedButton>
            </div>

            <AuthForm mode={authMode} />
          </div>
        );

      case 'password-reset':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                🔄 Password Reset
              </h2>
              <p className="text-gray-600 text-lg">
                Secure password recovery with engaging animations
              </p>
            </div>
            <PasswordReset />
          </div>
        );

      case 'email-verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                📧 Email Verification
              </h2>
              <p className="text-gray-600 text-lg">
                Interactive email confirmation experience
              </p>
            </div>
            <EmailVerification />
          </div>
        );

      case 'guest-onboarding':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                🎮 Guest Authentication System
              </h2>
              <p className="text-gray-600 text-lg">
                Frictionless guest experience with seamless account conversion
              </p>
            </div>

            {user ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-electric-400 to-plasma-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-4">
                  {isGuest ? '👤' : '👑'}
                </div>

                <h3 className="text-2xl font-bold text-electric-700 mb-2">
                  Welcome, {user.name}!{isGuest && ' (Guest)'}
                </h3>

                <p className="text-gray-600 mb-6">
                  {isGuest
                    ? "You're playing as a guest. Your progress is temporarily saved."
                    : "You're logged in with a permanent account!"}
                </p>

                {isGuest && guestSession && (
                  <div className="bg-gradient-to-r from-electric-50 to-plasma-50 border border-electric-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-electric-700 mb-2">
                      📊 Your Guest Progress:
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-plasma-600">
                          {guestSession.user.gameData?.gamesPlayed || 0}
                        </div>
                        <div className="text-gray-600">Games Played</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-electric-600">
                          {guestSession.user.gameData?.totalScore || 0}
                        </div>
                        <div className="text-gray-600">Total Score</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  {isGuest && (
                    <>
                      <AnimatedButton
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={simulateGameCompletion}
                        className="font-semibold"
                      >
                        🎮 Simulate Game Completion
                      </AnimatedButton>

                      <AnimatedButton
                        variant="secondary"
                        size="md"
                        fullWidth
                        onClick={simulateAchievement}
                        className="font-medium"
                      >
                        🏆 Trigger Achievement Prompt
                      </AnimatedButton>

                      <AnimatedButton
                        variant="ghost"
                        size="md"
                        fullWidth
                        onClick={() => setActiveDemo('auth')}
                        className="font-medium"
                      >
                        📝 Convert to Permanent Account
                      </AnimatedButton>
                    </>
                  )}

                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      // Clear user state to show onboarding again
                      const { logout } =
                        require('./stores/useAppStore').useAppActions();
                      logout();
                    }}
                  >
                    🔄 Reset Demo
                  </AnimatedButton>
                </div>
              </div>
            ) : (
              <GuestOnboarding
                onSuccess={() => {
                  // Guest session created successfully
                  console.log('Guest session created!');
                }}
                onSkip={() => setActiveDemo('auth')}
              />
            )}
          </div>
        );

      case 'profile-management':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
                👤 Profile Management
              </h2>
              <p className="text-gray-600 text-lg">
                Gamified profile system with stats, achievements, and
                customization
              </p>
            </div>

            {profile ? (
              <ProfileManagement
                profile={profile}
                onUpdateProfile={updateProfile}
                onUploadAvatar={uploadAvatar}
                onDeleteAccount={() => {
                  if (
                    confirm(
                      'Are you sure you want to delete your account? This action cannot be undone.'
                    )
                  ) {
                    alert(
                      'Account deletion would be processed here in a real app.'
                    );
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              </div>
            )}

            {/* Demo Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-electric-700 mb-4">
                🎮 Demo Controls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (profile) {
                      // Simulate a game completion to update stats
                      const gameResult = {
                        score: Math.floor(Math.random() * 500) + 100,
                        won: Math.random() > 0.3,
                        category: 'Science',
                        playTime: Math.floor(Math.random() * 10) + 5,
                        perfectRound: Math.random() > 0.8,
                      };

                      // In a real app, this would be handled by the game system
                      alert(
                        `🎮 Game completed! Score: ${gameResult.score}, ${gameResult.won ? 'Won' : 'Lost'}`
                      );
                    }
                  }}
                >
                  🎮 Simulate Game
                </AnimatedButton>

                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Switch between guest and regular user profiles
                    window.location.reload();
                  }}
                >
                  🔄 Switch Profile Type
                </AnimatedButton>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-4">
            🧠 Tony Trivia
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Component Showcase & Authentication Demo
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <AnimatedButton
            variant={activeDemo === 'profile-management' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('profile-management')}
            className="font-medium"
          >
            👤 Profile Management
          </AnimatedButton>
          <AnimatedButton
            variant={activeDemo === 'guest-onboarding' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('guest-onboarding')}
            className="font-medium"
          >
            🎮 Guest Auth
          </AnimatedButton>
          <AnimatedButton
            variant={activeDemo === 'auth' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('auth')}
            className="font-medium"
          >
            🔐 Authentication
          </AnimatedButton>
          <AnimatedButton
            variant={activeDemo === 'password-reset' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('password-reset')}
            className="font-medium"
          >
            🔄 Password Reset
          </AnimatedButton>
          <AnimatedButton
            variant={activeDemo === 'email-verification' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('email-verification')}
            className="font-medium"
          >
            📧 Email Verification
          </AnimatedButton>
          <AnimatedButton
            variant={activeDemo === 'buttons' ? 'primary' : 'ghost'}
            onClick={() => setActiveDemo('buttons')}
            className="font-medium"
          >
            🎨 Buttons
          </AnimatedButton>
        </div>

        {/* Demo Content */}
        <div className="mb-8">{renderActiveDemo()}</div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Built with React, TypeScript, Tailwind CSS, Framer Motion & Supabase
          </p>
          <p className="mt-2">🎯 Ready for epic trivia battles!</p>
        </div>
      </div>

      {/* Guest Registration Prompt */}
      <GuestRegistrationPrompt
        onRegister={() => setActiveDemo('auth')}
        onDismiss={() => console.log('Guest prompt dismissed')}
      />
    </div>
  );
}

export default App;
