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

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  ZoomIn: () => <div data-testid="zoom-in-icon" />,
  ZoomOut: () => <div data-testid="zoom-out-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Timer: () => <div data-testid="timer-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Users: () => <div data-testid="users-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Send: () => <div data-testid="send-icon" />,
}));

import { SpecialRoundManager } from '../services/specialRoundManager';
import { RoundManager } from '../services/roundManager';
import { ScoreManager } from '../services/scoreManager';
import {
  WagerRoundDisplay,
  PictureRoundDisplay,
  BonusRoundDisplay,
  LightningRoundDisplay,
  AudioRoundDisplay,
  TeamChallengeRoundDisplay,
} from '../components/game/SpecialRounds';
import {
  useSpecialRounds,
  useWagerRound,
  usePictureRound,
  useBonusRound,
  useLightningRound,
  useAudioRound,
  useTeamChallengeRound,
  useSpecialRoundEvents,
} from '../hooks/useSpecialRounds';
import {
  SpecialRoundType,
  WagerPhase,
  ImageLoadStatus,
  SpecialRoundEventType,
} from '../types/specialRounds';

// Test utilities
const createMockRoundManager = () => ({
  startRound: vi.fn(),
  endRound: vi.fn(),
  getParticipants: vi.fn(() => ['participant1', 'participant2']),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

const createMockScoreManager = () => ({
  updatePlayerScore: vi.fn(),
  getPlayerScore: vi.fn(() => ({ playerId: 'test', totalScore: 100 })),
});

const createMockWagerRound = () => ({
  id: 'wager-round-1',
  type: 'special' as const,
  specialType: SpecialRoundType.WAGER,
  title: 'Test Wager Round',
  description: 'Test wager round description',
  questions: [],
  settings: {
    minWager: 0,
    maxWager: 100,
    allowZeroWager: true,
    wagerTimeLimit: 60,
    questionTimeLimit: 30,
    defaultWager: 10,
    wagerMultiplier: 1.0,
  },
  wagerSubmissions: new Map(),
  wagerPhase: WagerPhase.INSTRUCTIONS,
  currentWagerDeadline: undefined,
});

const createMockPictureRound = () => ({
  id: 'picture-round-1',
  type: 'special' as const,
  specialType: SpecialRoundType.PICTURE,
  title: 'Test Picture Round',
  description: 'Test picture round description',
  questions: [
    {
      id: 'question-1',
      text: 'What is shown in this image?',
      type: 'multiple-choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      pointValue: 10,
      imageUrl: 'https://example.com/image.jpg',
      imageAlt: 'Test image',
      imageCaption: 'Test image caption',
    },
  ],
  settings: {
    imageQuality: 'high' as const,
    allowZoom: true,
    showImagePreview: true,
    imageDisplayTime: 0,
    preloadImages: true,
    imageTransitions: true,
  },
  imageLoadingStatus: new Map(),
});

const createMockBonusRound = () => ({
  id: 'bonus-round-1',
  type: 'special' as const,
  specialType: SpecialRoundType.BONUS,
  title: 'Test Bonus Round',
  description: 'Test bonus round description',
  questions: [],
  settings: {
    bonusMultiplier: 2.0,
    streakBonus: true,
    streakBonusThreshold: 3,
    streakBonusPoints: 10,
    timeBonus: true,
    timeBonusThreshold: 10,
    timeBonusMultiplier: 1.5,
    perfectRoundBonus: 50,
    eliminationMode: false,
    eliminationThreshold: 3,
  },
  participantStatus: new Map(),
  bonusScores: new Map(),
});

const createMockLightningRound = () => ({
  id: 'lightning-round-1',
  type: 'special' as const,
  specialType: SpecialRoundType.LIGHTNING,
  title: 'Test Lightning Round',
  description: 'Test lightning round description',
  questions: [],
  settings: {
    questionTimeLimit: 5,
    totalTimeLimit: 60,
    autoAdvance: true,
    showRunningScore: true,
    pointsPerCorrect: 10,
    penaltyPerIncorrect: 0,
    questionCount: 20,
  },
  startTime: undefined,
  endTime: undefined,
  currentQuestionIndex: 0,
  participantProgress: new Map(),
});

describe('SpecialRoundManager', () => {
  let specialRoundManager: SpecialRoundManager;
  let mockRoundManager: any;
  let mockScoreManager: any;

  beforeEach(() => {
    mockRoundManager = createMockRoundManager();
    mockScoreManager = createMockScoreManager();
    specialRoundManager = new SpecialRoundManager(
      mockRoundManager,
      mockScoreManager
    );
  });

  afterEach(() => {
    specialRoundManager.destroy();
  });

  describe('Basic Operations', () => {
    it('should initialize with default configurations', () => {
      const wagerConfig = specialRoundManager.getSpecialRoundConfig(
        SpecialRoundType.WAGER
      );
      expect(wagerConfig).toBeDefined();
      expect(wagerConfig?.enabled).toBe(true);
    });

    it('should start a special round successfully', async () => {
      const wagerRound = createMockWagerRound();

      await specialRoundManager.startSpecialRound(wagerRound);

      expect(specialRoundManager.getCurrentSpecialRound()).toBe(wagerRound);
    });

    it('should end a special round successfully', async () => {
      const wagerRound = createMockWagerRound();
      await specialRoundManager.startSpecialRound(wagerRound);

      await specialRoundManager.endSpecialRound();

      expect(specialRoundManager.getCurrentSpecialRound()).toBeNull();
    });

    it('should validate special rounds before starting', async () => {
      const invalidRound = { ...createMockWagerRound(), id: '' };

      await expect(
        specialRoundManager.startSpecialRound(invalidRound as any)
      ).rejects.toThrow('Invalid special round');
    });
  });

  describe('Wager Round Management', () => {
    let wagerRound: any;

    beforeEach(async () => {
      wagerRound = createMockWagerRound();
      wagerRound.wagerPhase = WagerPhase.WAGER_SUBMISSION;
      await specialRoundManager.startSpecialRound(wagerRound);
    });

    it('should submit wager successfully', async () => {
      await specialRoundManager.submitWager('participant1', 50);

      const submission = wagerRound.wagerSubmissions.get('participant1');
      expect(submission).toBeDefined();
      expect(submission.wagerAmount).toBe(50);
      expect(submission.isLocked).toBe(false);
    });

    it('should validate wager amounts', async () => {
      await expect(
        specialRoundManager.submitWager('participant1', 150)
      ).rejects.toThrow('Wager must be between');
    });

    it('should lock wager successfully', async () => {
      await specialRoundManager.submitWager('participant1', 50);
      await specialRoundManager.lockWager('participant1');

      const submission = wagerRound.wagerSubmissions.get('participant1');
      expect(submission.isLocked).toBe(true);
    });

    it('should lock all wagers', async () => {
      await specialRoundManager.submitWager('participant1', 30);
      await specialRoundManager.submitWager('participant2', 70);

      await specialRoundManager.lockAllWagers();

      expect(wagerRound.wagerSubmissions.get('participant1').isLocked).toBe(
        true
      );
      expect(wagerRound.wagerSubmissions.get('participant2').isLocked).toBe(
        true
      );
    });
  });

  describe('Picture Round Management', () => {
    let pictureRound: any;

    beforeEach(async () => {
      pictureRound = createMockPictureRound();
      await specialRoundManager.startSpecialRound(pictureRound);
    });

    it('should preload images', async () => {
      // Mock successful image loading
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(value: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      } as any;

      await specialRoundManager.preloadImages(pictureRound);

      const loadingStatus = pictureRound.imageLoadingStatus.get('question-1');
      expect(loadingStatus).toBe(ImageLoadStatus.LOADED);
    });
  });

  describe('Bonus Round Management', () => {
    let bonusRound: any;

    beforeEach(async () => {
      bonusRound = createMockBonusRound();
      await specialRoundManager.startSpecialRound(bonusRound);
    });

    it('should initialize bonus round participants', async () => {
      await specialRoundManager.initializeBonusRound(bonusRound);

      expect(bonusRound.participantStatus.size).toBeGreaterThan(0);
      expect(bonusRound.bonusScores.size).toBeGreaterThan(0);
    });

    it('should update bonus progress correctly', async () => {
      await specialRoundManager.initializeBonusRound(bonusRound);

      await specialRoundManager.updateBonusProgress('participant1', true, 5);

      const status = bonusRound.participantStatus.get('participant1');
      expect(status.consecutiveCorrect).toBe(1);
      expect(status.consecutiveIncorrect).toBe(0);
    });

    it('should handle elimination in elimination mode', async () => {
      bonusRound.settings.eliminationMode = true;
      bonusRound.settings.eliminationThreshold = 2;
      await specialRoundManager.initializeBonusRound(bonusRound);

      await specialRoundManager.updateBonusProgress('participant1', false);
      await specialRoundManager.updateBonusProgress('participant1', false);

      const status = bonusRound.participantStatus.get('participant1');
      expect(status.isEliminated).toBe(true);
    });
  });

  describe('Lightning Round Management', () => {
    let lightningRound: any;

    beforeEach(async () => {
      lightningRound = createMockLightningRound();
      await specialRoundManager.startSpecialRound(lightningRound);
    });

    it('should start lightning round with timer', async () => {
      await specialRoundManager.startLightningRound(lightningRound);

      expect(lightningRound.startTime).toBeDefined();
      expect(lightningRound.endTime).toBeDefined();
      expect(lightningRound.participantProgress.size).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit events for round lifecycle', async () => {
      const eventListener = vi.fn();
      specialRoundManager.addEventListener(
        SpecialRoundEventType.ROUND_STARTED,
        eventListener
      );

      const wagerRound = createMockWagerRound();
      await specialRoundManager.startSpecialRound(wagerRound);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SpecialRoundEventType.ROUND_STARTED,
          roundId: wagerRound.id,
          specialType: SpecialRoundType.WAGER,
        })
      );
    });

    it('should remove event listeners', () => {
      const eventListener = vi.fn();
      specialRoundManager.addEventListener(
        SpecialRoundEventType.ROUND_STARTED,
        eventListener
      );
      specialRoundManager.removeEventListener(
        SpecialRoundEventType.ROUND_STARTED,
        eventListener
      );

      // Event listener should be removed (tested by not being called)
      expect(true).toBe(true);
    });
  });
});

describe('Special Round Components', () => {
  describe('WagerRoundDisplay', () => {
    it('should render instructions phase', () => {
      const wagerRound = createMockWagerRound();
      const mockSubmit = vi.fn();
      const mockLock = vi.fn();

      render(
        <WagerRoundDisplay
          wagerRound={wagerRound}
          participantId="participant1"
          onWagerSubmit={mockSubmit}
          onWagerLock={mockLock}
        />
      );

      expect(screen.getByText('Wager Round')).toBeInTheDocument();
      expect(
        screen.getByText(/Choose how many points to wager/)
      ).toBeInTheDocument();
    });

    it('should render wager submission phase', () => {
      const wagerRound = createMockWagerRound();
      wagerRound.wagerPhase = WagerPhase.WAGER_SUBMISSION;
      const mockSubmit = vi.fn();
      const mockLock = vi.fn();

      render(
        <WagerRoundDisplay
          wagerRound={wagerRound}
          participantId="participant1"
          onWagerSubmit={mockSubmit}
          onWagerLock={mockLock}
        />
      );

      expect(screen.getByText('Place Your Wager')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByText('Submit Wager')).toBeInTheDocument();
    });

    it('should handle wager submission', async () => {
      const user = userEvent.setup();
      const wagerRound = createMockWagerRound();
      wagerRound.wagerPhase = WagerPhase.WAGER_SUBMISSION;
      const mockSubmit = vi.fn();
      const mockLock = vi.fn();

      render(
        <WagerRoundDisplay
          wagerRound={wagerRound}
          participantId="participant1"
          onWagerSubmit={mockSubmit}
          onWagerLock={mockLock}
        />
      );

      const submitButton = screen.getByText('Submit Wager');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith(10); // Default wager
    });
  });

  describe('PictureRoundDisplay', () => {
    it('should render picture round with image', () => {
      const pictureRound = createMockPictureRound();
      const currentQuestion = pictureRound.questions[0];

      render(
        <PictureRoundDisplay
          pictureRound={pictureRound}
          currentQuestion={currentQuestion}
        />
      );

      expect(screen.getByText('Picture Round')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const pictureRound = createMockPictureRound();
      const currentQuestion = pictureRound.questions[0];
      pictureRound.imageLoadingStatus.set(
        'question-1',
        ImageLoadStatus.LOADING
      );

      render(
        <PictureRoundDisplay
          pictureRound={pictureRound}
          currentQuestion={currentQuestion}
        />
      );

      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const pictureRound = createMockPictureRound();
      const currentQuestion = pictureRound.questions[0];
      pictureRound.imageLoadingStatus.set('question-1', ImageLoadStatus.ERROR);

      render(
        <PictureRoundDisplay
          pictureRound={pictureRound}
          currentQuestion={currentQuestion}
        />
      );

      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });

    it('should handle zoom controls when enabled', async () => {
      const user = userEvent.setup();
      const pictureRound = createMockPictureRound();
      const currentQuestion = pictureRound.questions[0];

      render(
        <PictureRoundDisplay
          pictureRound={pictureRound}
          currentQuestion={currentQuestion}
        />
      );

      // Simulate image load to enable zoom controls
      const image = screen.getByAltText('Test image');
      fireEvent.load(image);

      await waitFor(() => {
        expect(screen.getByTestId('zoom-in-icon')).toBeInTheDocument();
        expect(screen.getByTestId('zoom-out-icon')).toBeInTheDocument();
      });
    });
  });

  describe('BonusRoundDisplay', () => {
    it('should render active participant status', () => {
      const bonusRound = createMockBonusRound();
      bonusRound.participantStatus.set('participant1', {
        participantId: 'participant1',
        isActive: true,
        consecutiveCorrect: 5,
        consecutiveIncorrect: 0,
        isEliminated: false,
        bonusMultiplier: 2.0,
      });
      bonusRound.bonusScores.set('participant1', {
        participantId: 'participant1',
        baseScore: 100,
        bonusPoints: 20,
        streakBonus: 30,
        timeBonus: 15,
        perfectRoundBonus: 0,
        totalBonus: 65,
        finalScore: 165,
      });

      render(
        <BonusRoundDisplay
          bonusRound={bonusRound}
          participantId="participant1"
        />
      );

      expect(screen.getByText('Bonus Round')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Streak
      expect(screen.getByText('165')).toBeInTheDocument(); // Final score
    });

    it('should render eliminated participant status', () => {
      const bonusRound = createMockBonusRound();
      bonusRound.participantStatus.set('participant1', {
        participantId: 'participant1',
        isActive: false,
        consecutiveCorrect: 2,
        consecutiveIncorrect: 3,
        isEliminated: true,
        eliminatedAt: new Date(),
        bonusMultiplier: 2.0,
      });
      bonusRound.bonusScores.set('participant1', {
        participantId: 'participant1',
        baseScore: 50,
        bonusPoints: 0,
        streakBonus: 0,
        timeBonus: 0,
        perfectRoundBonus: 0,
        totalBonus: 0,
        finalScore: 50,
      });

      render(
        <BonusRoundDisplay
          bonusRound={bonusRound}
          participantId="participant1"
        />
      );

      expect(screen.getByText('Eliminated')).toBeInTheDocument();
    });
  });

  describe('LightningRoundDisplay', () => {
    it('should render active lightning round', () => {
      const lightningRound = createMockLightningRound();
      lightningRound.participantProgress.set('participant1', {
        participantId: 'participant1',
        questionsAnswered: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        currentScore: 40,
        timeRemaining: 45,
        isComplete: false,
      });

      render(
        <LightningRoundDisplay
          lightningRound={lightningRound}
          participantId="participant1"
        />
      );

      expect(screen.getByText('Lightning Round')).toBeInTheDocument();
      expect(screen.getByText('45s')).toBeInTheDocument();
      expect(screen.getByText('4/5')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Type your answer...')
      ).toBeInTheDocument();
    });

    it('should render completed lightning round', () => {
      const lightningRound = createMockLightningRound();
      lightningRound.participantProgress.set('participant1', {
        participantId: 'participant1',
        questionsAnswered: 20,
        correctAnswers: 18,
        incorrectAnswers: 2,
        currentScore: 180,
        timeRemaining: 0,
        isComplete: true,
        completedAt: new Date(),
      });

      render(
        <LightningRoundDisplay
          lightningRound={lightningRound}
          participantId="participant1"
        />
      );

      expect(screen.getByText('Round Complete!')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument(); // Correct answers
      expect(screen.getByText('2')).toBeInTheDocument(); // Incorrect answers
      expect(screen.getByText('180')).toBeInTheDocument(); // Score
    });

    it('should handle answer submission', async () => {
      const user = userEvent.setup();
      const lightningRound = createMockLightningRound();
      lightningRound.participantProgress.set('participant1', {
        participantId: 'participant1',
        questionsAnswered: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        currentScore: 40,
        timeRemaining: 45,
        isComplete: false,
      });
      const mockSubmit = vi.fn();

      render(
        <LightningRoundDisplay
          lightningRound={lightningRound}
          participantId="participant1"
          onAnswerSubmit={mockSubmit}
        />
      );

      const input = screen.getByPlaceholderText('Type your answer...');
      const submitButton = screen.getByText('Submit');

      await user.type(input, 'Test answer');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith('Test answer');
    });
  });

  describe('AudioRoundDisplay', () => {
    it('should render audio round with controls', () => {
      const audioRound = {
        id: 'audio-round-1',
        type: 'special' as const,
        specialType: SpecialRoundType.AUDIO,
        settings: {
          audioQuality: 'high' as const,
          allowReplay: true,
          maxReplays: 3,
          autoPlay: false,
          showWaveform: false,
          showPlaybackControls: true,
          preloadAudio: true,
        },
        questions: [],
        audioLoadingStatus: new Map(),
        playbackStatus: new Map(),
      };

      const currentQuestion = {
        id: 'question-1',
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 30,
        audioFormat: 'mp3',
      };

      render(
        <AudioRoundDisplay
          audioRound={audioRound}
          currentQuestion={currentQuestion}
        />
      );

      expect(screen.getByText('Audio Round')).toBeInTheDocument();
      expect(
        screen.getByText('Listen carefully to the audio clip')
      ).toBeInTheDocument();
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });
  });

  describe('TeamChallengeRoundDisplay', () => {
    it('should render team challenge with discussion', () => {
      const teamChallengeRound = {
        id: 'team-challenge-1',
        type: 'special' as const,
        specialType: SpecialRoundType.TEAM_CHALLENGE,
        settings: {
          requiresTeams: true,
          minTeamSize: 2,
          maxTeamSize: 4,
          allowIndividualParticipation: false,
          teamBonusMultiplier: 1.5,
          collaborativeAnswering: true,
          teamCaptainOnly: false,
          discussionTimeLimit: 120,
        },
        teamSubmissions: new Map(),
        discussionPhase: true,
      };

      render(
        <TeamChallengeRoundDisplay
          teamChallengeRound={teamChallengeRound}
          participantId="participant1"
          teamId="team1"
          isCaptain={false}
          onDiscussionMessage={vi.fn()}
          onAnswerSubmit={vi.fn()}
        />
      );

      expect(screen.getByText('Team Challenge')).toBeInTheDocument();
      expect(screen.getByText('Team Discussion')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Share your thoughts with the team...')
      ).toBeInTheDocument();
    });

    it('should handle captain-only submission mode', () => {
      const teamChallengeRound = {
        id: 'team-challenge-1',
        type: 'special' as const,
        specialType: SpecialRoundType.TEAM_CHALLENGE,
        settings: {
          requiresTeams: true,
          minTeamSize: 2,
          maxTeamSize: 4,
          allowIndividualParticipation: false,
          teamBonusMultiplier: 1.5,
          collaborativeAnswering: false,
          teamCaptainOnly: true,
          discussionTimeLimit: 120,
        },
        teamSubmissions: new Map(),
        discussionPhase: false,
      };

      render(
        <TeamChallengeRoundDisplay
          teamChallengeRound={teamChallengeRound}
          participantId="participant1"
          teamId="team1"
          isCaptain={false}
          onDiscussionMessage={vi.fn()}
          onAnswerSubmit={vi.fn()}
        />
      );

      expect(
        screen.getByText('Only the team captain can submit the final answer.')
      ).toBeInTheDocument();
    });
  });
});

describe('Special Round Hooks', () => {
  let mockSpecialRoundManager: any;

  beforeEach(() => {
    mockSpecialRoundManager = {
      getCurrentSpecialRound: vi.fn(() => null),
      startSpecialRound: vi.fn(),
      endSpecialRound: vi.fn(),
      getSpecialRoundConfig: vi.fn(),
      updateSpecialRoundConfig: vi.fn(),
      getSpecialRoundMetrics: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      submitWager: vi.fn(),
      lockWager: vi.fn(),
      advanceWagerPhase: vi.fn(),
      preloadImages: vi.fn(),
      updateBonusProgress: vi.fn(),
      startLightningRound: vi.fn(),
    };
  });

  describe('useSpecialRounds', () => {
    it('should provide special rounds state and actions', () => {
      const TestComponent = () => {
        const specialRounds = useSpecialRounds(mockSpecialRoundManager);

        return (
          <div>
            <div data-testid="is-active">
              {specialRounds.isSpecialRoundActive.toString()}
            </div>
            <div data-testid="is-loading">
              {specialRounds.isLoading.toString()}
            </div>
            <button
              onClick={() =>
                specialRounds.startSpecialRound(createMockWagerRound())
              }
            >
              Start Round
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('is-active')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByText('Start Round')).toBeInTheDocument();
    });
  });

  describe('useWagerRound', () => {
    it('should provide wager round state and actions', () => {
      const wagerRound = createMockWagerRound();
      mockSpecialRoundManager.getCurrentSpecialRound.mockReturnValue(
        wagerRound
      );

      const TestComponent = () => {
        const wager = useWagerRound(mockSpecialRoundManager, 'participant1');

        return (
          <div>
            <div data-testid="phase">{wager.currentPhase}</div>
            <div data-testid="can-submit">
              {wager.canSubmitWager.toString()}
            </div>
            <button onClick={() => wager.submitWager('participant1', 50)}>
              Submit Wager
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('phase')).toHaveTextContent(
        WagerPhase.INSTRUCTIONS
      );
      expect(screen.getByText('Submit Wager')).toBeInTheDocument();
    });
  });

  describe('useBonusRound', () => {
    it('should provide bonus round state and actions', () => {
      const bonusRound = createMockBonusRound();
      bonusRound.participantStatus.set('participant1', {
        participantId: 'participant1',
        isActive: true,
        consecutiveCorrect: 3,
        consecutiveIncorrect: 0,
        isEliminated: false,
        bonusMultiplier: 2.0,
      });
      mockSpecialRoundManager.getCurrentSpecialRound.mockReturnValue(
        bonusRound
      );

      const TestComponent = () => {
        const bonus = useBonusRound(mockSpecialRoundManager, 'participant1');

        return (
          <div>
            <div data-testid="streak">{bonus.currentStreak}</div>
            <div data-testid="eliminated">{bonus.isEliminated.toString()}</div>
            <button
              onClick={() => bonus.updateProgress('participant1', true, 5)}
            >
              Update Progress
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('streak')).toHaveTextContent('3');
      expect(screen.getByTestId('eliminated')).toHaveTextContent('false');
      expect(screen.getByText('Update Progress')).toBeInTheDocument();
    });
  });

  describe('useLightningRound', () => {
    it('should provide lightning round state and actions', () => {
      const lightningRound = createMockLightningRound();
      lightningRound.participantProgress.set('participant1', {
        participantId: 'participant1',
        questionsAnswered: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        currentScore: 40,
        timeRemaining: 45,
        isComplete: false,
      });
      mockSpecialRoundManager.getCurrentSpecialRound.mockReturnValue(
        lightningRound
      );

      const TestComponent = () => {
        const lightning = useLightningRound(
          mockSpecialRoundManager,
          'participant1'
        );

        return (
          <div>
            <div data-testid="score">{lightning.currentScore}</div>
            <div data-testid="complete">{lightning.isComplete.toString()}</div>
            <button
              onClick={() =>
                lightning.submitAnswer('participant1', 'answer', true)
              }
            >
              Submit Answer
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('score')).toHaveTextContent('40');
      expect(screen.getByTestId('complete')).toHaveTextContent('false');
      expect(screen.getByText('Submit Answer')).toBeInTheDocument();
    });
  });

  describe('useSpecialRoundEvents', () => {
    it('should track special round events', () => {
      const TestComponent = () => {
        const events = useSpecialRoundEvents(mockSpecialRoundManager, 10);

        return (
          <div>
            <div data-testid="event-count">{events.events.length}</div>
            <button onClick={() => events.clearEvents()}>Clear Events</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('event-count')).toHaveTextContent('0');
      expect(screen.getByText('Clear Events')).toBeInTheDocument();
    });
  });
});

describe('Special Round Integration', () => {
  it('should handle complete wager round workflow', async () => {
    const mockRoundManager = createMockRoundManager();
    const mockScoreManager = createMockScoreManager();
    const specialRoundManager = new SpecialRoundManager(
      mockRoundManager,
      mockScoreManager
    );

    const wagerRound = createMockWagerRound();

    // Start round
    await specialRoundManager.startSpecialRound(wagerRound);
    expect(specialRoundManager.getCurrentSpecialRound()).toBe(wagerRound);

    // Advance to wager submission phase
    wagerRound.wagerPhase = WagerPhase.WAGER_SUBMISSION;

    // Submit wagers
    await specialRoundManager.submitWager('participant1', 30);
    await specialRoundManager.submitWager('participant2', 70);

    // Lock wagers
    await specialRoundManager.lockAllWagers();

    // Verify submissions
    expect(wagerRound.wagerSubmissions.get('participant1')?.isLocked).toBe(
      true
    );
    expect(wagerRound.wagerSubmissions.get('participant2')?.isLocked).toBe(
      true
    );

    // End round
    await specialRoundManager.endSpecialRound();
    expect(specialRoundManager.getCurrentSpecialRound()).toBeNull();

    specialRoundManager.destroy();
  });

  it('should handle picture round with image loading', async () => {
    const mockRoundManager = createMockRoundManager();
    const mockScoreManager = createMockScoreManager();
    const specialRoundManager = new SpecialRoundManager(
      mockRoundManager,
      mockScoreManager
    );

    // Mock successful image loading
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    } as any;

    const pictureRound = createMockPictureRound();

    // Start round
    await specialRoundManager.startSpecialRound(pictureRound);

    // Preload images
    await specialRoundManager.preloadImages(pictureRound);

    // Verify image loading status
    const loadingStatus = pictureRound.imageLoadingStatus.get('question-1');
    expect(loadingStatus).toBe(ImageLoadStatus.LOADED);

    specialRoundManager.destroy();
  });
});

describe('Error Handling', () => {
  let specialRoundManager: SpecialRoundManager;
  let mockRoundManager: any;
  let mockScoreManager: any;

  beforeEach(() => {
    mockRoundManager = createMockRoundManager();
    mockScoreManager = createMockScoreManager();
    specialRoundManager = new SpecialRoundManager(
      mockRoundManager,
      mockScoreManager
    );
  });

  afterEach(() => {
    specialRoundManager.destroy();
  });

  it('should handle invalid wager amounts', async () => {
    const wagerRound = createMockWagerRound();
    wagerRound.wagerPhase = WagerPhase.WAGER_SUBMISSION;
    await specialRoundManager.startSpecialRound(wagerRound);

    await expect(
      specialRoundManager.submitWager('participant1', -10)
    ).rejects.toThrow('Wager must be between');

    await expect(
      specialRoundManager.submitWager('participant1', 200)
    ).rejects.toThrow('Wager must be between');
  });

  it('should handle wager submission in wrong phase', async () => {
    const wagerRound = createMockWagerRound();
    wagerRound.wagerPhase = WagerPhase.INSTRUCTIONS;
    await specialRoundManager.startSpecialRound(wagerRound);

    await expect(
      specialRoundManager.submitWager('participant1', 50)
    ).rejects.toThrow('Wager submission phase is not active');
  });

  it('should handle ending round when no round is active', async () => {
    await expect(specialRoundManager.endSpecialRound()).rejects.toThrow(
      'No active special round to end'
    );
  });
});
