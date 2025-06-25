import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Activity, Share2, Trophy } from 'lucide-react';
import {
  ReactionPicker,
  ReactionDisplay,
  ChatReactions,
  QuickReactionBar,
  FriendsList,
  ActivityFeed,
  ShareButton,
  ShareCard,
  UserProfileSocial
} from '../components/social';
import type { Reaction, ReactionType } from '../types/social';
import { cn } from '../utils/cn';

export function SocialFeaturesDemo() {
  const [selectedTab, setSelectedTab] = useState<'reactions' | 'friends' | 'activity' | 'profile' | 'sharing'>('reactions');
  const [demoReactions, setDemoReactions] = useState<Reaction[]>([
    {
      id: '1',
      user_id: 'user1',
      game_room_id: 'room1',
      target_type: 'game_moment',
      target_id: 'moment1',
      reaction_type: 'fire',
      created_at: new Date().toISOString(),
      user: { display_name: 'Alice', avatar_url: '' }
    },
    {
      id: '2',
      user_id: 'user2',
      game_room_id: 'room1',
      target_type: 'game_moment',
      target_id: 'moment1',
      reaction_type: 'clap',
      created_at: new Date().toISOString(),
      user: { display_name: 'Bob', avatar_url: '' }
    },
    {
      id: '3',
      user_id: 'user3',
      game_room_id: 'room1',
      target_type: 'game_moment',
      target_id: 'moment1',
      reaction_type: 'love',
      created_at: new Date().toISOString(),
      user: { display_name: 'Charlie', avatar_url: '' }
    }
  ]);

  const handleReaction = (reactionType: ReactionType) => {
    const newReaction: Reaction = {
      id: Date.now().toString(),
      user_id: 'currentUser',
      game_room_id: 'room1',
      target_type: 'game_moment',
      target_id: 'moment1',
      reaction_type: reactionType,
      created_at: new Date().toISOString(),
      user: { display_name: 'You', avatar_url: '' }
    };
    setDemoReactions([...demoReactions, newReaction]);
  };

  const TabButton = ({ 
    tab, 
    icon: Icon, 
    label 
  }: { 
    tab: typeof selectedTab;
    icon: React.ElementType;
    label: string;
  }) => (
    <button
      onClick={() => setSelectedTab(tab)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
        selectedTab === tab
          ? "bg-electric-500 text-white shadow-lg"
          : "bg-white text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-electric-50 via-white to-plasma-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-4xl font-bold text-electric-700 mb-2">
            Social Features Demo
          </h1>
          <p className="text-gray-600">
            Explore the social features of Tony Trivia
          </p>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 justify-center">
          <TabButton tab="reactions" icon={Heart} label="Reactions" />
          <TabButton tab="friends" icon={Users} label="Friends" />
          <TabButton tab="activity" icon={Activity} label="Activity Feed" />
          <TabButton tab="profile" icon={Trophy} label="Profile" />
          <TabButton tab="sharing" icon={Share2} label="Sharing" />
        </div>

        {/* Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20"
        >
          {selectedTab === 'reactions' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Reaction System
                </h2>
                <p className="text-gray-600 mb-6">
                  React to game moments, achievements, and chat messages with expressive emojis.
                </p>
              </div>

              {/* Reaction Picker Demo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Reaction Picker
                </h3>
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl">
                  <ReactionPicker
                    onReaction={handleReaction}
                    currentReaction="love"
                  />
                  <span className="text-gray-600">Click to open reaction picker</span>
                </div>
              </div>

              {/* Reaction Display Demo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Reaction Display
                </h3>
                <div className="p-6 bg-gray-50 rounded-xl">
                  <ReactionDisplay
                    reactions={demoReactions}
                    onReactionToggle={handleReaction}
                    currentUserReaction="fire"
                  />
                </div>
              </div>

              {/* Quick Reaction Bar Demo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Quick Reaction Bar
                </h3>
                <div className="p-6 bg-gray-50 rounded-xl">
                  <QuickReactionBar onReaction={handleReaction} />
                </div>
              </div>

              {/* Chat Message with Reactions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Chat Message Reactions
                </h3>
                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-electric-400 flex items-center justify-center text-white text-sm font-bold">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">Alice</div>
                        <div className="text-gray-600">Great answer! That was amazing! 🎉</div>
                      </div>
                    </div>
                    <div className="mt-3 pl-11">
                      <ChatReactions
                        messageId="msg1"
                        gameRoomId="room1"
                        teamId="team1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'friends' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Friends System
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect with other players, send friend requests, and manage your social connections.
                </p>
              </div>
              <FriendsList showRequests />
            </div>
          )}

          {selectedTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Activity Feed
                </h2>
                <p className="text-gray-600 mb-6">
                  Stay updated with your friends' achievements, game results, and social activities.
                </p>
              </div>
              <ActivityFeed />
            </div>
          )}

          {selectedTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Enhanced User Profile
                </h2>
                <p className="text-gray-600 mb-6">
                  View comprehensive user profiles with social stats, achievements, and activity history.
                </p>
              </div>
              <UserProfileSocial 
                userId="demo-user" 
                isOwnProfile={true}
              />
            </div>
          )}

          {selectedTab === 'sharing' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Social Sharing
                </h2>
                <p className="text-gray-600 mb-6">
                  Share your achievements and game results on social media platforms.
                </p>
              </div>

              {/* Share Button Demo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Share Button
                </h3>
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl">
                  <ShareButton
                    title="Tony Trivia Victory!"
                    text="I just won an amazing game of Tony Trivia!"
                    score={1250}
                  />
                  <ShareButton
                    title="New Achievement!"
                    text="Check out my latest achievement!"
                    achievement="Trivia Master"
                  />
                </div>
              </div>

              {/* Share Card Demo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Share Card
                </h3>
                <ShareCard
                  title="Game Results"
                  subtitle="Amazing performance in today's trivia!"
                  stats={[
                    { label: 'Score', value: 1250 },
                    { label: 'Correct', value: '18/20' },
                    { label: 'Streak', value: 5 },
                    { label: 'Rank', value: '1st' }
                  ]}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Feature Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Social Features Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-electric-50 rounded-lg p-3">
              <div className="font-medium text-electric-700">Reactions</div>
              <div className="text-gray-600">8 expressive emojis</div>
            </div>
            <div className="bg-plasma-50 rounded-lg p-3">
              <div className="font-medium text-plasma-700">Friends</div>
              <div className="text-gray-600">Connect & follow</div>
            </div>
            <div className="bg-energy-yellow/20 rounded-lg p-3">
              <div className="font-medium text-orange-700">Activities</div>
              <div className="text-gray-600">Real-time feed</div>
            </div>
            <div className="bg-energy-green/20 rounded-lg p-3">
              <div className="font-medium text-green-700">Sharing</div>
              <div className="text-gray-600">Social media ready</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}