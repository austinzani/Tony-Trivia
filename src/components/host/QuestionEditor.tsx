import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X, AlertCircle, Check } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '../ui/host';
import { cn } from '../../utils/cn';

export interface Question {
  id: string;
  text: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit: number;
}

interface QuestionEditorProps {
  question: Question;
  onSave: (updatedQuestion: Question) => Promise<void>;
  onCancel: () => void;
  isModal?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  isModal = false,
}) => {
  const [editedQuestion, setEditedQuestion] = useState<Question>(question);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const hasChanges = JSON.stringify(question) !== JSON.stringify(editedQuestion);

  const handleSave = async () => {
    if (!editedQuestion.text.trim() || !editedQuestion.answer.trim()) {
      setError('Question and answer cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedQuestion);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const EditorContent = (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text
        </label>
        <textarea
          value={editedQuestion.text}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors resize-none"
          rows={3}
          placeholder="Enter your question..."
        />
      </div>

      {/* Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer
        </label>
        <input
          type="text"
          value={editedQuestion.answer}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, answer: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
          placeholder="Enter the answer..."
        />
      </div>

      {/* Category and Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={editedQuestion.category}
            onChange={(e) => setEditedQuestion({ ...editedQuestion, category: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            placeholder="e.g., Science, History..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={editedQuestion.difficulty}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              difficulty: e.target.value as Question['difficulty'] 
            })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Points and Time Limit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Points
          </label>
          <input
            type="number"
            value={editedQuestion.points}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              points: Math.max(0, parseInt(e.target.value) || 0) 
            })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            min="0"
            step="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Limit (seconds)
          </label>
          <input
            type="number"
            value={editedQuestion.timeLimit}
            onChange={(e) => setEditedQuestion({ 
              ...editedQuestion, 
              timeLimit: Math.max(5, parseInt(e.target.value) || 30) 
            })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none transition-colors"
            min="5"
            step="5"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}

      {/* Success Confirmation */}
      {showConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          <Check className="w-5 h-5" />
          <span className="text-sm">Question saved successfully!</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={!hasChanges || isSaving}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Preview */}
      {hasChanges && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="space-y-2">
            <p className="text-gray-900">{editedQuestion.text}</p>
            <p className="text-sm text-gray-600">Answer: {editedQuestion.answer}</p>
            <div className="flex gap-2">
              <Badge variant="primary" size="sm">{editedQuestion.category}</Badge>
              <Badge 
                variant={
                  editedQuestion.difficulty === 'easy' ? 'success' : 
                  editedQuestion.difficulty === 'medium' ? 'warning' : 
                  'danger'
                } 
                size="sm"
              >
                {editedQuestion.difficulty}
              </Badge>
              <Badge variant="default" size="sm">{editedQuestion.points} pts</Badge>
              <Badge variant="default" size="sm">{editedQuestion.timeLimit}s</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return EditorContent;
  }

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-electric-600" />
          Edit Question
        </CardTitle>
      </CardHeader>
      <CardContent>
        {EditorContent}
      </CardContent>
    </Card>
  );
};

// Quick Edit Modal Component
interface QuickEditModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => Promise<void>;
}

export const QuickEditModal: React.FC<QuickEditModalProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!question) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Edit Question"
      size="lg"
    >
      <QuestionEditor
        question={question}
        onSave={async (updatedQuestion) => {
          await onSave(updatedQuestion);
          onClose();
        }}
        onCancel={onClose}
        isModal
      />
    </Modal>
  );
};