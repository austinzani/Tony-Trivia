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
import {
  GameTimer,
  TimerPhase,
  TimerEventType,
  TimerConfiguration,
} from '../services/gameTimer';
import TimerDisplay from '../components/game/TimerDisplay';
import {
  useTimer,
  useQuestionTimer,
  useRoundTimer,
  useGameTimer,
  useMultipleTimers,
} from '../hooks/useTimer';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Square: () => <div data-testid="stop-icon" />,
  RotateCcw: () => <div data-testid="reset-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock Audio constructor
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  volume: 0.7,
  preload: 'auto',
  src: '',
};

Object.defineProperty(global, 'Audio', {
  writable: true,
  value: jest.fn(() => mockAudio),
});

// Helper function to advance time
const advanceTime = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

describe('GameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const timer = new GameTimer({ duration: 60 });
      const state = timer.getState();

      expect(state.timeRemaining).toBe(60);
      expect(state.totalDuration).toBe(60);
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isExpired).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.phase).toBe(TimerPhase.NORMAL);
    });

    it('should initialize with custom configuration', () => {
      const config: TimerConfiguration = {
        duration: 30,
        warningThreshold: 15,
        criticalThreshold: 5,
        autoStart: false,
        precision: 500,
      };

      const timer = new GameTimer(config);
      const timerConfig = timer.getConfiguration();

      expect(timerConfig.duration).toBe(30);
      expect(timerConfig.warningThreshold).toBe(15);
      expect(timerConfig.criticalThreshold).toBe(5);
      expect(timerConfig.autoStart).toBe(false);
      expect(timerConfig.precision).toBe(500);
    });

    it('should auto-start when configured', () => {
      const timer = new GameTimer({ duration: 60, autoStart: true });
      expect(timer.isRunning()).toBe(true);
    });
  });

  describe('Timer Controls', () => {
    let timer: GameTimer;

    beforeEach(() => {
      timer = new GameTimer({ duration: 60, precision: 100 });
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should start timer correctly', () => {
      timer.start();
      expect(timer.isRunning()).toBe(true);
      expect(timer.isPaused()).toBe(false);
    });

    it('should pause and resume timer', () => {
      timer.start();
      timer.pause();

      expect(timer.isRunning()).toBe(true);
      expect(timer.isPaused()).toBe(true);

      timer.resume();
      expect(timer.isPaused()).toBe(false);
    });

    it('should stop timer', () => {
      timer.start();
      timer.stop();

      expect(timer.isRunning()).toBe(false);
      expect(timer.isPaused()).toBe(false);
    });

    it('should reset timer', () => {
      timer.start();
      advanceTime(5000); // 5 seconds
      timer.reset();

      const state = timer.getState();
      expect(state.timeRemaining).toBe(60);
      expect(state.isRunning).toBe(false);
      expect(state.progress).toBe(0);
    });

    it('should reset timer with new duration', () => {
      timer.reset(120);
      expect(timer.getState().timeRemaining).toBe(120);
      expect(timer.getState().totalDuration).toBe(120);
    });
  });

  describe('Timer Countdown', () => {
    let timer: GameTimer;

    beforeEach(() => {
      timer = new GameTimer({ duration: 10, precision: 100 });
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should countdown correctly', () => {
      timer.start();

      // After 1 second
      advanceTime(1000);
      expect(timer.getTimeRemaining()).toBeCloseTo(9, 1);

      // After 5 seconds total
      advanceTime(4000);
      expect(timer.getTimeRemaining()).toBeCloseTo(5, 1);
    });

    it('should handle expiration', () => {
      timer.start();

      // Run timer to completion
      advanceTime(10100);

      expect(timer.isExpired()).toBe(true);
      expect(timer.isRunning()).toBe(false);
      expect(timer.getTimeRemaining()).toBe(0);
      expect(timer.getProgress()).toBe(100);
    });

    it('should maintain accuracy during pause/resume', () => {
      timer.start();

      // Run for 3 seconds
      advanceTime(3000);
      timer.pause();

      // Pause for 2 seconds
      advanceTime(2000);
      timer.resume();

      // Run for 2 more seconds (5 total)
      advanceTime(2000);

      expect(timer.getTimeRemaining()).toBeCloseTo(5, 1);
    });
  });

  describe('Timer Phases', () => {
    let timer: GameTimer;

    beforeEach(() => {
      timer = new GameTimer({
        duration: 20,
        warningThreshold: 10,
        criticalThreshold: 5,
        precision: 100,
      });
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should start in normal phase', () => {
      expect(timer.getPhase()).toBe(TimerPhase.NORMAL);
    });

    it('should transition to warning phase', () => {
      timer.start();
      advanceTime(11000); // 11 seconds elapsed, 9 remaining
      expect(timer.getPhase()).toBe(TimerPhase.WARNING);
    });

    it('should transition to critical phase', () => {
      timer.start();
      advanceTime(16000); // 16 seconds elapsed, 4 remaining
      expect(timer.getPhase()).toBe(TimerPhase.CRITICAL);
    });

    it('should transition to expired phase', () => {
      timer.start();
      advanceTime(20100); // Timer expired
      expect(timer.getPhase()).toBe(TimerPhase.EXPIRED);
    });
  });

  describe('Event System', () => {
    let timer: GameTimer;
    let eventHandler: jest.Mock;

    beforeEach(() => {
      timer = new GameTimer({ duration: 10, precision: 100 });
      eventHandler = jest.fn();
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should emit start event', () => {
      timer.addEventListener(TimerEventType.STARTED, eventHandler);
      timer.start();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: TimerEventType.STARTED })
      );
    });

    it('should emit tick events', () => {
      timer.addEventListener(TimerEventType.TICK, eventHandler);
      timer.start();

      advanceTime(100);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: TimerEventType.TICK })
      );
    });

    it('should emit warning event', () => {
      const warningTimer = new GameTimer({
        duration: 10,
        warningThreshold: 5,
        precision: 100,
      });
      warningTimer.addEventListener(TimerEventType.WARNING, eventHandler);

      warningTimer.start();
      advanceTime(6000); // 4 seconds remaining, should trigger warning

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: TimerEventType.WARNING })
      );

      warningTimer.destroy();
    });

    it('should emit expired event', () => {
      timer.addEventListener(TimerEventType.EXPIRED, eventHandler);
      timer.start();

      advanceTime(10100);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: TimerEventType.EXPIRED })
      );
    });

    it('should remove event listeners', () => {
      timer.addEventListener(TimerEventType.STARTED, eventHandler);
      timer.removeEventListener(TimerEventType.STARTED, eventHandler);

      timer.start();
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });

  describe('Time Manipulation', () => {
    let timer: GameTimer;

    beforeEach(() => {
      timer = new GameTimer({ duration: 60 });
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should add time correctly', () => {
      timer.addTime(30);
      expect(timer.getTimeRemaining()).toBe(90);
      expect(timer.getState().totalDuration).toBe(90);
    });

    it('should subtract time correctly', () => {
      timer.subtractTime(10);
      expect(timer.getTimeRemaining()).toBe(50);
    });

    it('should not go below zero when subtracting', () => {
      timer.subtractTime(100);
      expect(timer.getTimeRemaining()).toBe(0);
      expect(timer.isExpired()).toBe(true);
    });

    it('should not manipulate expired timer', () => {
      timer.start();
      advanceTime(60100); // Expire timer

      timer.addTime(30);
      expect(timer.getTimeRemaining()).toBe(0);
    });
  });

  describe('Time Formatting', () => {
    let timer: GameTimer;

    beforeEach(() => {
      timer = new GameTimer({ duration: 125 }); // 2:05
    });

    afterEach(() => {
      timer.destroy();
    });

    it('should format time correctly', () => {
      expect(timer.formatTime()).toBe('2:05');
    });

    it('should format time with milliseconds', () => {
      timer.start();
      advanceTime(100);
      const formatted = timer.formatTime(true);
      expect(formatted).toMatch(/\d:\d{2}\.\d/);
    });

    it('should handle zero time', () => {
      timer.subtractTime(125);
      expect(timer.formatTime()).toBe('0:00');
    });
  });

  describe('Factory Methods', () => {
    afterEach(() => {
      // Clean up any timers created by factory methods
      jest.clearAllTimers();
    });

    it('should create question timer with appropriate settings', () => {
      const timer = GameTimer.createQuestionTimer(30);
      const config = timer.getConfiguration();

      expect(config.duration).toBe(30);
      expect(config.warningThreshold).toBe(9); // 30 * 0.3
      expect(config.criticalThreshold).toBe(4.5); // 30 * 0.15
      expect(config.precision).toBe(100);

      timer.destroy();
    });

    it('should create round timer with appropriate settings', () => {
      const timer = GameTimer.createRoundTimer(300);
      const config = timer.getConfiguration();

      expect(config.duration).toBe(300);
      expect(config.warningThreshold).toBe(30);
      expect(config.precision).toBe(1000);

      timer.destroy();
    });

    it('should create game timer with appropriate settings', () => {
      const timer = GameTimer.createGameTimer(3600);
      const config = timer.getConfiguration();

      expect(config.duration).toBe(3600);
      expect(config.enableSound).toBe(false);
      expect(config.precision).toBe(5000);

      timer.destroy();
    });
  });
});

describe('TimerDisplay Component', () => {
  let timer: GameTimer;

  beforeEach(() => {
    jest.useFakeTimers();
    timer = new GameTimer({ duration: 60 });
  });

  afterEach(() => {
    timer.destroy();
    jest.useRealTimers();
  });

  it('should render minimal variant correctly', () => {
    render(<TimerDisplay timer={timer} variant="minimal" />);

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('should render standard variant with progress bar', () => {
    render(
      <TimerDisplay timer={timer} variant="standard" showProgress={true} />
    );

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    // Progress bar should be present but at 0%
    const progressBar = document.querySelector('[style*="width: 0%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should render detailed variant with all features', () => {
    render(
      <TimerDisplay timer={timer} variant="detailed" showControls={true} />
    );

    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('0% elapsed')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('should show controls when enabled', () => {
    render(<TimerDisplay timer={timer} showControls={true} />);

    expect(screen.getByLabelText('Start timer')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset timer')).toBeInTheDocument();
  });

  it('should update display when timer changes', async () => {
    render(<TimerDisplay timer={timer} />);

    act(() => {
      timer.start();
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:59')).toBeInTheDocument();
    });
  });

  it('should show critical phase styling', async () => {
    const criticalTimer = new GameTimer({
      duration: 10,
      criticalThreshold: 8,
    });

    render(<TimerDisplay timer={criticalTimer} />);

    act(() => {
      criticalTimer.start();
      jest.advanceTimersByTime(3000); // 7 seconds remaining
    });

    await waitFor(() => {
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    criticalTimer.destroy();
  });

  it('should handle control button clicks', async () => {
    render(<TimerDisplay timer={timer} showControls={true} />);

    const startButton = screen.getByLabelText('Start timer');
    await userEvent.click(startButton);

    expect(timer.isRunning()).toBe(true);
  });

  it('should call event callbacks', async () => {
    const onExpired = jest.fn();
    const onWarning = jest.fn();

    const testTimer = new GameTimer({
      duration: 5,
      warningThreshold: 3,
      precision: 100,
    });

    render(
      <TimerDisplay
        timer={testTimer}
        onExpired={onExpired}
        onWarning={onWarning}
      />
    );

    act(() => {
      testTimer.start();
      jest.advanceTimersByTime(3000); // Trigger warning
    });

    await waitFor(() => {
      expect(onWarning).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(2100); // Trigger expiration
    });

    await waitFor(() => {
      expect(onExpired).toHaveBeenCalled();
    });

    testTimer.destroy();
  });
});

describe('useTimer Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useTimer(60));

    expect(result.current.timeRemaining).toBe(60);
    expect(result.current.formattedTime).toBe('1:00');
    expect(result.current.progress).toBe(0);
    expect(result.current.phase).toBe(TimerPhase.NORMAL);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('should provide control functions', () => {
    const { result } = renderHook(() => useTimer(60));

    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.resume).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.addTime).toBe('function');
    expect(typeof result.current.subtractTime).toBe('function');
  });

  it('should update state when timer runs', () => {
    const { result } = renderHook(() => useTimer(10));

    act(() => {
      result.current.start();
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBeCloseTo(9, 1);
    expect(result.current.isRunning).toBe(true);
  });

  it('should call event callbacks', () => {
    const onExpired = jest.fn();
    const onWarning = jest.fn();

    const { result } = renderHook(() =>
      useTimer(5, {
        warningThreshold: 3,
        onExpired,
        onWarning,
      })
    );

    act(() => {
      result.current.start();
      jest.advanceTimersByTime(3000); // Trigger warning
    });

    expect(onWarning).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2100); // Trigger expiration
    });

    expect(onExpired).toHaveBeenCalled();
  });

  it('should handle sound effects', () => {
    const { result } = renderHook(() =>
      useTimer(10, {
        enableSoundEffects: true,
        criticalThreshold: 8,
      })
    );

    act(() => {
      result.current.start();
      jest.advanceTimersByTime(3000); // Trigger critical phase
    });

    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useTimer(60));

    const timer = result.current.timer;
    const destroySpy = jest.spyOn(timer, 'destroy');

    unmount();

    expect(destroySpy).toHaveBeenCalled();
  });
});

describe('Specialized Timer Hooks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create question timer with appropriate settings', () => {
    const { result } = renderHook(() => useQuestionTimer(30));

    const config = result.current.timer.getConfiguration();
    expect(config.duration).toBe(30);
    expect(config.precision).toBe(100);
    expect(config.enableSound).toBe(true);
  });

  it('should create round timer with appropriate settings', () => {
    const { result } = renderHook(() => useRoundTimer(300));

    const config = result.current.timer.getConfiguration();
    expect(config.duration).toBe(300);
    expect(config.precision).toBe(1000);
  });

  it('should create game timer with appropriate settings', () => {
    const { result } = renderHook(() => useGameTimer(3600));

    const config = result.current.timer.getConfiguration();
    expect(config.duration).toBe(3600);
    expect(config.enableSound).toBe(false);
    expect(config.precision).toBe(5000);
  });
});

describe('useMultipleTimers Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should manage multiple timers', () => {
    const { result } = renderHook(() =>
      useMultipleTimers({
        timers: {
          question: { duration: 30 },
          round: { duration: 300 },
          game: { duration: 3600 },
        },
      })
    );

    expect(Object.keys(result.current.timers)).toHaveLength(3);
    expect(result.current.timers.question.timeRemaining).toBe(30);
    expect(result.current.timers.round.timeRemaining).toBe(300);
    expect(result.current.timers.game.timeRemaining).toBe(3600);
  });

  it('should provide control functions for all timers', () => {
    const { result } = renderHook(() =>
      useMultipleTimers({
        timers: {
          timer1: { duration: 30 },
          timer2: { duration: 60 },
        },
      })
    );

    act(() => {
      result.current.startAll();
    });

    expect(result.current.timers.timer1.isRunning).toBe(true);
    expect(result.current.timers.timer2.isRunning).toBe(true);
    expect(result.current.anyRunning).toBe(true);
  });

  it('should handle timer expiration callbacks', () => {
    const onAnyExpired = jest.fn();
    const onAllExpired = jest.fn();

    const { result } = renderHook(() =>
      useMultipleTimers({
        timers: {
          timer1: { duration: 2 },
          timer2: { duration: 3 },
        },
        onAnyExpired,
        onAllExpired,
      })
    );

    act(() => {
      result.current.startAll();
      jest.advanceTimersByTime(2100); // Expire first timer
    });

    expect(onAnyExpired).toHaveBeenCalledWith('timer1');

    act(() => {
      jest.advanceTimersByTime(1000); // Expire second timer
    });

    expect(onAllExpired).toHaveBeenCalled();
    expect(result.current.allExpired).toBe(true);
  });

  it('should track active and expired timers', () => {
    const { result } = renderHook(() =>
      useMultipleTimers({
        timers: {
          timer1: { duration: 5 },
          timer2: { duration: 10 },
        },
      })
    );

    act(() => {
      result.current.startAll();
    });

    expect(result.current.getActiveTimers()).toEqual(['timer1', 'timer2']);

    act(() => {
      jest.advanceTimersByTime(5100); // Expire first timer
    });

    expect(result.current.getActiveTimers()).toEqual(['timer2']);
    expect(result.current.getExpiredTimers()).toEqual(['timer1']);
  });
});
