import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TeamCaptainDashboard } from '../components/TeamCaptainDashboard';
import { TeamInvitationManager } from '../components/TeamInvitationManager';
import { TeamStatistics } from '../components/TeamStatistics';
import { TeamActivityFeed } from '../components/TeamActivityFeed';
import { TeamCaptainDashboardDemo } from '../pages/TeamCaptainDashboardDemo';

// Mock dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'captain@example.com',
      user_metadata: {
        full_name: 'Test Captain',
        avatar_url: '/avatars/captain.jpg',
      },
    },
  }),
}));

vi.mock('../hooks/useTeamFormation', () => ({
  useTeamFormation: () => ({
    updateTeam: vi.fn().mockResolvedValue({ success: true }),
    removeMember: vi.fn().mockResolvedValue({ success: true }),
    promoteMember: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
  }),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockTeam = {
  id: 'team-123',
  name: 'Test Team',
  game_room_id: 'room-456',
  color: '#3b82f6',
  description: 'A test team for unit testing',
  score: 1500,
  created_at: '2024-01-01T00:00:00Z',
  team_members: [
    {
      id: 'member-1',
      user_id: 'test-user-1',
      role: 'captain' as const,
      joined_at: '2024-01-01T00:00:00Z',
      profiles: {
        username: 'captain_test',
        full_name: 'Test Captain',
        avatar_url: '/avatars/captain.jpg',
      },
    },
    {
      id: 'member-2',
      user_id: 'test-user-2',
      role: 'member' as const,
      joined_at: '2024-01-05T00:00:00Z',
      profiles: {
        username: 'member_test',
        full_name: 'Test Member',
        avatar_url: '/avatars/member.jpg',
      },
    },
  ],
};

describe('TeamCaptainDashboard', () => {
  const mockProps = {
    team: mockTeam,
    gameRoomName: 'Test Game Room',
    onTeamUpdated: vi.fn(),
    onMemberRemoved: vi.fn(),
    onMemberPromoted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders captain dashboard with correct team information', () => {
    render(<TeamCaptainDashboard {...mockProps} />);

    expect(screen.getByText('Captain Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('Managing Test Game Room')).toBeInTheDocument();
  });

  it('displays team statistics correctly', () => {
    render(<TeamCaptainDashboard {...mockProps} />);

    // Check if team stats are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Total members
    expect(screen.getByText('1,500')).toBeInTheDocument(); // Team score
    expect(screen.getByText('1')).toBeInTheDocument(); // Captains count
  });

  it('allows navigation between different tabs', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboard {...mockProps} />);

    // Click on Members tab
    const membersTab = screen.getByRole('button', { name: /members/i });
    await user.click(membersTab);

    expect(screen.getByText('Team Captains (1)')).toBeInTheDocument();
    expect(screen.getByText('Team Members (1)')).toBeInTheDocument();

    // Click on Settings tab
    const settingsTab = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsTab);

    expect(screen.getByText('Team Information')).toBeInTheDocument();
    expect(screen.getByDisplayValue('team-123')).toBeInTheDocument();
  });

  it('enables team editing for captains', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboard {...mockProps} />);

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Check if edit form is displayed
    const nameInput = screen.getByDisplayValue('Test Team');
    expect(nameInput).toBeInTheDocument();

    // Modify team name
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Team Name');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockProps.onTeamUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Team Name',
        })
      );
    });
  });

  it('allows member removal with confirmation', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboard {...mockProps} />);

    // Navigate to members tab
    const membersTab = screen.getByRole('button', { name: /members/i });
    await user.click(membersTab);

    // Find and click member actions menu
    const memberCard =
      screen.getByText('Test Member').closest('[data-testid="member-card"]') ||
      screen.getByText('Test Member').closest('div');
    const actionsButton = within(memberCard as HTMLElement).getByRole('button');
    await user.click(actionsButton);

    // Click remove option
    const removeButton = screen.getByText(/remove from team/i);
    await user.click(removeButton);

    // Confirm removal in dialog
    const confirmButton = screen.getByRole('button', { name: /remove/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockProps.onMemberRemoved).toHaveBeenCalledWith('member-2');
    });
  });

  it('allows member promotion with confirmation', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboard {...mockProps} />);

    // Navigate to members tab
    const membersTab = screen.getByRole('button', { name: /members/i });
    await user.click(membersTab);

    // Find and click member actions menu
    const memberCard =
      screen.getByText('Test Member').closest('[data-testid="member-card"]') ||
      screen.getByText('Test Member').closest('div');
    const actionsButton = within(memberCard as HTMLElement).getByRole('button');
    await user.click(actionsButton);

    // Click promote option
    const promoteButton = screen.getByText(/promote to captain/i);
    await user.click(promoteButton);

    // Confirm promotion in dialog
    const confirmButton = screen.getByRole('button', { name: /promote/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockProps.onMemberPromoted).toHaveBeenCalledWith('member-2');
    });
  });

  it('copies team ID to clipboard', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboard {...mockProps} />);

    const copyButton = screen.getByRole('button', { name: /copy team id/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('team-123');
  });

  it('prevents non-captains from accessing management features', () => {
    const nonCaptainTeam = {
      ...mockTeam,
      team_members: [
        {
          id: 'member-1',
          user_id: 'different-user',
          role: 'captain' as const,
          joined_at: '2024-01-01T00:00:00Z',
          profiles: {
            username: 'other_captain',
            full_name: 'Other Captain',
          },
        },
        {
          id: 'member-2',
          user_id: 'test-user-1',
          role: 'member' as const,
          joined_at: '2024-01-05T00:00:00Z',
          profiles: {
            username: 'current_user',
            full_name: 'Current User',
          },
        },
      ],
    };

    render(<TeamCaptainDashboard {...mockProps} team={nonCaptainTeam} />);

    expect(screen.getByText('Captain Access Required')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Only team captains can access the team management dashboard.'
      )
    ).toBeInTheDocument();
  });
});

describe('TeamInvitationManager', () => {
  const mockProps = {
    teamId: 'team-123',
    teamName: 'Test Team',
    gameRoomName: 'Test Game Room',
    isTeamCaptain: true,
    onInvitationSent: vi.fn(),
    onInvitationRevoked: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invitation manager for captains', () => {
    render(<TeamInvitationManager {...mockProps} />);

    expect(screen.getByText('Team Invitations')).toBeInTheDocument();
    expect(
      screen.getByText(/invite players to join test team/i)
    ).toBeInTheDocument();
  });

  it('prevents non-captains from accessing invitation features', () => {
    render(<TeamInvitationManager {...mockProps} isTeamCaptain={false} />);

    expect(screen.getByText('Captain Access Required')).toBeInTheDocument();
    expect(
      screen.getByText('Only team captains can manage invitations.')
    ).toBeInTheDocument();
  });

  it('switches between invitation methods', async () => {
    const user = userEvent.setup();
    render(<TeamInvitationManager {...mockProps} />);

    // Default should be link method
    expect(screen.getByText('Invite Link')).toBeInTheDocument();

    // Switch to email method
    const emailButton = screen.getByRole('button', { name: /email/i });
    await user.click(emailButton);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Switch to code method
    const codeButton = screen.getByRole('button', { name: /invite code/i });
    await user.click(codeButton);

    expect(
      screen.getByText(/share this code with players/i)
    ).toBeInTheDocument();
  });

  it('validates email input before sending invitation', async () => {
    const user = userEvent.setup();
    render(<TeamInvitationManager {...mockProps} />);

    // Switch to email method
    const emailButton = screen.getByRole('button', { name: /email/i });
    await user.click(emailButton);

    // Try to send without email
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(
      screen.getByText(/please enter an email address/i)
    ).toBeInTheDocument();

    // Try with invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(sendButton);

    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it('copies invite link to clipboard', async () => {
    const user = userEvent.setup();
    render(<TeamInvitationManager {...mockProps} />);

    const copyButton = screen.getByRole('button', { name: /copy link/i });
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:3000/join-team?code=')
    );
  });

  it('displays active invitations', () => {
    render(<TeamInvitationManager {...mockProps} />);

    expect(screen.getByText('Active Invitations')).toBeInTheDocument();
    // Mock data should show some invitations
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});

describe('TeamStatistics', () => {
  const mockProps = {
    teamId: 'team-123',
    teamName: 'Test Team',
    timeFrame: 'month' as const,
    showExportOptions: true,
  };

  it('renders team statistics with performance metrics', async () => {
    render(<TeamStatistics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Team Statistics')).toBeInTheDocument();
      expect(
        screen.getByText(/performance insights for test team/i)
      ).toBeInTheDocument();
    });

    // Check for various stat cards
    expect(screen.getByText('Total Games')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
  });

  it('allows time frame selection', async () => {
    const user = userEvent.setup();
    render(<TeamStatistics {...mockProps} />);

    await waitFor(() => {
      const timeFrameSelect = screen.getByDisplayValue('Last Month');
      expect(timeFrameSelect).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('Last Month');
    await user.selectOptions(select, 'week');

    expect(screen.getByDisplayValue('Last Week')).toBeInTheDocument();
  });

  it('displays game history', async () => {
    render(<TeamStatistics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Games')).toBeInTheDocument();
      expect(screen.getByText('Friday Night Trivia')).toBeInTheDocument();
    });
  });

  it('shows best performance highlight', async () => {
    render(<TeamStatistics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Best Performance')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Best score
    });
  });
});

describe('TeamActivityFeed', () => {
  const mockProps = {
    teamId: 'team-123',
    teamName: 'Test Team',
    maxActivities: 20,
    showFilters: true,
    autoRefresh: false, // Disable for testing
    refreshInterval: 30000,
  };

  it('renders activity feed with team activities', async () => {
    render(<TeamActivityFeed {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Team Activity')).toBeInTheDocument();
      expect(
        screen.getByText(/latest updates for test team/i)
      ).toBeInTheDocument();
    });

    // Check for activity items
    expect(screen.getByText('Game Completed')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
  });

  it('filters activities by type', async () => {
    const user = userEvent.setup();
    render(<TeamActivityFeed {...mockProps} />);

    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('All Activity');
      expect(filterSelect).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue('All Activity');
    await user.selectOptions(select, 'games');

    expect(screen.getByDisplayValue('Games')).toBeInTheDocument();
  });

  it('displays activity summary statistics', async () => {
    render(<TeamActivityFeed {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('Members Joined')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Milestones')).toBeInTheDocument();
    });
  });

  it('refreshes activity feed manually', async () => {
    const user = userEvent.setup();
    render(<TeamActivityFeed {...mockProps} />);

    await waitFor(() => {
      const refreshButton = screen.getByTitle('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Refresh');
    await user.click(refreshButton);

    // Should trigger a refresh (tested via loading state or API calls in real implementation)
  });
});

describe('TeamCaptainDashboardDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders demo page with navigation', () => {
    render(<TeamCaptainDashboardDemo />);

    expect(screen.getByText('Captain Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/managing the trivia titans/i)).toBeInTheDocument();
    expect(screen.getByText('Dashboard Sections')).toBeInTheDocument();
  });

  it('navigates between different dashboard views', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboardDemo />);

    // Click on Invitations section
    const invitationsButton = screen.getByRole('button', {
      name: /invitations/i,
    });
    await user.click(invitationsButton);

    expect(screen.getByText('Team Invitations')).toBeInTheDocument();

    // Click on Statistics section
    const statisticsButton = screen.getByRole('button', {
      name: /statistics/i,
    });
    await user.click(statisticsButton);

    expect(screen.getByText('Team Statistics')).toBeInTheDocument();

    // Click on Activity section
    const activityButton = screen.getByRole('button', { name: /activity/i });
    await user.click(activityButton);

    expect(screen.getByText('Team Activity')).toBeInTheDocument();
  });

  it('displays team quick stats in header', () => {
    render(<TeamCaptainDashboardDemo />);

    expect(screen.getByText('4')).toBeInTheDocument(); // Members count
    expect(screen.getByText('12,750')).toBeInTheDocument(); // Team score
    expect(screen.getByText('1st')).toBeInTheDocument(); // Rank
  });

  it('shows demo mode indicator', () => {
    render(<TeamCaptainDashboardDemo />);

    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('provides quick action buttons', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboardDemo />);

    // Test quick action to invite members
    const inviteButton = screen.getByRole('button', {
      name: /invite members/i,
    });
    await user.click(inviteButton);

    expect(screen.getByText('Team Invitations')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  it('integrates captain dashboard with all sub-components', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboardDemo />);

    // Start on main dashboard
    expect(screen.getByText('Captain Dashboard')).toBeInTheDocument();

    // Navigate to invitations and test functionality
    const invitationsTab = screen.getByRole('button', { name: /invitations/i });
    await user.click(invitationsTab);

    expect(screen.getByText('Team Invitations')).toBeInTheDocument();

    // Test copying invite link
    const copyLinkButton = screen.getByRole('button', { name: /copy link/i });
    await user.click(copyLinkButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Navigate to statistics
    const statisticsTab = screen.getByRole('button', { name: /statistics/i });
    await user.click(statisticsTab);

    await waitFor(() => {
      expect(screen.getByText('Team Statistics')).toBeInTheDocument();
    });

    // Navigate to activity feed
    const activityTab = screen.getByRole('button', { name: /activity/i });
    await user.click(activityTab);

    await waitFor(() => {
      expect(screen.getByText('Team Activity')).toBeInTheDocument();
    });
  });

  it('maintains state consistency across navigation', async () => {
    const user = userEvent.setup();
    render(<TeamCaptainDashboardDemo />);

    // The team info should be consistent across all views
    const teamName = 'The Trivia Titans';

    // Check main dashboard
    expect(screen.getByText(teamName)).toBeInTheDocument();

    // Navigate to invitations
    const invitationsTab = screen.getByRole('button', { name: /invitations/i });
    await user.click(invitationsTab);

    expect(screen.getByText(new RegExp(teamName, 'i'))).toBeInTheDocument();

    // Navigate to statistics
    const statisticsTab = screen.getByRole('button', { name: /statistics/i });
    await user.click(statisticsTab);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(teamName, 'i'))).toBeInTheDocument();
    });
  });
});
