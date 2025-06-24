import React, { useState, useEffect, useCallback } from 'react';
import { Question, QuestionType } from '../../types/game';
import {
  ImageRenderer,
  AudioRenderer,
  VideoRenderer,
  TextRenderer,
} from './MediaRenderer';
import { Clock, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export interface QuestionDisplayProps {
  question: Question;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
  timeRemaining?: number;
  isAnswered?: boolean;
  userAnswer?: string;
  className?: string;
  onMediaLoad?: () => void;
  onMediaError?: (error: string) => void;
  onMediaPlay?: () => void;
  onMediaPause?: () => void;
  onMediaEnded?: () => void;
}

export interface QuestionDisplayState {
  isMediaLoading: boolean;
  mediaError: string | null;
  isMediaPlaying: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  showCorrectAnswer = false,
  showExplanation = false,
  timeRemaining,
  isAnswered = false,
  userAnswer,
  className = '',
  onMediaLoad,
  onMediaError,
  onMediaPlay,
  onMediaPause,
  onMediaEnded,
}) => {
  const [state, setState] = useState<QuestionDisplayState>({
    isMediaLoading: false,
    mediaError: null,
    isMediaPlaying: false,
  });

  // Reset state when question changes
  useEffect(() => {
    setState({
      isMediaLoading: question.mediaUrl ? true : false,
      mediaError: null,
      isMediaPlaying: false,
    });
  }, [question.id, question.mediaUrl]);

  const handleMediaLoad = useCallback(() => {
    setState(prev => ({ ...prev, isMediaLoading: false }));
    onMediaLoad?.();
  }, [onMediaLoad]);

  const handleMediaError = useCallback(
    (error: string) => {
      setState(prev => ({ ...prev, isMediaLoading: false, mediaError: error }));
      onMediaError?.(error);
    },
    [onMediaError]
  );

  const handleMediaPlay = useCallback(() => {
    setState(prev => ({ ...prev, isMediaPlaying: true }));
    onMediaPlay?.();
  }, [onMediaPlay]);

  const handleMediaPause = useCallback(() => {
    setState(prev => ({ ...prev, isMediaPlaying: false }));
    onMediaPause?.();
  }, [onMediaPause]);

  const handleMediaEnded = useCallback(() => {
    setState(prev => ({ ...prev, isMediaPlaying: false }));
    onMediaEnded?.();
  }, [onMediaEnded]);

  const getMediaType = (
    url: string
  ): 'image' | 'audio' | 'video' | 'unknown' => {
    const extension = url.split('.').pop()?.toLowerCase();

    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')
    ) {
      return 'image';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '')) {
      return 'audio';
    }
    if (['mp4', 'webm', 'ogv', 'avi', 'mov'].includes(extension || '')) {
      return 'video';
    }
    return 'unknown';
  };

  const renderMediaContent = () => {
    if (!question.mediaUrl) return null;

    const mediaType = getMediaType(question.mediaUrl);
    const mediaProps = {
      url: question.mediaUrl,
      className: 'w-full max-w-2xl mx-auto',
      onLoad: handleMediaLoad,
      onError: handleMediaError,
      onPlay: handleMediaPlay,
      onPause: handleMediaPause,
      onEnded: handleMediaEnded,
    };

    switch (mediaType) {
      case 'image':
        return (
          <ImageRenderer
            {...mediaProps}
            alt={`Question ${question.id} image`}
          />
        );

      case 'audio':
        return <AudioRenderer {...mediaProps} autoPlay={false} />;

      case 'video':
        return (
          <VideoRenderer {...mediaProps} autoPlay={false} controls={true} />
        );

      default:
        return (
          <div className="flex items-center justify-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            <span className="text-yellow-700">Unsupported media type</span>
          </div>
        );
    }
  };

  const renderQuestionOptions = () => {
    if (question.type !== 'multiple-choice' || !question.options) {
      return null;
    }

    return (
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Choose your answer:
        </h3>
        <div className="grid gap-2 sm:gap-3">
          {question.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            const isUserAnswer = userAnswer === option;
            const isCorrectAnswer =
              showCorrectAnswer && option === question.correctAnswer;
            const isWrongAnswer =
              showCorrectAnswer &&
              isUserAnswer &&
              option !== question.correctAnswer;

            let optionClasses =
              'flex items-center p-3 sm:p-4 border-2 rounded-game transition-all duration-200 touch-feedback min-h-[44px] ';

            if (isCorrectAnswer) {
              optionClasses += 'border-victory bg-green-50 text-green-800';
            } else if (isWrongAnswer) {
              optionClasses += 'border-energy-red bg-red-50 text-red-800';
            } else if (isUserAnswer && !showCorrectAnswer) {
              optionClasses += 'border-electric-500 bg-blue-50 text-blue-800';
            } else {
              optionClasses +=
                'border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50';
            }

            return (
              <div key={index} className={optionClasses}>
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-current flex items-center justify-center mr-3 sm:mr-4 font-semibold text-sm sm:text-base">
                    {optionLetter}
                  </div>
                  <span className="flex-1 text-left text-sm sm:text-base">{option}</span>
                  {showCorrectAnswer && (
                    <div className="flex-shrink-0 ml-3 sm:ml-4">
                      {isCorrectAnswer && (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-victory" />
                      )}
                      {isWrongAnswer && (
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-energy-red" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuestionMetadata = () => {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
        {question.category && (
          <span className="px-2 sm:px-3 py-1 bg-electric-100 text-electric-800 rounded-full">
            {question.category}
          </span>
        )}
        {question.difficulty && (
          <span
            className={`px-2 sm:px-3 py-1 rounded-full ${
              question.difficulty === 'easy'
                ? 'bg-victory/10 text-victory'
                : question.difficulty === 'medium'
                  ? 'bg-pending/10 text-pending'
                  : 'bg-defeat/10 text-defeat'
            }`}
          >
            {question.difficulty.charAt(0).toUpperCase() +
              question.difficulty.slice(1)}
          </span>
        )}
        {question.points && (
          <span className="px-2 sm:px-3 py-1 bg-plasma-100 text-plasma-800 rounded-full">
            {question.points} {question.points === 1 ? 'pt' : 'pts'}
          </span>
        )}
        {timeRemaining !== undefined && (
          <div className="flex items-center space-x-1 ml-auto">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span
              className={`font-semibold ${
                timeRemaining <= 10 ? 'text-energy-red animate-pulse' : ''
              }`}
            >
              {timeRemaining}s
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderExplanation = () => {
    if (!showExplanation || !question.explanation) {
      return null;
    }

    return (
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Explanation</h4>
            <TextRenderer
              text={question.explanation}
              className="text-blue-700"
              allowHTML={false}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionTags = () => {
    if (!question.tags || question.tags.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {question.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-card shadow-game p-4 sm:p-6 ${className}`}>
      {/* Question Metadata */}
      {renderQuestionMetadata()}

      {/* Question Text */}
      <div className="mb-4 sm:mb-6">
        <TextRenderer
          text={question.text}
          className="text-lg sm:text-xl font-medium text-gray-900 mb-3 sm:mb-4"
          allowHTML={false}
        />
      </div>

      {/* Media Content */}
      {question.mediaUrl && (
        <div className="mb-4 sm:mb-6">
          {renderMediaContent()}
          {state.mediaError && (
            <div className="mt-3 sm:mt-4 p-3 bg-red-50 border border-energy-red/20 rounded-game">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-energy-red mr-2 flex-shrink-0" />
                <span className="text-energy-red text-sm sm:text-base">{state.mediaError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Options */}
      {renderQuestionOptions()}

      {/* Explanation */}
      {renderExplanation()}

      {/* Question Tags */}
      {renderQuestionTags()}

      {/* Loading State for Media */}
      {state.isMediaLoading && (
        <div className="mt-3 sm:mt-4 text-center text-gray-600">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-electric-600 mr-2"></div>
            <span className="text-sm sm:text-base">Loading media content...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
