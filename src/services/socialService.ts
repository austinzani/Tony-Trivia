import { supabase } from '../lib/supabase';
import type {
  Reaction,
  ReactionType,
  TargetType,
  UserRelationship,
  RelationshipType,
  RelationshipStatus,
  SocialActivity,
  ActivityType,
  UserSocialStats,
  SocialAchievement,
  Visibility
} from '../types/social';

export class SocialService {
  // Reactions
  static async addReaction(params: {
    gameRoomId: string;
    targetType: TargetType;
    targetId: string;
    reactionType: ReactionType;
    teamId?: string;
  }): Promise<Reaction | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reactions')
      .insert({
        user_id: user.user.id,
        game_room_id: params.gameRoomId,
        target_type: params.targetType,
        target_id: params.targetId,
        reaction_type: params.reactionType,
        team_id: params.teamId
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      return null;
    }

    return data;
  }

  static async removeReaction(reactionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', reactionId);

    if (error) {
      console.error('Error removing reaction:', error);
      return false;
    }

    return true;
  }

  static async getReactions(params: {
    targetType: TargetType;
    targetId: string;
  }): Promise<Reaction[]> {
    const { data, error } = await supabase
      .from('reactions')
      .select(`
        *,
        user:profiles!user_id(display_name, avatar_url)
      `)
      .eq('target_type', params.targetType)
      .eq('target_id', params.targetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reactions:', error);
      return [];
    }

    return data || [];
  }

  static async getGameReactions(gameRoomId: string): Promise<Reaction[]> {
    const { data, error } = await supabase
      .from('reactions')
      .select(`
        *,
        user:profiles!user_id(display_name, avatar_url)
      `)
      .eq('game_room_id', gameRoomId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching game reactions:', error);
      return [];
    }

    return data || [];
  }

  // Relationships
  static async sendFriendRequest(targetUserId: string): Promise<UserRelationship | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_relationships')
      .insert({
        user_id: user.user.id,
        target_user_id: targetUserId,
        relationship_type: 'friend' as RelationshipType,
        status: 'pending' as RelationshipStatus
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending friend request:', error);
      return null;
    }

    // Create reciprocal pending relationship
    await supabase
      .from('user_relationships')
      .insert({
        user_id: targetUserId,
        target_user_id: user.user.id,
        relationship_type: 'friend' as RelationshipType,
        status: 'pending' as RelationshipStatus
      });

    return data;
  }

  static async acceptFriendRequest(relationshipId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Update both sides of the relationship
    const { error } = await supabase
      .from('user_relationships')
      .update({ status: 'accepted' as RelationshipStatus })
      .or(`id.eq.${relationshipId},and(user_id.eq.${user.user.id},target_user_id.eq.${user.user.id})`);

    if (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }

    return true;
  }

  static async followUser(targetUserId: string): Promise<UserRelationship | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_relationships')
      .insert({
        user_id: user.user.id,
        target_user_id: targetUserId,
        relationship_type: 'following' as RelationshipType,
        status: 'accepted' as RelationshipStatus
      })
      .select()
      .single();

    if (error) {
      console.error('Error following user:', error);
      return null;
    }

    return data;
  }

  static async unfollowUser(targetUserId: string): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_relationships')
      .delete()
      .eq('user_id', user.user.id)
      .eq('target_user_id', targetUserId)
      .eq('relationship_type', 'following');

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }

    return true;
  }

  static async getFriends(userId?: string): Promise<UserRelationship[]> {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        *,
        user:profiles!user_id(display_name, avatar_url),
        target_user:profiles!target_user_id(display_name, avatar_url)
      `)
      .or(`user_id.eq.${targetUserId},target_user_id.eq.${targetUserId}`)
      .eq('relationship_type', 'friend')
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    return data || [];
  }

  static async getFollowers(userId?: string): Promise<UserRelationship[]> {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        *,
        user:profiles!user_id(display_name, avatar_url)
      `)
      .eq('target_user_id', targetUserId)
      .eq('relationship_type', 'following')
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }

    return data || [];
  }

  static async getFollowing(userId?: string): Promise<UserRelationship[]> {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_relationships')
      .select(`
        *,
        target_user:profiles!target_user_id(display_name, avatar_url)
      `)
      .eq('user_id', targetUserId)
      .eq('relationship_type', 'following')
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching following:', error);
      return [];
    }

    return data || [];
  }

  // Social Activities
  static async createActivity(params: {
    activityType: ActivityType;
    activityData: Record<string, any>;
    visibility?: Visibility;
  }): Promise<SocialActivity | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('social_activities')
      .insert({
        user_id: user.user.id,
        activity_type: params.activityType,
        activity_data: params.activityData,
        visibility: params.visibility || 'friends'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }

    return data;
  }

  static async getActivityFeed(params?: {
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SocialActivity[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    let query = supabase
      .from('social_activities')
      .select(`
        *,
        user:profiles!user_id(display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }

    return data || [];
  }

  // Social Stats
  static async getUserSocialStats(userId?: string): Promise<UserSocialStats | null> {
    const { data: user } = await supabase.auth.getUser();
    const targetUserId = userId || user.user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('user_social_stats')
      .select()
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching social stats:', error);
      return null;
    }

    // Return default stats if none exist
    if (!data) {
      return {
        user_id: targetUserId,
        total_reactions_given: 0,
        total_reactions_received: 0,
        friends_count: 0,
        followers_count: 0,
        following_count: 0,
        social_score: 0,
        updated_at: new Date().toISOString()
      };
    }

    return data;
  }

  // Social Achievements
  static async getSocialAchievements(): Promise<SocialAchievement[]> {
    const { data, error } = await supabase
      .from('social_achievements')
      .select()
      .order('points', { ascending: true });

    if (error) {
      console.error('Error fetching social achievements:', error);
      return [];
    }

    return data || [];
  }

  static async checkSocialAchievements(userId: string): Promise<string[]> {
    // This would check user's social stats against achievement requirements
    // and return newly earned achievement IDs
    const stats = await this.getUserSocialStats(userId);
    if (!stats) return [];

    const achievements = await this.getSocialAchievements();
    const earnedAchievements: string[] = [];

    for (const achievement of achievements) {
      let earned = false;

      switch (achievement.requirement_type) {
        case 'friends_count':
          earned = stats.friends_count >= achievement.requirement_value;
          break;
        case 'reactions_given':
          earned = stats.total_reactions_given >= achievement.requirement_value;
          break;
        case 'reactions_received':
          earned = stats.total_reactions_received >= achievement.requirement_value;
          break;
        case 'followers_count':
          earned = stats.followers_count >= achievement.requirement_value;
          break;
        case 'social_score':
          earned = stats.social_score >= achievement.requirement_value;
          break;
      }

      if (earned) {
        earnedAchievements.push(achievement.achievement_id);
      }
    }

    return earnedAchievements;
  }

  // Real-time subscriptions
  static subscribeToReactions(
    gameRoomId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`reactions:${gameRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `game_room_id=eq.${gameRoomId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToActivities(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`activities:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_activities'
        },
        callback
      )
      .subscribe();
  }
}

export default SocialService;