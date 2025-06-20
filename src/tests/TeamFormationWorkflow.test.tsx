import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamFormationWorkflow } from '../components/TeamFormationWorkflow';
import { useAuth } from '../hooks/useAuth';
import { TeamsApi } from '../services/apiService';

// Mock dependencies
vi.mock('../hooks/useAuth');
vi.mock('../services/apiService');
vi.mock('../services/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
  },
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
  },
};

const mockTeam = {
  id: 'team-123',
  name: 'Test Team',
  game_room_id: 'room-123',
  color: '#3b82f6',
  score: 0,
  created_at: '2024-01-01T00:00:00Z',
  team_members: [
    {
      id: 'member-123',
      user_id: 'user-123',
      team_id: 'team-123',
      role: 'captain' as const,
      joined_at: '2024-01-01T00:00:00Z',
      profiles: {
        username: 'testuser',
        full_name: 'Test User',
      },
    },
  ],
};

const mockTeams = [
  mockTeam,
  {
    id: 'team-456',
    name: 'Another Team',
    game_room_id: 'room-123',
    color: '#a855f7',
    score: 0,
    created_at: '2024-01-01T00:00:00Z',
    team_members: [
      {
        id: 'member-456',
        user_id: 'user-456',
        team_id: 'team-456',
        role: 'captain' as const,
        joined_at: '2024-01-01T00:00:00Z',
        profiles: {
          username: 'otheruser',
          full_name: 'Other User',
        },
      },
    ],
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TeamFormationWorkflow Integration Tests', () => {
  const mockProps = {
    gameRoomId: 'room-123',
    gameRoomName: 'Test Game Room',
    maxTeamsPerRoom: 20,
    onTeamJoined: vi.fn(),
    onTeamCreated: vi.fn(),
    onTeamLeft: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth
    (useAuth as any).mockReturnValue({
      user: mockUser,
    });

    // Mock TeamsApi
    (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
      data: [],
      error: null,
    });

    (TeamsApi.createTeam as any).mockResolvedValue({
      data: mockTeam,
      error: null,
    });

    (TeamsApi.addTeamMember as any).mockResolvedValue({
      data: { id: 'member-123' },
      error: null,
    });

    (TeamsApi.removeTeamMember as any).mockResolvedValue({
      data: null,
      error: null,
    });

    (TeamsApi.updateTeam as any).mockResolvedValue({
      data: mockTeam,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Load and Overview', () => {
    it('should display overview step with team formation options', async () => {
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Team Formation')).toBeInTheDocument();
        expect(
          screen.getByText(/Join an existing team or create your own/)
        ).toBeInTheDocument();
        expect(screen.getByText('Browse & Join Teams')).toBeInTheDocument();
        expect(screen.getByText('Create New Team')).toBeInTheDocument();
      });
    });

    it('should load teams for the game room on mount', async () => {
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(TeamsApi.listTeamsByGameRoom).toHaveBeenCalledWith('room-123');
      });
    });

    it('should display team statistics correctly', async () => {
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: mockTeams,
        error: null,
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Teams count
        expect(screen.getByText('Teams Created')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total players count
        expect(screen.getByText('Total Players')).toBeInTheDocument();
      });
    });
  });

  describe('Team Creation Workflow', () => {
    it('should navigate to create team step and show form', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create Team')).toBeInTheDocument();
        expect(screen.getByText('Set up your new team')).toBeInTheDocument();
      });
    });

    it('should successfully create a team with valid data', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      // Navigate to create team
      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      // Fill out team creation form (assuming the form has these fields)
      const nameInput = await screen.findByLabelText(/team name/i);
      await user.type(nameInput, 'My Awesome Team');

      // Submit form
      const submitButton = await screen.findByText(/create team/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(TeamsApi.createTeam).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Awesome Team',
            game_room_id: 'room-123',
          })
        );
        expect(mockProps.onTeamCreated).toHaveBeenCalledWith('team-123');
      });
    });

    it('should handle team creation errors gracefully', async () => {
      const user = userEvent.setup();
      (TeamsApi.createTeam as any).mockResolvedValue({
        data: null,
        error: { message: 'Team name already exists' },
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      const nameInput = await screen.findByLabelText(/team name/i);
      await user.type(nameInput, 'Duplicate Team');

      const submitButton = await screen.findByText(/create team/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Team name already exists/)
        ).toBeInTheDocument();
      });
    });

    it('should validate team name with profanity filter', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      const nameInput = await screen.findByLabelText(/team name/i);
      await user.type(nameInput, 'Stupid Team');

      const submitButton = await screen.findByText(/create team/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/contains inappropriate language/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Team Browsing and Joining', () => {
    it('should navigate to browse teams step and display available teams', async () => {
      const user = userEvent.setup();
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: mockTeams,
        error: null,
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const browseButton = await screen.findByText('Browse & Join Teams');
      await user.click(browseButton);

      await waitFor(() => {
        expect(screen.getByText('Browse Teams')).toBeInTheDocument();
        expect(screen.getByText('Find a team to join')).toBeInTheDocument();
      });
    });

    it('should successfully join an available team', async () => {
      const user = userEvent.setup();
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: [mockTeams[1]], // Team without current user
        error: null,
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const browseButton = await screen.findByText('Browse & Join Teams');
      await user.click(browseButton);

      // Find and click join button for available team
      const joinButton = await screen.findByText(/join/i);
      await user.click(joinButton);

      await waitFor(() => {
        expect(TeamsApi.addTeamMember).toHaveBeenCalledWith(
          'team-456',
          'user-123',
          'member'
        );
        expect(mockProps.onTeamJoined).toHaveBeenCalledWith('team-456');
      });
    });

    it('should prevent joining when user is already on a team', async () => {
      const user = userEvent.setup();
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: mockTeams, // User is already on first team
        error: null,
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      // Should automatically navigate to manage step since user has a team
      await waitFor(() => {
        expect(screen.getByText('Team Management')).toBeInTheDocument();
      });
    });

    it('should handle team joining errors', async () => {
      const user = userEvent.setup();
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: [mockTeams[1]],
        error: null,
      });
      (TeamsApi.addTeamMember as any).mockResolvedValue({
        data: null,
        error: { message: 'Team is full' },
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const browseButton = await screen.findByText('Browse & Join Teams');
      await user.click(browseButton);

      const joinButton = await screen.findByText(/join/i);
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/Team is full/)).toBeInTheDocument();
      });
    });
  });

  describe('Team Management', () => {
    beforeEach(() => {
      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: [mockTeam], // User is on this team
        error: null,
      });
    });

    it('should display team management interface for team members', async () => {
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Team Management')).toBeInTheDocument();
        expect(screen.getByText('Captain')).toBeInTheDocument();
        expect(screen.getByText('Test Team')).toBeInTheDocument();
      });
    });

    it('should successfully leave a team', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const leaveButton = await screen.findByText('Leave Team');
      await user.click(leaveButton);

      await waitFor(() => {
        expect(TeamsApi.removeTeamMember).toHaveBeenCalledWith(
          'team-123',
          'user-123'
        );
        expect(mockProps.onTeamLeft).toHaveBeenCalled();
      });
    });

    it('should handle team leaving errors', async () => {
      const user = userEvent.setup();
      (TeamsApi.removeTeamMember as any).mockResolvedValue({
        data: null,
        error: { message: 'Cannot leave team during active game' },
      });

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const leaveButton = await screen.findByText('Leave Team');
      await user.click(leaveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Cannot leave team during active game/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time team creation updates', async () => {
      const { rerender } = render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      // Simulate real-time team creation
      act(() => {
        (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
          data: [mockTeam],
          error: null,
        });
      });

      rerender(<TeamFormationWorkflow {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Updated team count
      });
    });
  });

  describe('Navigation and User Flow', () => {
    it('should allow navigation back from create team step', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      const backButton = await screen.findByLabelText(/back/i);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Browse & Join Teams')).toBeInTheDocument();
      });
    });

    it('should allow navigation back from browse teams step', async () => {
      const user = userEvent.setup();
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const browseButton = await screen.findByText('Browse & Join Teams');
      await user.click(browseButton);

      const backButton = await screen.findByLabelText(/back/i);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Team')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should display loading overlay during team operations', async () => {
      const user = userEvent.setup();
      // Mock a slow API response
      (TeamsApi.createTeam as any).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ data: mockTeam, error: null }), 1000)
          )
      );

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');
      await user.click(createButton);

      const nameInput = await screen.findByLabelText(/team name/i);
      await user.type(nameInput, 'Test Team');

      const submitButton = await screen.findByText(/create team/i);
      await user.click(submitButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (TeamsApi.listTeamsByGameRoom as any).mockRejectedValue(
        new Error('Network error')
      );

      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should be keyboard navigable', async () => {
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      const createButton = await screen.findByText('Create New Team');

      // Test keyboard navigation
      createButton.focus();
      expect(createButton).toHaveFocus();

      fireEvent.keyDown(createButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Create Team')).toBeInTheDocument();
      });
    });

    it('should display appropriate ARIA labels and roles', async () => {
      render(<TeamFormationWorkflow {...mockProps} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach(button => {
          expect(button).toHaveAttribute('type');
        });
      });
    });
  });

  describe('Team Limits and Validation', () => {
    it('should disable team creation when max teams reached', async () => {
      const tooManyTeams = Array.from({ length: 21 }, (_, i) => ({
        ...mockTeam,
        id: `team-${i}`,
        name: `Team ${i}`,
      }));

      (TeamsApi.listTeamsByGameRoom as any).mockResolvedValue({
        data: tooManyTeams,
        error: null,
      });

      render(<TeamFormationWorkflow {...mockProps} maxTeamsPerRoom={20} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const createButton = screen.getByText('Create New Team');
        expect(createButton).toBeDisabled();
        expect(
          screen.getByText(/Maximum number of teams reached/)
        ).toBeInTheDocument();
      });
    });
  });
});
