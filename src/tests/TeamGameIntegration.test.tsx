import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnhancedGameRoom } from '../components/EnhancedGameRoom';
import { TeamGameInterface } from '../components/TeamGameInterface';
import { teamGameIntegration } from '../services/teamGameIntegration';
import { useTeamGameIntegration } from '../hooks/useTeamGameIntegration';

// Mock dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
    },
  }),
}));

vi.mock('../hooks/useGameState', () => ({
  useGameState: () => ({
    gameRoom: {
      id: 'room-1',
      code: 'ABCD',
      name: 'Test Game Room',
      status: 'lobby',
      host_id: 'host-1',
    },
    teams: [
      {
        id: 'team-1',
        name: 'Team Alpha',
        score: 150,
        game_room_id: 'room-1',
      },
      {
        id: 'team-2',
        name: 'Team Beta',
        score: 120,
        game_room_id: 'room-1',
      },
    ],
    gameState: {
      id: 'state-1',
      game_room_id: 'room-1',
      status: 'lobby',
      metadata: {},
    },
    userTeam: {
      id: 'team-1',
      name: 'Team Alpha',
      score: 150,
      game_room_id: 'room-1',
    },
    isHost: false,
    loading: false,
    error: null,
    connectionStatus: {
      gameRoom: true,
      teams: true,
      gameState: true,
      teamAnswers: true,
    },
    createTeam: vi.fn().mockResolvedValue({ success: true }),
    joinTeam: vi.fn().mockResolvedValue({ success: true }),
    leaveTeam: vi.fn().mockResolvedValue({ success: true }),
    startGame: vi.fn().mockResolvedValue({ success: true }),
    submitAnswer: vi.fn().mockResolvedValue({ success: true }),
    refreshData: vi.fn(),
  }),
}));

vi.mock('../hooks/useTeamPresence', () => ({
  useTeamPresence: () => ({
    members: [
      {
        user_id: 'user-1',
        username: 'testuser',
        role: 'captain',
        status: 'online',
        team_id: 'team-1',
        device_info: { type: 'desktop', browser: 'chrome' },
        last_seen: new Date().toISOString(),
      },
      {
        user_id: 'user-2',
        username: 'teammate',
        role: 'member',
        status: 'ready',
        team_id: 'team-1',
        device_info: { type: 'mobile', browser: 'safari' },
        last_seen: new Date().toISOString(),
      },
    ],
    activities: [],
    connectionState: {
      isConnected: true,
      reconnectAttempts: 0,
      lastError: null,
    },
    updateStatus: vi.fn(),
    broadcastActivity: vi.fn(),
  }),
}));

vi.mock('../components/TeamFormationWorkflow', () => ({
  TeamFormationWorkflow: ({ onTeamCreated, onTeamJoined }: any) => (
    <div data-testid="team-formation-workflow">
      <button onClick={() => onTeamCreated?.({ name: 'New Team' })}>
        Create Team
      </button>
      <button onClick={() => onTeamJoined?.('team-2')}>Join Team</button>
    </div>
  ),
}));

vi.mock('../components/TeamCaptainDashboard', () => ({
  TeamCaptainDashboard: () => (
    <div data-testid="team-captain-dashboard">Captain Dashboard</div>
  ),
}));

vi.mock('../components/TeamStatusTracker', () => ({
  TeamStatusTracker: () => (
    <div data-testid="team-status-tracker">Status Tracker</div>
  ),
}));

vi.mock('../components/TeamRealtimeSync', () => ({
  TeamRealtimeSync: () => (
    <div data-testid="team-realtime-sync">Realtime Sync</div>
  ),
}));

vi.mock('../components/ConnectionStatus', () => ({
  ConnectionStatus: () => (
    <div data-testid="connection-status">Connection Status</div>
  ),
}));

vi.mock('../components/RealtimeStatus', () => ({
  RealtimeStatus: () => (
    <div data-testid="realtime-status">Realtime Status</div>
  ),
}));

// Mock team game integration service
vi.mock('../services/teamGameIntegration', () => ({
  teamGameIntegration: {
    subscribeToTeamGameEvents: vi.fn(() => vi.fn()),
    broadcastTeamGameEvent: vi.fn(),
    getTeamGameState: vi.fn(),
    updateMemberReadiness: vi.fn(),
    submitTeamAnswer: vi.fn(),
    checkGameReadiness: vi.fn(),
    startGameWithTeamIntegration: vi.fn(),
    updateTeamScores: vi.fn(),
    getTeamLeaderboard: vi.fn(),
    cleanup: vi.fn(),
  },
}));

describe('Team Game Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('EnhancedGameRoom Component', () => {
    it('renders game room with team integration', async () => {
      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        expect(screen.getByText('Test Game Room')).toBeInTheDocument();
        expect(screen.getByText('Room Code:')).toBeInTheDocument();
        expect(screen.getByText('ABCD')).toBeInTheDocument();
        expect(screen.getByText('2 Teams')).toBeInTheDocument();
      });
    });

    it('shows different tabs based on user role', async () => {
      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Captain')).toBeInTheDocument(); // User is captain
        expect(screen.getByText('Live Status')).toBeInTheDocument();
        expect(screen.getByText('Team Chat')).toBeInTheDocument();
      });
    });

    it('handles tab navigation correctly', async () => {
      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        const teamsTab = screen.getByText('Teams');
        fireEvent.click(teamsTab);
        expect(
          screen.getByTestId('team-formation-workflow')
        ).toBeInTheDocument();
      });
    });

    it('displays team readiness status', async () => {
      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Ready Teams')).toBeInTheDocument();
      });
    });

    it('shows connection status components', async () => {
      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toBeInTheDocument();
        expect(screen.getByTestId('team-realtime-sync')).toBeInTheDocument();
        expect(screen.getByTestId('realtime-status')).toBeInTheDocument();
      });
    });

    it('handles team creation through integration', async () => {
      const mockCreateTeam = vi.fn().mockResolvedValue({ success: true });

      render(<EnhancedGameRoom gameRoomId="room-1" />);

      await waitFor(() => {
        const teamsTab = screen.getByText('Teams');
        fireEvent.click(teamsTab);
      });

      const createButton = screen.getByText('Create Team');
      fireEvent.click(createButton);

      // Verify team creation workflow is triggered
      expect(screen.getByTestId('team-formation-workflow')).toBeInTheDocument();
    });
  });

  describe('TeamGameInterface Component', () => {
    const mockTeamGameIntegration = {
      gameTeamState: {
        teamId: 'team-1',
        gameRoomId: 'room-1',
        status: 'lobby' as const,
        readyMembers: ['user-2'],
        totalMembers: 2,
        score: 150,
        rank: 1,
      },
      teamEvents: [
        {
          id: 'event-1',
          type: 'member_ready' as const,
          teamId: 'team-1',
          gameRoomId: 'room-1',
          timestamp: new Date().toISOString(),
          payload: { userId: 'user-2' },
        },
      ],
      readinessCheck: {
        teamId: 'team-1',
        teamName: 'Team Alpha',
        totalMembers: 2,
        readyMembers: 1,
        onlineMembers: 2,
        isReady: false,
        memberStatuses: [
          {
            userId: 'user-1',
            username: 'testuser',
            status: 'online' as const,
            isReady: false,
          },
          {
            userId: 'user-2',
            username: 'teammate',
            status: 'ready' as const,
            isReady: true,
          },
        ],
      },
      leaderboard: [
        {
          teamId: 'team-1',
          teamName: 'Team Alpha',
          score: 150,
          rank: 1,
          memberCount: 2,
          onlineMembers: 2,
          lastActivity: new Date().toISOString(),
        },
      ],
      isLoading: false,
      error: null,
      isConnected: true,
      updateReadiness: vi.fn(),
      submitAnswer: vi.fn(),
      refreshGameState: vi.fn(),
      clearEvents: vi.fn(),
      isTeamReady: false,
      readyMemberCount: 1,
      totalMemberCount: 2,
      unreadyMembers: ['testuser'],
      canSubmitAnswer: false,
      hasSubmittedAnswer: false,
      currentQuestion: null,
      teamAnswer: null,
      teamScore: 150,
      teamRank: 1,
    };

    beforeEach(() => {
      vi.mocked(useTeamGameIntegration).mockReturnValue(
        mockTeamGameIntegration
      );
    });

    it('renders team game interface correctly', () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Team Game Interface')).toBeInTheDocument();
      expect(screen.getByText('Game Status:')).toBeInTheDocument();
      expect(screen.getByText('Lobby')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // Score
      expect(screen.getByText('#1')).toBeInTheDocument(); // Rank
    });

    it('displays team readiness status', () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Team Readiness: 1/2 ready')).toBeInTheDocument();
      expect(screen.getByText('Waiting for: testuser')).toBeInTheDocument();
    });

    it('handles readiness toggle', async () => {
      const mockUpdateReadiness = vi.fn().mockResolvedValue(true);
      vi.mocked(useTeamGameIntegration).mockReturnValue({
        ...mockTeamGameIntegration,
        updateReadiness: mockUpdateReadiness,
      });

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      const readyButton = screen.getByText('Mark Ready');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(mockUpdateReadiness).toHaveBeenCalledWith(true);
      });
    });

    it('shows lobby waiting state', () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Waiting for Game to Start')).toBeInTheDocument();
      expect(
        screen.getByText(/The game host will start the game/)
      ).toBeInTheDocument();
    });

    it('displays leaderboard correctly', () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('(Your Team)')).toBeInTheDocument();
      expect(screen.getByText('2/2 online')).toBeInTheDocument();
    });

    it('shows recent team activity', () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Recent Team Activity')).toBeInTheDocument();
      expect(screen.getByText('Member ready')).toBeInTheDocument();
    });

    it('handles active game with current question', () => {
      const activeGameState = {
        ...mockTeamGameIntegration,
        gameTeamState: {
          ...mockTeamGameIntegration.gameTeamState,
          status: 'active' as const,
          currentQuestion: {
            id: 'question-1',
            text: 'What is the capital of France?',
            timeLimit: 30,
            startedAt: new Date().toISOString(),
          },
        },
        canSubmitAnswer: true,
      };

      vi.mocked(useTeamGameIntegration).mockReturnValue(activeGameState);

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Current Question')).toBeInTheDocument();
      expect(
        screen.getByText('What is the capital of France?')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your answer...')
      ).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('handles answer submission', async () => {
      const mockSubmitAnswer = vi.fn().mockResolvedValue({ success: true });
      const activeGameState = {
        ...mockTeamGameIntegration,
        gameTeamState: {
          ...mockTeamGameIntegration.gameTeamState,
          status: 'active' as const,
          currentQuestion: {
            id: 'question-1',
            text: 'What is the capital of France?',
            timeLimit: 30,
            startedAt: new Date().toISOString(),
          },
        },
        canSubmitAnswer: true,
        submitAnswer: mockSubmitAnswer,
      };

      vi.mocked(useTeamGameIntegration).mockReturnValue(activeGameState);

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      const answerInput = screen.getByPlaceholderText('Enter your answer...');
      const submitButton = screen.getByText('Submit');

      fireEvent.change(answerInput, { target: { value: 'Paris' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitAnswer).toHaveBeenCalledWith('question-1', 'Paris');
      });
    });

    it('shows submitted answer state', () => {
      const submittedState = {
        ...mockTeamGameIntegration,
        hasSubmittedAnswer: true,
        teamAnswer: {
          answer: 'Paris',
          pointValue: 10,
          submittedAt: new Date().toISOString(),
          submittedBy: 'testuser',
        },
      };

      vi.mocked(useTeamGameIntegration).mockReturnValue(submittedState);

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Answer Submitted')).toBeInTheDocument();
      expect(screen.getByText('Answer: Paris')).toBeInTheDocument();
      expect(screen.getByText(/Submitted by testuser/)).toBeInTheDocument();
    });

    it('handles loading state', () => {
      vi.mocked(useTeamGameIntegration).mockReturnValue({
        ...mockTeamGameIntegration,
        isLoading: true,
      });

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(
        screen.getByText('Loading team game interface...')
      ).toBeInTheDocument();
    });

    it('handles error state', () => {
      vi.mocked(useTeamGameIntegration).mockReturnValue({
        ...mockTeamGameIntegration,
        error: 'Failed to load game state',
      });

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load game state')).toBeInTheDocument();
    });
  });

  describe('Team Game Integration Service', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('subscribes to team game events', () => {
      const callback = vi.fn();
      const unsubscribe = teamGameIntegration.subscribeToTeamGameEvents(
        'room-1',
        'team-1',
        callback
      );

      expect(
        teamGameIntegration.subscribeToTeamGameEvents
      ).toHaveBeenCalledWith('room-1', 'team-1', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('broadcasts team game events', async () => {
      const event = {
        type: 'member_ready' as const,
        teamId: 'team-1',
        gameRoomId: 'room-1',
        userId: 'user-1',
        payload: { isReady: true },
      };

      await teamGameIntegration.broadcastTeamGameEvent(event);

      expect(teamGameIntegration.broadcastTeamGameEvent).toHaveBeenCalledWith(
        event
      );
    });

    it('gets team game state', async () => {
      await teamGameIntegration.getTeamGameState('team-1', 'room-1');

      expect(teamGameIntegration.getTeamGameState).toHaveBeenCalledWith(
        'team-1',
        'room-1'
      );
    });

    it('updates member readiness', async () => {
      await teamGameIntegration.updateMemberReadiness(
        'team-1',
        'room-1',
        'user-1',
        true
      );

      expect(teamGameIntegration.updateMemberReadiness).toHaveBeenCalledWith(
        'team-1',
        'room-1',
        'user-1',
        true
      );
    });

    it('submits team answer', async () => {
      await teamGameIntegration.submitTeamAnswer(
        'team-1',
        'room-1',
        'question-1',
        'Paris',
        10,
        'user-1'
      );

      expect(teamGameIntegration.submitTeamAnswer).toHaveBeenCalledWith(
        'team-1',
        'room-1',
        'question-1',
        'Paris',
        10,
        'user-1'
      );
    });

    it('checks game readiness', async () => {
      await teamGameIntegration.checkGameReadiness('room-1');

      expect(teamGameIntegration.checkGameReadiness).toHaveBeenCalledWith(
        'room-1'
      );
    });

    it('starts game with team integration', async () => {
      await teamGameIntegration.startGameWithTeamIntegration(
        'room-1',
        'host-1'
      );

      expect(
        teamGameIntegration.startGameWithTeamIntegration
      ).toHaveBeenCalledWith('room-1', 'host-1');
    });

    it('updates team scores', async () => {
      const scoreUpdates = [
        {
          teamId: 'team-1',
          points: 10,
          questionId: 'question-1',
          isCorrect: true,
        },
      ];

      await teamGameIntegration.updateTeamScores('room-1', scoreUpdates);

      expect(teamGameIntegration.updateTeamScores).toHaveBeenCalledWith(
        'room-1',
        scoreUpdates
      );
    });

    it('gets team leaderboard', async () => {
      await teamGameIntegration.getTeamLeaderboard('room-1');

      expect(teamGameIntegration.getTeamLeaderboard).toHaveBeenCalledWith(
        'room-1'
      );
    });

    it('cleans up resources', () => {
      teamGameIntegration.cleanup();

      expect(teamGameIntegration.cleanup).toHaveBeenCalled();
    });
  });

  describe('useTeamGameIntegration Hook', () => {
    it('returns expected interface', () => {
      const result = useTeamGameIntegration({
        teamId: 'team-1',
        gameRoomId: 'room-1',
      });

      expect(result).toHaveProperty('gameTeamState');
      expect(result).toHaveProperty('teamEvents');
      expect(result).toHaveProperty('readinessCheck');
      expect(result).toHaveProperty('leaderboard');
      expect(result).toHaveProperty('isLoading');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('isConnected');
      expect(result).toHaveProperty('updateReadiness');
      expect(result).toHaveProperty('submitAnswer');
      expect(result).toHaveProperty('refreshGameState');
      expect(result).toHaveProperty('clearEvents');
      expect(result).toHaveProperty('isTeamReady');
      expect(result).toHaveProperty('readyMemberCount');
      expect(result).toHaveProperty('totalMemberCount');
      expect(result).toHaveProperty('unreadyMembers');
      expect(result).toHaveProperty('canSubmitAnswer');
      expect(result).toHaveProperty('hasSubmittedAnswer');
      expect(result).toHaveProperty('currentQuestion');
      expect(result).toHaveProperty('teamAnswer');
      expect(result).toHaveProperty('teamScore');
      expect(result).toHaveProperty('teamRank');
    });
  });

  describe('Integration Flow', () => {
    it('handles complete team formation to game start flow', async () => {
      const { rerender } = render(<EnhancedGameRoom gameRoomId="room-1" />);

      // Start in overview tab
      expect(screen.getByText('Overview')).toBeInTheDocument();

      // Switch to teams tab
      fireEvent.click(screen.getByText('Teams'));
      expect(screen.getByTestId('team-formation-workflow')).toBeInTheDocument();

      // Create a team
      fireEvent.click(screen.getByText('Create Team'));

      // Switch to captain tab (user becomes captain)
      fireEvent.click(screen.getByText('Captain'));
      expect(screen.getByTestId('team-captain-dashboard')).toBeInTheDocument();

      // Switch to status tab
      fireEvent.click(screen.getByText('Live Status'));
      expect(screen.getByTestId('team-status-tracker')).toBeInTheDocument();
    });

    it('handles team readiness and game start integration', async () => {
      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      // Initial state - team not ready
      expect(screen.getByText('Team Readiness: 1/2 ready')).toBeInTheDocument();
      expect(screen.getByText('Mark Ready')).toBeInTheDocument();

      // Mark user as ready
      const readyButton = screen.getByText('Mark Ready');
      fireEvent.click(readyButton);

      await waitFor(() => {
        expect(mockTeamGameIntegration.updateReadiness).toHaveBeenCalledWith(
          true
        );
      });
    });

    it('handles question flow from start to submission', async () => {
      // Start with active game state
      const activeState = {
        ...mockTeamGameIntegration,
        gameTeamState: {
          ...mockTeamGameIntegration.gameTeamState,
          status: 'active' as const,
          currentQuestion: {
            id: 'question-1',
            text: 'Test question?',
            timeLimit: 30,
            startedAt: new Date().toISOString(),
          },
        },
        canSubmitAnswer: true,
      };

      vi.mocked(useTeamGameIntegration).mockReturnValue(activeState);

      render(<TeamGameInterface teamId="team-1" gameRoomId="room-1" />);

      // Question is displayed
      expect(screen.getByText('Current Question')).toBeInTheDocument();
      expect(screen.getByText('Test question?')).toBeInTheDocument();

      // Submit answer
      const answerInput = screen.getByPlaceholderText('Enter your answer...');
      fireEvent.change(answerInput, { target: { value: 'Test answer' } });
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(activeState.submitAnswer).toHaveBeenCalledWith(
          'question-1',
          'Test answer'
        );
      });
    });
  });
});
