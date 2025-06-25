import React, { useState } from 'react';
import QuestionDisplay from '../components/game/QuestionDisplay';
import { Question } from '../types/game';
import { AccessibilityHelpButton, AccessibilityHelpModal } from '../components/game/MediaAccessibilityInfo';

/**
 * Example component demonstrating how to use media questions with full accessibility support
 */
export const MediaQuestionExample: React.FC = () => {
  const [showAccessibilityHelp, setShowAccessibilityHelp] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Example media questions with accessibility features
  const mediaQuestions: Question[] = [
    {
      id: '1',
      text: 'What famous landmark is shown in this image?',
      type: 'image',
      category: 'Geography',
      difficulty: 'medium',
      correctAnswer: 'Eiffel Tower',
      mediaUrl: '/assets/images/eiffel-tower.jpg',
      mediaType: 'image',
      altText: 'A tall iron lattice tower on the Champ de Mars in Paris, France, with four legs converging to a point at the top',
      points: 3,
      timeLimit: 30,
      explanation: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It was constructed from 1887 to 1889 as the entrance to the 1889 World\'s Fair.',
      options: ['Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Tokyo Tower'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      text: 'Listen to this audio clip. Which instrument is being played?',
      type: 'audio',
      category: 'Music',
      difficulty: 'easy',
      correctAnswer: 'Piano',
      mediaUrl: '/assets/audio/piano-sample.mp3',
      mediaType: 'audio',
      transcript: 'A piano playing a C major scale, starting from middle C and ascending one octave. Each note is played clearly and distinctly, with a slight pause between notes.',
      points: 2,
      timeLimit: 45,
      explanation: 'The piano is a keyboard instrument that produces sound by striking strings with hammers. The distinctive timbre makes it easily recognizable.',
      options: ['Piano', 'Guitar', 'Violin', 'Flute'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      text: 'Watch this video clip. What scientific phenomenon is being demonstrated?',
      type: 'video',
      category: 'Science',
      difficulty: 'hard',
      correctAnswer: 'Bernoulli\'s Principle',
      mediaUrl: '/assets/video/bernoulli-demo.mp4',
      mediaType: 'video',
      transcript: 'A person is holding a hair dryer pointed upward. They place a ping pong ball in the stream of air, and the ball hovers in place without falling. When they tilt the hair dryer slightly to the side, the ball follows the air stream but remains suspended. The demonstrator explains that the fast-moving air creates lower pressure around the ball, keeping it suspended.',
      captions: '/assets/video/bernoulli-demo.vtt',
      points: 5,
      timeLimit: 60,
      explanation: 'Bernoulli\'s Principle states that as the speed of a fluid increases, its pressure decreases. The fast-moving air from the hair dryer creates a low-pressure zone that keeps the ball suspended.',
      options: ['Bernoulli\'s Principle', 'Newton\'s Third Law', 'Magnetic Levitation', 'Static Electricity'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const currentQuestion = mediaQuestions[currentQuestionIndex];

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev + 1) % mediaQuestions.length);
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev - 1 + mediaQuestions.length) % mediaQuestions.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Media Question Examples
          </h1>
          <p className="text-gray-600">
            Demonstrating image, audio, and video questions with full accessibility support
          </p>
        </div>

        {/* Accessibility Help Button */}
        <div className="mb-6 flex justify-end">
          <AccessibilityHelpButton onClick={() => setShowAccessibilityHelp(true)} />
        </div>

        {/* Question Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handlePreviousQuestion}
            className="px-4 py-2 bg-electric-100 text-electric-700 rounded-lg hover:bg-electric-200 transition-colors"
          >
            Previous Question
          </button>
          <span className="text-gray-600">
            Question {currentQuestionIndex + 1} of {mediaQuestions.length}
          </span>
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-electric-100 text-electric-700 rounded-lg hover:bg-electric-200 transition-colors"
          >
            Next Question
          </button>
        </div>

        {/* Question Display */}
        <QuestionDisplay
          question={currentQuestion}
          showCorrectAnswer={true}
          showExplanation={true}
          timeRemaining={currentQuestion.timeLimit}
          className="mb-8"
        />

        {/* Accessibility Features Showcase */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Accessibility Features in This Question
          </h2>
          <ul className="space-y-2 text-gray-600">
            {currentQuestion.type === 'image' && (
              <>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Alternative text provided for screen readers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Image can be zoomed without losing quality</span>
                </li>
              </>
            )}
            {currentQuestion.type === 'audio' && (
              <>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Full transcript available for deaf/hard of hearing users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Keyboard controls for playback (Space, arrows, M)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Visual feedback for audio playback state</span>
                </li>
              </>
            )}
            {currentQuestion.type === 'video' && (
              <>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Captions available for deaf/hard of hearing users</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Full transcript provided as alternative</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Keyboard and touch-friendly controls</span>
                </li>
              </>
            )}
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Clear focus indicators for keyboard navigation</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Responsive design for all screen sizes</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>High contrast support for better visibility</span>
            </li>
          </ul>
        </div>

        {/* Implementation Guide */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Implementation Guide
          </h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-1">For Image Questions:</h4>
              <code className="block bg-white p-2 rounded border border-gray-200">
                {`<Question 
  type="image"
  mediaUrl="/path/to/image.jpg"
  altText="Descriptive text for screen readers"
/>`}
              </code>
            </div>
            <div>
              <h4 className="font-medium mb-1">For Audio Questions:</h4>
              <code className="block bg-white p-2 rounded border border-gray-200">
                {`<Question 
  type="audio"
  mediaUrl="/path/to/audio.mp3"
  transcript="Full transcript of audio content"
/>`}
              </code>
            </div>
            <div>
              <h4 className="font-medium mb-1">For Video Questions:</h4>
              <code className="block bg-white p-2 rounded border border-gray-200">
                {`<Question 
  type="video"
  mediaUrl="/path/to/video.mp4"
  transcript="Full transcript"
  captions="/path/to/captions.vtt"
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Help Modal */}
      <AccessibilityHelpModal
        isOpen={showAccessibilityHelp}
        onClose={() => setShowAccessibilityHelp(false)}
      />
    </div>
  );
};