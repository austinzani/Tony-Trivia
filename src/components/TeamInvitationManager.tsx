import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Copy,
  Share2,
  Users,
  Clock,
  Check,
  X,
  Send,
  Link,
  QrCode,
  UserPlus,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string;
  email?: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  invited_user?: {
    username: string;
    full_name?: string;
  };
}

interface TeamInvitationManagerProps {
  teamId: string;
  teamName: string;
  gameRoomName: string;
  isTeamCaptain: boolean;
  onInvitationSent?: (invitation: TeamInvitation) => void;
  onInvitationRevoked?: (invitationId: string) => void;
}

type InviteMethod = 'email' | 'link' | 'code';

export function TeamInvitationManager({
  teamId,
  teamName,
  gameRoomName,
  isTeamCaptain,
  onInvitationSent,
  onInvitationRevoked,
}: TeamInvitationManagerProps) {
  const { user } = useAuth();
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('link');
  const [emailInput, setEmailInput] = useState('');
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({
    type: 'info',
    message: '',
    show: false,
  });

  // Mock data for demo - in real app this would come from API
  const mockInvitations: TeamInvitation[] = [
    {
      id: 'inv-1',
      team_id: teamId,
      invited_by: user?.id || '',
      email: 'john@example.com',
      invite_code: 'TEAM123',
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      invited_user: {
        username: 'john_doe',
        full_name: 'John Doe',
      },
    },
    {
      id: 'inv-2',
      team_id: teamId,
      invited_by: user?.id || '',
      invite_code: 'TEAM456',
      status: 'accepted',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      invited_user: {
        username: 'jane_smith',
        full_name: 'Jane Smith',
      },
    },
  ];

  useEffect(() => {
    // Load existing invitations
    setInvitations(mockInvitations);
  }, [teamId]);

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

  // Generate invite link
  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteCode = generateInviteCode();
    return `${baseUrl}/join-team?code=${inviteCode}&team=${teamId}`;
  };

  // Generate invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Handle sending email invitation
  const handleSendEmailInvite = async () => {
    if (!emailInput.trim()) {
      showNotification('error', 'Please enter an email address');
      return;
    }

    if (!isValidEmail(emailInput)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newInvitation: TeamInvitation = {
        id: `inv-${Date.now()}`,
        team_id: teamId,
        invited_by: user?.id || '',
        email: emailInput,
        invite_code: generateInviteCode(),
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      setInvitations(prev => [newInvitation, ...prev]);
      setEmailInput('');
      showNotification('success', `Invitation sent to ${emailInput}! 📧`);
      onInvitationSent?.(newInvitation);
    } catch (error) {
      showNotification('error', 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copying invite link
  const handleCopyInviteLink = async () => {
    const inviteLink = generateInviteLink();

    try {
      await navigator.clipboard.writeText(inviteLink);
      showNotification('success', 'Invite link copied to clipboard! 🔗');
    } catch (error) {
      showNotification('error', 'Failed to copy invite link');
    }
  };

  // Handle copying invite code
  const handleCopyInviteCode = async () => {
    const inviteCode = generateInviteCode();

    try {
      await navigator.clipboard.writeText(inviteCode);
      showNotification('success', 'Invite code copied to clipboard! 📋');
    } catch (error) {
      showNotification('error', 'Failed to copy invite code');
    }
  };

  // Handle revoking invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      showNotification('success', 'Invitation revoked successfully');
      onInvitationRevoked?.(invitationId);
    } catch (error) {
      showNotification('error', 'Failed to revoke invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sharing via native share API
  const handleNativeShare = async () => {
    const inviteLink = generateInviteLink();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${teamName} on Tony Trivia!`,
          text: `You've been invited to join the team "${teamName}" for ${gameRoomName}. Click the link to join!`,
          url: inviteLink,
        });
        showNotification('success', 'Invitation shared! 🚀');
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          showNotification('error', 'Failed to share invitation');
        }
      }
    } else {
      // Fallback to copying link
      handleCopyInviteLink();
    }
  };

  // Validate email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Get status color
  const getStatusColor = (status: TeamInvitation['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'declined':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TeamInvitation['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'declined':
        return <X className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isTeamCaptain) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Captain Access Required
        </h3>
        <p className="text-gray-600">
          Only team captains can manage invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Team Invitations
        </h2>
        <p className="text-gray-600">
          Invite players to join{' '}
          <span className="font-semibold text-blue-600">{teamName}</span>
        </p>
      </div>

      {/* Invite Methods */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Send Invitation
        </h3>

        {/* Method Selector */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'link', label: 'Share Link', icon: Link },
            { id: 'code', label: 'Invite Code', icon: QrCode },
          ].map(method => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setInviteMethod(method.id as InviteMethod)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  inviteMethod === method.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{method.label}</span>
              </button>
            );
          })}
        </div>

        {/* Email Invitation */}
        {inviteMethod === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={e => e.key === 'Enter' && handleSendEmailInvite()}
                />
                <button
                  onClick={handleSendEmailInvite}
                  disabled={isLoading || !emailInput.trim()}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Link Sharing */}
        {inviteMethod === 'link' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Invite Link
                </span>
                <span className="text-xs text-gray-500">
                  Expires in 24 hours
                </span>
              </div>
              <div className="bg-white border border-gray-300 rounded-lg p-3 font-mono text-sm text-gray-600 break-all">
                {generateInviteLink()}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCopyInviteLink}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>

              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Code Sharing */}
        {inviteMethod === 'code' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Invite Code
                </span>
                <span className="text-xs text-gray-500">
                  Share this code with players
                </span>
              </div>
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                  {generateInviteCode()}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyInviteCode}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Invite Code</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Active Invitations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Invitations
          </h3>
          <span className="text-sm text-gray-500">
            {invitations.filter(inv => inv.status === 'pending').length} pending
          </span>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No invitations sent
            </h4>
            <p className="text-gray-600">
              Send your first invitation to start building your team!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map(invitation => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {invitation.email?.charAt(0).toUpperCase() ||
                        invitation.invited_user?.username
                          ?.charAt(0)
                          .toUpperCase() ||
                        'U'}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {invitation.invited_user?.full_name ||
                          invitation.invited_user?.username ||
                          invitation.email ||
                          'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Invited{' '}
                        {new Date(invitation.created_at).toLocaleDateString()}
                        {invitation.email && ` • ${invitation.email}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}
                    >
                      {getStatusIcon(invitation.status)}
                      <span className="capitalize">{invitation.status}</span>
                    </div>

                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleRevokeInvitation(invitation.id)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
