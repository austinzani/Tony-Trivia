import { renderHook, act } from '@testing-library/react';
import { RoundManager, RoundConfiguration } from '../services/roundManager';
import {
  useRoundManager,
  useLastCallTriviaRounds,
  useCustomRounds,
} from '../hooks/useRoundManager';
import {
  Round,
  RoundType,
  PointValue,
  Question,
  QuestionType,
  GameDifficulty,
} from '../types/game';

// Mock data
const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    type: 'multiple-choice' as QuestionType,
    category: 'Geography',
    difficulty: 'easy' as GameDifficulty,
    points: 1 as PointValue,
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    explanation: 'Paris is the capital of France.',
    timeLimit: 30,
    mediaUrl: undefined,
    tags: ['geography', 'capitals'],
  },
  {
    id: 'q2',
    text: 'Who painted the Mona Lisa?',
    type: 'multiple-choice' as QuestionType,
    category: 'Art',
    difficulty: 'medium' as GameDifficulty,
    points: 3 as PointValue,
    options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'],
    correctAnswer: 'Da Vinci',
    explanation: 'Leonardo da Vinci painted the Mona Lisa.',
    timeLimit: 45,
    mediaUrl: undefined,
    tags: ['art', 'renaissance'],
  },
];

const mockRound1Questions = mockQuestions.slice(0, 1);
const mockRound2Questions = mockQuestions.slice(1, 2);

const mockRounds: Round[] = [
  {
    id: 'round1',
    number: 1,
    type: 'standard' as RoundType,
    name: 'Round 1',
    description: 'First round',
    availablePointValues: [1, 3, 5] as PointValue[],
    questions: mockRound1Questions,
    timeLimit: 30,
    maxQuestions: 10,
    specialRules: {},
    status: 'not-started',
    startedAt: undefined,
    completedAt: undefined,
  },
  {
    id: 'round2',
    number: 2,
    type: 'standard' as RoundType,
    name: 'Round 2',
    description: 'Second round',
    availablePointValues: [2, 4, 6] as PointValue[],
    questions: mockRound2Questions,
    timeLimit: 45,
    maxQuestions: 10,
    specialRules: {},
    status: 'not-started',
    startedAt: undefined,
    completedAt: undefined,
  },
];

const mockRoundConfigurations: RoundConfiguration[] = [
  {
    number: 1,
    type: 'standard' as RoundType,
    name: 'Round 1',
    description: 'First round',
    availablePointValues: [1, 3, 5] as PointValue[],
    questions: mockRound1Questions,
    timeLimit: 30,
    maxQuestions: 10,
    specialRules: {},
  },
  {
    number: 2,
    type: 'standard' as RoundType,
    name: 'Round 2',
    description: 'Second round',
    availablePointValues: [2, 4, 6] as PointValue[],
    questions: mockRound2Questions,
    timeLimit: 45,
    maxQuestions: 10,
    specialRules: {},
  },
];

describe('RoundManager', () => {
  let roundManager: RoundManager;

  beforeEach(() => {
    roundManager = new RoundManager(mockRounds);
  });

  describe('Initialization', () => {
    it('should initialize with provided rounds', () => {
      expect(roundManager.getAllRounds()).toHaveLength(2);
      expect(roundManager.getTotalRounds()).toBe(2);
      expect(roundManager.getCurrentRoundNumber()).toBe(0);
      expect(roundManager.getCurrentRound()).toBeNull();
    });

    it('should initialize with empty rounds', () => {
      const emptyManager = new RoundManager([]);
      expect(emptyManager.getAllRounds()).toHaveLength(0);
      expect(emptyManager.getTotalRounds()).toBe(0);
    });

    it('should validate rounds during initialization', () => {
      const invalidRounds = [
        {
          ...mockRounds[0],
          number: 0, // Invalid round number
        },
      ];

      expect(() => new RoundManager(invalidRounds as Round[])).toThrow();
    });
  });

  describe('Round Management', () => {
    it('should start a round', () => {
      const success = roundManager.startRound(1);
      expect(success).toBe(true);
      expect(roundManager.getCurrentRoundNumber()).toBe(1);
      expect(roundManager.getCurrentRound()?.status).toBe('active');
    });

    it('should not start invalid round', () => {
      const success = roundManager.startRound(99);
      expect(success).toBe(false);
      expect(roundManager.getCurrentRoundNumber()).toBe(0);
    });

    it('should complete a round', () => {
      roundManager.startRound(1);
      const success = roundManager.completeRound(1);
      expect(success).toBe(true);
      expect(roundManager.getCurrentRound()?.status).toBe('completed');
    });

    it('should advance to next round', () => {
      roundManager.startRound(1);
      roundManager.completeRound(1);

      const success = roundManager.advanceToNextRound();
      expect(success).toBe(true);
      expect(roundManager.getCurrentRoundNumber()).toBe(2);
    });

    it('should not advance past last round', () => {
      roundManager.startRound(2);
      roundManager.completeRound(2);

      const success = roundManager.advanceToNextRound();
      expect(success).toBe(false);
      expect(roundManager.isLastRound()).toBe(true);
    });

    it('should go to previous round', () => {
      roundManager.startRound(2);
      const success = roundManager.goToPreviousRound();
      expect(success).toBe(true);
      expect(roundManager.getCurrentRoundNumber()).toBe(1);
    });

    it('should go to specific round', () => {
      const success = roundManager.goToRound(2);
      expect(success).toBe(true);
      expect(roundManager.getCurrentRoundNumber()).toBe(2);
    });

    it('should reset a round', () => {
      roundManager.startRound(1);
      roundManager.usePointValue('player1', 1 as PointValue, 1);

      const success = roundManager.resetRound(1);
      expect(success).toBe(true);
      expect(roundManager.getUsedPointValues('player1', 1)).toHaveLength(0);
    });

    it('should reset all rounds', () => {
      roundManager.startRound(1);
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      roundManager.startRound(2);
      roundManager.usePointValue('player1', 2 as PointValue, 2);

      roundManager.resetAllRounds();
      expect(roundManager.getCurrentRoundNumber()).toBe(0);
      expect(roundManager.getUsedPointValues('player1', 1)).toHaveLength(0);
      expect(roundManager.getUsedPointValues('player1', 2)).toHaveLength(0);
    });
  });

  describe('Point Value Management', () => {
    beforeEach(() => {
      roundManager.startRound(1);
    });

    it('should get available point values for round', () => {
      const availablePoints = roundManager.getAvailablePointValues(1);
      expect(availablePoints).toEqual([1, 3, 5]);
    });

    it('should use point value', () => {
      const success = roundManager.usePointValue('player1', 1 as PointValue, 1);
      expect(success).toBe(true);

      const usedPoints = roundManager.getUsedPointValues('player1', 1);
      expect(usedPoints).toContain(1);
    });

    it('should not use same point value twice', () => {
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      const success = roundManager.usePointValue('player1', 1 as PointValue, 1);
      expect(success).toBe(false);
    });

    it('should not use invalid point value', () => {
      const success = roundManager.usePointValue('player1', 2 as PointValue, 1);
      expect(success).toBe(false);
    });

    it('should check if can use point value', () => {
      expect(roundManager.canUsePointValue('player1', 1 as PointValue, 1)).toBe(
        true
      );

      roundManager.usePointValue('player1', 1 as PointValue, 1);
      expect(roundManager.canUsePointValue('player1', 1 as PointValue, 1)).toBe(
        false
      );
    });

    it('should get remaining point values', () => {
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      const remaining = roundManager.getRemainingPointValues('player1', 1);
      expect(remaining).toEqual([3, 5]);
    });

    it('should release point value', () => {
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      const success = roundManager.releasePointValue(
        'player1',
        1 as PointValue,
        1
      );
      expect(success).toBe(true);

      const usedPoints = roundManager.getUsedPointValues('player1', 1);
      expect(usedPoints).not.toContain(1);
    });

    it('should clear participant data', () => {
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      roundManager.clearParticipant('player1');

      const usedPoints = roundManager.getUsedPointValues('player1', 1);
      expect(usedPoints).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      roundManager.startRound(1);
    });

    it('should validate point selection', () => {
      const result = roundManager.validatePointSelection(
        'player1',
        1 as PointValue,
        1
      );
      expect(result.isValid).toBe(true);

      roundManager.usePointValue('player1', 1 as PointValue, 1);
      const result2 = roundManager.validatePointSelection(
        'player1',
        1 as PointValue,
        1
      );
      expect(result2.isValid).toBe(false);
    });

    it('should validate round completion', () => {
      const result = roundManager.validateRoundCompletion(1);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(() => {
      roundManager.startRound(1);
    });

    it('should get round progress', () => {
      const progress = roundManager.getRoundProgress(1);
      expect(progress.currentRound).toBe(1);
      expect(progress.totalRounds).toBe(2);
      expect(progress.roundComplete).toBe(false);
    });

    it('should get all round progress', () => {
      const allProgress = roundManager.getAllRoundProgress();
      expect(allProgress).toHaveLength(2);
    });

    it('should get participant round stats', () => {
      roundManager.usePointValue('player1', 1 as PointValue, 1);
      roundManager.usePointValue('player1', 3 as PointValue, 1);

      const stats = roundManager.getParticipantRoundStats('player1');
      expect(stats[1].pointsUsed).toEqual([1, 3]);
      expect(stats[1].totalPointsUsed).toBe(4);
    });
  });

  describe('State Management', () => {
    it('should export and import state', () => {
      roundManager.startRound(1);
      roundManager.usePointValue('player1', 1 as PointValue, 1);

      const state = roundManager.exportState();
      expect(state).toBeDefined();

      const newManager = new RoundManager(mockRounds);
      newManager.importState(state);

      expect(newManager.getCurrentRoundNumber()).toBe(1);
      expect(newManager.getUsedPointValues('player1', 1)).toContain(1);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create Last Call Trivia rounds', () => {
      const rounds = RoundManager.createLastCallTriviaRounds(
        mockRound1Questions,
        mockRound2Questions
      );
      expect(rounds).toHaveLength(2);
      expect(rounds[0].availablePointValues).toEqual([1, 3, 5]);
      expect(rounds[1].availablePointValues).toEqual([2, 4, 6]);
    });

    it('should create custom rounds', () => {
      const rounds = RoundManager.createCustomRounds(mockRoundConfigurations);
      expect(rounds).toHaveLength(2);
      expect(rounds[0].number).toBe(1);
      expect(rounds[1].number).toBe(2);
    });
  });
});

describe('useRoundManager', () => {
  it('should initialize with rounds', () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    expect(result.current.totalRounds).toBe(2);
    expect(result.current.currentRoundNumber).toBe(0);
    expect(result.current.allRounds).toHaveLength(2);
  });

  it('should auto-start if configured', () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
        autoStart: true,
      })
    );

    expect(result.current.currentRoundNumber).toBe(1);
    expect(result.current.currentRound?.status).toBe('active');
  });

  it('should start round', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      const success = await result.current.startRound(1);
      expect(success).toBe(true);
    });

    expect(result.current.currentRoundNumber).toBe(1);
    expect(result.current.currentRound?.status).toBe('active');
  });

  it('should complete round', async () => {
    const onRoundComplete = jest.fn();
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
        onRoundComplete,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
      const success = await result.current.completeRound(1);
      expect(success).toBe(true);
    });

    expect(result.current.currentRound?.status).toBe('completed');
    expect(onRoundComplete).toHaveBeenCalledWith(1);
  });

  it('should advance to next round', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
      await result.current.completeRound(1);
      const success = await result.current.advanceToNextRound();
      expect(success).toBe(true);
    });

    expect(result.current.currentRoundNumber).toBe(2);
  });

  it('should handle point value management', async () => {
    const onPointUsed = jest.fn();
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
        onPointUsed,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
    });

    expect(result.current.getAvailablePointValues(1)).toEqual([1, 3, 5]);
    expect(result.current.canUsePointValue('player1', 1 as PointValue, 1)).toBe(
      true
    );

    await act(async () => {
      const success = await result.current.usePointValue(
        'player1',
        1 as PointValue,
        1
      );
      expect(success).toBe(true);
    });

    expect(result.current.getUsedPointValues('player1', 1)).toContain(1);
    expect(result.current.getRemainingPointValues('player1', 1)).toEqual([
      3, 5,
    ]);
    expect(onPointUsed).toHaveBeenCalledWith('player1', 1, 1);
  });

  it('should validate operations', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
    });

    const validation = result.current.validatePointSelection(
      'player1',
      1 as PointValue,
      1
    );
    expect(validation.isValid).toBe(true);

    const completion = result.current.validateRoundCompletion(1);
    expect(completion.isValid).toBe(true);
  });

  it('should track progress', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
      await result.current.usePointValue('player1', 1 as PointValue, 1);
    });

    const progress = result.current.getRoundProgress(1);
    expect(progress.currentRound).toBe(1);
    expect(progress.totalRounds).toBe(2);

    const allProgress = result.current.getAllRoundProgress();
    expect(allProgress).toHaveLength(2);

    const stats = result.current.getParticipantRoundStats('player1');
    expect(stats[1].pointsUsed).toContain(1);
  });

  it('should handle navigation', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(2);
    });

    expect(result.current.currentRoundNumber).toBe(2);
    expect(result.current.isLastRound).toBe(true);

    act(() => {
      const success = result.current.goToPreviousRound();
      expect(success).toBe(true);
    });

    expect(result.current.currentRoundNumber).toBe(1);

    act(() => {
      const success = result.current.goToRound(2);
      expect(success).toBe(true);
    });

    expect(result.current.currentRoundNumber).toBe(2);
  });

  it('should handle reset operations', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
      await result.current.usePointValue('player1', 1 as PointValue, 1);
    });

    act(() => {
      const success = result.current.resetRound(1);
      expect(success).toBe(true);
    });

    expect(result.current.getUsedPointValues('player1', 1)).toHaveLength(0);

    await act(async () => {
      await result.current.startRound(1);
      await result.current.usePointValue('player1', 1 as PointValue, 1);
    });

    act(() => {
      result.current.resetAllRounds();
    });

    expect(result.current.currentRoundNumber).toBe(0);
    expect(result.current.getUsedPointValues('player1', 1)).toHaveLength(0);
  });

  it('should handle utility operations', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
      await result.current.usePointValue('player1', 1 as PointValue, 1);
    });

    act(() => {
      result.current.clearParticipant('player1');
    });

    expect(result.current.getUsedPointValues('player1', 1)).toHaveLength(0);

    const state = result.current.exportState();
    expect(state).toBeDefined();

    act(() => {
      result.current.importState(state);
    });
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
      })
    );

    await act(async () => {
      const success = await result.current.startRound(99); // Invalid round
      expect(success).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should trigger callbacks', async () => {
    const onRoundChange = jest.fn();
    const onAllRoundsComplete = jest.fn();

    const { result } = renderHook(() =>
      useRoundManager({
        initialRounds: mockRounds,
        onRoundChange,
        onAllRoundsComplete,
      })
    );

    await act(async () => {
      await result.current.startRound(1);
    });

    expect(onRoundChange).toHaveBeenCalled();

    await act(async () => {
      await result.current.completeRound(1);
      await result.current.advanceToNextRound();
      await result.current.completeRound(2);
    });

    expect(onAllRoundsComplete).toHaveBeenCalled();
  });
});

describe('useLastCallTriviaRounds', () => {
  it('should create Last Call Trivia rounds', () => {
    const { result } = renderHook(() =>
      useLastCallTriviaRounds(mockRound1Questions, mockRound2Questions)
    );

    expect(result.current.totalRounds).toBe(2);
    expect(result.current.getAvailablePointValues(1)).toEqual([1, 3, 5]);
    expect(result.current.getAvailablePointValues(2)).toEqual([2, 4, 6]);
  });

  it('should auto-start if configured', () => {
    const { result } = renderHook(() =>
      useLastCallTriviaRounds(mockRound1Questions, mockRound2Questions, {
        autoStart: true,
      })
    );

    expect(result.current.currentRoundNumber).toBe(1);
  });
});

describe('useCustomRounds', () => {
  it('should create custom rounds', () => {
    const { result } = renderHook(() =>
      useCustomRounds(mockRoundConfigurations)
    );

    expect(result.current.totalRounds).toBe(2);
    expect(result.current.allRounds[0].name).toBe('Round 1');
    expect(result.current.allRounds[1].name).toBe('Round 2');
  });

  it('should handle custom configurations', () => {
    const customConfigs = [
      {
        ...mockRoundConfigurations[0],
        name: 'Custom Round',
        availablePointValues: [10, 20, 30] as PointValue[],
      },
    ];

    const { result } = renderHook(() => useCustomRounds(customConfigs));

    expect(result.current.totalRounds).toBe(1);
    expect(result.current.allRounds[0].name).toBe('Custom Round');
    expect(result.current.getAvailablePointValues(1)).toEqual([10, 20, 30]);
  });
});
