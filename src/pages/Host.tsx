import { Link } from 'react-router-dom';
import GameForm from '../components/GameForm';
import GameList from '../components/GameList';
import PageTransition from '../components/PageTransition';
import AnimatedButton from '../components/AnimatedButton';

export default function Host() {
  // Mock form submission handler
  const handleGameSubmit = async (data: any) => {
    console.log('Game creation data:', data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    alert(
      `Game "${data.name}" created successfully!\nGame Code: ${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-900 mb-2">
              🎯 Host Game
            </h1>
            <p className="text-lg text-gray-600">
              Set up a new trivia game session
            </p>
          </header>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create New Game Form */}
              <div>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Create New Game
                  </h2>
                  <GameForm onSubmit={handleGameSubmit} />
                </div>

                {/* Navigation */}
                <div className="flex space-x-4">
                  <Link to="/" className="flex-1">
                    <AnimatedButton variant="secondary" className="w-full">
                      ← Back to Home
                    </AnimatedButton>
                  </Link>
                  <Link to="/game" className="flex-1">
                    <AnimatedButton variant="primary" className="w-full">
                      Join Game Instead
                    </AnimatedButton>
                  </Link>
                </div>
              </div>

              {/* Active Games List */}
              <div>
                <GameList />

                {/* Information Panel */}
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🎯 Hosting Tips
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>
                        Set appropriate time limits based on question difficulty
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>
                        Choose diverse categories to engage all players
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>
                        Consider team size limits for balanced gameplay
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>Share the game code with players once created</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
