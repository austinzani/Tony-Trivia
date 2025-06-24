import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface TimerProps {
  initialTime: number; // in seconds
  onComplete?: () => void;
  onTimeUpdate?: (time: number) => void;
  autoStart?: boolean;
  showControls?: boolean;
  variant?: 'default' | 'compact' | 'large';
  urgentThreshold?: number; // seconds remaining to trigger urgent state
  className?: string;
}

const Timer: React.FC<TimerProps> = ({
  initialTime,
  onComplete,
  onTimeUpdate,
  autoStart = false,
  showControls = true,
  variant = 'default',
  urgentThreshold = 10,
  className,
}) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    setIsUrgent(time <= urgentThreshold && time > 0);
  }, [time, urgentThreshold]);

  useEffect(() => {
    if (!isRunning || time <= 0) return;

    const interval = setInterval(() => {
      setTime((prevTime) => {
        const newTime = Math.max(0, prevTime - 1);
        onTimeUpdate?.(newTime);
        
        if (newTime === 0) {
          setIsRunning(false);
          onComplete?.();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, time, onComplete, onTimeUpdate]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(initialTime);
    setIsRunning(false);
    setIsUrgent(false);
    onTimeUpdate?.(initialTime);
  };

  const variants = {
    default: {
      container: 'bg-energy-yellow text-electric-900 px-6 py-3 rounded-game shadow-yellow',
      time: 'text-display-md',
      controls: 'flex gap-2 mt-3',
    },
    compact: {
      container: 'bg-electric-100 text-electric-700 px-4 py-2 rounded-lg',
      time: 'text-lg',
      controls: 'flex gap-1 ml-3',
    },
    large: {
      container: 'bg-gradient-to-r from-electric-500 to-plasma-600 text-white px-8 py-6 rounded-xl shadow-electric-lg',
      time: 'text-display-xl',
      controls: 'flex gap-3 mt-4 justify-center',
    },
  };

  const urgentStyles = isUrgent
    ? 'bg-energy-red text-white animate-pulse shadow-red-500/50'
    : '';

  return (
    <motion.div
      className={cn(
        'font-bold text-center font-mono inline-flex items-center',
        variants[variant].container,
        urgentStyles,
        className
      )}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <Clock className={cn('mr-2', variant === 'large' ? 'w-8 h-8' : 'w-5 h-5')} />
      <span className={variants[variant].time}>{formatTime(time)}</span>
      
      {showControls && (
        <div className={variants[variant].controls}>
          <button
            onClick={handlePlayPause}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? (
              <Pause className={variant === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />
            ) : (
              <Play className={variant === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw className={variant === 'large' ? 'w-6 h-6' : 'w-4 h-4'} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Timer;