import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from './AnimatedButton';
import StatsDisplay from './StatsDisplay';
import AvatarSelector from './AvatarSelector';
import type { UserProfile } from '../types/profile';

interface ProfileManagementProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUploadAvatar?: (file: File) => void;
  onDeleteAccount?: () => void;
  className?: string;
}

type TabType = 'overview' | 'stats' | 'avatar' | 'settings' | 'achievements';

const ProfileManagement: React.FC<ProfileManagementProps> = ({
  profile,
  onUpdateProfile,
  onUploadAvatar,
  onDeleteAccount,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: profile.displayName,
    username: profile.username,
  });

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'avatar', label: 'Avatar', icon: '🎭' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleSaveProfile = () => {
    onUpdateProfile({
      displayName: editForm.displayName,
      username: editForm.username,
    });
    setIsEditing(false);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    onUpdateProfile({ avatarUrl });
  };

  const handleSettingChange = (
    key: keyof UserProfile['settings'],
    value: any
  ) => {
    onUpdateProfile({
      settings: {
        ...profile.settings,
        [key]: value,
      },
    });
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-8 ${className}`}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-electric-400 to-plasma-600 p-1">
            <div className="w-full h-full rounded-full bg-dark-800 flex items-center justify-center text-4xl">
              {profile.avatarUrl || '👤'}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-electric-400 to-plasma-600 text-white text-xs px-2 py-1 rounded-full font-bold">
            LV.{profile.level}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-electric-400 to-plasma-600 bg-clip-text text-transparent">
            {profile.displayName}
          </h1>
          <p className="text-gray-400">@{profile.username}</p>
          {profile.isGuest && (
            <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
              🎮 Guest Player
            </span>
          )}
        </div>

        {/* XP Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Level {profile.level}</span>
            <span>
              {profile.xp} / {profile.xpToNextLevel} XP
            </span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-electric-400 to-plasma-600"
              initial={{ width: 0 }}
              animate={{
                width: `${(profile.xp / profile.xpToNextLevel) * 100}%`,
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-electric-400 to-plasma-600 text-white shadow-lg'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Personal Information
                  </h3>
                  <AnimatedButton
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? 'secondary' : 'primary'}
                    size="sm"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </AnimatedButton>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={e =>
                          setEditForm({
                            ...editForm,
                            displayName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-electric-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={e =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-electric-400 focus:outline-none"
                      />
                    </div>
                    <AnimatedButton
                      onClick={handleSaveProfile}
                      className="w-full"
                    >
                      Save Changes
                    </AnimatedButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Display Name
                      </label>
                      <p className="text-white font-medium">
                        {profile.displayName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Username
                      </label>
                      <p className="text-white font-medium">
                        @{profile.username}
                      </p>
                    </div>
                    {profile.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400">
                          Email
                        </label>
                        <p className="text-white font-medium">
                          {profile.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Member Since
                      </label>
                      <p className="text-white font-medium">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
                <h3 className="text-xl font-bold text-white mb-6">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-electric-400">
                      {profile.stats.gamesPlayed}
                    </div>
                    <div className="text-sm text-gray-400">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-plasma-400">
                      {profile.stats.gamesWon}
                    </div>
                    <div className="text-sm text-gray-400">Games Won</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {profile.stats.highestScore.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">High Score</div>
                  </div>
                  <div className="text-center p-4 bg-dark-700 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">
                      {Math.round(profile.stats.winRate * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsDisplay
              stats={profile.stats}
              achievements={profile.achievements}
              level={profile.level}
              xp={profile.xp}
              xpToNextLevel={profile.xpToNextLevel}
            />
          )}

          {activeTab === 'avatar' && (
            <AvatarSelector
              currentAvatar={profile.avatarUrl}
              userLevel={profile.level}
              userAchievements={profile.achievements.map(a => a.id)}
              onAvatarSelect={handleAvatarSelect}
              onUpload={onUploadAvatar}
            />
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">🏆 Achievements</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.achievements.map(achievement => (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 ${
                      achievement.unlockedAt
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400'
                        : 'bg-dark-700 border-dark-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{achievement.icon}</div>
                      <h4 className="font-bold text-white">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-amber-400">
                          Unlocked:{' '}
                          {new Date(
                            achievement.unlockedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {achievement.progress !== undefined &&
                        !achievement.unlockedAt && (
                          <div className="mt-2">
                            <div className="w-full bg-dark-600 rounded-full h-2">
                              <div
                                className="h-2 bg-gradient-to-r from-electric-400 to-plasma-600 rounded-full"
                                style={{
                                  width: `${(achievement.progress / achievement.target!) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </div>
                        )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-2xl font-bold text-white">⚙️ Settings</h3>

              {/* Game Settings */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
                <h4 className="text-lg font-bold text-white mb-4">
                  Game Preferences
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium">
                        Sound Effects
                      </label>
                      <p className="text-sm text-gray-400">
                        Play sound effects during games
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          'soundEnabled',
                          !profile.settings.soundEnabled
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.settings.soundEnabled
                          ? 'bg-electric-400'
                          : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          profile.settings.soundEnabled
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium">
                        Animations
                      </label>
                      <p className="text-sm text-gray-400">
                        Enable smooth animations and transitions
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          'animationsEnabled',
                          !profile.settings.animationsEnabled
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.settings.animationsEnabled
                          ? 'bg-electric-400'
                          : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          profile.settings.animationsEnabled
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium">
                        Auto-Join Next Game
                      </label>
                      <p className="text-sm text-gray-400">
                        Automatically join the next game after completion
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          'autoJoinNextGame',
                          !profile.settings.autoJoinNextGame
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.settings.autoJoinNextGame
                          ? 'bg-electric-400'
                          : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          profile.settings.autoJoinNextGame
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-600">
                <h4 className="text-lg font-bold text-white mb-4">Privacy</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium">
                        Show in Leaderboards
                      </label>
                      <p className="text-sm text-gray-400">
                        Display your scores on public leaderboards
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          'showInLeaderboards',
                          !profile.settings.showInLeaderboards
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.settings.showInLeaderboards
                          ? 'bg-electric-400'
                          : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          profile.settings.showInLeaderboards
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-white font-medium">
                        Allow Friend Requests
                      </label>
                      <p className="text-sm text-gray-400">
                        Let other players send you friend requests
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          'allowFriendRequests',
                          !profile.settings.allowFriendRequests
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        profile.settings.allowFriendRequests
                          ? 'bg-electric-400'
                          : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          profile.settings.allowFriendRequests
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {onDeleteAccount && (
                <div className="bg-red-900/20 border border-red-600 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-red-400 mb-4">
                    ⚠️ Danger Zone
                  </h4>
                  <p className="text-gray-300 mb-4">
                    Once you delete your account, there is no going back. This
                    action cannot be undone.
                  </p>
                  <AnimatedButton
                    onClick={onDeleteAccount}
                    variant="danger"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Account
                  </AnimatedButton>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProfileManagement;
