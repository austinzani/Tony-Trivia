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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Choose your answer:
        </h3>
        <div className="grid gap-3">
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
              'flex items-center p-4 border-2 rounded-lg transition-all duration-200 ';

            if (isCorrectAnswer) {
              optionClasses += 'border-green-500 bg-green-50 text-green-800';
            } else if (isWrongAnswer) {
              optionClasses += 'border-red-500 bg-red-50 text-red-800';
            } else if (isUserAnswer && !showCorrectAnswer) {
              optionClasses += 'border-blue-500 bg-blue-50 text-blue-800';
            } else {
              optionClasses +=
                'border-gray-200 bg-white text-gray-700 hover:border-gray-300';
            }

            return (
              <div key={index} className={optionClasses}>
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-4 font-semibold">
                    {optionLetter}
                  </div>
                  <span className="flex-1 text-left">{option}</span>
                  {showCorrectAnswer && (
                    <div className="flex-shrink-0 ml-4">
                      {isCorrectAnswer && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      {isWrongAnswer && (
                        <XCircle className="w-6 h-6 text-red-600" />
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
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
        {question.category && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {question.category}
          </span>
        )}
        {question.difficulty && (
          <span
            className={`px-3 py-1 rounded-full ${
              question.difficulty === 'easy'
                ? 'bg-green-100 text-green-800'
                : question.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {question.difficulty.charAt(0).toUpperCase() +
              question.difficulty.slice(1)}
          </span>
        )}
        {question.points && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            {question.points} {question.points === 1 ? 'point' : 'points'}
          </span>
        )}
        {timeRemaining !== undefined && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span
              className={
                timeRemaining <= 10 ? 'text-red-600 font-semibold' : ''
              }
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
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Question Metadata */}
      {renderQuestionMetadata()}

      {/* Question Text */}
      <div className="mb-6">
        <TextRenderer
          text={question.text}
          className="text-xl font-medium text-gray-900 mb-4"
          allowHTML={false}
        />
      </div>

      {/* Media Content */}
      {question.mediaUrl && (
        <div className="mb-6">
          {renderMediaContent()}
          {state.mediaError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{state.mediaError}</span>
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
        <div className="mt-4 text-center text-gray-600">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading media content...
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
