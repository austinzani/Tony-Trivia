import { useState, useEffect, useCallback } from 'react';
import { SocialService } from '../services/socialService';
import type {
  Reaction,
  ReactionType,
  TargetType,
  UserRelationship,
  SocialActivity,
  UserSocialStats
} from '../types/social';
import { useAuth } from './useAuth';

export function useSocial() {
  const { user } = useAuth();
  const [socialStats, setSocialStats] = useState<UserSocialStats | null>(null);
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's social stats
  const loadSocialStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const stats = await SocialService.getUserSocialStats(user.id);
      setSocialStats(stats);
    } catch (error) {
      console.error('Error loading social stats:', error);
    }
  }, [user?.id]);

  // Load friends
  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const friendsList = await SocialService.getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load activity feed
  const loadActivities = useCallback(async (limit = 20) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const feed = await SocialService.getActivityFeed({ limit });
      setActivities(feed);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Add reaction
  const addReaction = useCallback(async (params: {
    gameRoomId: string;
    targetType: TargetType;
    targetId: string;
    reactionType: ReactionType;
    teamId?: string;
  }) => {
    if (!user?.id) return null;
    
    try {
      const reaction = await SocialService.addReaction(params);
      await loadSocialStats(); // Update stats
      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return null;
    }
  }, [user?.id, loadSocialStats]);

  // Send friend request
  const sendFriendRequest = useCallback(async (targetUserId: string) => {
    if (!user?.id) return false;
    
    try {
      const request = await SocialService.sendFriendRequest(targetUserId);
      if (request) {
        await loadFriends();
        return true;
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
    return false;
  }, [user?.id, loadFriends]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (relationshipId: string) => {
    try {
      const success = await SocialService.acceptFriendRequest(relationshipId);
      if (success) {
        await loadFriends();
        await loadSocialStats();
      }
      return success;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  }, [loadFriends, loadSocialStats]);

  // Follow/unfollow user
  const toggleFollow = useCallback(async (targetUserId: string, isFollowing: boolean) => {
    if (!user?.id) return false;
    
    try {
      if (isFollowing) {
        const success = await SocialService.unfollowUser(targetUserId);
        if (success) {
          await loadSocialStats();
          return true;
        }
      } else {
        const relationship = await SocialService.followUser(targetUserId);
        if (relationship) {
          await loadSocialStats();
          return true;
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
    return false;
  }, [user?.id, loadSocialStats]);

  // Create activity
  const createActivity = useCallback(async (params: Parameters<typeof SocialService.createActivity>[0]) => {
    if (!user?.id) return null;
    
    try {
      const activity = await SocialService.createActivity(params);
      if (activity) {
        setActivities(prev => [activity, ...prev]);
      }
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }, [user?.id]);

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      loadSocialStats();
      loadFriends();
      loadActivities();
    }
  }, [user?.id]);

  return {
    // State
    socialStats,
    friends,
    activities,
    loading,
    
    // Actions
    loadSocialStats,
    loadFriends,
    loadActivities,
    addReaction,
    sendFriendRequest,
    acceptFriendRequest,
    toggleFollow,
    createActivity,
    
    // Computed
    pendingFriendRequests: friends.filter(f => f.status === 'pending'),
    acceptedFriends: friends.filter(f => f.status === 'accepted')
  };
}

// Hook for managing reactions on a specific target
export function useReactions(targetType: TargetType, targetId: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUserReaction, setCurrentUserReaction] = useState<ReactionType | undefined>();
  const [loading, setLoading] = useState(true);

  const loadReactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SocialService.getReactions({ targetType, targetId });
      setReactions(data);
      
      // Find current user's reaction
      const userReaction = data.find(r => r.user_id === user?.id);
      setCurrentUserReaction(userReaction?.reaction_type);
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, user?.id]);

  const toggleReaction = useCallback(async (reactionType: ReactionType, gameRoomId: string, teamId?: string) => {
    if (!user?.id) return;

    try {
      // If user already has this reaction, remove it
      if (currentUserReaction === reactionType) {
        const existingReaction = reactions.find(
          r => r.user_id === user.id && r.reaction_type === reactionType
        );
        if (existingReaction) {
          const success = await SocialService.removeReaction(existingReaction.id);
          if (success) {
            setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
            setCurrentUserReaction(undefined);
          }
        }
      } else {
        // Remove existing reaction if any
        if (currentUserReaction) {
          const existingReaction = reactions.find(
            r => r.user_id === user.id && r.reaction_type === currentUserReaction
          );
          if (existingReaction) {
            await SocialService.removeReaction(existingReaction.id);
            setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
          }
        }

        // Add new reaction
        const newReaction = await SocialService.addReaction({
          gameRoomId,
          targetType,
          targetId,
          reactionType,
          teamId
        });

        if (newReaction) {
          setReactions(prev => [...prev, newReaction]);
          setCurrentUserReaction(reactionType);
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }, [user?.id, currentUserReaction, reactions, targetType, targetId]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  return {
    reactions,
    currentUserReaction,
    loading,
    toggleReaction,
    refresh: loadReactions
  };
}