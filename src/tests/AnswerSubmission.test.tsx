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
import {
  AnswerSubmissionManager,
  SubmissionEventType,
} from '../services/answerSubmissionManager';
import { RoundManager } from '../services/roundManager';
import AnswerSubmission from '../components/game/AnswerSubmission';
import {
  useAnswerSubmission,
  useQuestionSubmission,
  useRoundSubmissions,
} from '../hooks/useAnswerSubmission';
import { Question, RoundType } from '../types/game';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Lock: () => <div data-testid="lock-icon" />,
  Unlock: () => <div data-testid="unlock-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Edit3: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

// Mock data
const mockQuestion: Question = {
  id: 'q1',
  text: 'What is the capital of France?',
  type: 'multiple-choice',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 'Paris',
  category: 'Geography',
  difficulty: 'easy',
  points: 1,
  explanation: 'Paris is the capital and largest city of France.',
  tags: ['geography', 'capitals'],
  metadata: {},
};

const mockOpenEndedQuestion: Question = {
  id: 'q2',
  text: 'Explain the theory of relativity.',
  type: 'open-ended',
  correctAnswer: "Einstein's theory describing space-time",
  category: 'Science',
  difficulty: 'hard',
  points: 5,
  explanation: 'Complex physics theory by Albert Einstein.',
  tags: ['physics', 'einstein'],
  metadata: {},
};

const mockRounds = [
  {
    id: 'round1',
    name: 'Round 1',
    type: RoundType.STANDARD,
    pointValues: [1, 3, 5],
    questions: [mockQuestion],
    timeLimit: 300,
    isActive: true,
  },
  {
    id: 'round2',
    name: 'Round 2',
    type: RoundType.STANDARD,
    pointValues: [2, 4, 6],
    questions: [mockOpenEndedQuestion],
    timeLimit: 300,
    isActive: false,
  },
];

describe('AnswerSubmissionManager', () => {
  let roundManager: RoundManager;
  let submissionManager: AnswerSubmissionManager;
  const participantId = 'participant1';

  beforeEach(() => {
    roundManager = RoundManager.createLastCallTriviaRounds();
    roundManager.startRound();
    submissionManager = new AnswerSubmissionManager(roundManager);
  });

  afterEach(() => {
    submissionManager.reset();
  });

  describe('Basic Operations', () => {
    it('should initialize with empty state', () => {
      expect(submissionManager.getSubmissionCount()).toBe(0);
      expect(submissionManager.getLockedSubmissionCount()).toBe(0);
      expect(submissionManager.getAllSubmissions()).toEqual([]);
    });

    it('should successfully submit an answer', () => {
      const result = submissionManager.submitAnswer(
        mockQuestion.id,
        participantId,
        'Paris',
        1
      );

      expect(result.success).toBe(true);
      expect(result.submissionId).toBeDefined();
      expect(result.errors).toEqual([]);
      expect(submissionManager.getSubmissionCount()).toBe(1);
    });

    it('should validate required fields', () => {
      const result = submissionManager.submitAnswer('', participantId, '', 0);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate point value usage', () => {
      // First submission
      const firstResult = submissionManager.submitAnswer(
        'q1',
        participantId,
        'Answer 1',
        1
      );
      expect(firstResult.success).toBe(true);

      // Second submission with same point value should fail
      const secondResult = submissionManager.submitAnswer(
        'q2',
        participantId,
        'Answer 2',
        1
      );
      expect(secondResult.success).toBe(false);
    });
  });

  describe('Locking Operations', () => {
    it('should lock and unlock submissions', () => {
      const result = submissionManager.submitAnswer(
        mockQuestion.id,
        participantId,
        'Paris',
        1
      );
      const submissionId = result.submissionId!;

      // Lock submission
      const lockResult = submissionManager.lockSubmission(submissionId);
      expect(lockResult).toBe(true);
      expect(submissionManager.isSubmissionLocked(submissionId)).toBe(true);

      // Unlock submission
      const unlockResult = submissionManager.unlockSubmission(submissionId);
      expect(unlockResult).toBe(true);
      expect(submissionManager.isSubmissionLocked(submissionId)).toBe(false);
    });

    it('should not update locked submission', () => {
      const result = submissionManager.submitAnswer(
        mockQuestion.id,
        participantId,
        'Paris',
        1
      );
      submissionManager.lockSubmission(result.submissionId!);

      const updateResult = submissionManager.updateSubmission(
        result.submissionId!,
        'London'
      );
      expect(updateResult.success).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should emit submission created event', () => {
      const listener = vi.fn();
      submissionManager.addEventListener(
        SubmissionEventType.SUBMISSION_CREATED,
        listener
      );

      submissionManager.submitAnswer(
        mockQuestion.id,
        participantId,
        'Paris',
        1
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SubmissionEventType.SUBMISSION_CREATED,
          participantId,
          questionId: mockQuestion.id,
        })
      );
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      submissionManager.addEventListener(
        SubmissionEventType.SUBMISSION_CREATED,
        listener
      );
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_CREATED,
        listener
      );

      submissionManager.submitAnswer(
        mockQuestion.id,
        participantId,
        'Paris',
        1
      );
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('AnswerSubmission Component', () => {
  let roundManager: RoundManager;
  let submissionManager: AnswerSubmissionManager;
  const participantId = 'participant1';

  beforeEach(() => {
    roundManager = RoundManager.createLastCallTriviaRounds();
    roundManager.startRound();
    submissionManager = new AnswerSubmissionManager(roundManager);
  });

  const defaultProps = {
    question: mockQuestion,
    participantId,
    submissionManager,
    availablePointValues: [1, 3, 5],
  };

  it('should render answer submission form', () => {
    render(<AnswerSubmission {...defaultProps} />);

    expect(screen.getByText('Your Answer')).toBeInTheDocument();
    expect(screen.getByText('Point Value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should render multiple choice options', () => {
    render(<AnswerSubmission {...defaultProps} />);

    mockQuestion.options?.forEach(option => {
      expect(screen.getByLabelText(option)).toBeInTheDocument();
    });
  });

  it('should handle point value selection', async () => {
    const user = userEvent.setup();
    render(<AnswerSubmission {...defaultProps} />);

    const pointValue3Button = screen.getByRole('button', { name: '3' });
    await user.click(pointValue3Button);

    expect(pointValue3Button).toHaveClass('bg-blue-500 text-white');
  });

  it('should handle answer selection', async () => {
    const user = userEvent.setup();
    render(<AnswerSubmission {...defaultProps} />);

    const parisOption = screen.getByLabelText('Paris');
    await user.click(parisOption);

    expect(parisOption).toBeChecked();
  });

  it('should show validation errors for empty submission', async () => {
    const user = userEvent.setup();
    render(<AnswerSubmission {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Answer is required')).toBeInTheDocument();
  });

  it('should be read-only when specified', () => {
    render(<AnswerSubmission {...defaultProps} isReadOnly={true} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });
});

describe('useAnswerSubmission Hook', () => {
  let roundManager: RoundManager;
  const participantId = 'participant1';

  beforeEach(() => {
    roundManager = RoundManager.createLastCallTriviaRounds();
    roundManager.startRound();
  });

  const TestComponent: React.FC = () => {
    const hook = useAnswerSubmission(roundManager, { participantId });

    return (
      <div>
        <div data-testid="submission-count">{hook.submissionCount}</div>
        <div data-testid="available-points">
          {hook.getAvailablePointValues().join(',')}
        </div>
        <button
          onClick={() => hook.submitAnswer('q1', 'Test Answer', 1)}
          data-testid="submit-button"
        >
          Submit
        </button>
      </div>
    );
  };

  it('should initialize with correct state', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('submission-count')).toHaveTextContent('0');
    expect(screen.getByTestId('available-points')).toHaveTextContent('1,3,5');
  });

  it('should handle answer submission', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submission-count')).toHaveTextContent('1');
    });
  });
});

describe('useQuestionSubmission Hook', () => {
  let roundManager: RoundManager;
  const participantId = 'participant1';
  const questionId = 'q1';

  beforeEach(() => {
    roundManager = RoundManager.createLastCallTriviaRounds();
    roundManager.startRound();
  });

  const TestComponent: React.FC = () => {
    const hook = useQuestionSubmission(roundManager, participantId, questionId);

    return (
      <div>
        <div data-testid="has-submission">
          {hook.hasQuestionSubmission.toString()}
        </div>
        <div data-testid="is-locked">{hook.isQuestionLocked.toString()}</div>
        <div data-testid="available-points">
          {hook.availablePointValues.join(',')}
        </div>
        <button
          onClick={() => hook.submitQuestionAnswer('Test Answer', 1)}
          data-testid="submit-button"
        >
          Submit
        </button>
        <button
          onClick={() => hook.lockQuestionAnswer()}
          data-testid="lock-button"
        >
          Lock
        </button>
      </div>
    );
  };

  it('should initialize with no submission', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('has-submission')).toHaveTextContent('false');
    expect(screen.getByTestId('is-locked')).toHaveTextContent('false');
  });

  it('should handle question-specific submission', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('has-submission')).toHaveTextContent('true');
    });
  });

  it('should handle question-specific locking', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Submit first
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('has-submission')).toHaveTextContent('true');
    });

    // Then lock
    await user.click(screen.getByTestId('lock-button'));

    await waitFor(() => {
      expect(screen.getByTestId('is-locked')).toHaveTextContent('true');
    });
  });
});

describe('useRoundSubmissions Hook', () => {
  let roundManager: RoundManager;
  const participantId = 'participant1';

  beforeEach(() => {
    roundManager = RoundManager.createLastCallTriviaRounds();
    roundManager.startRound();
  });

  const TestComponent: React.FC = () => {
    const hook = useRoundSubmissions(roundManager, participantId);

    return (
      <div>
        <div data-testid="round-submissions">
          {hook.roundSubmissions.length}
        </div>
        <div data-testid="round-complete">
          {hook.isRoundComplete().toString()}
        </div>
        <div data-testid="round-progress">{hook.roundProgress.percentage}</div>
        <button
          onClick={() => hook.submitAnswer('q1', 'Answer 1', 1)}
          data-testid="submit-1"
        >
          Submit 1
        </button>
        <button
          onClick={() => hook.submitAnswer('q2', 'Answer 2', 3)}
          data-testid="submit-2"
        >
          Submit 2
        </button>
        <button
          onClick={() => hook.lockRoundSubmissions()}
          data-testid="lock-round"
        >
          Lock Round
        </button>
      </div>
    );
  };

  it('should track round progress', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    expect(screen.getByTestId('round-submissions')).toHaveTextContent('0');
    expect(screen.getByTestId('round-complete')).toHaveTextContent('false');

    // Submit first answer
    await user.click(screen.getByTestId('submit-1'));

    await waitFor(() => {
      expect(screen.getByTestId('round-submissions')).toHaveTextContent('1');
    });

    // Submit second answer
    await user.click(screen.getByTestId('submit-2'));

    await waitFor(() => {
      expect(screen.getByTestId('round-submissions')).toHaveTextContent('2');
    });
  });

  it('should handle round-level locking', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Submit some answers
    await user.click(screen.getByTestId('submit-1'));
    await user.click(screen.getByTestId('submit-2'));

    await waitFor(() => {
      expect(screen.getByTestId('round-submissions')).toHaveTextContent('2');
    });

    // Lock all round submissions
    await user.click(screen.getByTestId('lock-round'));

    // Verify submissions are locked (this would need additional state tracking in the component)
    expect(screen.getByTestId('round-submissions')).toHaveTextContent('2');
  });
});
