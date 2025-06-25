import { useState } from 'react';
import { Link } from 'react-router-dom';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import UserStatus from '../components/UserStatus';
import RouterTest from '../components/RouterTest';
import AnimatedButton from '../components/AnimatedButton';
import PageTransition from '../components/PageTransition';
import EnvDemo from '../components/EnvDemo';
import { MobileButton } from '../components/ui';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-electric-50 to-plasma-50 safe-padding-top safe-padding-bottom">
        <div className="container mx-auto mobile-padding py-6 sm:py-8">
          {/* Header */}
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-electric-900 mb-2">
              🎯 Tony Trivia
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              A web-based live trivia platform
            </p>
          </header>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            {/* Status Components */}
            <UserStatus />
            <RouterTest />
            <EnvDemo />

            <div className="bg-white p-4 sm:p-6 rounded-card shadow-game mb-6 sm:mb-8">
              <div className="flex justify-center mb-4 sm:mb-6">
                <a
                  href="https://vitejs.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-feedback"
                >
                  <img src={viteLogo} className="h-12 sm:h-16 mx-3 sm:mx-4" alt="Vite logo" />
                </a>
                <a
                  href="https://react.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-feedback"
                >
                  <img
                    src={reactLogo}
                    className="h-12 sm:h-16 mx-3 sm:mx-4 animate-spin"
                    alt="React logo"
                  />
                </a>
              </div>

              <div className="text-center mb-4 sm:mb-6">
                <MobileButton 
                  onClick={() => setCount(count => count + 1)}
                  variant="primary"
                  size="md"
                >
                  count is {count}
                </MobileButton>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                  Edit{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">
                    src/App.tsx
                  </code>{' '}
                  and save to test HMR
                </p>
              </div>

              <p className="text-gray-500 text-center text-sm sm:text-base">
                Click on the Vite and React logos to learn more
              </p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link to="/game" className="touch-feedback">
                <MobileButton variant="primary" size="lg" fullWidth>
                  🎮 Join Game
                </MobileButton>
              </Link>
              <Link to="/host" className="touch-feedback">
                <MobileButton variant="secondary" size="lg" fullWidth>
                  🎯 Host Game
                </MobileButton>
              </Link>
            </div>

            {/* Read more section */}
            <div className="bg-white p-4 sm:p-6 rounded-card shadow-game">
              <p className="text-gray-600 text-center text-sm sm:text-base mb-4">
                Ready to start your trivia adventure?
              </p>
              <div className="space-y-3">
                <Link to="/scheduled-games" className="block">
                  <MobileButton variant="primary" size="md" fullWidth>
                    📅 Scheduled Games
                  </MobileButton>
                </Link>
                <Link to="/mobile-demo" className="block">
                  <MobileButton variant="secondary" size="md" fullWidth>
                    View Mobile Components Demo
                  </MobileButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
