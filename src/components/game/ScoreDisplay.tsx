import React from 'react';
import {
  Trophy,
  Target,
  TrendingUp,
  Users,
  Award,
  Star,
  Zap,
  Clock,
} from 'lucide-react';
import {
  PlayerScore,
  TeamScore,
  LeaderboardEntry,
  QuestionScore,
} from '../../services/scoreManager';

export interface PlayerScoreCardProps {
  playerScore: PlayerScore;
  showDetails?: boolean;
  showRank?: boolean;
  className?: string;
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  playerScore,
  showDetails = true,
  showRank = true,
  className = '',
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5" />;
    if (rank === 2) return <Award className="w-5 h-5" />;
    if (rank === 3) return <Star className="w-5 h-5" />;
    return <Target className="w-5 h-5" />;
  };

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {playerScore.playerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {playerScore.playerName}
            </h3>
            {showRank && (
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRankColor(playerScore.rank)}`}
              >
                {getRankIcon(playerScore.rank)}
                <span>Rank #{playerScore.rank}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {playerScore.totalScore}
          </div>
          <div className="text-sm text-gray-500">points</div>
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {playerScore.correctAnswers}
              </div>
              <div className="text-xs text-gray-500">Correct</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {playerScore.accuracy.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {playerScore.averagePointValue.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Avg Points</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {playerScore.totalQuestions}
              </div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showTopOnly?: number;
  highlightPlayerId?: string;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  title = 'Leaderboard',
  showTopOnly,
  highlightPlayerId,
  className = '',
}) => {
  const displayEntries = showTopOnly ? entries.slice(0, showTopOnly) : entries;

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getEntryBgColor = (entry: LeaderboardEntry) => {
    if (entry.id === highlightPlayerId) return 'bg-blue-50 border-blue-200';
    if (entry.rank <= 3)
      return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {displayEntries.map((entry, index) => (
          <div
            key={entry.id}
            className={`p-4 flex items-center justify-between transition-colors ${getEntryBgColor(entry)}`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-gray-600 w-8">
                {getRankDisplay(entry.rank)}
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{entry.name}</div>
                  <div className="text-xs text-gray-500">
                    {entry.correctAnswers}/{entry.totalQuestions} •{' '}
                    {entry.accuracy.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {entry.score}
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>
        ))}
      </div>

      {showTopOnly && entries.length > showTopOnly && (
        <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-100">
          Showing top {showTopOnly} of {entries.length}{' '}
          {entries[0]?.type === 'team' ? 'teams' : 'players'}
        </div>
      )}
    </div>
  );
};

export interface ScoreStatsProps {
  playerScores: PlayerScore[];
  className?: string;
}

export const ScoreStats: React.FC<ScoreStatsProps> = ({
  playerScores,
  className = '',
}) => {
  const totalPlayers = playerScores.length;
  const totalScore = playerScores.reduce((sum, p) => sum + p.totalScore, 0);
  const averageScore = totalPlayers > 0 ? totalScore / totalPlayers : 0;
  const highestScore = Math.max(...playerScores.map(p => p.totalScore), 0);
  const totalQuestions = playerScores.reduce(
    (sum, p) => sum + p.totalQuestions,
    0
  );
  const totalCorrect = playerScores.reduce(
    (sum, p) => sum + p.correctAnswers,
    0
  );
  const overallAccuracy =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const stats = [
    {
      label: 'Players',
      value: totalPlayers.toString(),
      icon: Users,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      label: 'Average Score',
      value: averageScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-green-500 bg-green-50',
    },
    {
      label: 'Highest Score',
      value: highestScore.toString(),
      icon: Trophy,
      color: 'text-yellow-500 bg-yellow-50',
    },
    {
      label: 'Overall Accuracy',
      value: `${overallAccuracy.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-500 bg-purple-50',
    },
  ];

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Game Statistics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${stat.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-lg font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface QuestionScoreListProps {
  questionScores: QuestionScore[];
  title?: string;
  showAnswers?: boolean;
  className?: string;
}

export const QuestionScoreList: React.FC<QuestionScoreListProps> = ({
  questionScores,
  title = 'Question Scores',
  showAnswers = false,
  className = '',
}) => {
  const sortedScores = [...questionScores].sort(
    (a, b) => b.scoredAt.getTime() - a.scoredAt.getTime()
  );

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedScores.map((score, index) => (
          <div key={score.questionId} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    score.isCorrect
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {score.isCorrect ? '✓' : '✗'}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Question {index + 1}
                </span>
                {score.bonusPoints && score.bonusPoints > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                    +{score.bonusPoints} bonus
                  </span>
                )}
              </div>

              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    score.pointsAwarded > 0
                      ? 'text-green-600'
                      : score.pointsAwarded < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {score.pointsAwarded > 0 ? '+' : ''}
                  {score.pointsAwarded}
                </div>
                <div className="text-xs text-gray-500">
                  of {score.pointsAttempted} pts
                </div>
              </div>
            </div>

            {showAnswers && (
              <div className="mt-2 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">Your answer:</span>{' '}
                  {score.answer}
                </div>
                {!score.isCorrect && (
                  <div className="text-gray-600 mt-1">
                    <span className="font-medium">Correct answer:</span>{' '}
                    {score.correctAnswer}
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              Scored at {score.scoredAt.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {sortedScores.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No questions scored yet</p>
        </div>
      )}
    </div>
  );
};

export interface RoundScoreDisplayProps {
  playerScore: PlayerScore;
  roundId: string;
  roundName?: string;
  className?: string;
}

export const RoundScoreDisplay: React.FC<RoundScoreDisplayProps> = ({
  playerScore,
  roundId,
  roundName,
  className = '',
}) => {
  const roundScore = playerScore.roundScores.get(roundId) || 0;
  const roundQuestions = Array.from(playerScore.questionScores.values()).filter(
    q => q.questionId.startsWith(roundId)
  ); // This is a simplified check

  const roundCorrect = roundQuestions.filter(q => q.isCorrect).length;
  const roundTotal = roundQuestions.length;
  const roundAccuracy = roundTotal > 0 ? (roundCorrect / roundTotal) * 100 : 0;

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {roundName || `Round ${roundId}`}
        </h3>
        <div className="text-2xl font-bold text-blue-600">{roundScore}</div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">{roundCorrect}</div>
          <div className="text-xs text-gray-500">Correct</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{roundTotal}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">
            {roundAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
      </div>
    </div>
  );
};
