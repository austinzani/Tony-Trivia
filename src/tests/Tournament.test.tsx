import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateTournamentForm from '../components/tournament/CreateTournamentForm';
import BracketVisualization from '../components/tournament/BracketVisualization';
import TournamentStandings from '../components/tournament/TournamentStandings';
import { TournamentService } from '../services/tournamentService';

// Mock the services
vi.mock('../services/tournamentService');
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' }
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('Tournament System', () => {
  describe('CreateTournamentForm', () => {
    it('should render tournament creation form', () => {
      render(<CreateTournamentForm />, { wrapper });
      
      expect(screen.getByText('Create Tournament')).toBeInTheDocument();
      expect(screen.getByLabelText('Tournament Name')).toBeInTheDocument();
      expect(screen.getByText('Single Elimination')).toBeInTheDocument();
      expect(screen.getByText('Round Robin')).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      const mockCreateTournament = vi.fn().mockResolvedValue({
        id: 'tournament-123',
        name: 'Test Tournament',
        format: 'single_elimination'
      });
      (TournamentService.createTournament as any) = mockCreateTournament;

      render(<CreateTournamentForm />, { wrapper });
      
      const nameInput = screen.getByLabelText('Tournament Name');
      fireEvent.change(nameInput, { target: { value: 'Test Tournament' } });
      
      const submitButton = screen.getByText('Create Tournament');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateTournament).toHaveBeenCalledWith({
          name: 'Test Tournament',
          description: '',
          format: 'single_elimination',
          maxTeams: 16,
          minTeams: 2,
          settings: expect.any(Object),
          startDate: undefined
        });
      });
    });

    it('should show round-robin specific settings', () => {
      render(<CreateTournamentForm />, { wrapper });
      
      const roundRobinOption = screen.getByLabelText('Round Robin');
      fireEvent.click(roundRobinOption);
      
      expect(screen.getByLabelText('Points per Win')).toBeInTheDocument();
      expect(screen.getByLabelText('Points per Draw')).toBeInTheDocument();
      expect(screen.getByLabelText('Points per Loss')).toBeInTheDocument();
    });
  });

  describe('BracketVisualization', () => {
    const mockMatches = [
      {
        id: '1',
        tournament_id: 'test',
        round: 1,
        match_number: 1,
        team1_score: 100,
        team2_score: 80,
        status: 'completed' as const,
        winner_id: 'team1',
        team1: {
          id: 'team1',
          team: { name: 'Team Alpha' }
        },
        team2: {
          id: 'team2',
          team: { name: 'Team Beta' }
        }
      }
    ];

    it('should render bracket visualization', () => {
      render(
        <BracketVisualization 
          matches={mockMatches as any} 
          totalRounds={1}
        />, 
        { wrapper }
      );
      
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('should handle match click', () => {
      const handleClick = vi.fn();
      render(
        <BracketVisualization 
          matches={mockMatches as any} 
          totalRounds={1}
          onMatchClick={handleClick}
        />, 
        { wrapper }
      );
      
      const matchElement = screen.getByText('Team Alpha').closest('g')?.querySelector('rect');
      if (matchElement) {
        fireEvent.click(matchElement);
        expect(handleClick).toHaveBeenCalledWith(mockMatches[0]);
      }
    });
  });

  describe('TournamentStandings', () => {
    it('should render standings table', async () => {
      const mockStandings = [
        {
          id: '1',
          tournament_id: 'test',
          participant_id: 'p1',
          position: 1,
          matches_played: 3,
          matches_won: 3,
          matches_lost: 0,
          matches_drawn: 0,
          points_for: 300,
          points_against: 150,
          points_difference: 150,
          tournament_points: 9,
          tiebreaker_score: 0,
          updated_at: new Date().toISOString(),
          participant: {
            id: 'p1',
            team: { name: 'Champions' }
          }
        }
      ];

      (TournamentService.getStandings as any) = vi.fn().mockResolvedValue(mockStandings);

      render(<TournamentStandings tournamentId="test" />, { wrapper });
      
      await waitFor(() => {
        expect(screen.getByText('Champions')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument(); // Tournament points
        expect(screen.getByText('3-0')).toBeInTheDocument(); // W-L record
      });
    });

    it('should show loading state', () => {
      (TournamentService.getStandings as any) = vi.fn().mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<TournamentStandings tournamentId="test" />, { wrapper });
      
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('Tournament Service', () => {
    it('should generate proper single elimination bracket', () => {
      const participants = [
        { id: 'p1', seed: 1, team: { name: 'Team 1' } },
        { id: 'p2', seed: 2, team: { name: 'Team 2' } },
        { id: 'p3', seed: 3, team: { name: 'Team 3' } },
        { id: 'p4', seed: 4, team: { name: 'Team 4' } }
      ];

      const matches = TournamentService['generateFirstRoundMatches'](participants as any);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].team1?.seed).toBe(1);
      expect(matches[0].team2?.seed).toBe(4);
      expect(matches[1].team1?.seed).toBe(2);
      expect(matches[1].team2?.seed).toBe(3);
    });

    it('should handle byes in bracket generation', () => {
      const participants = [
        { id: 'p1', seed: 1, team: { name: 'Team 1' } },
        { id: 'p2', seed: 2, team: { name: 'Team 2' } },
        { id: 'p3', seed: 3, team: { name: 'Team 3' } }
      ];

      const matches = TournamentService['generateFirstRoundMatches'](participants as any);
      
      expect(matches).toHaveLength(2);
      expect(matches[0].team2).toBeUndefined(); // Team 1 gets a bye
      expect(matches[1].team1?.seed).toBe(2);
      expect(matches[1].team2?.seed).toBe(3);
    });
  });
});