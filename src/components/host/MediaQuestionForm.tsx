import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image, 
  Music, 
  Video, 
  FileText, 
  AlertCircle, 
  Check,
  X,
  Info
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '../ui/host';
import { Question, QuestionType } from '../../types/game';
import { cn } from '../../utils/cn';

interface MediaQuestionFormProps {
  onSave: (question: Partial<Question>) => Promise<void>;
  onCancel: () => void;
  initialQuestion?: Partial<Question>;
}

export const MediaQuestionForm: React.FC<MediaQuestionFormProps> = ({
  onSave,
  onCancel,
  initialQuestion
}) => {
  const [question, setQuestion] = useState<Partial<Question>>({
    text: '',
    type: 'text',
    category: '',
    difficulty: 'medium',
    correctAnswer: '',
    mediaUrl: '',
    mediaType: undefined,
    altText: '',
    transcript: '',
    captions: '',
    points: 3,
    timeLimit: 30,
    explanation: '',
    tags: [],
    ...initialQuestion
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAccessibilityHelp, setShowAccessibilityHelp] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!question.text?.trim()) {
      newErrors.text = 'Question text is required';
    }

    if (!question.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Correct answer is required';
    }

    if (!question.category?.trim()) {
      newErrors.category = 'Category is required';
    }

    // Media-specific validation
    if (question.mediaUrl) {
      if (question.mediaType === 'image' && !question.altText?.trim()) {
        newErrors.altText = 'Alternative text is required for image accessibility';
      }

      if ((question.mediaType === 'audio' || question.mediaType === 'video') && !question.transcript?.trim()) {
        newErrors.transcript = 'Transcript is required for audio/video accessibility';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(question);
    } catch (error) {
      console.error('Failed to save question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMediaTypeChange = (type: QuestionType) => {
    setQuestion(prev => ({
      ...prev,
      type,
      mediaType: type === 'image' ? 'image' : type === 'audio' ? 'audio' : type === 'video' ? 'video' : undefined
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real implementation, this would upload to storage
    // For now, we'll just set a placeholder URL
    const fileUrl = URL.createObjectURL(file);
    setQuestion(prev => ({
      ...prev,
      mediaUrl: fileUrl
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Create Media Question</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAccessibilityHelp(!showAccessibilityHelp)}
              className="text-electric-600"
            >
              <Info className="w-4 h-4 mr-2" />
              Accessibility Guidelines
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: 'text' as QuestionType, icon: FileText, label: 'Text Only' },
                { type: 'image' as QuestionType, icon: Image, label: 'Image' },
                { type: 'audio' as QuestionType, icon: Music, label: 'Audio' },
                { type: 'video' as QuestionType, icon: Video, label: 'Video' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMediaTypeChange(type)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                    question.type === type
                      ? 'border-electric-500 bg-electric-50 text-electric-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              id="question-text"
              value={question.text}
              onChange={(e) => setQuestion(prev => ({ ...prev, text: e.target.value }))}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500',
                errors.text ? 'border-red-500' : 'border-gray-300'
              )}
              rows={3}
              placeholder="Enter your question here..."
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text}</p>
            )}
          </div>

          {/* Media Upload */}
          {question.type !== 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload {question.type} File
              </label>
              <div className="mt-1 flex items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept={
                    question.type === 'image' ? 'image/*' :
                    question.type === 'audio' ? 'audio/*' :
                    question.type === 'video' ? 'video/*' : ''
                  }
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                {question.mediaUrl && (
                  <span className="ml-3 text-sm text-gray-600">
                    File uploaded
                    <Check className="inline w-4 h-4 ml-1 text-green-600" />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Accessibility Fields */}
          {question.type === 'image' && (
            <div>
              <label htmlFor="alt-text" className="block text-sm font-medium text-gray-700 mb-2">
                Alternative Text (for screen readers) *
              </label>
              <textarea
                id="alt-text"
                value={question.altText}
                onChange={(e) => setQuestion(prev => ({ ...prev, altText: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500',
                  errors.altText ? 'border-red-500' : 'border-gray-300'
                )}
                rows={2}
                placeholder="Describe the image for users who can't see it..."
              />
              {errors.altText && (
                <p className="mt-1 text-sm text-red-600">{errors.altText}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Describe what's important about the image for answering the question
              </p>
            </div>
          )}

          {(question.type === 'audio' || question.type === 'video') && (
            <>
              <div>
                <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
                  Transcript *
                </label>
                <textarea
                  id="transcript"
                  value={question.transcript}
                  onChange={(e) => setQuestion(prev => ({ ...prev, transcript: e.target.value }))}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500',
                    errors.transcript ? 'border-red-500' : 'border-gray-300'
                  )}
                  rows={4}
                  placeholder="Enter the full transcript of the audio/video content..."
                />
                {errors.transcript && (
                  <p className="mt-1 text-sm text-red-600">{errors.transcript}</p>
                )}
              </div>

              {question.type === 'video' && (
                <div>
                  <label htmlFor="captions" className="block text-sm font-medium text-gray-700 mb-2">
                    Captions File URL (optional)
                  </label>
                  <input
                    id="captions"
                    type="text"
                    value={question.captions}
                    onChange={(e) => setQuestion(prev => ({ ...prev, captions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                    placeholder="URL to .vtt caption file"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    WebVTT format recommended for captions
                  </p>
                </div>
              )}
            </>
          )}

          {/* Answer Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="correct-answer" className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <input
                id="correct-answer"
                type="text"
                value={question.correctAnswer}
                onChange={(e) => setQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500',
                  errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="Enter the correct answer"
              />
              {errors.correctAnswer && (
                <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                id="category"
                type="text"
                value={question.category}
                onChange={(e) => setQuestion(prev => ({ ...prev, category: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500',
                  errors.category ? 'border-red-500' : 'border-gray-300'
                )}
                placeholder="e.g., Geography, History, Science"
              />
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={question.difficulty}
                onChange={(e) => setQuestion(prev => ({ 
                  ...prev, 
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard' | 'expert' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <select
                id="points"
                value={question.points}
                onChange={(e) => setQuestion(prev => ({ 
                  ...prev, 
                  points: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              >
                {[1, 2, 3, 4, 5, 6].map(p => (
                  <option key={p} value={p}>{p} {p === 1 ? 'point' : 'points'}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="time-limit" className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (seconds)
              </label>
              <input
                id="time-limit"
                type="number"
                min="10"
                max="300"
                value={question.timeLimit}
                onChange={(e) => setQuestion(prev => ({ 
                  ...prev, 
                  timeLimit: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (optional)
            </label>
            <textarea
              id="explanation"
              value={question.explanation}
              onChange={(e) => setQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              rows={2}
              placeholder="Provide additional context or explanation for the answer..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Question
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Help Modal */}
      {showAccessibilityHelp && (
        <Modal
          isOpen={showAccessibilityHelp}
          onClose={() => setShowAccessibilityHelp(false)}
          title="Accessibility Guidelines for Media Questions"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Image Questions</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Provide descriptive alt text that conveys the essential information</li>
                <li>• Focus on details relevant to answering the question</li>
                <li>• Avoid phrases like "image of" or "picture of"</li>
                <li>• Include text visible in the image if it's important</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Audio Questions</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Include a complete transcript of all spoken content</li>
                <li>• Note significant sounds that affect the answer</li>
                <li>• Use timestamps for longer audio clips</li>
                <li>• Indicate speaker changes clearly</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Video Questions</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Provide both captions and transcripts when possible</li>
                <li>• Include descriptions of visual elements important to the question</li>
                <li>• Note on-screen text and graphics</li>
                <li>• Describe actions and context that affect the answer</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Following these guidelines ensures all players can participate equally,
                regardless of their abilities. This creates a more inclusive and enjoyable
                trivia experience for everyone.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
};