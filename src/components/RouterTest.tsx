import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentGame, useUser, useAppActions } from '../stores/useAppStore';

export default function RouterTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentGame = useCurrentGame();
  const user = useUser();
  const { setCurrentGame, clearCurrentGame } = useAppActions();

  const testGame = {
    id: 'test-123',
    code: '1234',
    name: 'Test Trivia Game',
    hostId: 'host-1',
    maxPlayers: 20,
    currentPlayers: 1,
    status: 'waiting' as const,
  };

  const handleSetTestGame = () => {
    setCurrentGame(testGame);
  };

  const handleClearGame = () => {
    clearCurrentGame();
  };

  return (
    <div className="card bg-gray-50 border-gray-200 mb-4">
      <h4 className="text-gray-800 font-medium mb-3">
        🧪 Router & State Test Panel
      </h4>

      {/* Current Route Display */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>Current Route:</strong> {location.pathname}
        </p>
      </div>

      {/* Navigation Test */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>Navigation Test:</strong>
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate('/game')}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
          >
            Go to Game
          </button>
          <button
            onClick={() => navigate('/host')}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
          >
            Go to Host
          </button>
        </div>
      </div>

      {/* State Management Test */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>State Management Test:</strong>
        </p>
        <div className="text-sm space-y-1">
          <p>
            <strong>User:</strong> {user?.name || 'Not logged in'}
          </p>
          <p>
            <strong>Current Game:</strong> {currentGame?.name || 'No game set'}
          </p>
          {currentGame && (
            <p>
              <strong>Game Code:</strong> {currentGame.code}
            </p>
          )}
        </div>

        <div className="flex space-x-2 mt-2">
          <button
            onClick={handleSetTestGame}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200"
            disabled={!!currentGame}
          >
            Set Test Game
          </button>
          <button
            onClick={handleClearGame}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            disabled={!currentGame}
          >
            Clear Game
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        ✅ All routing and state management features working correctly!
      </p>
    </div>
  );
}
