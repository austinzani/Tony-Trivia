import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Target, 
  Minus, 
  Plus, 
  Award,
  AlertTriangle,
  Sparkles,
  Clock,
  Users
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar } from '../ui/host';
import { cn } from '../../utils/cn';

interface Team {
  id: string;
  name: string;
  score: number;
  bonusPoints: number;
  penalties: number;
  streakCount: number;
}

interface ScoringRule {
  id: string;
  name: string;
  description: string;
  value: number;
  type: 'bonus' | 'penalty' | 'multiplier';
  icon: React.ReactNode;
  color: string;
}

interface AdvancedScoringControlsProps {
  teams: Team[];
  onScoreUpdate: (teamId: string, adjustment: number, reason: string) => void;
  onBonusApply: (teamId: string, bonus: ScoringRule) => void;
  onPenaltyApply: (teamId: string, penalty: ScoringRule) => void;
  currentQuestionValue?: number;
}

const predefinedRules: ScoringRule[] = {
  bonuses: [
    {
      id: 'speed-bonus',
      name: 'Speed Bonus',
      description: 'First team to answer correctly',
      value: 10,
      type: 'bonus',
      icon: <Zap className="w-4 h-4" />,
      color: 'energy-yellow'
    },
    {
      id: 'streak-bonus',
      name: 'Streak Bonus',
      description: '3+ correct answers in a row',
      value: 15,
      type: 'bonus',
      icon: <Trophy className="w-4 h-4" />,
      color: 'victory'
    },
    {
      id: 'perfect-round',
      name: 'Perfect Round',
      description: 'All questions answered correctly',
      value: 25,
      type: 'bonus',
      icon: <Award className="w-4 h-4" />,
      color: 'energy-green'
    },
    {
      id: 'creativity-bonus',
      name: 'Creativity Bonus',
      description: 'Exceptionally creative answer',
      value: 5,
      type: 'bonus',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'plasma-500'
    }
  ],
  penalties: [
    {
      id: 'time-penalty',
      name: 'Time Penalty',
      description: 'Exceeded time limit',
      value: -5,
      type: 'penalty',
      icon: <Clock className="w-4 h-4" />,
      color: 'energy-red'
    },
    {
      id: 'hint-penalty',
      name: 'Hint Used',
      description: 'Team requested a hint',
      value: -10,
      type: 'penalty',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'energy-orange'
    },
    {
      id: 'conduct-penalty',
      name: 'Conduct Penalty',
      description: 'Unsportsmanlike behavior',
      value: -15,
      type: 'penalty',
      icon: <Users className="w-4 h-4" />,
      color: 'defeat'
    }
  ]
};

export const AdvancedScoringControls: React.FC<AdvancedScoringControlsProps> = ({
  teams,
  onScoreUpdate,
  onBonusApply,
  onPenaltyApply,
  currentQuestionValue = 10
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [customAdjustment, setCustomAdjustment] = useState<number>(0);
  const [customReason, setCustomReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'quick' | 'bonuses' | 'penalties' | 'custom'>('quick');

  const handleQuickScore = (teamId: string, correct: boolean) => {
    const points = correct ? currentQuestionValue : 0;
    onScoreUpdate(teamId, points, correct ? 'Correct answer' : 'Incorrect answer');
  };

  const handleCustomAdjustment = () => {
    if (selectedTeam && customAdjustment !== 0 && customReason) {
      onScoreUpdate(selectedTeam, customAdjustment, customReason);
      setCustomAdjustment(0);
      setCustomReason('');
    }
  };

  const tabs = [
    { id: 'quick', label: 'Quick Score', icon: Target },
    { id: 'bonuses', label: 'Bonuses', icon: Trophy },
    { id: 'penalties', label: 'Penalties', icon: AlertTriangle },
    { id: 'custom', label: 'Custom', icon: Sparkles }
  ];

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-6 h-6 text-electric-600" />
            Advanced Scoring Controls
          </span>
          <Badge variant="primary" size="lg">
            Question Value: {currentQuestionValue} pts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                  activeTab === tab.id
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'quick' && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Quickly score teams for the current question
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-electric-300 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{team.name}</h4>
                      <p className="text-sm text-gray-600">Score: {team.score}</p>
                      {team.streakCount > 0 && (
                        <Badge variant="warning" size="sm" className="mt-1">
                          Streak: {team.streakCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleQuickScore(team.id, true)}
                      >
                        <Plus className="w-4 h-4" />
                        Correct
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleQuickScore(team.id, false)}
                      >
                        <Minus className="w-4 h-4" />
                        Wrong
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'bonuses' && (
            <motion.div
              key="bonuses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Apply bonus points for exceptional performance
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
                >
                  <option value="">Choose a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predefinedRules.bonuses.map(bonus => (
                  <motion.button
                    key={bonus.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectedTeam && onBonusApply(selectedTeam, bonus)}
                    disabled={!selectedTeam}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      selectedTeam
                        ? 'border-green-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        {bonus.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{bonus.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{bonus.description}</p>
                        <Badge variant="success" size="sm" className="mt-2">
                          +{bonus.value} pts
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'penalties' && (
            <motion.div
              key="penalties"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Apply penalties for rule violations or mistakes
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
                >
                  <option value="">Choose a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predefinedRules.penalties.map(penalty => (
                  <motion.button
                    key={penalty.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectedTeam && onPenaltyApply(selectedTeam, penalty)}
                    disabled={!selectedTeam}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      selectedTeam
                        ? 'border-red-200 hover:border-red-400 hover:bg-red-50 cursor-pointer'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        {penalty.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{penalty.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{penalty.description}</p>
                        <Badge variant="danger" size="sm" className="mt-2">
                          {penalty.value} pts
                        </Badge>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 mb-4">
                Apply custom score adjustments
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Team
                  </label>
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
                  >
                    <option value="">Choose a team...</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Adjustment
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCustomAdjustment(customAdjustment - 5)}
                    >
                      -5
                    </Button>
                    <input
                      type="number"
                      value={customAdjustment}
                      onChange={(e) => setCustomAdjustment(parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none text-center"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCustomAdjustment(customAdjustment + 5)}
                    >
                      +5
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Adjustment
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none resize-none"
                  rows={3}
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>
              
              <Button
                variant="primary"
                fullWidth
                onClick={handleCustomAdjustment}
                disabled={!selectedTeam || customAdjustment === 0 || !customReason}
              >
                Apply Custom Adjustment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Score Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Current Standings</h4>
          <div className="space-y-2">
            {teams
              .sort((a, b) => b.score - a.score)
              .map((team, index) => (
                <div key={team.id} className="flex items-center gap-3">
                  <Badge 
                    variant={index === 0 ? 'victory' : 'default'} 
                    size="sm"
                  >
                    #{index + 1}
                  </Badge>
                  <span className="flex-1 text-sm font-medium">{team.name}</span>
                  <span className="text-sm font-bold text-electric-600">
                    {team.score} pts
                  </span>
                  <ProgressBar
                    value={team.score}
                    max={Math.max(...teams.map(t => t.score))}
                    variant="gradient"
                    size="sm"
                    className="w-24"
                  />
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};