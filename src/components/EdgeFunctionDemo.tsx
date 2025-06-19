import React, { useState } from 'react';
import {
  useGameManagement,
  useTeamAnswering,
  useLiveScores,
  useEdgeFunctionHealth,
} from '../hooks/useEdgeFunctions';
import { useAuth } from '../hooks/useAuth';

interface EdgeFunctionDemoProps {
  gameId: string;
  teamId?: string;
}

export const EdgeFunctionDemo: React.FC<EdgeFunctionDemoProps> = ({
  gameId,
  teamId,
}) => {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [pointsToWager, setPointsToWager] = useState(1);
  const [questionText, setQuestionText] = useState('What is 2 + 2?');
  const [correctAnswer, setCorrectAnswer] = useState('4');

  // Edge Function hooks
  const gameManagement = useGameManagement(gameId, user?.id || '');
  const teamAnswering = useTeamAnswering(teamId || '', gameId);
  const liveScores = useLiveScores(gameId);
  const healthCheck = useEdgeFunctionHealth();

  // Sample questions for demo
  const sampleQuestions = [
    {
      text: 'What is the capital of France?',
      correctAnswer: 'Paris',
      questionType: 'short_answer' as const,
      acceptPartial: true,
    },
    {
      text: 'What is 15 × 7?',
      correctAnswer: '105',
      questionType: 'short_answer' as const,
      acceptPartial: false,
    },
    {
      text: 'True or False: The Earth is flat',
      correctAnswer: 'False',
      questionType: 'true_false' as const,
      acceptPartial: false,
    },
  ];

  const handleStartRound = () => {
    gameManagement.startRound({
      roundNumber: 1,
      roundType: 'standard',
      timeLimit: 60,
      questions: sampleQuestions,
    });
  };

  const handleSubmitAnswer = () => {
    if (!teamId) {
      alert('Please join a team first');
      return;
    }

    // For demo purposes, we'll use a mock question ID
    const mockQuestionId = 'demo-question-1';
    teamAnswering.submitAnswer(mockQuestionId, answer, pointsToWager);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Edge Functions Demo
        </h1>

        {/* Health Check Status */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Edge Functions Health</h2>
          {healthCheck.isLoading ? (
            <div className="text-gray-600">Checking health...</div>
          ) : healthCheck.error ? (
            <div className="text-red-600">Error checking health</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(healthCheck.data || {}).map(
                ([func, isHealthy]) => (
                  <div
                    key={func}
                    className={`p-2 rounded text-sm ${
                      isHealthy
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {func}: {isHealthy ? '✅' : '❌'}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Game Management Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Game Management</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={gameManagement.startGame}
              disabled={gameManagement.isStartingGame}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {gameManagement.isStartingGame ? 'Starting...' : 'Start Game'}
            </button>

            <button
              onClick={gameManagement.pauseGame}
              disabled={gameManagement.isPausingGame}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {gameManagement.isPausingGame ? 'Pausing...' : 'Pause Game'}
            </button>

            <button
              onClick={gameManagement.resumeGame}
              disabled={gameManagement.isResumingGame}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {gameManagement.isResumingGame ? 'Resuming...' : 'Resume Game'}
            </button>

            <button
              onClick={handleStartRound}
              disabled={gameManagement.isStartingRound}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {gameManagement.isStartingRound
                ? 'Starting Round...'
                : 'Start Round'}
            </button>

            <button
              onClick={gameManagement.endGame}
              disabled={gameManagement.isEndingGame}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {gameManagement.isEndingGame ? 'Ending...' : 'End Game'}
            </button>
          </div>

          {/* Display any errors */}
          {(gameManagement.startGameError ||
            gameManagement.pauseGameError ||
            gameManagement.resumeGameError ||
            gameManagement.endGameError ||
            gameManagement.startRoundError) && (
            <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
              Error:{' '}
              {gameManagement.startGameError?.message ||
                gameManagement.pauseGameError?.message ||
                gameManagement.resumeGameError?.message ||
                gameManagement.endGameError?.message ||
                gameManagement.startRoundError?.message}
            </div>
          )}
        </div>

        {/* Team Answering Section */}
        {teamId && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Team Answering</h2>

            {/* Point Balance */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Point Balance</h3>
              {teamAnswering.isLoadingBalance ? (
                <div>Loading balance...</div>
              ) : teamAnswering.pointBalance ? (
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    Remaining: {teamAnswering.pointBalance.remainingPoints}{' '}
                    points
                  </div>
                  <div className="text-sm text-gray-600">
                    Available:
                    {Object.entries(
                      teamAnswering.pointBalance.availablePoints
                    ).map(([value, count]) => (
                      <span key={value} className="ml-2">
                        {count}x {value}-point
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>No balance data</div>
              )}
            </div>

            {/* Answer Submission */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your answer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Wager
                </label>
                <select
                  value={pointsToWager}
                  onChange={e => setPointsToWager(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Point</option>
                  <option value={3}>3 Points</option>
                  <option value={5}>5 Points</option>
                </select>
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={teamAnswering.isSubmittingAnswer || !answer.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {teamAnswering.isSubmittingAnswer
                  ? 'Submitting...'
                  : 'Submit Answer'}
              </button>
            </div>

            {/* Answer submission errors */}
            {(teamAnswering.submitAnswerError ||
              teamAnswering.wagerPointsError) && (
              <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
                Error:{' '}
                {teamAnswering.submitAnswerError?.message ||
                  teamAnswering.wagerPointsError?.message}
              </div>
            )}
          </div>
        )}

        {/* Live Scores Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Scores</h2>
          {liveScores.isLoading ? (
            <div className="text-gray-600">Loading scores...</div>
          ) : liveScores.error ? (
            <div className="text-red-600">
              Error loading scores: {liveScores.error.message}
            </div>
          ) : liveScores.data ? (
            <div>
              {/* Team Scores */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Team Rankings</h3>
                <div className="space-y-2">
                  {liveScores.data.teams.map(team => (
                    <div
                      key={team.teamId}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-medium">
                          #{team.rank} {team.teamName}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({team.correctAnswers}/{team.totalAnswers} correct)
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {team.totalScore} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Statistics */}
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-medium mb-2">Game Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Questions</div>
                    <div className="font-semibold">
                      {liveScores.data.gameStats.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Average Score</div>
                    <div className="font-semibold">
                      {liveScores.data.gameStats.averageScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Highest Score</div>
                    <div className="font-semibold">
                      {liveScores.data.gameStats.highestScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Completed Rounds</div>
                    <div className="font-semibold">
                      {liveScores.data.gameStats.completedRounds}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">No score data available</div>
          )}
        </div>

        {/* Demo Question Setup */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Demo Question Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <input
                type="text"
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Check that all Edge Functions are healthy (green checkmarks above)
            </li>
            <li>Click "Start Game" to initialize the game state</li>
            <li>Click "Start Round" to create a round with sample questions</li>
            <li>
              If you have a team ID, you can submit answers and see point
              balances
            </li>
            <li>View live scores to see team rankings and game statistics</li>
            <li>Use pause/resume to control game flow</li>
            <li>Click "End Game" to finish and calculate final scores</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
