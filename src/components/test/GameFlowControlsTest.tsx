import React from 'react';
import { GameFlowControls } from '../host/GameFlowControls';

/**
 * Test component for GameFlowControls
 * This component can be used to test the game flow controls in isolation
 */
export function GameFlowControlsTest() {
  const testGameId = 'test-game-123';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Game Flow Controls Test
          </h1>
          <p className="text-gray-600">
            Testing the enhanced game flow controls component with game ID:{' '}
            {testGameId}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <GameFlowControls gameId={testGameId} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Expected Features
            </h3>
            <ul className="text-blue-800 space-y-2">
              <li>• Enhanced confirmation dialogs with gradients</li>
              <li>• Progress rings for rounds and questions</li>
              <li>• Playful & colorful button designs</li>
              <li>• Real-time game state indicators</li>
              <li>• Hover animations and visual feedback</li>
              <li>• Loading states and error handling</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              Style Guide Compliance
            </h3>
            <ul className="text-green-800 space-y-2">
              <li>• Electric blue & plasma purple gradients ✓</li>
              <li>• Energetic & competitive design ✓</li>
              <li>• Clear visual hierarchy ✓</li>
              <li>• Accessible focus states ✓</li>
              <li>• Responsive design ✓</li>
              <li>• Reduced motion support ✓</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameFlowControlsTest;
