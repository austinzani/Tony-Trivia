import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScoreManager, PlayerScore, TeamScore } from '../services/scoreManager';
import {
  PlayerScoreCard,
  TeamScoreCard,
  Leaderboard,
  ScoreStatistics,
} from '../components/game/ScoreDisplay';
import {
  useScoreManager,
  usePlayerScore,
  useTeamScore,
  useLeaderboard,
} from '../hooks/useScoreManager';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon" />,
  Target: () => <div data-testid="target-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Percent: () => <div data-testid="percent-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Medal: () => <div data-testid="medal-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    scoreManager = new ScoreManager('test-game');
  });

  afterEach(() => {
    scoreManager.destroy();
  });

  describe('Basic Operations', () => {
    test('should initialize with empty scores', () => {
      expect(scoreManager.getPlayerScores().size).toBe(0);
      expect(scoreManager.getTeamScores().size).toBe(0);
      expect(scoreManager.getLeaderboard()).toHaveLength(0);
    });

    test('should calculate player score correctly', async () => {
      await scoreManager.calculateScore('player1', 'question1', true, 5);

      const playerScore = scoreManager.getPlayerScore('player1');
      expect(playerScore).toBeTruthy();
      expect(playerScore!.totalScore).toBe(5);
      expect(playerScore!.correctAnswers).toBe(1);
      expect(playerScore!.incorrectAnswers).toBe(0);
    });

    test('should handle incorrect answers', async () => {
      await scoreManager.calculateScore('player1', 'question1', false, 3);

      const playerScore = scoreManager.getPlayerScore('player1');
      expect(playerScore).toBeTruthy();
      expect(playerScore!.totalScore).toBe(0);
      expect(playerScore!.correctAnswers).toBe(0);
      expect(playerScore!.incorrectAnswers).toBe(1);
    });

    test('should accumulate scores across questions', async () => {
      await scoreManager.calculateScore('player1', 'question1', true, 3);
      await scoreManager.calculateScore('player1', 'question2', true, 5);
      await scoreManager.calculateScore('player1', 'question3', false, 1);

      const playerScore = scoreManager.getPlayerScore('player1');
      expect(playerScore!.totalScore).toBe(8);
      expect(playerScore!.correctAnswers).toBe(2);
      expect(playerScore!.incorrectAnswers).toBe(1);
      expect(playerScore!.accuracy).toBe(66.67);
    });

    test('should register and update players', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.registerPlayer('player2', 'Bob');

      expect(scoreManager.getPlayerScores().size).toBe(2);
      expect(scoreManager.getPlayerScore('player1')!.playerName).toBe('Alice');
      expect(scoreManager.getPlayerScore('player2')!.playerName).toBe('Bob');
    });

    test('should register and update teams', async () => {
      await scoreManager.registerTeam('team1', 'Team Alpha');
      await scoreManager.addPlayerToTeam('player1', 'team1', 'Alice');

      const teamScore = scoreManager.getTeamScore('team1');
      expect(teamScore).toBeTruthy();
      expect(teamScore!.teamName).toBe('Team Alpha');
      expect(teamScore!.playerScores.size).toBe(1);
    });

    test('should calculate team scores from player scores', async () => {
      await scoreManager.registerTeam('team1', 'Team Alpha');
      await scoreManager.addPlayerToTeam('player1', 'team1', 'Alice');
      await scoreManager.addPlayerToTeam('player2', 'team1', 'Bob');

      await scoreManager.calculateScore('player1', 'question1', true, 5);
      await scoreManager.calculateScore('player2', 'question1', true, 3);

      const teamScore = scoreManager.getTeamScore('team1');
      expect(teamScore!.totalScore).toBe(8);
      expect(teamScore!.correctAnswers).toBe(2);
    });
  });

  describe('Leaderboard Management', () => {
    beforeEach(async () => {
      // Setup test data
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.registerPlayer('player2', 'Bob');
      await scoreManager.registerPlayer('player3', 'Charlie');
      await scoreManager.registerTeam('team1', 'Team Alpha');
      await scoreManager.registerTeam('team2', 'Team Beta');

      await scoreManager.addPlayerToTeam('player1', 'team1', 'Alice');
      await scoreManager.addPlayerToTeam('player2', 'team1', 'Bob');
      await scoreManager.addPlayerToTeam('player3', 'team2', 'Charlie');

      // Add scores
      await scoreManager.calculateScore('player1', 'question1', true, 5);
      await scoreManager.calculateScore('player2', 'question1', true, 3);
      await scoreManager.calculateScore('player3', 'question1', true, 6);
    });

    test('should generate correct leaderboard', () => {
      const leaderboard = scoreManager.getLeaderboard();

      expect(leaderboard).toHaveLength(5); // 3 players + 2 teams

      // Check player rankings
      const playerEntries = leaderboard.filter(
        entry => entry.type === 'player'
      );
      expect(playerEntries[0].name).toBe('Charlie'); // 6 points
      expect(playerEntries[1].name).toBe('Alice'); // 5 points
      expect(playerEntries[2].name).toBe('Bob'); // 3 points
    });

    test('should handle ties correctly', async () => {
      await scoreManager.calculateScore('player2', 'question2', true, 2); // Bob now has 5 points too

      const leaderboard = scoreManager.getLeaderboard();
      const playerEntries = leaderboard.filter(
        entry => entry.type === 'player'
      );

      // Charlie still first with 6 points
      expect(playerEntries[0].name).toBe('Charlie');
      // Alice and Bob tied with 5 points - should be ordered by name or timestamp
      expect([playerEntries[1].name, playerEntries[2].name]).toContain('Alice');
      expect([playerEntries[1].name, playerEntries[2].name]).toContain('Bob');
    });

    test('should update ranks correctly', () => {
      const leaderboard = scoreManager.getLeaderboard();
      const playerEntries = leaderboard.filter(
        entry => entry.type === 'player'
      );

      expect(playerEntries[0].rank).toBe(1);
      expect(playerEntries[1].rank).toBe(2);
      expect(playerEntries[2].rank).toBe(3);
    });
  });

  describe('Round Management Integration', () => {
    test('should track round scores separately', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');

      await scoreManager.calculateScore('player1', 'q1', true, 3, 'round1');
      await scoreManager.calculateScore('player1', 'q2', true, 5, 'round2');

      const playerScore = scoreManager.getPlayerScore('player1');
      expect(playerScore!.totalScore).toBe(8);
      expect(playerScore!.roundScores.get('round1')).toBe(3);
      expect(playerScore!.roundScores.get('round2')).toBe(5);
    });

    test('should calculate round statistics', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.registerPlayer('player2', 'Bob');

      await scoreManager.calculateScore('player1', 'q1', true, 3, 'round1');
      await scoreManager.calculateScore('player1', 'q2', false, 1, 'round1');
      await scoreManager.calculateScore('player2', 'q1', true, 5, 'round1');

      const roundStats = scoreManager.getRoundStatistics('round1');
      expect(roundStats.totalParticipants).toBe(2);
      expect(roundStats.averageScore).toBe(4); // (3 + 5) / 2
      expect(roundStats.highestScore).toBe(5);
      expect(roundStats.lowestScore).toBe(3);
    });
  });

  describe('Event System', () => {
    test('should emit score update events', async () => {
      const eventSpy = jest.fn();
      scoreManager.addEventListener('scoreUpdated', eventSpy);

      await scoreManager.calculateScore('player1', 'question1', true, 5);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'scoreUpdated',
          playerId: 'player1',
          score: expect.any(Object),
        })
      );
    });

    test('should emit leaderboard update events', async () => {
      const eventSpy = jest.fn();
      scoreManager.addEventListener('leaderboardUpdated', eventSpy);

      await scoreManager.calculateScore('player1', 'question1', true, 5);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'leaderboardUpdated',
          leaderboard: expect.any(Array),
        })
      );
    });

    test('should remove event listeners correctly', async () => {
      const eventSpy = jest.fn();
      scoreManager.addEventListener('scoreUpdated', eventSpy);
      scoreManager.removeEventListener('scoreUpdated', eventSpy);

      await scoreManager.calculateScore('player1', 'question1', true, 5);

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    test('should export and import scores', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.calculateScore('player1', 'question1', true, 5);

      const exportedData = scoreManager.exportScores();
      expect(exportedData).toBeTruthy();

      const newScoreManager = new ScoreManager('test-game-2');
      await newScoreManager.importScores(exportedData);

      const importedScore = newScoreManager.getPlayerScore('player1');
      expect(importedScore!.totalScore).toBe(5);
      expect(importedScore!.playerName).toBe('Alice');

      newScoreManager.destroy();
    });

    test('should reset all scores', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.calculateScore('player1', 'question1', true, 5);

      expect(scoreManager.getPlayerScores().size).toBe(1);

      await scoreManager.resetScores();

      expect(scoreManager.getPlayerScores().size).toBe(0);
      expect(scoreManager.getTeamScores().size).toBe(0);
      expect(scoreManager.getLeaderboard()).toHaveLength(0);
    });

    test('should recalculate all scores', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');
      await scoreManager.calculateScore('player1', 'question1', true, 5);

      // Manually modify score to test recalculation
      const playerScore = scoreManager.getPlayerScore('player1')!;
      playerScore.totalScore = 100;

      await scoreManager.recalculateAllScores();

      // Score should be recalculated back to correct value
      const recalculatedScore = scoreManager.getPlayerScore('player1');
      expect(recalculatedScore!.totalScore).toBe(5);
    });
  });
});

describe('React Components', () => {
  const mockPlayerScore: PlayerScore = {
    playerId: 'player1',
    playerName: 'Alice',
    totalScore: 15,
    roundScores: new Map([
      ['round1', 8],
      ['round2', 7],
    ]),
    questionScores: new Map(),
    correctAnswers: 3,
    incorrectAnswers: 1,
    totalQuestions: 4,
    accuracy: 75,
    averagePointValue: 5,
    rank: 1,
    lastUpdated: new Date(),
  };

  const mockTeamScore: TeamScore = {
    teamId: 'team1',
    teamName: 'Team Alpha',
    totalScore: 25,
    roundScores: new Map([
      ['round1', 15],
      ['round2', 10],
    ]),
    playerScores: new Map([['player1', mockPlayerScore]]),
    correctAnswers: 5,
    incorrectAnswers: 2,
    totalQuestions: 7,
    accuracy: 71.43,
    averagePointValue: 5,
    rank: 1,
    lastUpdated: new Date(),
  };

  describe('PlayerScoreCard', () => {
    test('should render player score information', () => {
      render(<PlayerScoreCard playerScore={mockPlayerScore} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('3/4')).toBeInTheDocument();
    });

    test('should show rank when enabled', () => {
      render(<PlayerScoreCard playerScore={mockPlayerScore} showRank={true} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    test('should hide details when disabled', () => {
      render(
        <PlayerScoreCard playerScore={mockPlayerScore} showDetails={false} />
      );

      expect(screen.queryByText('75%')).not.toBeInTheDocument();
      expect(screen.queryByText('3/4')).not.toBeInTheDocument();
    });
  });

  describe('TeamScoreCard', () => {
    test('should render team score information', () => {
      render(<TeamScoreCard teamScore={mockTeamScore} />);

      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('71%')).toBeInTheDocument();
      expect(screen.getByText('1 player')).toBeInTheDocument();
    });

    test('should show player details when enabled', () => {
      render(
        <TeamScoreCard teamScore={mockTeamScore} showPlayerDetails={true} />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('Leaderboard', () => {
    const mockLeaderboard = [
      {
        id: 'player1',
        name: 'Alice',
        score: 15,
        rank: 1,
        type: 'player' as const,
        accuracy: 75,
        correctAnswers: 3,
        totalQuestions: 4,
      },
      {
        id: 'team1',
        name: 'Team Alpha',
        score: 25,
        rank: 1,
        type: 'team' as const,
        accuracy: 71,
        correctAnswers: 5,
        totalQuestions: 7,
      },
    ];

    test('should render leaderboard entries', () => {
      render(<Leaderboard entries={mockLeaderboard} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    test('should filter by type when specified', () => {
      render(<Leaderboard entries={mockLeaderboard} type="player" />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
    });

    test('should limit entries when maxEntries is set', () => {
      render(<Leaderboard entries={mockLeaderboard} maxEntries={1} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Team Alpha')).not.toBeInTheDocument();
    });
  });
});

describe('React Hooks', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    scoreManager = new ScoreManager('test-game');
  });

  afterEach(() => {
    scoreManager.destroy();
  });

  describe('useScoreManager', () => {
    const TestComponent: React.FC = () => {
      const {
        playerScores,
        teamScores,
        leaderboard,
        totalPlayers,
        calculateScore,
        resetScores,
      } = useScoreManager('test-game');

      return (
        <div>
          <div data-testid="total-players">{totalPlayers}</div>
          <div data-testid="leaderboard-length">{leaderboard.length}</div>
          <button
            onClick={() => calculateScore('player1', 'question1', true, 5)}
            data-testid="calculate-score"
          >
            Calculate Score
          </button>
          <button onClick={resetScores} data-testid="reset-scores">
            Reset Scores
          </button>
        </div>
      );
    };

    test('should provide score manager functionality', async () => {
      render(<TestComponent />);

      expect(screen.getByTestId('total-players')).toHaveTextContent('0');
      expect(screen.getByTestId('leaderboard-length')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('calculate-score'));

      await waitFor(() => {
        expect(screen.getByTestId('total-players')).toHaveTextContent('1');
        expect(screen.getByTestId('leaderboard-length')).toHaveTextContent('1');
      });
    });

    test('should handle reset scores', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('calculate-score'));

      await waitFor(() => {
        expect(screen.getByTestId('total-players')).toHaveTextContent('1');
      });

      fireEvent.click(screen.getByTestId('reset-scores'));

      await waitFor(() => {
        expect(screen.getByTestId('total-players')).toHaveTextContent('0');
      });
    });
  });

  describe('usePlayerScore', () => {
    const TestComponent: React.FC<{ playerId: string }> = ({ playerId }) => {
      const { playerScore, updateScore } = usePlayerScore(
        scoreManager,
        playerId
      );

      return (
        <div>
          <div data-testid="player-score">
            {playerScore ? playerScore.totalScore : 'No score'}
          </div>
          <button
            onClick={() => updateScore({ totalScore: 10 })}
            data-testid="update-score"
          >
            Update Score
          </button>
        </div>
      );
    };

    test('should track individual player score', async () => {
      await scoreManager.registerPlayer('player1', 'Alice');

      render(<TestComponent playerId="player1" />);

      expect(screen.getByTestId('player-score')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('update-score'));

      await waitFor(() => {
        expect(screen.getByTestId('player-score')).toHaveTextContent('10');
      });
    });
  });
});
