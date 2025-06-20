import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionDisplay from '../components/game/QuestionDisplay';
import {
  ImageRenderer,
  AudioRenderer,
  VideoRenderer,
  TextRenderer,
} from '../components/game/MediaRenderer';
import {
  useQuestionDisplay,
  useQuestionSequence,
} from '../hooks/useQuestionDisplay';
import {
  Question,
  QuestionType,
  GameDifficulty,
  PointValue,
} from '../types/game';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Volume2: () => <div data-testid="volume-icon" />,
  VolumeX: () => <div data-testid="mute-icon" />,
  RotateCcw: () => <div data-testid="restart-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  XCircle: () => <div data-testid="x-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

// Mock HTML5 media elements
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 100,
  muted: false,
};

const mockVideo = {
  ...mockAudio,
  requestFullscreen: jest.fn(() => Promise.resolve()),
};

// Mock media element creation
Object.defineProperty(global, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn(() => mockAudio),
});

Object.defineProperty(global, 'HTMLVideoElement', {
  writable: true,
  value: jest.fn(() => mockVideo),
});

// Mock document.exitFullscreen
Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn(() => Promise.resolve()),
});

Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

// Mock data
const mockTextQuestion: Question = {
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
  tags: ['geography', 'capitals'],
};

const mockImageQuestion: Question = {
  ...mockTextQuestion,
  id: 'q2',
  text: 'What landmark is shown in this image?',
  mediaUrl: 'https://example.com/image.jpg',
};

const mockAudioQuestion: Question = {
  ...mockTextQuestion,
  id: 'q3',
  text: 'What song is playing?',
  type: 'multiple-choice' as QuestionType,
  mediaUrl: 'https://example.com/audio.mp3',
};

const mockVideoQuestion: Question = {
  ...mockTextQuestion,
  id: 'q4',
  text: 'What movie is this clip from?',
  mediaUrl: 'https://example.com/video.mp4',
};

const mockOpenEndedQuestion: Question = {
  id: 'q5',
  text: 'Explain the theory of relativity.',
  type: 'open-ended' as QuestionType,
  category: 'Physics',
  difficulty: 'hard' as GameDifficulty,
  points: 5 as PointValue,
  explanation: "Einstein's theory describes space and time.",
  timeLimit: 120,
};

describe('TextRenderer', () => {
  it('should render plain text correctly', () => {
    render(<TextRenderer text="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should handle multi-line text', () => {
    const multiLineText = 'Line 1\nLine 2\nLine 3';
    render(<TextRenderer text={multiLineText} />);

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TextRenderer text="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('ImageRenderer', () => {
  it('should render image with loading state', () => {
    render(<ImageRenderer url="https://example.com/image.jpg" />);
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByText('Loading image...')).toBeInTheDocument();
  });

  it('should handle image load success', async () => {
    const onLoad = jest.fn();
    render(
      <ImageRenderer url="https://example.com/image.jpg" onLoad={onLoad} />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should handle image load error', async () => {
    const onError = jest.fn();
    render(
      <ImageRenderer url="https://example.com/image.jpg" onError={onError} />
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to load image');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  it('should set correct alt text', () => {
    render(
      <ImageRenderer url="https://example.com/image.jpg" alt="Test image" />
    );
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });
});

describe('AudioRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render audio player with loading state', () => {
    render(<AudioRenderer url="https://example.com/audio.mp3" />);
    expect(screen.getByText('Loading audio...')).toBeInTheDocument();
  });

  it('should show controls after loading', async () => {
    render(<AudioRenderer url="https://example.com/audio.mp3" />);

    // Simulate audio load
    const audio = document.createElement('audio');
    fireEvent.loadedData(audio);

    await waitFor(() => {
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.getByTestId('restart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('volume-icon')).toBeInTheDocument();
    });
  });

  it('should handle play/pause toggle', async () => {
    render(<AudioRenderer url="https://example.com/audio.mp3" />);

    const playButton = screen.getByLabelText('Play');
    await userEvent.click(playButton);

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('should handle mute toggle', async () => {
    render(<AudioRenderer url="https://example.com/audio.mp3" />);

    const muteButton = screen.getByLabelText('Mute');
    await userEvent.click(muteButton);

    expect(mockAudio.muted).toBe(true);
  });

  it('should handle restart', async () => {
    render(<AudioRenderer url="https://example.com/audio.mp3" />);

    const restartButton = screen.getByLabelText('Restart');
    await userEvent.click(restartButton);

    expect(mockAudio.currentTime).toBe(0);
  });

  it('should handle audio error', async () => {
    const onError = jest.fn();
    render(
      <AudioRenderer url="https://example.com/audio.mp3" onError={onError} />
    );

    const audio = document.createElement('audio');
    fireEvent.error(audio);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to load audio');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });
});

describe('VideoRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render video player with loading state', () => {
    render(<VideoRenderer url="https://example.com/video.mp4" />);
    expect(screen.getByText('Loading video...')).toBeInTheDocument();
  });

  it('should show video element with controls', () => {
    render(
      <VideoRenderer url="https://example.com/video.mp4" controls={true} />
    );

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('controls');
  });

  it('should handle fullscreen toggle', async () => {
    render(
      <VideoRenderer url="https://example.com/video.mp4" controls={false} />
    );

    const video = document.querySelector('video');
    fireEvent.doubleClick(video!);

    expect(mockVideo.requestFullscreen).toHaveBeenCalled();
  });

  it('should handle video error', async () => {
    const onError = jest.fn();
    render(
      <VideoRenderer url="https://example.com/video.mp4" onError={onError} />
    );

    const video = document.querySelector('video');
    fireEvent.error(video!);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to load video');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });
});

describe('QuestionDisplay', () => {
  it('should render text question correctly', () => {
    render(<QuestionDisplay question={mockTextQuestion} />);

    expect(
      screen.getByText('What is the capital of France?')
    ).toBeInTheDocument();
    expect(screen.getByText('Geography')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('1 point')).toBeInTheDocument();
  });

  it('should render multiple choice options', () => {
    render(<QuestionDisplay question={mockTextQuestion} />);

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('should show correct answer when enabled', () => {
    render(
      <QuestionDisplay
        question={mockTextQuestion}
        showCorrectAnswer={true}
        userAnswer="London"
      />
    );

    expect(screen.getByTestId('check-icon')).toBeInTheDocument(); // Correct answer
    expect(screen.getByTestId('x-icon')).toBeInTheDocument(); // Wrong answer
  });

  it('should show explanation when enabled', () => {
    render(
      <QuestionDisplay question={mockTextQuestion} showExplanation={true} />
    );

    expect(screen.getByText('Explanation')).toBeInTheDocument();
    expect(
      screen.getByText('Paris is the capital of France.')
    ).toBeInTheDocument();
  });

  it('should display time remaining', () => {
    render(<QuestionDisplay question={mockTextQuestion} timeRemaining={15} />);

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('should highlight low time remaining', () => {
    render(<QuestionDisplay question={mockTextQuestion} timeRemaining={5} />);

    const timeElement = screen.getByText('5s');
    expect(timeElement).toHaveClass('text-red-600');
  });

  it('should render image question with media', () => {
    render(<QuestionDisplay question={mockImageQuestion} />);

    expect(
      screen.getByText('What landmark is shown in this image?')
    ).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('should render audio question with player', () => {
    render(<QuestionDisplay question={mockAudioQuestion} />);

    expect(screen.getByText('What song is playing?')).toBeInTheDocument();
    // Audio player should be rendered
  });

  it('should render video question with player', () => {
    render(<QuestionDisplay question={mockVideoQuestion} />);

    expect(
      screen.getByText('What movie is this clip from?')
    ).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('should handle open-ended questions without options', () => {
    render(<QuestionDisplay question={mockOpenEndedQuestion} />);

    expect(
      screen.getByText('Explain the theory of relativity.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Choose your answer:')).not.toBeInTheDocument();
  });

  it('should render question tags', () => {
    render(<QuestionDisplay question={mockTextQuestion} />);

    expect(screen.getByText('#geography')).toBeInTheDocument();
    expect(screen.getByText('#capitals')).toBeInTheDocument();
  });

  it('should handle media load events', () => {
    const onMediaLoad = jest.fn();
    render(
      <QuestionDisplay question={mockImageQuestion} onMediaLoad={onMediaLoad} />
    );

    const img = screen.getByRole('img');
    fireEvent.load(img);

    expect(onMediaLoad).toHaveBeenCalled();
  });

  it('should handle media error events', () => {
    const onMediaError = jest.fn();
    render(
      <QuestionDisplay
        question={mockImageQuestion}
        onMediaError={onMediaError}
      />
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(onMediaError).toHaveBeenCalledWith('Failed to load image');
  });

  it('should handle unsupported media types', () => {
    const unsupportedQuestion = {
      ...mockTextQuestion,
      mediaUrl: 'https://example.com/file.xyz',
    };

    render(<QuestionDisplay question={unsupportedQuestion} />);

    expect(screen.getByText('Unsupported media type')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
  });
});

describe('useQuestionDisplay', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useQuestionDisplay({ question: mockTextQuestion })
    );

    expect(result.current.isMediaLoading).toBe(false);
    expect(result.current.mediaError).toBeNull();
    expect(result.current.isMediaPlaying).toBe(false);
    expect(result.current.selectedAnswer).toBeNull();
  });

  it('should reset state when question changes', () => {
    const { result, rerender } = renderHook(
      ({ question }) => useQuestionDisplay({ question }),
      { initialProps: { question: mockTextQuestion } }
    );

    act(() => {
      result.current.selectAnswer('Paris');
    });

    expect(result.current.selectedAnswer).toBe('Paris');

    rerender({ question: mockImageQuestion });

    expect(result.current.selectedAnswer).toBeNull();
  });

  it('should handle answer selection', () => {
    const onAnswerSelected = jest.fn();
    const { result } = renderHook(() =>
      useQuestionDisplay({
        question: mockTextQuestion,
        onAnswerSelected,
      })
    );

    act(() => {
      result.current.selectAnswer('Paris');
    });

    expect(result.current.selectedAnswer).toBe('Paris');
    expect(onAnswerSelected).toHaveBeenCalledWith('Paris');
  });

  it('should clear answer', () => {
    const { result } = renderHook(() =>
      useQuestionDisplay({ question: mockTextQuestion })
    );

    act(() => {
      result.current.selectAnswer('Paris');
    });

    expect(result.current.selectedAnswer).toBe('Paris');

    act(() => {
      result.current.clearAnswer();
    });

    expect(result.current.selectedAnswer).toBeNull();
  });

  it('should handle media events', () => {
    const onMediaLoad = jest.fn();
    const onMediaError = jest.fn();
    const { result } = renderHook(() =>
      useQuestionDisplay({
        question: mockImageQuestion,
        onMediaLoad,
        onMediaError,
      })
    );

    act(() => {
      result.current.handleMediaLoad();
    });

    expect(result.current.isMediaLoading).toBe(false);
    expect(onMediaLoad).toHaveBeenCalled();

    act(() => {
      result.current.handleMediaError('Test error');
    });

    expect(result.current.mediaError).toBe('Test error');
    expect(onMediaError).toHaveBeenCalledWith('Test error');
  });

  it('should handle keyboard navigation', () => {
    const { result } = renderHook(() =>
      useQuestionDisplay({
        question: mockTextQuestion,
        enableKeyboardNavigation: true,
      })
    );

    const keyEvent = {
      key: '1',
      ctrlKey: false,
      metaKey: false,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(keyEvent);
    });

    expect(result.current.selectedAnswer).toBe('London'); // First option
    expect(keyEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle escape key to clear answer', () => {
    const { result } = renderHook(() =>
      useQuestionDisplay({ question: mockTextQuestion })
    );

    act(() => {
      result.current.selectAnswer('Paris');
    });

    const escapeEvent = {
      key: 'Escape',
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleKeyDown(escapeEvent);
    });

    expect(result.current.selectedAnswer).toBeNull();
    expect(escapeEvent.preventDefault).toHaveBeenCalled();
  });
});

describe('useQuestionSequence', () => {
  const mockQuestions = [
    mockTextQuestion,
    mockImageQuestion,
    mockAudioQuestion,
  ];

  it('should initialize with first question', () => {
    const { result } = renderHook(() =>
      useQuestionSequence({ questions: mockQuestions })
    );

    expect(result.current.currentQuestion).toBe(mockTextQuestion);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.isFirstQuestion).toBe(true);
    expect(result.current.isLastQuestion).toBe(false);
    expect(result.current.progress).toBe(33.33333333333333);
  });

  it('should navigate to next question', () => {
    const { result } = renderHook(() =>
      useQuestionSequence({ questions: mockQuestions })
    );

    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.currentQuestion).toBe(mockImageQuestion);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isFirstQuestion).toBe(false);
    expect(result.current.isLastQuestion).toBe(false);
  });

  it('should navigate to previous question', () => {
    const { result } = renderHook(() =>
      useQuestionSequence({
        questions: mockQuestions,
        currentQuestionIndex: 1,
      })
    );

    act(() => {
      result.current.previousQuestion();
    });

    expect(result.current.currentQuestion).toBe(mockTextQuestion);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should go to specific question', () => {
    const { result } = renderHook(() =>
      useQuestionSequence({ questions: mockQuestions })
    );

    act(() => {
      result.current.goToQuestion(2);
    });

    expect(result.current.currentQuestion).toBe(mockAudioQuestion);
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.isLastQuestion).toBe(true);
  });

  it('should handle sequence completion', () => {
    const onSequenceComplete = jest.fn();
    const { result } = renderHook(() =>
      useQuestionSequence({
        questions: mockQuestions,
        currentQuestionIndex: 2,
        onSequenceComplete,
      })
    );

    act(() => {
      result.current.nextQuestion();
    });

    expect(onSequenceComplete).toHaveBeenCalled();
    expect(result.current.currentIndex).toBe(2); // Should stay at last question
  });

  it('should reset sequence', () => {
    const { result } = renderHook(() =>
      useQuestionSequence({
        questions: mockQuestions,
        currentQuestionIndex: 2,
      })
    );

    act(() => {
      result.current.resetSequence();
    });

    expect(result.current.currentQuestion).toBe(mockTextQuestion);
    expect(result.current.currentIndex).toBe(0);
  });

  it('should trigger question change callback', () => {
    const onQuestionChange = jest.fn();
    const { result } = renderHook(() =>
      useQuestionSequence({
        questions: mockQuestions,
        onQuestionChange,
      })
    );

    act(() => {
      result.current.nextQuestion();
    });

    expect(onQuestionChange).toHaveBeenCalledWith(mockImageQuestion, 1);
  });
});
