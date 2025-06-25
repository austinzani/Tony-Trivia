import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Trophy, Heart, Users, Activity, TrendingUp, 
  Calendar, Award, Star, Zap, UserPlus, MessageCircle 
} from 'lucide-react';
import { SocialService } from '../../services/socialService';
import { statisticsService } from '../../services/statisticsService';
import type { UserSocialStats } from '../../types/social';
import type { UserStatistics } from '../../services/statisticsService';
import { FriendsList } from './FriendsList';
import { ActivityFeed } from './ActivityFeed';
import { AchievementsBadges } from '../statistics/AchievementsBadges';
import { cn } from '../../utils/cn';

interface UserProfileSocialProps {
  userId: string;
  isOwnProfile?: boolean;
  className?: string;
}

export function UserProfileSocial({
  userId,
  isOwnProfile = false,
  className
}: UserProfileSocialProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'friends' | 'activity'>('overview');
  const [socialStats, setSocialStats] = useState<UserSocialStats | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [social, stats] = await Promise.all([
        SocialService.getUserSocialStats(userId),
        statisticsService.getUserStatistics(userId)
      ]);
      
      setSocialStats(social);
      setUserStats(stats);

      // Check if following
      if (!isOwnProfile) {
        const following = await SocialService.getFollowing();
        setIsFollowing(following.some(r => r.target_user_id === userId));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowing) {
      await SocialService.unfollowUser(userId);
      setIsFollowing(false);
    } else {
      await SocialService.followUser(userId);
      setIsFollowing(true);
    }
    loadUserData();
  };

  const handleFriendRequest = async () => {
    await SocialService.sendFriendRequest(userId);
    // Show success message
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color 
  }: { 
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-electric-300 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-electric-50 to-plasma-50 rounded-2xl p-6 border-2 border-electric-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-400 to-plasma-400 flex items-center justify-center text-white text-2xl font-bold">
              {userStats?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {userStats?.display_name || 'User'}
                {userStats?.current_league && (
                  <span className="px-2 py-1 bg-energy-yellow text-gray-900 text-xs font-bold rounded-full">
                    {userStats.current_league}
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mt-1">
                Level {Math.floor((userStats?.experience_points || 0) / 1000)} • {socialStats?.social_score || 0} Social XP
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {socialStats?.friends_count || 0} friends
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {socialStats?.followers_count || 0} followers
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-electric-500 text-white hover:bg-electric-600"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFriendRequest}
                className="px-4 py-2 bg-white border-2 border-electric-300 text-electric-600 rounded-lg font-medium hover:bg-electric-50 transition-all"
              >
                <UserPlus className="w-4 h-4 inline mr-1" />
                Add Friend
              </motion.button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 pt-6 border-t border-electric-200">
          {(['overview', 'achievements', 'friends', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                activeTab === tab
                  ? "bg-electric-500 text-white"
                  : "bg-white/50 text-gray-700 hover:bg-white"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Game Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-energy-yellow" />
              Game Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Trophy}
                label="Games Won"
                value={userStats?.total_wins || 0}
                color="bg-energy-yellow"
              />
              <StatCard
                icon={Star}
                label="Win Rate"
                value={`${userStats?.win_rate || 0}%`}
                color="bg-electric-500"
              />
              <StatCard
                icon={Zap}
                label="Avg Response"
                value={`${userStats?.average_response_time || 0}s`}
                color="bg-energy-orange"
              />
              <StatCard
                icon={TrendingUp}
                label="Best Streak"
                value={userStats?.longest_win_streak || 0}
                color="bg-energy-green"
              />
            </div>
          </div>

          {/* Social Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-energy-red" />
              Social Activity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Heart}
                label="Reactions Given"
                value={socialStats?.total_reactions_given || 0}
                color="bg-energy-red"
              />
              <StatCard
                icon={MessageCircle}
                label="Reactions Received"
                value={socialStats?.total_reactions_received || 0}
                color="bg-plasma-500"
              />
              <StatCard
                icon={Users}
                label="Following"
                value={socialStats?.following_count || 0}
                color="bg-indigo-500"
              />
              <StatCard
                icon={Award}
                label="Social Score"
                value={socialStats?.social_score || 0}
                color="bg-energy-green"
              />
            </div>
          </div>

          {/* Recent Achievements Preview */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-plasma-500" />
              Recent Achievements
            </h3>
            <AchievementsBadges
              userId={userId}
              userStats={userStats}
              compact
              maxDisplay={6}
              showLocked={false}
            />
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <AchievementsBadges
          userId={userId}
          userStats={userStats}
          showLocked={isOwnProfile}
        />
      )}

      {activeTab === 'friends' && (
        <FriendsList
          userId={userId}
          showRequests={isOwnProfile}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityFeed
          userId={userId}
          showVisibilityFilter={isOwnProfile}
        />
      )}
    </div>
  );
}