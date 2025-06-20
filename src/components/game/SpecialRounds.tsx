import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  Image,
  Zap,
  Trophy,
  Target,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  DollarSign,
  Lock,
  Unlock,
  Timer,
  Star,
  Award,
  Users,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  SpecialRoundType,
  WagerRound,
  WagerSubmission,
  WagerPhase,
  PictureRound,
  PictureQuestion,
  ImageLoadStatus,
  BonusRound,
  BonusParticipantStatus,
  LightningRound,
  LightningProgress,
  AudioRound,
  AudioQuestion,
  VideoRound,
  VideoQuestion,
  TeamChallengeRound,
} from '../../types/specialRounds';

// Wager Round Components
export interface WagerRoundDisplayProps {
  wagerRound: WagerRound;
  participantId: string;
  onWagerSubmit: (amount: number) => void;
  onWagerLock: () => void;
  className?: string;
}

export const WagerRoundDisplay: React.FC<WagerRoundDisplayProps> = ({
  wagerRound,
  participantId,
  onWagerSubmit,
  onWagerLock,
  className = '',
}) => {
  const [wagerAmount, setWagerAmount] = useState(
    wagerRound.settings.defaultWager || 0
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  const currentSubmission = wagerRound.wagerSubmissions.get(participantId);

  useEffect(() => {
    if (wagerRound.currentWagerDeadline) {
      const interval = setInterval(() => {
        const remaining = Math.max(
          0,
          wagerRound.currentWagerDeadline!.getTime() - Date.now()
        );
        setTimeRemaining(Math.ceil(remaining / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [wagerRound.currentWagerDeadline]);

  const handleWagerSubmit = () => {
    if (
      wagerAmount >= wagerRound.settings.minWager &&
      wagerAmount <= wagerRound.settings.maxWager
    ) {
      onWagerSubmit(wagerAmount);
    }
  };

  const getPhaseContent = () => {
    switch (wagerRound.wagerPhase) {
      case WagerPhase.INSTRUCTIONS:
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900">Wager Round</h2>
            <p className="text-gray-600">
              Choose how many points to wager on the next question. You can
              wager between {wagerRound.settings.minWager} and{' '}
              {wagerRound.settings.maxWager} points.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                ⚠️ If you answer correctly, you'll gain your wagered points. If
                you answer incorrectly, you'll lose your wagered points.
              </p>
            </div>
          </div>
        );

      case WagerPhase.WAGER_SUBMISSION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Place Your Wager
              </h2>
              <div className="flex items-center justify-center space-x-2 text-lg">
                <Timer className="w-5 h-5 text-orange-500" />
                <span className="font-mono font-bold text-orange-600">
                  {timeRemaining}s
                </span>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wager Amount
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min={wagerRound.settings.minWager}
                      max={wagerRound.settings.maxWager}
                      value={wagerAmount}
                      onChange={e => setWagerAmount(Number(e.target.value))}
                      disabled={currentSubmission?.isLocked}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center space-x-2 min-w-0">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {wagerAmount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {[
                    wagerRound.settings.minWager,
                    Math.round(wagerRound.settings.maxWager * 0.25),
                    Math.round(wagerRound.settings.maxWager * 0.5),
                    Math.round(wagerRound.settings.maxWager * 0.75),
                    wagerRound.settings.maxWager,
                  ].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setWagerAmount(preset)}
                      disabled={currentSubmission?.isLocked}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleWagerSubmit}
                    disabled={currentSubmission?.isLocked}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Submit Wager</span>
                  </button>

                  {currentSubmission && !currentSubmission.isLocked && (
                    <button
                      onClick={onWagerLock}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Lock</span>
                    </button>
                  )}
                </div>

                {currentSubmission && (
                  <div
                    className={`p-3 rounded-lg ${currentSubmission.isLocked ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}
                  >
                    <div className="flex items-center space-x-2">
                      {currentSubmission.isLocked ? (
                        <Lock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="font-medium">
                        Current wager: ${currentSubmission.wagerAmount}
                      </span>
                      <span
                        className={`text-sm ${currentSubmission.isLocked ? 'text-green-600' : 'text-yellow-600'}`}
                      >
                        ({currentSubmission.isLocked ? 'Locked' : 'Unlocked'})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Wager Round in Progress
            </h2>
            <p className="text-gray-600 mt-2">Phase: {wagerRound.wagerPhase}</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6 ${className}`}
    >
      {getPhaseContent()}
    </div>
  );
};

// Picture Round Components
export interface PictureRoundDisplayProps {
  pictureRound: PictureRound;
  currentQuestion: PictureQuestion;
  onImageLoad?: (questionId: string) => void;
  onImageError?: (questionId: string, error: string) => void;
  className?: string;
}

export const PictureRoundDisplay: React.FC<PictureRoundDisplayProps> = ({
  pictureRound,
  currentQuestion,
  onImageLoad,
  onImageError,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const loadingStatus =
    pictureRound.imageLoadingStatus.get(currentQuestion.id) ||
    ImageLoadStatus.PENDING;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(null);
    onImageLoad?.(currentQuestion.id);
  };

  const handleImageError = () => {
    const error = 'Failed to load image';
    setImageError(error);
    setImageLoaded(false);
    onImageError?.(currentQuestion.id, error);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={`bg-white border-2 border-blue-200 rounded-lg overflow-hidden ${className}`}
    >
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Picture Round</h3>
          </div>

          {pictureRound.settings.allowZoom && imageLoaded && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-blue-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetZoom}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-gray-50 min-h-96 flex items-center justify-center overflow-hidden">
        {loadingStatus === ImageLoadStatus.LOADING && (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading image...</p>
          </div>
        )}

        {loadingStatus === ImageLoadStatus.ERROR ||
          (imageError && (
            <div className="flex flex-col items-center space-y-3 text-red-600">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Image className="w-8 h-8" />
              </div>
              <p>Failed to load image</p>
              <p className="text-sm text-gray-500">{imageError}</p>
            </div>
          ))}

        {(loadingStatus === ImageLoadStatus.LOADED ||
          loadingStatus === ImageLoadStatus.PENDING) && (
          <img
            ref={imageRef}
            src={currentQuestion.imageUrl}
            alt={currentQuestion.imageAlt}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              cursor:
                pictureRound.settings.allowZoom && zoomLevel > 1
                  ? 'move'
                  : 'default',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            className="transition-transform duration-200"
            draggable={false}
          />
        )}
      </div>

      {currentQuestion.imageCaption && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-700 italic">
            {currentQuestion.imageCaption}
          </p>
        </div>
      )}
    </div>
  );
};

// Bonus Round Components
export interface BonusRoundDisplayProps {
  bonusRound: BonusRound;
  participantId: string;
  className?: string;
}

export const BonusRoundDisplay: React.FC<BonusRoundDisplayProps> = ({
  bonusRound,
  participantId,
  className = '',
}) => {
  const participantStatus = bonusRound.participantStatus.get(participantId);
  const bonusScore = bonusRound.bonusScores.get(participantId);

  if (!participantStatus || !bonusScore) {
    return null;
  }

  return (
    <div
      className={`bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">🏆</div>
        <h2 className="text-2xl font-bold text-purple-900">Bonus Round</h2>
        <p className="text-purple-700">
          Multiplier: {bonusRound.settings.bonusMultiplier}x • Streak Bonus:{' '}
          {bonusRound.settings.streakBonusPoints} pts
        </p>
      </div>

      {participantStatus.isEliminated ? (
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-4xl mb-2">😵</div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Eliminated</h3>
          <p className="text-red-700">
            You were eliminated at{' '}
            {participantStatus.eliminatedAt?.toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {participantStatus.consecutiveCorrect}
            </div>
            <div className="text-sm text-gray-500">Streak</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {bonusScore.streakBonus}
            </div>
            <div className="text-sm text-gray-500">Streak Bonus</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {bonusScore.timeBonus}
            </div>
            <div className="text-sm text-gray-500">Time Bonus</div>
          </div>

          <div className="bg-white rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-gold-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {bonusScore.finalScore}
            </div>
            <div className="text-sm text-gray-500">Total Score</div>
          </div>
        </div>
      )}

      {bonusRound.settings.streakBonus && (
        <div className="mt-4 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Streak Progress</span>
            <span className="text-sm text-gray-500">
              {participantStatus.consecutiveCorrect} /{' '}
              {bonusRound.settings.streakBonusThreshold}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (participantStatus.consecutiveCorrect / bonusRound.settings.streakBonusThreshold) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Lightning Round Components
export interface LightningRoundDisplayProps {
  lightningRound: LightningRound;
  participantId: string;
  onAnswerSubmit?: (answer: string) => void;
  className?: string;
}

export const LightningRoundDisplay: React.FC<LightningRoundDisplayProps> = ({
  lightningRound,
  participantId,
  onAnswerSubmit,
  className = '',
}) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const participantProgress =
    lightningRound.participantProgress.get(participantId);

  if (!participantProgress) {
    return null;
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAnswer.trim() && !participantProgress.isComplete) {
      onAnswerSubmit?.(currentAnswer.trim());
      setCurrentAnswer('');
    }
  };

  const progressPercentage =
    (participantProgress.questionsAnswered /
      lightningRound.settings.questionCount) *
    100;

  return (
    <div
      className={`bg-gradient-to-br from-yellow-50 to-red-50 border-2 border-yellow-300 rounded-lg p-6 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">⚡</div>
        <h2 className="text-2xl font-bold text-yellow-900">Lightning Round</h2>
        <div className="flex items-center justify-center space-x-4 mt-2">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="font-mono font-bold text-orange-600">
              {Math.ceil(participantProgress.timeRemaining)}s
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="w-4 h-4 text-green-500" />
            <span className="font-bold text-green-600">
              {participantProgress.correctAnswers}/
              {participantProgress.questionsAnswered}
            </span>
          </div>
        </div>
      </div>

      {participantProgress.isComplete ? (
        <div className="text-center bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-4xl mb-2">🎯</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Round Complete!
          </h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {participantProgress.correctAnswers}
              </div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {participantProgress.incorrectAnswers}
              </div>
              <div className="text-sm text-gray-500">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {participantProgress.currentScore}
              </div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {participantProgress.questionsAnswered} /{' '}
                {lightningRound.settings.questionCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <form
            onSubmit={handleAnswerSubmit}
            className="bg-white rounded-lg p-4"
          >
            <div className="flex space-x-3">
              <input
                type="text"
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={participantProgress.isComplete}
                autoFocus
              />
              <button
                type="submit"
                disabled={
                  !currentAnswer.trim() || participantProgress.isComplete
                }
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </form>

          {lightningRound.settings.showRunningScore && (
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {participantProgress.currentScore}
              </div>
              <div className="text-sm text-gray-500">Current Score</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Audio Round Components
export interface AudioRoundDisplayProps {
  audioRound: AudioRound;
  currentQuestion: AudioQuestion;
  onAudioPlay?: (questionId: string) => void;
  onAudioPause?: (questionId: string) => void;
  className?: string;
}

export const AudioRoundDisplay: React.FC<AudioRoundDisplayProps> = ({
  audioRound,
  currentQuestion,
  onAudioPlay,
  onAudioPause,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const settings = audioRound.settings;
  const canReplay = !settings.allowReplay || playCount < settings.maxReplays;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayCount(prev => prev + 1);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onAudioPause?.(currentQuestion.id);
    } else if (canReplay) {
      audio.play();
      setIsPlaying(true);
      onAudioPlay?.(currentQuestion.id);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`bg-white border-2 border-green-200 rounded-lg p-6 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">🎵</div>
        <h2 className="text-2xl font-bold text-green-900">Audio Round</h2>
        <p className="text-green-700">Listen carefully to the audio clip</p>
      </div>

      <audio
        ref={audioRef}
        src={currentQuestion.audioUrl}
        preload={settings.preloadAudio ? 'auto' : 'metadata'}
      />

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={togglePlayback}
            disabled={!canReplay && !isPlaying}
            className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
        </div>

        {settings.showPlaybackControls && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono text-gray-600">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{
                    width: duration
                      ? `${(currentTime / duration) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-sm font-mono text-gray-600">
                {formatTime(duration)}
              </span>
            </div>

            {settings.allowReplay && (
              <div className="text-center text-sm text-gray-600">
                Plays remaining: {Math.max(0, settings.maxReplays - playCount)}
              </div>
            )}
          </div>
        )}
      </div>

      {currentQuestion.audioTranscript && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Show Transcript (for accessibility)
          </summary>
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
            {currentQuestion.audioTranscript}
          </div>
        </details>
      )}
    </div>
  );
};

// Team Challenge Round Components
export interface TeamChallengeRoundDisplayProps {
  teamChallengeRound: TeamChallengeRound;
  participantId: string;
  teamId: string;
  isCaptain: boolean;
  onDiscussionMessage: (message: string) => void;
  onAnswerSubmit?: (answer: string) => void;
  className?: string;
}

export const TeamChallengeRoundDisplay: React.FC<
  TeamChallengeRoundDisplayProps
> = ({
  teamChallengeRound,
  participantId,
  teamId,
  isCaptain,
  onDiscussionMessage,
  onAnswerSubmit,
  className = '',
}) => {
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [teamAnswer, setTeamAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  const teamSubmission = teamChallengeRound.teamSubmissions.get(teamId);
  const settings = teamChallengeRound.settings;

  useEffect(() => {
    if (teamChallengeRound.discussionDeadline) {
      const interval = setInterval(() => {
        const remaining = Math.max(
          0,
          teamChallengeRound.discussionDeadline!.getTime() - Date.now()
        );
        setTimeRemaining(Math.ceil(remaining / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [teamChallengeRound.discussionDeadline]);

  const handleDiscussionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (discussionMessage.trim()) {
      onDiscussionMessage(discussionMessage.trim());
      setDiscussionMessage('');
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAnswer.trim() && (isCaptain || !settings.teamCaptainOnly)) {
      onAnswerSubmit?.(teamAnswer.trim());
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 ${className}`}
    >
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">👥</div>
        <h2 className="text-2xl font-bold text-blue-900">Team Challenge</h2>
        <p className="text-blue-700">
          Work together with your team to answer the question
        </p>
        {teamChallengeRound.discussionPhase && (
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Timer className="w-4 h-4 text-orange-500" />
            <span className="font-mono font-bold text-orange-600">
              {timeRemaining}s
            </span>
            <span className="text-sm text-gray-600">discussion time</span>
          </div>
        )}
      </div>

      {teamChallengeRound.discussionPhase &&
        settings.collaborativeAnswering && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Team Discussion</h3>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {teamSubmission?.discussionLog?.map((entry, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {entry.participantId.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{entry.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">
                  No discussion yet...
                </p>
              )}
            </div>

            <form onSubmit={handleDiscussionSubmit} className="flex space-x-3">
              <input
                type="text"
                value={discussionMessage}
                onChange={e => setDiscussionMessage(e.target.value)}
                placeholder="Share your thoughts with the team..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!discussionMessage.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

      {(!settings.teamCaptainOnly || isCaptain) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">
              {settings.teamCaptainOnly ? 'Captain Answer' : 'Team Answer'}
            </h3>
          </div>

          <form onSubmit={handleAnswerSubmit} className="space-y-3">
            <textarea
              value={teamAnswer}
              onChange={e => setTeamAnswer(e.target.value)}
              placeholder="Enter your team's answer..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!teamAnswer.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Award className="w-5 h-5" />
              <span>Submit Team Answer</span>
            </button>
          </form>

          {teamSubmission && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                Team Answer Submitted:
              </p>
              <p className="text-sm text-green-700 mt-1">
                {teamSubmission.answer}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Submitted by Captain at{' '}
                {teamSubmission.submittedAt.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}

      {settings.teamCaptainOnly && !isCaptain && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">
            Only the team captain can submit the final answer. Continue
            discussing with your team!
          </p>
        </div>
      )}
    </div>
  );
};
