import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus,
  AlertTriangle,
  Zap,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar, Modal } from '../ui/host';
import { cn } from '../../utils/cn';

interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  warningAt: number;
  urgentAt: number;
}

interface AdvancedTimerControlsProps {
  onTimeUp: () => void;
  onTimeUpdate?: (timeRemaining: number) => void;
  onTimerStateChange?: (isRunning: boolean) => void;
  defaultDuration?: number;
  soundEnabled?: boolean;
}

const timerPresets: TimerPreset[] = [
  { id: 'quick', name: 'Quick', duration: 30, warningAt: 10, urgentAt: 5 },
  { id: 'standard', name: 'Standard', duration: 60, warningAt: 20, urgentAt: 10 },
  { id: 'extended', name: 'Extended', duration: 90, warningAt: 30, urgentAt: 15 },
  { id: 'challenge', name: 'Challenge', duration: 120, warningAt: 40, urgentAt: 20 },
];

export const AdvancedTimerControls: React.FC<AdvancedTimerControlsProps> = ({
  onTimeUp,
  onTimeUpdate,
  onTimerStateChange,
  defaultDuration = 60,
  soundEnabled: initialSoundEnabled = true
}) => {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('standard');
  const [warningThreshold, setWarningThreshold] = useState(20);
  const [urgentThreshold, setUrgentThreshold] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [showSettings, setShowSettings] = useState(false);
  const [autoPauseOnZero, setAutoPauseOnZero] = useState(true);

  const timerState = 
    timeRemaining <= urgentThreshold ? 'urgent' :
    timeRemaining <= warningThreshold ? 'warning' :
    'normal';

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        onTimeUpdate?.(newTime);
        
        if (newTime === 0) {
          if (autoPauseOnZero) {
            setIsRunning(false);
          }
          onTimeUp();
          if (soundEnabled) {
            // Play time up sound
            playSound('timeup');
          }
        } else if (newTime === urgentThreshold && soundEnabled) {
          // Play urgent warning sound
          playSound('urgent');
        } else if (newTime === warningThreshold && soundEnabled) {
          // Play warning sound
          playSound('warning');
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onTimeUp, onTimeUpdate, warningThreshold, urgentThreshold, soundEnabled, autoPauseOnZero]);

  useEffect(() => {
    onTimerStateChange?.(isRunning);
  }, [isRunning, onTimerStateChange]);

  const playSound = (type: 'warning' | 'urgent' | 'timeup') => {
    // In a real implementation, you would play actual sound files
    console.log(`Playing ${type} sound`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePresetSelect = (preset: TimerPreset) => {
    setSelectedPreset(preset.id);
    setDuration(preset.duration);
    setTimeRemaining(preset.duration);
    setWarningThreshold(preset.warningAt);
    setUrgentThreshold(preset.urgentAt);
    setIsRunning(false);
  };

  const handlePlayPause = () => {
    if (timeRemaining === 0) {
      handleReset();
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setTimeRemaining(duration);
    setIsRunning(false);
  };

  const handleAddTime = (seconds: number) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
  };

  const handleCustomDuration = (value: number) => {
    const newDuration = Math.max(5, value);
    setDuration(newDuration);
    setTimeRemaining(newDuration);
    setIsRunning(false);
    setSelectedPreset('custom');
  };

  return (
    <>
      <Card variant="elevated" className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-electric-600" />
              Advanced Timer Controls
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                icon={soundEnabled ? Volume2 : VolumeX}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                icon={Settings}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Main Timer Display */}
          <div className="mb-6">
            <motion.div
              className={cn(
                'text-center p-8 rounded-xl transition-all duration-300',
                timerState === 'urgent' 
                  ? 'bg-energy-red text-white animate-pulse shadow-red-500/50' 
                  : timerState === 'warning'
                  ? 'bg-energy-yellow text-electric-900'
                  : 'bg-gradient-to-r from-electric-500 to-plasma-600 text-white'
              )}
              animate={timerState === 'urgent' ? { scale: [1, 1.02, 1] } : undefined}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="text-display-xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </div>
              {timerState !== 'normal' && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {timerState === 'urgent' ? 'Time Almost Up!' : 'Warning!'}
                  </span>
                </div>
              )}
            </motion.div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <ProgressBar
                value={timeRemaining}
                max={duration}
                variant={
                  timerState === 'urgent' ? 'danger' :
                  timerState === 'warning' ? 'warning' :
                  'gradient'
                }
                showPercentage
                animate
              />
            </div>
          </div>

          {/* Timer Presets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h4>
            <div className="grid grid-cols-4 gap-2">
              {timerPresets.map(preset => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  disabled={isRunning}
                >
                  {preset.name}
                  <span className="text-xs ml-1 opacity-75">({preset.duration}s)</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant={isRunning ? 'warning' : 'success'}
              size="lg"
              onClick={handlePlayPause}
              icon={isRunning ? Pause : Play}
              fullWidth
            >
              {isRunning ? 'Pause' : timeRemaining === 0 ? 'Restart' : 'Start'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleReset}
              icon={RotateCcw}
              disabled={timeRemaining === duration && !isRunning}
              fullWidth
            >
              Reset
            </Button>
          </div>

          {/* Quick Time Adjustments */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Adjustments</h4>
            <div className="flex gap-2 justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddTime(-10)}
                disabled={timeRemaining <= 10}
                icon={Minus}
              >
                10s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddTime(-5)}
                disabled={timeRemaining <= 5}
                icon={Minus}
              >
                5s
              </Button>
              <div className="px-4 py-2 bg-gray-100 rounded-lg font-mono font-semibold text-gray-700">
                {formatTime(timeRemaining)}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddTime(5)}
                icon={Plus}
              >
                5s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddTime(10)}
                icon={Plus}
              >
                10s
              </Button>
            </div>
          </div>

          {/* Custom Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => handleCustomDuration(parseInt(e.target.value) || 60)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
                min="5"
                step="5"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={() => handleCustomDuration(duration)}
                disabled={isRunning}
                fullWidth
                icon={Zap}
              >
                Set Custom Time
              </Button>
            </div>
          </div>

          {/* Timer States Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-around text-center">
              <div>
                <Badge variant="warning" size="sm">Warning</Badge>
                <p className="text-xs text-gray-600 mt-1">at {warningThreshold}s</p>
              </div>
              <div>
                <Badge variant="danger" size="sm">Urgent</Badge>
                <p className="text-xs text-gray-600 mt-1">at {urgentThreshold}s</p>
              </div>
              <div>
                <Badge variant="default" size="sm">Auto-pause</Badge>
                <p className="text-xs text-gray-600 mt-1">{autoPauseOnZero ? 'On' : 'Off'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Timer Settings"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Threshold (seconds)
            </label>
            <input
              type="number"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value) || 20)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
              min="5"
              max={duration - 5}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgent Threshold (seconds)
            </label>
            <input
              type="number"
              value={urgentThreshold}
              onChange={(e) => setUrgentThreshold(parseInt(e.target.value) || 10)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
              min="1"
              max={warningThreshold - 1}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Auto-pause when timer reaches zero
            </label>
            <button
              onClick={() => setAutoPauseOnZero(!autoPauseOnZero)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                autoPauseOnZero ? 'bg-electric-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  autoPauseOnZero ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Sound Effects
            </label>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                soundEnabled ? 'bg-electric-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
          
          <div className="pt-4">
            <Button
              variant="primary"
              onClick={() => setShowSettings(false)}
              fullWidth
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};