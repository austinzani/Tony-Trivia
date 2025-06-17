import { useState } from 'react';
import { Link } from 'react-router-dom';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import UserStatus from '../components/UserStatus';
import RouterTest from '../components/RouterTest';
import AnimatedButton from '../components/AnimatedButton';
import PageTransition from '../components/PageTransition';
import EnvDemo from '../components/EnvDemo';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">
              🎯 Tony Trivia
            </h1>
            <p className="text-lg text-gray-600">
              A web-based live trivia platform
            </p>
          </header>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            {/* Status Components */}
            <UserStatus />
            <RouterTest />
            <EnvDemo />

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="flex justify-center mb-6">
                <a
                  href="https://vitejs.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={viteLogo} className="h-16 mx-4" alt="Vite logo" />
                </a>
                <a
                  href="https://react.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={reactLogo}
                    className="h-16 mx-4 animate-spin"
                    alt="React logo"
                  />
                </a>
              </div>

              <div className="text-center mb-6">
                <AnimatedButton onClick={() => setCount(count => count + 1)}>
                  count is {count}
                </AnimatedButton>
                <p className="mt-4 text-gray-600">
                  Edit{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    src/App.tsx
                  </code>{' '}
                  and save to test HMR
                </p>
              </div>

              <p className="text-gray-500 text-center">
                Click on the Vite and React logos to learn more
              </p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link to="/game">
                <AnimatedButton variant="primary" className="w-full">
                  🎮 Join Game
                </AnimatedButton>
              </Link>
              <Link to="/host">
                <AnimatedButton variant="secondary" className="w-full">
                  🎯 Host Game
                </AnimatedButton>
              </Link>
            </div>

            {/* Read more section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 text-center">
                Click on the Vite and React logos to learn more
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
