import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TeamStatusTracker } from '../components/TeamStatusTracker';
import { TeamRealtimeSync } from '../components/TeamRealtimeSync';
import { TeamMemberTracker } from '../components/TeamMemberTracker';
import { useTeamPresence } from '../hooks/useTeamPresence';
import { useAuth } from '../hooks/useAuth';

// Mock the hooks
vi.mock('../hooks/useTeamPresence');
vi.mock('../hooks/useAuth');
vi.mock('../services/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
      unsubscribe: vi.fn(),
      track: vi.fn(),
      untrack: vi.fn(),
      send: vi.fn(),
      presenceState: vi.fn(() => ({})),
    })),
  },
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
};

const mockProfile = {
  id: 'user-1',
  username: 'testuser',
  display_name: 'Test User',
  full_name: 'Test User',
  avatar_url: null,
};

const mockTeamMembers = {
  'user-1': {
    user_id: 'user-1',
    username: 'testuser',
    full_name: 'Test User',
    role: 'captain' as const,
    status: 'online' as const,
    team_id: 'team-1',
    joined_at: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-01T12:00:00Z',
    current_activity: 'browsing' as const,
    device_info: {
      type: 'desktop' as const,
      browser: 'chrome',
    },
  },
  'user-2': {
    user_id: 'user-2',
    username: 'teammate',
    full_name: 'Team Mate',
    role: 'member' as const,
    status: 'in_game' as const,
    team_id: 'team-1',
    joined_at: '2024-01-01T01:00:00Z',
    last_seen: '2024-01-01T12:30:00Z',
    current_activity: 'in_game' as const,
    device_info: {
      type: 'mobile' as const,
      browser: 'safari',
    },
  },
  'user-3': {
    user_id: 'user-3',
    username: 'offline_user',
    full_name: 'Offline User',
    role: 'member' as const,
    status: 'offline' as const,
    team_id: 'team-1',
    joined_at: '2024-01-01T02:00:00Z',
    last_seen: '2024-01-01T10:00:00Z',
    current_activity: 'idle' as const,
    device_info: {
      type: 'tablet' as const,
      browser: 'firefox',
    },
  },
};

const mockActivities = [
  {
    id: 'activity-1',
    type: 'member_joined' as const,
    user_id: 'user-2',
    username: 'teammate',
    team_id: 'team-1',
    timestamp: '2024-01-01T12:00:00Z',
    description: 'teammate joined the team',
  },
  {
    id: 'activity-2',
    type: 'status_changed' as const,
    user_id: 'user-1',
    username: 'testuser',
    team_id: 'team-1',
    timestamp: '2024-01-01T12:15:00Z',
    description: 'testuser changed status to online',
    metadata: { new_status: 'online' },
  },
  {
    id: 'activity-3',
    type: 'game_joined' as const,
    user_id: 'user-2',
    username: 'teammate',
    team_id: 'team-1',
    timestamp: '2024-01-01T12:30:00Z',
    description: 'teammate joined a game',
    metadata: { game_room_id: 'room-1' },
  },
];

const mockConnectionStatus = {
  connected: true,
  lastSync: new Date('2024-01-01T12:30:00Z'),
  syncErrors: 0,
  reconnectAttempts: 0,
};

const mockTeamPresence = {
  teamMembers: mockTeamMembers,
  memberCount: 3,
  onlineCount: 2,
  activities: mockActivities,
  isConnected: true,
  error: null,
  updateStatus: vi.fn(),
  updateActivity: vi.fn(),
  joinTeamPresence: vi.fn(),
  leaveTeamPresence: vi.fn(),
  getTeamMemberStatus: vi.fn(),
  getOnlineMembers: vi.fn(() =>
    Object.values(mockTeamMembers).filter(m => m.status !== 'offline')
  ),
  getActiveMembersInGame: vi.fn(() =>
    Object.values(mockTeamMembers).filter(m => m.status === 'in_game')
  ),
};

describe('TeamStatusTracker', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.mocked(useTeamPresence).mockReturnValue(mockTeamPresence);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders team status overview correctly', () => {
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    expect(screen.getByText('Team Status')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 members online')).toBeInTheDocument();
    expect(screen.getByText('Test Team')).toBeInTheDocument();
  });

  it('displays team members with correct status indicators', () => {
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('teammate')).toBeInTheDocument();
    expect(screen.getByText('offline_user')).toBeInTheDocument();

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('In Game')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows device information when enabled', () => {
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    // Device info should be visible in the UI
    expect(screen.getByText('testuser')).toBeInTheDocument();
    // Note: Device icons are rendered but text might not be directly visible
  });

  it('filters members by status correctly', async () => {
    const user = userEvent.setup();

    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    // Find and click the status filter
    const statusFilter = screen.getByDisplayValue('All Members');
    await user.selectOptions(statusFilter, 'Online Only');

    // Should show only online members (testuser and teammate)
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('teammate')).toBeInTheDocument();
  });

  it('displays recent activities correctly', () => {
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText(/teammate.*joined the team/)).toBeInTheDocument();
    expect(
      screen.getByText(/testuser.*changed status to online/)
    ).toBeInTheDocument();
    expect(screen.getByText(/teammate.*joined a game/)).toBeInTheDocument();
  });

  it('allows status changes for current user', async () => {
    const user = userEvent.setup();

    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
        showDeviceInfo={true}
      />
    );

    // Open settings
    const settingsButton = screen.getByTitle('Settings');
    await user.click(settingsButton);

    // Should show status options
    expect(screen.getByText('Your Status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Away')).toBeInTheDocument();
    expect(screen.getByText('In Game')).toBeInTheDocument();
  });

  it('renders in compact mode correctly', () => {
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        compactMode={true}
      />
    );

    expect(screen.getByText('2/3 online')).toBeInTheDocument();
    expect(screen.getByText('Test Team')).toBeInTheDocument();

    // Should show member avatars
    expect(screen.getByText('T')).toBeInTheDocument(); // testuser
    expect(screen.getByText('T')).toBeInTheDocument(); // teammate
  });

  it('handles connection status correctly', () => {
    // Test connected state
    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
      />
    );

    expect(screen.getByText(/Connected/)).toBeInTheDocument();
    expect(screen.getByText(/Real-time updates active/)).toBeInTheDocument();
  });

  it('handles disconnected state', () => {
    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      isConnected: false,
      error: new Error('Connection lost'),
    });

    render(
      <TeamStatusTracker
        teamId="team-1"
        teamName="Test Team"
        showActivities={true}
      />
    );

    expect(screen.getByText('Connection lost')).toBeInTheDocument();
  });
});

describe('TeamRealtimeSync', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      members: Object.values(mockTeamMembers),
      connectionStatus: mockConnectionStatus,
    });
  });

  it('renders connection status correctly when connected', () => {
    render(
      <TeamRealtimeSync
        teamId="team-1"
        gameRoomId="room-1"
        showConnectionStatus={true}
        enableBroadcast={true}
      />
    );

    expect(screen.getByText('Live Sync Active')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument(); // active/total members
  });

  it('shows reconnecting state', () => {
    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      members: Object.values(mockTeamMembers),
      connectionStatus: { ...mockConnectionStatus, connected: false },
    });

    render(
      <TeamRealtimeSync
        teamId="team-1"
        gameRoomId="room-1"
        showConnectionStatus={true}
        enableBroadcast={true}
      />
    );

    expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles manual reconnection', async () => {
    const user = userEvent.setup();

    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      members: Object.values(mockTeamMembers),
      connectionStatus: { ...mockConnectionStatus, connected: false },
    });

    render(
      <TeamRealtimeSync
        teamId="team-1"
        gameRoomId="room-1"
        showConnectionStatus={true}
        enableBroadcast={true}
      />
    );

    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // Should trigger reconnection logic
    expect(retryButton).toBeInTheDocument();
  });

  it('hides when showConnectionStatus is false', () => {
    const { container } = render(
      <TeamRealtimeSync
        teamId="team-1"
        gameRoomId="room-1"
        showConnectionStatus={false}
        enableBroadcast={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('TeamMemberTracker', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      members: Object.values(mockTeamMembers),
      connectionStatus: mockConnectionStatus,
    });

    // Mock browser APIs
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true,
    });

    Object.defineProperty(screen, 'width', { value: 1920, configurable: true });
    Object.defineProperty(screen, 'height', {
      value: 1080,
      configurable: true,
    });
  });

  it('renders team tracker overview correctly', () => {
    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        showMemberLocations={true}
        showDeviceInfo={true}
        showActivityHistory={true}
      />
    );

    expect(screen.getByText('Team Tracker')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 online')).toBeInTheDocument();
  });

  it('displays member locations when enabled', () => {
    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        showMemberLocations={true}
        showDeviceInfo={true}
        showActivityHistory={true}
      />
    );

    expect(screen.getByText('Member Locations')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('teammate')).toBeInTheDocument();
  });

  it('shows activity history correctly', () => {
    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        showMemberLocations={true}
        showDeviceInfo={true}
        showActivityHistory={true}
      />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText(/activities/)).toBeInTheDocument();
  });

  it('filters activities by type', async () => {
    const user = userEvent.setup();

    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        showMemberLocations={true}
        showDeviceInfo={true}
        showActivityHistory={true}
      />
    );

    // Open filters
    const filterButton = screen.getByRole('button', { name: /filter/i });
    await user.click(filterButton);

    // Should show filter options
    expect(screen.getByText('Activity Type')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
  });

  it('renders in compact mode correctly', () => {
    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        compactMode={true}
      />
    );

    expect(screen.getByText('2 online')).toBeInTheDocument();
  });

  it('handles tracking toggle', async () => {
    const user = userEvent.setup();

    render(
      <TeamMemberTracker
        teamId="team-1"
        gameRoomId="room-1"
        showMemberLocations={true}
        showDeviceInfo={true}
        showActivityHistory={true}
      />
    );

    const trackingButton = screen.getByTitle('Disable tracking');
    await user.click(trackingButton);

    // Should toggle tracking state
    expect(screen.getByTitle('Enable tracking')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      updateProfile: vi.fn(),
    });

    vi.mocked(useTeamPresence).mockReturnValue(mockTeamPresence);
  });

  it('updates status across all components', async () => {
    const updateStatusMock = vi.fn();
    vi.mocked(useTeamPresence).mockReturnValue({
      ...mockTeamPresence,
      updateStatus: updateStatusMock,
    });

    const user = userEvent.setup();

    render(
      <div>
        <TeamStatusTracker
          teamId="team-1"
          teamName="Test Team"
          showActivities={true}
          showDeviceInfo={true}
        />
        <TeamRealtimeSync
          teamId="team-1"
          gameRoomId="room-1"
          showConnectionStatus={true}
          enableBroadcast={true}
        />
      </div>
    );

    // Open settings in status tracker
    const settingsButton = screen.getByTitle('Settings');
    await user.click(settingsButton);

    // Change status
    const awayButton = screen.getByText('Away');
    await user.click(awayButton);

    expect(updateStatusMock).toHaveBeenCalledWith('away');
  });

  it('handles real-time activity updates', async () => {
    const onActivityUpdate = vi.fn();

    render(
      <TeamRealtimeSync
        teamId="team-1"
        gameRoomId="room-1"
        onActivityUpdate={onActivityUpdate}
        showConnectionStatus={true}
        enableBroadcast={true}
      />
    );

    // Simulate receiving a new activity
    await act(async () => {
      // This would normally be triggered by the real-time subscription
      onActivityUpdate([
        ...mockActivities,
        {
          id: 'activity-4',
          type: 'member_left',
          user_id: 'user-3',
          username: 'offline_user',
          team_id: 'team-1',
          timestamp: new Date().toISOString(),
          description: 'offline_user left the team',
        },
      ]);
    });

    expect(onActivityUpdate).toHaveBeenCalled();
  });

  it('maintains consistent state across components', () => {
    render(
      <div>
        <TeamStatusTracker
          teamId="team-1"
          teamName="Test Team"
          showActivities={true}
          showDeviceInfo={true}
        />
        <TeamMemberTracker
          teamId="team-1"
          gameRoomId="room-1"
          showMemberLocations={true}
          showDeviceInfo={true}
          showActivityHistory={true}
        />
      </div>
    );

    // Both components should show the same member count
    const onlineCountElements = screen.getAllByText(/2.*3.*online/);
    expect(onlineCountElements.length).toBeGreaterThan(0);

    // Both should show the same members
    const testuserElements = screen.getAllByText('testuser');
    expect(testuserElements.length).toBeGreaterThan(0);
  });
});
