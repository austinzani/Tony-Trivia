import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            🎯 Tony Trivia
          </h1>
          <p className="text-lg text-secondary-600">
            A web-based live trivia platform
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to Tony Trivia!
            </h2>
            <p className="text-gray-600 mb-6">
              This is the development version of Tony Trivia, built with React,
              TypeScript, and Tailwind CSS. The app is currently under
              development.
            </p>

            {/* Tech Stack Demo */}
            <div className="flex justify-center items-center space-x-8 mb-6">
              <a
                href="https://vite.dev"
                target="_blank"
                className="transition-transform hover:scale-110"
              >
                <img src={viteLogo} className="h-12 w-12" alt="Vite logo" />
              </a>
              <a
                href="https://react.dev"
                target="_blank"
                className="transition-transform hover:scale-110"
              >
                <img
                  src={reactLogo}
                  className="h-12 w-12 animate-spin"
                  alt="React logo"
                  style={{ animationDuration: '10s' }}
                />
              </a>
            </div>

            {/* Interactive Demo */}
            <div className="text-center">
              <button
                onClick={() => setCount(count => count + 1)}
                className="btn-primary mb-4"
              >
                Test Counter: {count}
              </button>
              <p className="text-sm text-gray-500">
                Click the button to test our Tailwind CSS styling!
              </p>
            </div>
          </div>

          {/* Development Status */}
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800 mb-2">
              Development Status
            </h3>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>✅ React + TypeScript setup complete</li>
              <li>✅ Tailwind CSS configured</li>
              <li>✅ ESLint + Prettier configured</li>
              <li>🔄 Supabase integration (next step)</li>
              <li>⏳ Authentication system</li>
              <li>⏳ Game room management</li>
              <li>⏳ Live gameplay engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
