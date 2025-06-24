import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Trophy,
  Target,
  Zap,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar, Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/host';
import { cn } from '../../utils/cn';

interface GameStats {
  totalQuestions: number;
  questionsAnswered: number;
  averageResponseTime: number;
  totalTeams: number;
  activePlayers: number;
  correctAnswerRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  avgResponseTime: number;
  streakBest: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
  correctRate: number;
  avgResponseTime: number;
  totalAttempts: number;
}

interface HostAnalyticsDashboardProps {
  gameStats: GameStats;
  teamPerformances: TeamPerformance[];
  questionAnalytics: QuestionAnalytics[];
  onExportReport?: () => void;
}

export const HostAnalyticsDashboard: React.FC<HostAnalyticsDashboardProps> = ({
  gameStats,
  teamPerformances,
  questionAnalytics,
  onExportReport
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'teams' | 'questions'>('overview');

  const statCards = [
    {
      label: 'Questions Progress',
      value: `${gameStats.questionsAnswered}/${gameStats.totalQuestions}`,
      icon: Target,
      color: 'electric',
      progress: (gameStats.questionsAnswered / gameStats.totalQuestions) * 100
    },
    {
      label: 'Active Players',
      value: gameStats.activePlayers,
      icon: Users,
      color: 'plasma',
      subtext: `${gameStats.totalTeams} teams`
    },
    {
      label: 'Correct Answer Rate',
      value: `${Math.round(gameStats.correctAnswerRate)}%`,
      icon: Trophy,
      color: gameStats.correctAnswerRate > 70 ? 'victory' : 'warning',
      trend: gameStats.correctAnswerRate > 70 ? 'up' : 'down'
    },
    {
      label: 'Avg Response Time',
      value: `${gameStats.averageResponseTime.toFixed(1)}s`,
      icon: Clock,
      color: 'energy-yellow'
    }
  ];

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'teams', label: 'Team Analytics', icon: Users },
    { id: 'questions', label: 'Question Analytics', icon: Target }
  ];

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-electric-600" />
            Host Analytics Dashboard
          </span>
          {onExportReport && (
            <button
              onClick={onExportReport}
              className="text-sm text-electric-600 hover:text-electric-700 font-medium"
            >
              Export Report
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                  activeView === tab.id
                    ? 'bg-electric-500 text-white shadow-electric'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview View */}
        {activeView === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        stat.color === 'electric' ? 'bg-electric-100' :
                        stat.color === 'plasma' ? 'bg-plasma-100' :
                        stat.color === 'victory' ? 'bg-green-100' :
                        stat.color === 'warning' ? 'bg-yellow-100' :
                        'bg-yellow-100'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          stat.color === 'electric' ? 'text-electric-600' :
                          stat.color === 'plasma' ? 'text-plasma-600' :
                          stat.color === 'victory' ? 'text-green-600' :
                          stat.color === 'warning' ? 'text-yellow-600' :
                          'text-yellow-600'
                        )} />
                      </div>
                      {stat.trend && (
                        <div className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {stat.trend === 'up' ? '+' : '-'}12%
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                    {stat.subtext && (
                      <div className="text-xs text-gray-500">{stat.subtext}</div>
                    )}
                    {stat.progress !== undefined && (
                      <ProgressBar
                        value={stat.progress}
                        variant="gradient"
                        size="sm"
                        className="mt-3"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Highest Score</span>
                    <span className="text-xl font-bold text-victory">{gameStats.highestScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="text-xl font-bold text-electric-600">{Math.round(gameStats.averageScore)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lowest Score</span>
                    <span className="text-xl font-bold text-gray-600">{gameStats.lowestScore}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Score Range</div>
                    <ProgressBar
                      value={gameStats.averageScore - gameStats.lowestScore}
                      max={gameStats.highestScore - gameStats.lowestScore}
                      variant="gradient"
                      showPercentage
                    />
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="bg-gradient-to-br from-electric-50 to-plasma-50 p-6 rounded-lg border border-electric-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-electric-600" />
                  Quick Insights
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-electric-500 rounded-full mt-1.5"></div>
                    <span className="text-sm text-gray-700">
                      Teams are answering {gameStats.correctAnswerRate > 70 ? 'exceptionally well' : 'moderately'} with 
                      a {Math.round(gameStats.correctAnswerRate)}% success rate
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-plasma-500 rounded-full mt-1.5"></div>
                    <span className="text-sm text-gray-700">
                      Response times are {gameStats.averageResponseTime < 15 ? 'very quick' : 'steady'} at 
                      {' '}{gameStats.averageResponseTime.toFixed(1)}s average
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-victory rounded-full mt-1.5"></div>
                    <span className="text-sm text-gray-700">
                      Competition is {gameStats.highestScore - gameStats.lowestScore > 50 ? 'tight' : 'spread out'} with 
                      a {gameStats.highestScore - gameStats.lowestScore} point gap
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Teams Analytics View */}
        {activeView === 'teams' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell variant="header">Rank</TableCell>
                  <TableCell variant="header">Team</TableCell>
                  <TableCell variant="header" align="center">Score</TableCell>
                  <TableCell variant="header" align="center">Correct/Total</TableCell>
                  <TableCell variant="header" align="center">Accuracy</TableCell>
                  <TableCell variant="header" align="center">Avg Time</TableCell>
                  <TableCell variant="header" align="center">Best Streak</TableCell>
                  <TableCell variant="header" align="center">Trend</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPerformances.map((team, index) => {
                  const accuracy = (team.correctAnswers / (team.correctAnswers + team.incorrectAnswers)) * 100;
                  return (
                    <TableRow key={team.teamId} animate index={index}>
                      <TableCell>
                        <Badge 
                          variant={team.rank <= 3 ? 'victory' : 'default'}
                          size="sm"
                        >
                          #{team.rank}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{team.teamName}</div>
                      </TableCell>
                      <TableCell align="center">
                        <span className="font-bold text-electric-600">{team.score}</span>
                      </TableCell>
                      <TableCell align="center">
                        {team.correctAnswers}/{team.correctAnswers + team.incorrectAnswers}
                      </TableCell>
                      <TableCell align="center">
                        <Badge 
                          variant={accuracy > 70 ? 'success' : accuracy > 50 ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {accuracy.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell align="center">{team.avgResponseTime.toFixed(1)}s</TableCell>
                      <TableCell align="center">
                        {team.streakBest > 2 && <Award className="w-4 h-4 text-yellow-500 inline mr-1" />}
                        {team.streakBest}
                      </TableCell>
                      <TableCell align="center">
                        {team.trend === 'up' && <ArrowUp className="w-4 h-4 text-green-600" />}
                        {team.trend === 'down' && <ArrowDown className="w-4 h-4 text-red-600" />}
                        {team.trend === 'stable' && <span className="text-gray-400">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Questions Analytics View */}
        {activeView === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-1">Easiest Question</h4>
                <p className="text-lg font-bold text-green-700">
                  {Math.max(...questionAnalytics.map(q => q.correctRate)).toFixed(0)}% correct
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-900 mb-1">Hardest Question</h4>
                <p className="text-lg font-bold text-red-700">
                  {Math.min(...questionAnalytics.map(q => q.correctRate)).toFixed(0)}% correct
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Fastest Answered</h4>
                <p className="text-lg font-bold text-blue-700">
                  {Math.min(...questionAnalytics.map(q => q.avgResponseTime)).toFixed(1)}s avg
                </p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell variant="header">Question</TableCell>
                  <TableCell variant="header">Category</TableCell>
                  <TableCell variant="header" align="center">Difficulty</TableCell>
                  <TableCell variant="header" align="center">Success Rate</TableCell>
                  <TableCell variant="header" align="center">Avg Time</TableCell>
                  <TableCell variant="header" align="center">Attempts</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionAnalytics.map((question, index) => (
                  <TableRow key={question.questionId} animate index={index}>
                    <TableCell>
                      <div className="max-w-xs truncate" title={question.questionText}>
                        {question.questionText}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary" size="sm">{question.category}</Badge>
                    </TableCell>
                    <TableCell align="center">
                      <Badge 
                        variant={
                          question.difficulty === 'easy' ? 'success' :
                          question.difficulty === 'medium' ? 'warning' :
                          'danger'
                        }
                        size="sm"
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-2">
                        <ProgressBar
                          value={question.correctRate}
                          variant={
                            question.correctRate > 70 ? 'success' :
                            question.correctRate > 40 ? 'warning' :
                            'danger'
                          }
                          size="sm"
                          className="w-16"
                        />
                        <span className="text-sm font-medium">{question.correctRate.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">{question.avgResponseTime.toFixed(1)}s</TableCell>
                    <TableCell align="center">{question.totalAttempts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};