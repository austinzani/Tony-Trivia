import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  Trophy,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  Target,
  Zap,
  Star,
  Crown,
  Timer,
  MessageSquare,
} from 'lucide-react';
import { useTeamGameIntegration } from '../hooks/useTeamGameIntegration';
import { useAuth } from '../hooks/useAuth';

interface TeamGameInterfaceProps {
  teamId: string;
  gameRoomId: string;
  className?: string;
}

export function TeamGameInterface({
  teamId,
  gameRoomId,
  className = '',
}: TeamGameInterfaceProps) {
  const { user } = useAuth();
  const {
    gameTeamState,
    teamEvents,
    readinessCheck,
    leaderboard,
    isLoading,
    error,
    isConnected,
    updateReadiness,
    submitAnswer,
    refreshGameState,
    isTeamReady,
    readyMemberCount,
    totalMemberCount,
    unreadyMembers,
    canSubmitAnswer,
    hasSubmittedAnswer,
    currentQuestion,
    teamAnswer,
    teamScore,
    teamRank,
  } = useTeamGameIntegration({ teamId, gameRoomId });

  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReadinessControls, setShowReadinessControls] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Calculate time remaining for current question
  useEffect(() => {
    if (!currentQuestion) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const startTime = new Date(currentQuestion.startedAt).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, currentQuestion.timeLimit * 1000 - elapsed);
      return Math.floor(remaining / 1000);
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion]);

  // Handle readiness toggle
  const handleReadinessToggle = async () => {
    const currentUserStatus = readinessCheck?.memberStatuses.find(
      member => member.userId === user?.id
    );
    const isCurrentlyReady = currentUserStatus?.isReady || false;

    await updateReadiness(!isCurrentlyReady);
  };

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answerText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitAnswer(currentQuestion.id, answerText.trim());

      if (result.success) {
        setAnswerText('');
        setShowReadinessControls(false);
      } else {
        alert(result.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current user's readiness status
  const currentUserStatus = readinessCheck?.memberStatuses.find(
    member => member.userId === user?.id
  );
  const isCurrentUserReady = currentUserStatus?.isReady || false;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-48 ${className}`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">Loading team game interface...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={refreshGameState}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Team Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Team Game Interface
              {!isConnected && <AlertCircle className="w-5 h-5 text-red-500" />}
            </h2>
            <p className="text-sm text-gray-600">
              Game Status:{' '}
              <span className="capitalize font-medium">
                {gameTeamState?.status || 'Unknown'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {teamScore}
              </div>
              <div className="text-xs text-gray-600">Score</div>
            </div>
            {teamRank > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  #{teamRank}
                </div>
                <div className="text-xs text-gray-600">Rank</div>
              </div>
            )}
          </div>
        </div>

        {/* Team Readiness Indicator */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700">
                Team Readiness: {readyMemberCount}/{totalMemberCount} ready
              </span>
              {isTeamReady ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {showReadinessControls && gameTeamState?.status === 'lobby' && (
              <button
                onClick={handleReadinessToggle}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCurrentUserReady
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {isCurrentUserReady ? 'Ready!' : 'Mark Ready'}
              </button>
            )}
          </div>

          {unreadyMembers.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                Waiting for: {unreadyMembers.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Current Question
            </h3>

            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining <= 10
                    ? 'bg-red-100 text-red-800'
                    : timeRemaining <= 30
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}
              >
                <Timer className="w-4 h-4" />
                {timeRemaining}s
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-gray-900 font-medium">{currentQuestion.text}</p>
          </div>

          {/* Answer Submission */}
          {canSubmitAnswer && !hasSubmittedAnswer && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Team's Answer
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="Enter your answer..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitAnswer();
                      }
                    }}
                    disabled={isSubmitting || timeRemaining === 0}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={
                      !answerText.trim() || isSubmitting || timeRemaining === 0
                    }
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submitted Answer Display */}
          {hasSubmittedAnswer && teamAnswer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-800">
                  Answer Submitted
                </span>
              </div>
              <p className="text-green-700">
                <strong>Answer:</strong> {teamAnswer.answer}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Submitted by {teamAnswer.submittedBy} at{' '}
                {new Date(teamAnswer.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          )}

          {timeRemaining === 0 && !hasSubmittedAnswer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-800">Time's Up!</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                The time limit for this question has expired.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Game Lobby State */}
      {gameTeamState?.status === 'lobby' && !currentQuestion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-800">
              Waiting for Game to Start
            </h3>
          </div>
          <p className="text-yellow-700 mb-4">
            The game host will start the game once all teams are ready. Make
            sure your team is marked as ready!
          </p>

          {!isTeamReady && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Team Status</h4>
              <div className="space-y-2">
                {readinessCheck?.memberStatuses.map(member => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">
                      {member.username}
                    </span>
                    <div className="flex items-center gap-2">
                      {member.isReady ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-600">Ready</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-600">
                            Waiting
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard
          </h3>

          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((team, index) => (
              <div
                key={team.teamId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  team.teamId === teamId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : index === 1
                          ? 'bg-gray-100 text-gray-800'
                          : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {index === 0 ? <Crown className="w-4 h-4" /> : team.rank}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {team.teamName}
                      {team.teamId === teamId && (
                        <span className="text-blue-600 ml-2">(Your Team)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600">
                      {team.onlineMembers}/{team.memberCount} online
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900">{team.score}</div>
                  <div className="text-xs text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Team Events */}
      {teamEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Recent Team Activity
          </h3>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {teamEvents
              .slice(-5)
              .reverse()
              .map((event, index) => (
                <div
                  key={event.id}
                  className="text-sm text-gray-600 p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamGameInterface;
