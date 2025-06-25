// Social features types for Tony Trivia

export type ReactionType = 
  | 'like' 
  | 'love' 
  | 'laugh' 
  | 'wow' 
  | 'cheer' 
  | 'fire' 
  | 'mind_blown' 
  | 'clap';

export type TargetType = 
  | 'game_moment' 
  | 'answer' 
  | 'score' 
  | 'chat_message' 
  | 'achievement';

export type RelationshipType = 'friend' | 'following' | 'blocked';
export type RelationshipStatus = 'pending' | 'accepted' | 'declined';

export type ActivityType = 
  | 'game_won' 
  | 'achievement_earned' 
  | 'high_score' 
  | 'perfect_round' 
  | 'friend_added' 
  | 'team_joined' 
  | 'level_up' 
  | 'streak_milestone';

export type Visibility = 'public' | 'friends' | 'private';

export interface Reaction {
  id: string;
  user_id: string;
  game_room_id: string;
  team_id?: string;
  target_type: TargetType;
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
  // Enriched data for UI
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface UserRelationship {
  id: string;
  user_id: string;
  target_user_id: string;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  created_at: string;
  updated_at: string;
  // Enriched data for UI
  user?: {
    display_name: string;
    avatar_url?: string;
  };
  target_user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface SocialActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  activity_data: {
    [key: string]: any;
    // Common fields
    title?: string;
    description?: string;
    points?: number;
    achievement_id?: string;
    game_room_id?: string;
    team_id?: string;
    score?: number;
    streak?: number;
  };
  visibility: Visibility;
  created_at: string;
  // Enriched data for UI
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export interface UserSocialStats {
  user_id: string;
  total_reactions_given: number;
  total_reactions_received: number;
  friends_count: number;
  followers_count: number;
  following_count: number;
  social_score: number;
  most_used_reaction?: ReactionType;
  updated_at: string;
}

export interface SocialAchievement {
  id: string;
  achievement_id: string;
  category: 'social' | 'community' | 'friendship' | 'interaction';
  requirement_type: string;
  requirement_value: number;
  icon_name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  created_at: string;
}

// Reaction configurations for UI
export const REACTION_CONFIG: Record<ReactionType, {
  emoji: string;
  label: string;
  color: string;
  animation?: string;
}> = {
  like: {
    emoji: '👍',
    label: 'Like',
    color: 'text-blue-500',
    animation: 'bounce'
  },
  love: {
    emoji: '❤️',
    label: 'Love',
    color: 'text-red-500',
    animation: 'pulse'
  },
  laugh: {
    emoji: '😂',
    label: 'Laugh',
    color: 'text-yellow-500',
    animation: 'wiggle'
  },
  wow: {
    emoji: '😮',
    label: 'Wow',
    color: 'text-purple-500',
    animation: 'scale'
  },
  cheer: {
    emoji: '🎉',
    label: 'Cheer',
    color: 'text-green-500',
    animation: 'rotate'
  },
  fire: {
    emoji: '🔥',
    label: 'Fire',
    color: 'text-orange-500',
    animation: 'flame'
  },
  mind_blown: {
    emoji: '🤯',
    label: 'Mind Blown',
    color: 'text-pink-500',
    animation: 'explode'
  },
  clap: {
    emoji: '👏',
    label: 'Clap',
    color: 'text-indigo-500',
    animation: 'clap'
  }
};

// Activity type configurations for UI
export const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: string;
  title: string;
  color: string;
}> = {
  game_won: {
    icon: '🏆',
    title: 'Won a game',
    color: 'text-yellow-500'
  },
  achievement_earned: {
    icon: '🏅',
    title: 'Earned an achievement',
    color: 'text-purple-500'
  },
  high_score: {
    icon: '⭐',
    title: 'New high score',
    color: 'text-blue-500'
  },
  perfect_round: {
    icon: '💯',
    title: 'Perfect round',
    color: 'text-green-500'
  },
  friend_added: {
    icon: '🤝',
    title: 'Made a new friend',
    color: 'text-pink-500'
  },
  team_joined: {
    icon: '👥',
    title: 'Joined a team',
    color: 'text-indigo-500'
  },
  level_up: {
    icon: '📈',
    title: 'Leveled up',
    color: 'text-orange-500'
  },
  streak_milestone: {
    icon: '🔥',
    title: 'Streak milestone',
    color: 'text-red-500'
  }
};