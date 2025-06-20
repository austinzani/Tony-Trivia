import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Crown,
  UserPlus,
} from 'lucide-react';
import { TeamCard } from './TeamCard';
import { CreateTeamForm } from './CreateTeamForm';
import { TeamList } from './TeamList';
import { useTeamFormation } from '../hooks/useTeamFormation';
import { useAuth } from '../hooks/useAuth';

interface TeamFormationWorkflowProps {
  gameRoomId: string;
  gameRoomName: string;
  maxTeamsPerRoom?: number;
  onTeamJoined?: (teamId: string) => void;
  onTeamCreated?: (teamId: string) => void;
  onTeamLeft?: () => void;
}

type WorkflowStep = 'overview' | 'browse' | 'create' | 'manage';

interface NotificationState {
  type: 'success' | 'error' | 'info';
  message: string;
  show: boolean;
}

export function TeamFormationWorkflow({
  gameRoomId,
  gameRoomName,
  maxTeamsPerRoom = 20,
  onTeamJoined,
  onTeamCreated,
  onTeamLeft,
}: TeamFormationWorkflowProps) {
  const { user } = useAuth();
  const {
    teams,
    userTeam,
    isLoading,
    error,
    createTeam,
    joinTeam,
    leaveTeam,
    loadTeams,
    canJoinTeam,
    canManageTeam,
  } = useTeamFormation();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview');
  const [notification, setNotification] = useState<NotificationState>({
    type: 'info',
    message: '',
    show: false,
  });

  // Load teams when component mounts or gameRoomId changes
  useEffect(() => {
    if (gameRoomId) {
      loadTeams(gameRoomId);
    }
  }, [gameRoomId, loadTeams]);

  // Auto-navigate to manage step if user has a team
  useEffect(() => {
    if (userTeam && currentStep === 'overview') {
      setCurrentStep('manage');
    }
  }, [userTeam, currentStep]);

  // Show notification helper
  const showNotification = (
    type: NotificationState['type'],
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Handle team creation
  const handleCreateTeam = async (teamData: any) => {
    const result = await createTeam(teamData, gameRoomId);

    if (result.success) {
      showNotification(
        'success',
        `Team "${teamData.name}" created successfully! 🎉`
      );
      setCurrentStep('manage');
      onTeamCreated?.(result.team!.id);
    } else {
      showNotification('error', result.error || 'Failed to create team');
    }

    return result;
  };

  // Handle team joining
  const handleJoinTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const result = await joinTeam(teamId);

    if (result.success) {
      showNotification('success', `Welcome to ${team.name}! 🎊`);
      setCurrentStep('manage');
      onTeamJoined?.(teamId);
    } else {
      showNotification('error', result.error || 'Failed to join team');
    }
  };

  // Handle team leaving
  const handleLeaveTeam = async () => {
    if (!userTeam) return;

    const result = await leaveTeam(userTeam.id);

    if (result.success) {
      showNotification('info', `You've left ${userTeam.name}`);
      setCurrentStep('overview');
      onTeamLeft?.();
    } else {
      showNotification('error', result.error || 'Failed to leave team');
    }
  };

  // Navigation helpers
  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  const goBack = () => {
    if (currentStep === 'create' || currentStep === 'browse') {
      setCurrentStep('overview');
    } else if (currentStep === 'manage' && userTeam) {
      setCurrentStep('overview');
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return <OverviewStep />;
      case 'browse':
        return <BrowseStep />;
      case 'create':
        return <CreateStep />;
      case 'manage':
        return <ManageStep />;
      default:
        return <OverviewStep />;
    }
  };

  // Overview Step Component
  const OverviewStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Team Formation
        </h2>
        <p className="text-gray-600">
          Join an existing team or create your own for{' '}
          <span className="font-semibold text-blue-600">{gameRoomName}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
          <div className="text-sm text-blue-700">Teams Created</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {teams.reduce(
              (sum, team) => sum + (team.team_members?.length || 0),
              0
            )}
          </div>
          <div className="text-sm text-purple-700">Total Players</div>
        </div>
      </div>

      {/* Current Team Status */}
      {userTeam && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-800">
                You're on Team {userTeam.name}!
              </div>
              <div className="text-sm text-green-600">
                {canManageTeam(userTeam)
                  ? 'You are the team captain'
                  : 'You are a team member'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {!userTeam ? (
          <>
            <button
              onClick={() => goToStep('browse')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Browse & Join Teams</span>
            </button>

            <button
              onClick={() => goToStep('create')}
              disabled={teams.length >= maxTeamsPerRoom}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Team</span>
            </button>

            {teams.length >= maxTeamsPerRoom && (
              <p className="text-sm text-amber-600 text-center">
                Maximum number of teams reached for this game room
              </p>
            )}
          </>
        ) : (
          <button
            onClick={() => goToStep('manage')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Manage Team</span>
          </button>
        )}
      </div>
    </motion.div>
  );

  // Browse Step Component
  const BrowseStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={goBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Browse Teams</h2>
          <p className="text-sm text-gray-600">Find a team to join</p>
        </div>
      </div>

      {/* Team List */}
      <TeamList
        teams={teams}
        currentUserId={user?.id}
        onJoinTeam={handleJoinTeam}
        showJoinButton={true}
        emptyStateMessage="No teams available to join"
        emptyStateSubtext="Be the first to create a team!"
      />
    </motion.div>
  );

  // Create Step Component
  const CreateStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={goBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create Team</h2>
          <p className="text-sm text-gray-600">Set up your new team</p>
        </div>
      </div>

      {/* Create Team Form */}
      <CreateTeamForm
        onSubmit={handleCreateTeam}
        existingTeamNames={teams.map(t => t.name)}
        isLoading={isLoading}
      />
    </motion.div>
  );

  // Manage Step Component
  const ManageStep = () => {
    if (!userTeam) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">You're not on a team yet.</p>
          <button
            onClick={() => goToStep('overview')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back to team selection
          </button>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Team Management
              </h2>
              <p className="text-sm text-gray-600">Manage your team settings</p>
            </div>
          </div>

          {canManageTeam(userTeam) && (
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">
              <Crown className="w-4 h-4" />
              <span>Captain</span>
            </div>
          )}
        </div>

        {/* Team Card */}
        <TeamCard
          team={userTeam}
          currentUserId={user?.id}
          onJoin={() => {}}
          onLeave={handleLeaveTeam}
          onManage={() => {}}
          showActions={true}
          isExpanded={true}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleLeaveTeam}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Leave Team</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="font-medium">Processing...</span>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800">Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </motion.div>
      )}

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
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {notification.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {notification.type === 'info' && (
                <AlertCircle className="w-5 h-5 text-blue-600" />
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

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
