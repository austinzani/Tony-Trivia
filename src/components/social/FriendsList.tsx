import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserCheck, UserX, Search, Loader2 } from 'lucide-react';
import { SocialService } from '../../services/socialService';
import type { UserRelationship } from '../../types/social';
import { cn } from '../../utils/cn';

interface FriendsListProps {
  userId?: string;
  showRequests?: boolean;
  onSelectFriend?: (friendId: string) => void;
  className?: string;
}

export function FriendsList({
  userId,
  showRequests = true,
  onSelectFriend,
  className
}: FriendsListProps) {
  const [friends, setFriends] = useState<UserRelationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserRelationship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
  }, [userId]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const friendsData = await SocialService.getFriends(userId);
      setFriends(friendsData.filter(r => r.status === 'accepted'));
      setPendingRequests(friendsData.filter(r => r.status === 'pending'));
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    const success = await SocialService.acceptFriendRequest(relationshipId);
    if (success) {
      await loadFriends();
    }
  };

  const filteredFriends = friends.filter(friend => {
    const displayName = friend.user?.display_name || friend.target_user?.display_name || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const FriendCard = ({ relationship }: { relationship: UserRelationship }) => {
    const isSender = relationship.user_id === userId;
    const friendData = isSender ? relationship.target_user : relationship.user;
    const friendId = isSender ? relationship.target_user_id : relationship.user_id;

    if (!friendData) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onSelectFriend?.(friendId)}
        className={cn(
          "p-4 bg-white rounded-xl border-2 border-gray-100",
          "hover:border-electric-300 transition-all cursor-pointer",
          "flex items-center gap-3"
        )}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-400 to-plasma-400 flex items-center justify-center text-white font-bold">
          {friendData.avatar_url ? (
            <img 
              src={friendData.avatar_url} 
              alt={friendData.display_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            friendData.display_name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{friendData.display_name}</h4>
          <p className="text-xs text-gray-500">Friend</p>
        </div>

        {/* Status indicator */}
        <div className="w-2 h-2 rounded-full bg-energy-green"></div>
      </motion.div>
    );
  };

  const RequestCard = ({ relationship }: { relationship: UserRelationship }) => {
    const isSender = relationship.user_id === userId;
    const userData = isSender ? relationship.target_user : relationship.user;

    if (!userData || isSender) return null; // Don't show outgoing requests

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="p-4 bg-energy-yellow/10 rounded-xl border-2 border-energy-yellow/30"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-energy-yellow to-energy-orange flex items-center justify-center text-white font-bold">
            {userData.avatar_url ? (
              <img 
                src={userData.avatar_url} 
                alt={userData.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userData.display_name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{userData.display_name}</h4>
            <p className="text-xs text-gray-500">Wants to be friends</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAcceptRequest(relationship.id)}
              className="w-8 h-8 rounded-full bg-energy-green text-white flex items-center justify-center"
            >
              <UserCheck className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full bg-energy-red text-white flex items-center justify-center"
            >
              <UserX className="w-4 h-4" />
            </motion.button>
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
            <Users className="w-5 h-5" />
            Friends
          </h3>
          {showRequests && pendingRequests.length > 0 && (
            <span className="px-2 py-1 bg-energy-yellow text-gray-900 text-xs font-bold rounded-full">
              {pendingRequests.length} new
            </span>
          )}
        </div>

        {/* Tabs */}
        {showRequests && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                activeTab === 'friends'
                  ? "bg-electric-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all relative",
                activeTab === 'requests'
                  ? "bg-electric-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-energy-red text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Search */}
        {activeTab === 'friends' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-400 focus:border-transparent"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-electric-500" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {activeTab === 'friends' ? (
                filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                    <FriendCard key={friend.id} relationship={friend} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No friends found' : 'No friends yet'}
                  </div>
                )
              ) : (
                pendingRequests.length > 0 ? (
                  pendingRequests.map(request => (
                    <RequestCard key={request.id} relationship={request} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No pending requests
                  </div>
                )
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Friend Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full py-3 bg-gradient-to-r from-electric-500 to-plasma-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg"
      >
        <UserPlus className="w-5 h-5" />
        Add Friend
      </motion.button>
    </div>
  );
}