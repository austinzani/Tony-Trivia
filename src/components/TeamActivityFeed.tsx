import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  UserPlus,
  UserMinus,
  Crown,
  Trophy,
  Target,
  MessageCircle,
  Calendar,
  Clock,
  Star,
  Award,
  Zap,
  TrendingUp,
  Users,
  GamepadIcon,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TeamActivity {
  id: string;
  type:
    | 'member_joined'
    | 'member_left'
    | 'member_promoted'
    | 'game_completed'
    | 'achievement_earned'
    | 'team_updated'
    | 'score_milestone'
    | 'streak_achieved';
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    game_name?: string;
    score?: number;
    rank?: number;
    total_teams?: number;
    achievement_type?: string;
    streak_count?: number;
    milestone_value?: number;
  };
}

interface TeamActivityFeedProps {
  teamId: string;
  teamName: string;
  maxActivities?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

type ActivityFilter = 'all' | 'members' | 'games' | 'achievements';

export function TeamActivityFeed({
  teamId,
  teamName,
  maxActivities = 20,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000,
}: TeamActivityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock data for demo - in real app this would come from API
  const mockActivities: TeamActivity[] = [
    {
      id: 'act-1',
      type: 'game_completed',
      user_id: 'user-1',
      user_name: 'Alex Johnson',
      user_avatar: '/avatars/alex.jpg',
      title: 'Game Completed',
      description: 'Team finished 1st place in Friday Night Trivia',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: {
        game_name: 'Friday Night Trivia',
        score: 1250,
        rank: 1,
        total_teams: 8,
      },
    },
    {
      id: 'act-2',
      type: 'achievement_earned',
      title: 'Achievement Unlocked',
      description: 'Team earned "Speed Demons" achievement',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      metadata: {
        achievement_type: 'speed_demons',
      },
    },
    {
      id: 'act-3',
      type: 'member_joined',
      user_id: 'user-2',
      user_name: 'Sarah Chen',
      user_avatar: '/avatars/sarah.jpg',
      title: 'New Member',
      description: 'Sarah Chen joined the team',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-4',
      type: 'score_milestone',
      title: 'Score Milestone',
      description: 'Team reached 10,000 total points!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        milestone_value: 10000,
      },
    },
    {
      id: 'act-5',
      type: 'streak_achieved',
      title: 'Win Streak',
      description: 'Team achieved 3-game win streak!',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        streak_count: 3,
      },
    },
    {
      id: 'act-6',
      type: 'member_promoted',
      user_id: 'user-3',
      user_name: 'Mike Rodriguez',
      user_avatar: '/avatars/mike.jpg',
      title: 'Member Promoted',
      description: 'Mike Rodriguez was promoted to team captain',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-7',
      type: 'team_updated',
      user_id: 'user-1',
      user_name: 'Alex Johnson',
      title: 'Team Updated',
      description: 'Team name and description were updated',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    loadActivities();
  }, [teamId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadActivities(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadActivities = async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, isRefresh ? 500 : 1000));
      setActivities(mockActivities.slice(0, maxActivities));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load team activities:', error);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  };

  const getActivityIcon = (type: TeamActivity['type']) => {
    switch (type) {
      case 'member_joined':
        return <UserPlus className="w-5 h-5" />;
      case 'member_left':
        return <UserMinus className="w-5 h-5" />;
      case 'member_promoted':
        return <Crown className="w-5 h-5" />;
      case 'game_completed':
        return <GamepadIcon className="w-5 h-5" />;
      case 'achievement_earned':
        return <Award className="w-5 h-5" />;
      case 'team_updated':
        return <Users className="w-5 h-5" />;
      case 'score_milestone':
        return <Target className="w-5 h-5" />;
      case 'streak_achieved':
        return <Zap className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: TeamActivity['type']) => {
    switch (type) {
      case 'member_joined':
        return 'bg-green-500';
      case 'member_left':
        return 'bg-red-500';
      case 'member_promoted':
        return 'bg-yellow-500';
      case 'game_completed':
        return 'bg-blue-500';
      case 'achievement_earned':
        return 'bg-purple-500';
      case 'team_updated':
        return 'bg-gray-500';
      case 'score_milestone':
        return 'bg-orange-500';
      case 'streak_achieved':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;

    switch (filter) {
      case 'members':
        return activities.filter(activity =>
          ['member_joined', 'member_left', 'member_promoted'].includes(
            activity.type
          )
        );
      case 'games':
        return activities.filter(activity =>
          ['game_completed'].includes(activity.type)
        );
      case 'achievements':
        return activities.filter(activity =>
          ['achievement_earned', 'score_milestone', 'streak_achieved'].includes(
            activity.type
          )
        );
      default:
        return activities;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getActivityDetails = (activity: TeamActivity) => {
    switch (activity.type) {
      case 'game_completed':
        const { score, rank, total_teams, game_name } = activity.metadata || {};
        return (
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">{game_name}</span> • Score:{' '}
            {score?.toLocaleString()} • Rank: #{rank} of {total_teams}
          </div>
        );
      case 'score_milestone':
        return (
          <div className="text-sm text-gray-600 mt-1">
            🎯 {activity.metadata?.milestone_value?.toLocaleString()} points
            milestone reached!
          </div>
        );
      case 'streak_achieved':
        return (
          <div className="text-sm text-gray-600 mt-1">
            ⚡ {activity.metadata?.streak_count} consecutive wins!
          </div>
        );
      case 'achievement_earned':
        return (
          <div className="text-sm text-gray-600 mt-1">
            🏆 {activity.metadata?.achievement_type?.replace('_', ' ')}{' '}
            achievement unlocked!
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredActivities = getFilteredActivities();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Team Activity
          </h3>
          <p className="text-sm text-gray-600">
            Latest updates for{' '}
            <span className="font-semibold text-blue-600">{teamName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showFilters && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as ActivityFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Activity</option>
              <option value="members">Members</option>
              <option value="games">Games</option>
              <option value="achievements">Achievements</option>
            </select>
          )}

          <button
            onClick={() => loadActivities(true)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Clock className="w-4 h-4" />
        <span>Last updated {formatTimestamp(lastRefresh.toISOString())}</span>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Activity Icon */}
              <div
                className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white flex-shrink-0`}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    {getActivityDetails(activity)}
                  </div>

                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>

                {/* User Avatar and Name */}
                {activity.user_name && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {activity.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.user_name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No Activity Yet
            </h4>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Team activity will appear here as members interact and play games.'
                : `No ${filter} activity found. Try changing the filter.`}
            </p>
          </div>
        )}
      </div>

      {/* Activity Summary */}
      {filteredActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {activities.filter(a => a.type === 'game_completed').length}
              </p>
              <p className="text-xs text-gray-600">Games Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.type === 'member_joined').length}
              </p>
              <p className="text-xs text-gray-600">Members Joined</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {activities.filter(a => a.type === 'achievement_earned').length}
              </p>
              <p className="text-xs text-gray-600">Achievements</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {
                  activities.filter(a =>
                    ['score_milestone', 'streak_achieved'].includes(a.type)
                  ).length
                }
              </p>
              <p className="text-xs text-gray-600">Milestones</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
