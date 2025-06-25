import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface MediaRendererProps {
  url: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  transcript?: string; // For audio/video accessibility
  captions?: string; // For video accessibility
  onLoad?: () => void;
  onError?: (error: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}

export interface VideoPlayerState extends AudioPlayerState {
  isFullscreen: boolean;
}

// Image Renderer Component
export const ImageRenderer: React.FC<MediaRendererProps> = ({
  url,
  alt = 'Question image',
  className = '',
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    const errorMessage = 'Failed to load image';
    setIsLoading(false);
    setError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading image...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <img
        src={url}
        alt={alt}
        className={`w-full h-auto rounded-lg shadow-md transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        role="img"
        aria-label={alt}
      />
    </div>
  );
};

// Audio Renderer Component
export const AudioRenderer: React.FC<MediaRendererProps> = ({
  url,
  className = '',
  autoPlay = false,
  transcript,
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: audio.duration || 0,
      }));
      onLoad?.();
    };

    const handleError = () => {
      const errorMessage = 'Failed to load audio';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    };

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime || 0,
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlay?.();
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEnded?.();
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onLoad, onError, onPlay, onPause, onEnded]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (state.isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setState(prev => ({ ...prev, isMuted: audio.muted }));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setState(prev => ({ ...prev, currentTime: 0 }));
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const audio = audioRef.current;
      if (!audio) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.isPlaying]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.error) {
    return (
      <div
        className={`flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700">{state.error}</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}
      role="region"
      aria-label="Audio player"
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        autoPlay={autoPlay}
        className="hidden"
        aria-label="Audio content"
      />

      {state.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading audio...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>

            <button
              onClick={restart}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              aria-label="Restart"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              aria-label={state.isMuted ? 'Unmute' : 'Mute'}
            >
              {state.isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <div className="text-sm text-gray-600">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={state.duration || 0}
              value={state.currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Audio progress"
              aria-valuemin="0"
              aria-valuemax={state.duration || 0}
              aria-valuenow={state.currentTime}
              aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(state.duration)}`}
            />
          </div>

          {/* Transcript for accessibility */}
          {transcript && (
            <details className="mt-4 p-3 bg-gray-50 rounded-lg">
              <summary className="font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                Audio Transcript
              </summary>
              <div className="mt-2 text-gray-600 whitespace-pre-wrap">{transcript}</div>
            </details>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="mt-3 text-xs text-gray-500">
            <span className="sr-only">Keyboard shortcuts: </span>
            <span aria-hidden="true">
              Keyboard: Space (play/pause) • ← → (seek) • M (mute)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Video Renderer Component
export const VideoRenderer: React.FC<MediaRendererProps> = ({
  url,
  className = '',
  autoPlay = false,
  controls = true,
  captions,
  transcript,
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    isLoading: true,
    error: null,
    isFullscreen: false,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: video.duration || 0,
      }));
      onLoad?.();
    };

    const handleError = () => {
      const errorMessage = 'Failed to load video';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    };

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime || 0,
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlay?.();
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEnded?.();
    };

    const handleFullscreenChange = () => {
      setState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onLoad, onError, onPlay, onPause, onEnded]);

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (state.isFullscreen) {
        await document.exitFullscreen();
      } else {
        await video.requestFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  if (state.error) {
    return (
      <div
        className={`flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
        <span className="text-red-700">{state.error}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
    >
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-white mr-2" />
          <span className="text-white">Loading video...</span>
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        className="w-full h-auto"
        controls={controls}
        autoPlay={autoPlay}
        preload="metadata"
        onDoubleClick={toggleFullscreen}
        aria-label="Video content"
      >
        {captions && (
          <track
            kind="captions"
            src={captions}
            srcLang="en"
            label="English captions"
            default
          />
        )}
      </video>

      {!controls && !state.isLoading && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={toggleFullscreen}
            className="bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75 transition-opacity"
            aria-label="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Transcript for accessibility */}
      {transcript && (
        <details className="mt-4 p-3 bg-gray-50 rounded-lg">
          <summary className="font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
            Video Transcript
          </summary>
          <div className="mt-2 text-gray-600 whitespace-pre-wrap">{transcript}</div>
        </details>
      )}
    </div>
  );
};

// Text Renderer Component
export const TextRenderer: React.FC<{
  text: string;
  className?: string;
  allowHTML?: boolean;
}> = ({ text, className = '', allowHTML = false }) => {
  if (allowHTML) {
    return (
      <div
        className={`prose prose-lg max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <div className={`text-lg leading-relaxed ${className}`}>
      {text.split('\n').map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      ))}
    </div>
  );
};
