import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Edit3,
  UserPlus,
  UserMinus,
  Shield,
  BarChart3,
  Trophy,
  Calendar,
  Settings,
  Save,
  X,
  Check,
  AlertTriangle,
  Copy,
  Mail,
  MoreVertical,
  ArrowUpCircle,
  Trash2,
  Activity,
  Wifi,
} from 'lucide-react';
import { useTeamFormation } from '../hooks/useTeamFormation';
import { useAuth } from '../hooks/useAuth';
import { TeamStatusTracker } from './TeamStatusTracker';
import { TeamRealtimeSync } from './TeamRealtimeSync';
import { TeamMemberTracker } from './TeamMemberTracker';

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

interface TeamCaptainDashboardProps {
  team: Team;
  gameRoomName: string;
  onTeamUpdated?: (team: Team) => void;
  onMemberRemoved?: (memberId: string) => void;
  onMemberPromoted?: (memberId: string) => void;
}

type DashboardTab =
  | 'overview'
  | 'members'
  | 'status'
  | 'settings'
  | 'statistics';

interface EditableTeamData {
  name: string;
  description: string;
  color: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'remove' | 'promote' | 'delete';
  title: string;
  message: string;
  onConfirm: () => void;
  memberName?: string;
}

export function TeamCaptainDashboard({
  team,
  gameRoomName,
  onTeamUpdated,
  onMemberRemoved,
  onMemberPromoted,
}: TeamCaptainDashboardProps) {
  const { user } = useAuth();
  const { updateTeam, removeMember, promoteMember, isLoading } =
    useTeamFormation();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableTeamData>({
    name: team.name,
    description: team.description || '',
    color: team.color || '#3b82f6',
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: 'remove',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'info',
    message: '',
    show: false,
  });

  // Check if current user is captain
  const isCurrentUserCaptain =
    team.team_members?.some(
      member => member.user_id === user?.id && member.role === 'captain'
    ) || false;

  const teamMembers = team.team_members || [];
  const captains = teamMembers.filter(member => member.role === 'captain');
  const regularMembers = teamMembers.filter(member => member.role === 'member');

  // Show notification helper
  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Handle team update
  const handleSaveTeam = async () => {
    if (!isCurrentUserCaptain) {
      showNotification('error', 'You do not have permission to edit this team');
      return;
    }

    const result = await updateTeam(team.id, {
      name: editData.name.trim(),
      description: editData.description.trim(),
      color: editData.color,
    });

    if (result.success) {
      showNotification('success', 'Team updated successfully! 🎉');
      setIsEditing(false);
      onTeamUpdated?.({
        ...team,
        name: editData.name.trim(),
        description: editData.description.trim(),
        color: editData.color,
      });
    } else {
      showNotification('error', result.error || 'Failed to update team');
    }
  };

  // Handle member removal
  const handleRemoveMember = async (member: TeamMember) => {
    if (!isCurrentUserCaptain) {
      showNotification('error', 'You do not have permission to remove members');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'remove',
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.profiles?.username || 'this member'} from the team?`,
      memberName: member.profiles?.username,
      onConfirm: async () => {
        const result = await removeMember(team.id, member.id);
        if (result.success) {
          showNotification(
            'success',
            `${member.profiles?.username || 'Member'} has been removed from the team`
          );
          onMemberRemoved?.(member.id);
        } else {
          showNotification('error', result.error || 'Failed to remove member');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handle member promotion
  const handlePromoteMember = async (member: TeamMember) => {
    if (!isCurrentUserCaptain) {
      showNotification(
        'error',
        'You do not have permission to promote members'
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'promote',
      title: 'Promote to Captain',
      message: `Are you sure you want to promote ${member.profiles?.username || 'this member'} to team captain?`,
      memberName: member.profiles?.username,
      onConfirm: async () => {
        const result = await promoteMember(team.id, member.id);
        if (result.success) {
          showNotification(
            'success',
            `${member.profiles?.username || 'Member'} has been promoted to captain! 👑`
          );
          onMemberPromoted?.(member.id);
        } else {
          showNotification('error', result.error || 'Failed to promote member');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Copy team ID
  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id);
      showNotification('success', 'Team ID copied to clipboard! 📋');
    } catch (err) {
      showNotification('error', 'Failed to copy team ID');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditData({
      name: team.name,
      description: team.description || '',
      color: team.color || '#3b82f6',
    });
    setIsEditing(false);
  };

  // Color palette for team colors
  const colorPalette = [
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#f97316', // Orange
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
  ];

  // Tab content components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.name}
                  onChange={e =>
                    setEditData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Team name"
                />
                <textarea
                  value={editData.description}
                  onChange={e =>
                    setEditData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Team description (optional)"
                  rows={2}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {team.name}
                </h2>
                {team.description && (
                  <p className="text-gray-600">{team.description}</p>
                )}
              </div>
            )}
          </div>

          {isCurrentUserCaptain && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveTeam}
                    disabled={isLoading}
                    className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Color Picker (when editing) */}
        {isEditing && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Color
            </label>
            <div className="flex space-x-2">
              {colorPalette.map(color => (
                <button
                  key={color}
                  onClick={() => setEditData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    editData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {teamMembers.length}
            </div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {team.score || 0}
            </div>
            <div className="text-sm text-gray-600">Team Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {captains.length}
            </div>
            <div className="text-sm text-gray-600">Captains</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleCopyTeamId}
          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <Copy className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">Copy Team ID</div>
            <div className="text-sm text-gray-600">
              Share with others to join
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <Users className="w-5 h-5 text-purple-600" />
          <div>
            <div className="font-medium text-gray-900">Manage Members</div>
            <div className="text-sm text-gray-600">
              Add, remove, or promote members
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const MembersTab = () => (
    <div className="space-y-6">
      {/* Captains Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <span>Team Captains ({captains.length})</span>
        </h3>

        <div className="space-y-3">
          {captains.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              isCaptain={true}
              canManage={isCurrentUserCaptain && member.user_id !== user?.id}
              onRemove={() => handleRemoveMember(member)}
              onPromote={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Regular Members Section */}
      {regularMembers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Team Members ({regularMembers.length})</span>
          </h3>

          <div className="space-y-3">
            {regularMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                isCaptain={false}
                canManage={isCurrentUserCaptain}
                onRemove={() => handleRemoveMember(member)}
                onPromote={() => handlePromoteMember(member)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {regularMembers.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No team members yet
          </h3>
          <p className="text-gray-600 mb-4">
            Invite players to join your team and start competing!
          </p>
          <button
            onClick={handleCopyTeamId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy Team ID to Invite
          </button>
        </div>
      )}
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Team Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team ID
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={team.id}
                readOnly
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
              />
              <button
                onClick={handleCopyTeamId}
                className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game Room
            </label>
            <input
              type="text"
              value={gameRoomName}
              readOnly
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created
            </label>
            <input
              type="text"
              value={new Date(team.created_at).toLocaleDateString()}
              readOnly
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone (Captain Only) */}
      {isCurrentUserCaptain && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-900">Delete Team</div>
                <div className="text-sm text-red-700">
                  Permanently delete this team and remove all members
                </div>
              </div>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const StatusTab = () => (
    <div className="space-y-6">
      {/* Real-time Sync Status */}
      <TeamRealtimeSync
        teamId={team.id}
        gameRoomId={team.game_room_id}
        showConnectionStatus={true}
        enableBroadcast={true}
        className="mb-6"
      />

      {/* Team Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Status Tracker */}
        <div className="lg:col-span-1">
          <TeamStatusTracker
            teamId={team.id}
            teamName={team.name}
            showActivities={true}
            showDeviceInfo={true}
            autoRefresh={true}
            compactMode={false}
          />
        </div>

        {/* Member Location Tracker */}
        <div className="lg:col-span-1">
          <TeamMemberTracker
            teamId={team.id}
            gameRoomId={team.game_room_id}
            showMemberLocations={true}
            showDeviceInfo={true}
            showActivityHistory={true}
            compactMode={false}
            refreshInterval={5000}
            maxActivities={15}
          />
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-green-500" />
            <span>Live Team Activity</span>
          </h3>
          <div className="text-sm text-gray-500">Real-time updates enabled</div>
        </div>

        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">
            Real-time Status Tracking Active
          </p>
          <p className="text-sm">
            Monitor your team members' live status, locations, and activities in
            real-time. This feature helps you coordinate better during games and
            track team engagement.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Member Presence</h4>
            <p className="text-sm text-gray-600">
              See who's online, away, or in-game in real-time
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Live Activity</h4>
            <p className="text-sm text-gray-600">
              Track member activities and interactions as they happen
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Wifi className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Sync Status</h4>
            <p className="text-sm text-gray-600">
              Monitor connection quality and sync performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const StatisticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Performance</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Score</span>
              <span className="font-semibold text-blue-600">
                {team.score || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Games Played</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-semibold">N/A</span>
            </div>
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Activity</span>
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Team Created</span>
              <span className="font-semibold">
                {new Date(team.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Active</span>
              <span className="font-semibold">Today</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Members</span>
              <span className="font-semibold">{teamMembers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Member Card Component
  const MemberCard = ({
    member,
    isCaptain,
    canManage,
    onRemove,
    onPromote,
  }: {
    member: TeamMember;
    isCaptain: boolean;
    canManage: boolean;
    onRemove: () => void;
    onPromote: () => void;
  }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* Member Info */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {member.profiles?.full_name ||
                    member.profiles?.username ||
                    'Unknown User'}
                </span>
                {isCaptain && <Crown className="w-4 h-4 text-amber-500" />}
              </div>
              <div className="text-sm text-gray-600">
                @{member.profiles?.username || 'unknown'}
                {member.user_id === user?.id && (
                  <span className="text-blue-600 ml-1">(You)</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]"
                  >
                    {!isCaptain && (
                      <button
                        onClick={() => {
                          onPromote();
                          setShowActions(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                        <span>Promote to Captain</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onRemove();
                        setShowActions(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove from Team</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isCurrentUserCaptain) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Captain Access Required
        </h2>
        <p className="text-gray-600">
          Only team captains can access the team management dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Crown className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Captain Dashboard
          </h1>
        </div>
        <p className="text-gray-600">
          Manage your team for{' '}
          <span className="font-semibold text-blue-600">{gameRoomName}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'status', label: 'Live Status', icon: Activity },
            { id: 'statistics', label: 'Statistics', icon: Trophy },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'status' && <StatusTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'statistics' && <StatisticsTab />}
        </motion.div>
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {confirmDialog.title}
              </h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>

              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() =>
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
                  }
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    confirmDialog.type === 'remove'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmDialog.type === 'remove' ? 'Remove' : 'Promote'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-40 max-w-sm rounded-lg p-4 shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === 'success' && (
                <Check className="w-5 h-5 text-green-600" />
              )}
              {notification.type === 'error' && (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              {notification.type === 'info' && (
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              )}
              <span
                className={`font-medium ${
                  notification.type === 'success'
                    ? 'text-green-800'
                    : notification.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                }`}
              >
                {notification.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
