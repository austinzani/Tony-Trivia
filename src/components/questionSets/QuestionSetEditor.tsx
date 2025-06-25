import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Download,
  Settings,
  Tag as TagIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { 
  QuestionSet, 
  CustomQuestion, 
  Tag, 
  CreateQuestionSetData, 
  UpdateQuestionSetData,
  CreateCustomQuestionData,
  UpdateCustomQuestionData,
  QuestionType,
  QuestionDifficulty
} from '../../types/questionSets';
import { QuestionSetService } from '../../services/questionSetService';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/host/Card';
import Button from '../ui/host/Button';
import Badge from '../ui/host/Badge';
import Modal from '../ui/host/Modal';
import { cn } from '../../utils/cn';

interface QuestionSetEditorProps {
  questionSet?: QuestionSet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionSet: QuestionSet) => void;
  className?: string;
}

interface QuestionFormData {
  text: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  time_limit: number;
  difficulty: QuestionDifficulty;
  category: string;
}

const defaultQuestionForm: QuestionFormData = {
  text: '',
  type: 'multiple_choice',
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
  points: 1,
  time_limit: 30,
  difficulty: 'medium',
  category: ''
};

export const QuestionSetEditor: React.FC<QuestionSetEditorProps> = ({
  questionSet,
  isOpen,
  onClose,
  onSave,
  className
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [questions, setQuestions] = useState<(CustomQuestion | CreateCustomQuestionData)[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormData>(defaultQuestionForm);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const isEditing = !!questionSet;

  useEffect(() => {
    if (isOpen) {
      loadAvailableTags();
      if (questionSet) {
        loadQuestionSetData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, questionSet]);

  const loadAvailableTags = async () => {
    try {
      const tags = await QuestionSetService.getAllTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadQuestionSetData = async () => {
    if (!questionSet) return;

    try {
      setIsLoading(true);
      const fullQuestionSet = await QuestionSetService.getQuestionSetWithQuestions(questionSet.id);
      
      setTitle(fullQuestionSet.title);
      setDescription(fullQuestionSet.description || '');
      setIsPublic(fullQuestionSet.is_public);
      setSelectedTags(fullQuestionSet.tags?.map(t => t.id) || []);
      setQuestions(fullQuestionSet.questions || []);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question set');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(false);
    setSelectedTags([]);
    setQuestions([]);
    setError(null);
    setIsDirty(false);
    setEditingQuestion(null);
    setQuestionForm(defaultQuestionForm);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let savedQuestionSet: QuestionSet;

      if (isEditing && questionSet) {
        // Update existing question set
        const updateData: UpdateQuestionSetData = {
          id: questionSet.id,
          title: title.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          tag_ids: selectedTags
        };
        savedQuestionSet = await QuestionSetService.updateQuestionSet(updateData);
      } else {
        // Create new question set
        const createData: CreateQuestionSetData = {
          title: title.trim(),
          description: description.trim() || undefined,
          is_public: isPublic,
          tag_ids: selectedTags
        };
        savedQuestionSet = await QuestionSetService.createQuestionSet(createData);
      }

      // Handle questions
      if (questions.length > 0) {
        // For new question sets, create all questions
        if (!isEditing) {
          const questionsToCreate: CreateCustomQuestionData[] = questions.map((q, index) => ({
            question_set_id: savedQuestionSet.id,
            text: q.text,
            type: q.type,
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points || 1,
            time_limit: q.time_limit || 30,
            difficulty: q.difficulty || 'medium',
            category: q.category,
            order_index: index
          }));
          await QuestionSetService.createMultipleQuestions(questionsToCreate);
        }
        // For existing question sets, handle updates/creates individually
        // This is a simplified version - a full implementation would track changes
      }

      setIsDirty(false);
      onSave(savedQuestionSet);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question set');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSave = () => {
    if (!questionForm.text.trim() || !questionForm.correct_answer.trim()) {
      setError('Question text and correct answer are required');
      return;
    }

    const newQuestion: CreateCustomQuestionData = {
      question_set_id: questionSet?.id || '',
      text: questionForm.text.trim(),
      type: questionForm.type,
      options: questionForm.type === 'multiple_choice' ? questionForm.options.filter(o => o.trim()) : [],
      correct_answer: questionForm.correct_answer.trim(),
      explanation: questionForm.explanation.trim() || undefined,
      points: questionForm.points,
      time_limit: questionForm.time_limit,
      difficulty: questionForm.difficulty,
      category: questionForm.category.trim() || undefined,
      order_index: questions.length
    };

    if (editingQuestion !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestion] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions(prev => [...prev, newQuestion]);
    }

    setQuestionForm(defaultQuestionForm);
    setEditingQuestion(null);
    setShowQuestionModal(false);
    setIsDirty(true);
  };

  const handleQuestionEdit = (index: number) => {
    const question = questions[index];
    setQuestionForm({
      text: question.text,
      type: question.type,
      options: question.type === 'multiple_choice' ? [...(question.options || []), '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      points: question.points || 1,
      time_limit: question.time_limit || 30,
      difficulty: question.difficulty || 'medium',
      category: question.category || ''
    });
    setEditingQuestion(index);
    setShowQuestionModal(true);
  };

  const handleQuestionDelete = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const updatedQuestions = [...questions];
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1);
    updatedQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(updatedQuestions);
    setIsDirty(true);
  };

  const QuestionCard: React.FC<{ question: CustomQuestion | CreateCustomQuestionData; index: number }> = ({ 
    question, 
    index 
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card variant="default" className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex flex-col items-center space-y-2">
              <button
                className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                // onMouseDown={() => setDragging(index)}
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                {index + 1}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {question.text}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                <Badge variant="default" size="sm">
                  {question.type.replace('_', ' ')}
                </Badge>
                <span>{question.points} pts</span>
                <span>{question.time_limit}s</span>
                <Badge 
                  variant={
                    question.difficulty === 'easy' ? 'success' :
                    question.difficulty === 'hard' ? 'danger' : 'warning'
                  }
                  size="sm"
                >
                  {question.difficulty}
                </Badge>
              </div>

              {question.type === 'multiple_choice' && question.options && question.options.length > 0 && (
                <div className="space-y-1">
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex}
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        option === question.correct_answer 
                          ? "bg-green-100 text-green-800 font-medium" 
                          : "bg-gray-50 text-gray-600"
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
              )}

              {question.type !== 'multiple_choice' && (
                <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                  Answer: {question.correct_answer}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuestionEdit(index)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuestionDelete(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const QuestionFormModal: React.FC = () => (
    <Modal 
      isOpen={showQuestionModal} 
      onClose={() => {
        setShowQuestionModal(false);
        setEditingQuestion(null);
        setQuestionForm(defaultQuestionForm);
      }}
      title={editingQuestion !== null ? 'Edit Question' : 'Add Question'}
    >
      <div className="space-y-4">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <textarea
            value={questionForm.text}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
            placeholder="Enter your question..."
          />
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select
            value={questionForm.type}
            onChange={(e) => setQuestionForm(prev => ({ 
              ...prev, 
              type: e.target.value as QuestionType,
              options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : []
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>

        {/* Multiple Choice Options */}
        {questionForm.type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options
            </label>
            <div className="space-y-2">
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer *
          </label>
          {questionForm.type === 'multiple_choice' ? (
            <select
              value={questionForm.correct_answer}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            >
              <option value="">Select correct answer...</option>
              {questionForm.options.map((option, index) => (
                option.trim() && (
                  <option key={index} value={option}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                )
              ))}
            </select>
          ) : questionForm.type === 'true_false' ? (
            <select
              value={questionForm.correct_answer}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            >
              <option value="">Select answer...</option>
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          ) : (
            <input
              type="text"
              value={questionForm.correct_answer}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
              placeholder="Enter the correct answer..."
            />
          )}
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="1"
              value={questionForm.points}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              min="5"
              value={questionForm.time_limit}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={questionForm.difficulty}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value as QuestionDifficulty }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={questionForm.category}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
              placeholder="e.g., Science, History..."
            />
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            value={questionForm.explanation}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
            placeholder="Provide an explanation for the answer..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => {
              setShowQuestionModal(false);
              setEditingQuestion(null);
              setQuestionForm(defaultQuestionForm);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleQuestionSave}>
            {editingQuestion !== null ? 'Update Question' : 'Add Question'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (!isOpen) return null;

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title={isEditing ? 'Edit Question Set' : 'Create Question Set'}
        className="max-w-6xl"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                placeholder="Enter question set title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                placeholder="Describe your question set..."
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded border-gray-300 text-electric-600 focus:ring-electric-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Make this question set public
                </span>
              </label>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const isSelected = selectedTags.includes(tag.id);
                      if (isSelected) {
                        setSelectedTags(prev => prev.filter(id => id !== tag.id));
                      } else {
                        setSelectedTags(prev => [...prev, tag.id]);
                      }
                      setIsDirty(true);
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      selectedTags.includes(tag.id)
                        ? "bg-electric-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    style={selectedTags.includes(tag.id) ? {} : { 
                      backgroundColor: tag.color + '20', 
                      color: tag.color 
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Questions ({questions.length})
              </h3>
              <Button
                onClick={() => {
                  setQuestionForm(defaultQuestionForm);
                  setEditingQuestion(null);
                  setShowQuestionModal(true);
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {questions.map((question, index) => (
                  <QuestionCard 
                    key={`question-${index}`} 
                    question={question} 
                    index={index} 
                  />
                ))}
              </AnimatePresence>

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No questions added yet</p>
                  <p className="text-sm">Click "Add Question" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              {questions.length > 0 && (
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !title.trim()}
                className="flex items-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Update' : 'Create'} Question Set
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <QuestionFormModal />
    </>
  );
};