import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Users,
  BarChart3,
  Activity,
  Mail,
  Settings,
  ArrowLeft,
  Shield,
  Trophy,
  Target,
  Star,
} from 'lucide-react';
import { TeamCaptainDashboard } from '../components/TeamCaptainDashboard';
import { TeamInvitationManager } from '../components/TeamInvitationManager';
import { TeamStatistics } from '../components/TeamStatistics';
import { TeamActivityFeed } from '../components/TeamActivityFeed';
import { useAuth } from '../hooks/useAuth';

type DashboardView = 'main' | 'invitations' | 'statistics' | 'activity';

interface MockTeam {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  description?: string;
  score?: number;
  created_at: string;
  team_members?: MockTeamMember[];
}

interface MockTeamMember {
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

export function TeamCaptainDashboardDemo() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('main');

  // Mock team data for demo
  const mockTeam: MockTeam = {
    id: 'team-demo-123',
    name: 'The Trivia Titans',
    game_room_id: 'room-456',
    color: '#3b82f6',
    description:
      'A competitive trivia team focused on science and history topics',
    score: 12750,
    created_at: '2024-01-01T00:00:00Z',
    team_members: [
      {
        id: 'member-1',
        user_id: user?.id || 'demo-user-1',
        role: 'captain',
        joined_at: '2024-01-01T00:00:00Z',
        profiles: {
          username: user?.email?.split('@')[0] || 'captain_demo',
          full_name: user?.user_metadata?.full_name || 'Demo Captain',
          avatar_url: user?.user_metadata?.avatar_url,
        },
      },
      {
        id: 'member-2',
        user_id: 'demo-user-2',
        role: 'member',
        joined_at: '2024-01-05T00:00:00Z',
        profiles: {
          username: 'alex_trivia',
          full_name: 'Alex Johnson',
          avatar_url: '/avatars/alex.jpg',
        },
      },
      {
        id: 'member-3',
        user_id: 'demo-user-3',
        role: 'member',
        joined_at: '2024-01-10T00:00:00Z',
        profiles: {
          username: 'sarah_chen',
          full_name: 'Sarah Chen',
          avatar_url: '/avatars/sarah.jpg',
        },
      },
      {
        id: 'member-4',
        user_id: 'demo-user-4',
        role: 'member',
        joined_at: '2024-01-12T00:00:00Z',
        profiles: {
          username: 'mike_quiz',
          full_name: 'Mike Rodriguez',
          avatar_url: '/avatars/mike.jpg',
        },
      },
    ],
  };

  const gameRoomName = 'Friday Night Trivia Championship';

  const navigationItems = [
    {
      id: 'main',
      label: 'Dashboard',
      icon: Crown,
      description: 'Main team management dashboard',
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: Mail,
      description: 'Manage team invitations',
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      description: 'Team performance analytics',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      description: 'Real-time team activity feed',
    },
  ];

  const handleTeamUpdated = (updatedTeam: MockTeam) => {
    console.log('Team updated:', updatedTeam);
    // In a real app, this would update the team state
  };

  const handleMemberRemoved = (memberId: string) => {
    console.log('Member removed:', memberId);
    // In a real app, this would update the team members
  };

  const handleMemberPromoted = (memberId: string) => {
    console.log('Member promoted:', memberId);
    // In a real app, this would update the member role
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'main':
        return (
          <TeamCaptainDashboard
            team={mockTeam}
            gameRoomName={gameRoomName}
            onTeamUpdated={handleTeamUpdated}
            onMemberRemoved={handleMemberRemoved}
            onMemberPromoted={handleMemberPromoted}
          />
        );
      case 'invitations':
        return (
          <TeamInvitationManager
            teamId={mockTeam.id}
            teamName={mockTeam.name}
            gameRoomName={gameRoomName}
            isTeamCaptain={true}
            onInvitationSent={invitation =>
              console.log('Invitation sent:', invitation)
            }
            onInvitationRevoked={invitationId =>
              console.log('Invitation revoked:', invitationId)
            }
          />
        );
      case 'statistics':
        return (
          <TeamStatistics
            teamId={mockTeam.id}
            teamName={mockTeam.name}
            timeFrame="month"
            showExportOptions={true}
          />
        );
      case 'activity':
        return (
          <TeamActivityFeed
            teamId={mockTeam.id}
            teamName={mockTeam.name}
            maxActivities={20}
            showFilters={true}
            autoRefresh={true}
            refreshInterval={30000}
          />
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access the Team Captain Dashboard.
          </p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Captain Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">
                    Managing{' '}
                    <span className="font-semibold text-blue-600">
                      {mockTeam.name}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Team Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {mockTeam.team_members?.length || 0}
                </div>
                <div className="text-xs text-gray-600">Members</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {mockTeam.score?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">1st</div>
                <div className="text-xs text-gray-600">Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dashboard Sections
              </h3>

              <nav className="space-y-2">
                {navigationItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as DashboardView)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all ${
                        currentView === item.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Team Info Card */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: mockTeam.color }}
                  />
                  <span className="font-medium text-gray-900">
                    {mockTeam.name}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>Room: {gameRoomName}</div>
                  <div>
                    Created:{' '}
                    {new Date(mockTeam.created_at).toLocaleDateString()}
                  </div>
                  <div>Your Role: Captain</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h4>

              <div className="space-y-3">
                <button
                  onClick={() => setCurrentView('invitations')}
                  className="w-full flex items-center space-x-2 text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Invite Members</span>
                </button>

                <button
                  onClick={() => setCurrentView('statistics')}
                  className="w-full flex items-center space-x-2 text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Stats</span>
                </button>

                <button
                  onClick={() => setCurrentView('activity')}
                  className="w-full flex items-center space-x-2 text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  <span>Check Activity</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Demo Mode</span>
        </div>
      </div>
    </div>
  );
}
