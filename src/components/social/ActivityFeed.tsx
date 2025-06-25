import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Globe, Users, Lock, Loader2, RefreshCw } from 'lucide-react';
import { SocialService } from '../../services/socialService';
import { ACTIVITY_CONFIG, type SocialActivity, type Visibility } from '../../types/social';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  userId?: string;
  limit?: number;
  showVisibilityFilter?: boolean;
  className?: string;
}

export function ActivityFeed({
  userId,
  limit = 20,
  showVisibilityFilter = true,
  className
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | 'all'>('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userId, visibilityFilter]);

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = SocialService.subscribeToActivities(
      userId || '',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setActivities(prev => [payload.new as SocialActivity, ...prev]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadActivities = async (append = false) => {
    if (!append) {
      setLoading(true);
      setOffset(0);
    }

    try {
      const data = await SocialService.getActivityFeed({
        userId,
        limit,
        offset: append ? offset : 0
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      if (append) {
        setActivities(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      } else {
        setActivities(data);
        setOffset(data.length);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadActivities(true);
    }
  };

  const filteredActivities = visibilityFilter === 'all' 
    ? activities 
    : activities.filter(a => a.visibility === visibilityFilter);

  const ActivityCard = ({ activity }: { activity: SocialActivity }) => {
    const config = ACTIVITY_CONFIG[activity.activity_type];
    const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-electric-300 transition-all"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xl",
            "bg-gradient-to-br from-gray-50 to-gray-100"
          )}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  {activity.user?.display_name || 'Anonymous'}
                  <span className={cn("text-sm font-normal", config.color)}>
                    {config.title}
                  </span>
                </h4>
                {activity.activity_data.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.activity_data.description}
                  </p>
                )}
                {activity.activity_data.points && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-energy-yellow/20 rounded-full">
                    <span className="text-xs font-bold text-orange-700">
                      +{activity.activity_data.points} XP
                    </span>
                  </div>
                )}
              </div>

              {/* Visibility Icon */}
              <div className="text-gray-400">
                {activity.visibility === 'public' && <Globe className="w-4 h-4" />}
                {activity.visibility === 'friends' && <Users className="w-4 h-4" />}
                {activity.visibility === 'private' && <Lock className="w-4 h-4" />}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{timeAgo}</span>
              {activity.activity_data.game_room_id && (
                <span>In game #{activity.activity_data.game_room_id.slice(0, 8)}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-electric-700 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={cn(
              "w-4 h-4 text-gray-600",
              refreshing && "animate-spin"
            )} />
          </motion.button>
        </div>

        {/* Visibility Filter */}
        {showVisibilityFilter && (
          <div className="flex gap-2 mb-4">
            {(['all', 'public', 'friends'] as const).map((visibility) => (
              <button
                key={visibility}
                onClick={() => setVisibilityFilter(visibility)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  visibilityFilter === visibility
                    ? "bg-electric-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Activities */}
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-electric-500" />
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoadMore}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 font-medium transition-colors"
              >
                Load More
              </motion.button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No activities yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start playing to see your friends' activities!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}