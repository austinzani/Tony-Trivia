import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Users,
  UserMinus,
  UserPlus,
  Settings,
  Trophy,
  Edit3,
  Save,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Copy,
  Share2,
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Team {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  description?: string;
  score?: number;
  created_at: string;
  team_members?: TeamMember[];
}

interface TeamManagementDashboardProps {
  team: Team;
  currentUserId: string;
  onUpdateTeam: (updates: Partial<Team>) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onPromoteMember: (memberId: string) => Promise<void>;
  onInviteMembers: () => void;
  onLeaveTeam: () => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  className?: string;
}

export function TeamManagementDashboard({
  team,
  currentUserId,
  onUpdateTeam,
  onRemoveMember,
  onPromoteMember,
  onInviteMembers,
  onLeaveTeam,
  onClose,
  isLoading = false,
  className = '',
}: TeamManagementDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: team.name,
    description: team.description || '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'remove' | 'promote' | 'leave';
    memberId?: string;
    memberName?: string;
  } | null>(null);

  const members = team.team_members || [];
  const currentMember = members.find(m => m.user_id === currentUserId);
  const isCaptain = currentMember?.role === 'captain';
  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  const handleSaveEdit = async () => {
    try {
      await onUpdateTeam(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleConfirmAction = async () => {
    if (!showConfirmDialog) return;

    try {
      switch (showConfirmDialog.type) {
        case 'remove':
          if (showConfirmDialog.memberId) {
            await onRemoveMember(showConfirmDialog.memberId);
          }
          break;
        case 'promote':
          if (showConfirmDialog.memberId) {
            await onPromoteMember(showConfirmDialog.memberId);
          }
          break;
        case 'leave':
          await onLeaveTeam();
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setShowConfirmDialog(null);
    }
  };

  const copyTeamCode = () => {
    navigator.clipboard.writeText(team.id);
    // You could add a toast notification here
  };

  return (
    <div className={`mx-auto max-w-4xl ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Team Management
                </h1>
                <p className="text-electric-blue-100">
                  Manage your trivia team
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Team Info Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Team Information
              </h2>
              {isCaptain && !isEditing && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-lg bg-electric-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-electric-blue-600 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </motion.button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e =>
                      setEditData(prev => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-electric-blue-500 focus:outline-none"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editData.description}
                    onChange={e =>
                      setEditData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus:border-electric-blue-500 focus:outline-none"
                    rows={3}
                    maxLength={100}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-lg bg-energy-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-energy-green-600 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        name: team.name,
                        description: team.description || '',
                      });
                    }}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {team.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {team.description || 'No description provided'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      {members.length} members
                    </span>
                  </div>
                  {team.score !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-energy-orange-500" />
                      <span className="text-gray-700 font-semibold">
                        {team.score} points
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyTeamCode}
                      className="flex items-center gap-1 text-sm text-electric-blue-600 hover:text-electric-blue-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Team ID
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Team Members Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({members.length})
              </h2>
              {isCaptain && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onInviteMembers}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-electric-blue-500 to-plasma-purple-500 px-4 py-2 text-sm font-medium text-white hover:from-electric-blue-600 hover:to-plasma-purple-600 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </motion.button>
              )}
            </div>

            <div className="space-y-3">
              {/* Current User */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border-2 border-electric-blue-200 bg-electric-blue-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-electric-blue-400 to-plasma-purple-400 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {currentMember?.profiles?.username
                        ?.charAt(0)
                        .toUpperCase() || 'Y'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {currentMember?.profiles?.username || 'You'} (You)
                      </span>
                      {isCaptain && (
                        <Crown className="h-4 w-4 text-energy-yellow-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600 capitalize">
                      {currentMember?.role || 'member'}
                    </span>
                  </div>
                </div>
                {!isCaptain && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirmDialog({ type: 'leave' })}
                    className="flex items-center gap-2 rounded-lg bg-energy-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-energy-red-600 transition-colors"
                  >
                    <UserMinus className="h-4 w-4" />
                    Leave Team
                  </motion.button>
                )}
              </motion.div>

              {/* Other Members */}
              {otherMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {member.profiles?.username?.charAt(0).toUpperCase() ||
                          '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {member.profiles?.username || 'Unknown'}
                        </span>
                        {member.role === 'captain' && (
                          <Crown className="h-4 w-4 text-energy-yellow-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600 capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {isCaptain && (
                    <div className="flex items-center gap-2">
                      {member.role === 'member' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setShowConfirmDialog({
                              type: 'promote',
                              memberId: member.id,
                              memberName:
                                member.profiles?.username || 'this member',
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-energy-yellow-500 px-3 py-2 text-sm font-medium text-white hover:bg-energy-yellow-600 transition-colors"
                        >
                          <Shield className="h-4 w-4" />
                          Promote
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setShowConfirmDialog({
                            type: 'remove',
                            memberId: member.id,
                            memberName:
                              member.profiles?.username || 'this member',
                          })
                        }
                        className="flex items-center gap-1 rounded-lg bg-energy-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-energy-red-600 transition-colors"
                      >
                        <UserMinus className="h-4 w-4" />
                        Remove
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-energy-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-energy-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Confirm Action
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                {showConfirmDialog.type === 'remove' &&
                  `Are you sure you want to remove ${showConfirmDialog.memberName} from the team?`}
                {showConfirmDialog.type === 'promote' &&
                  `Are you sure you want to promote ${showConfirmDialog.memberName} to captain?`}
                {showConfirmDialog.type === 'leave' &&
                  'Are you sure you want to leave this team?'}
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-medium text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-energy-red-500 px-4 py-2 font-medium text-white hover:bg-energy-red-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Confirm'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TeamManagementDashboard;
