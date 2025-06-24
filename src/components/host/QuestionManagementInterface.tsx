import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  Upload,
  Download,
  Shuffle,
  Copy
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/host';
import { QuestionEditor, QuickEditModal, Question } from './QuestionEditor';
import { cn } from '../../utils/cn';

interface QuestionSet {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionManagementInterfaceProps {
  questionSets: QuestionSet[];
  currentSetId?: string;
  onQuestionSetChange: (setId: string) => void;
  onQuestionAdd: (question: Question) => Promise<void>;
  onQuestionEdit: (question: Question) => Promise<void>;
  onQuestionDelete: (questionId: string) => Promise<void>;
  onQuestionSetCreate: (set: Omit<QuestionSet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onQuestionSetImport: (file: File) => Promise<void>;
  onQuestionSetExport: (setId: string) => void;
}

export const QuestionManagementInterface: React.FC<QuestionManagementInterfaceProps> = ({
  questionSets,
  currentSetId,
  onQuestionSetChange,
  onQuestionAdd,
  onQuestionEdit,
  onQuestionDelete,
  onQuestionSetCreate,
  onQuestionSetImport,
  onQuestionSetExport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showSetCreator, setShowSetCreator] = useState(false);

  const currentSet = questionSets.find(set => set.id === currentSetId);
  const allCategories = Array.from(new Set(questionSets.flatMap(set => set.categories)));

  const filteredQuestions = currentSet?.questions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || question.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedQuestions.size} questions?`)) {
      for (const questionId of selectedQuestions) {
        await onQuestionDelete(questionId);
      }
      setSelectedQuestions(new Set());
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onQuestionSetImport(file);
    }
  };

  const newQuestionTemplate: Question = {
    id: '',
    text: '',
    answer: '',
    category: '',
    difficulty: 'medium',
    points: 10,
    timeLimit: 30
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-electric-600" />
              Question Management
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="lg">
                {currentSet ? `${currentSet.questions.length} Questions` : 'No Set Selected'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Question Set Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Question Set
            </label>
            <div className="flex gap-2">
              <select
                value={currentSetId || ''}
                onChange={(e) => onQuestionSetChange(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
              >
                <option value="">Select a question set...</option>
                {questionSets.map(set => (
                  <option key={set.id} value={set.id}>
                    {set.name} ({set.questions.length} questions)
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => setShowSetCreator(true)}
                icon={Plus}
              >
                New Set
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="primary"
              onClick={() => setShowAddQuestionModal(true)}
              icon={Plus}
              disabled={!currentSetId}
            >
              Add Question
            </Button>
            <Button
              variant="secondary"
              onClick={() => document.getElementById('import-file')?.click()}
              icon={Upload}
            >
              Import
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => currentSetId && onQuestionSetExport(currentSetId)}
              icon={Download}
              disabled={!currentSetId}
            >
              Export
            </Button>
            <Button
              variant="secondary"
              icon={Shuffle}
              disabled={!currentSetId || filteredQuestions.length === 0}
            >
              Shuffle Order
            </Button>
            {selectedQuestions.size > 0 && (
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                icon={Trash2}
              >
                Delete Selected ({selectedQuestions.size})
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Questions Table */}
          {currentSet && filteredQuestions.length > 0 ? (
            <Table animate>
              <TableHeader>
                <TableRow>
                  <TableCell variant="header">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.size === filteredQuestions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
                        } else {
                          setSelectedQuestions(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell variant="header">Question</TableCell>
                  <TableCell variant="header">Category</TableCell>
                  <TableCell variant="header" align="center">Difficulty</TableCell>
                  <TableCell variant="header" align="center">Points</TableCell>
                  <TableCell variant="header" align="center">Time</TableCell>
                  <TableCell variant="header" align="center">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question, index) => (
                  <TableRow key={question.id} animate index={index}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedQuestions);
                          if (e.target.checked) {
                            newSelected.add(question.id);
                          } else {
                            newSelected.delete(question.id);
                          }
                          setSelectedQuestions(newSelected);
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {question.text}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Answer: {question.answer}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary" size="sm">{question.category}</Badge>
                    </TableCell>
                    <TableCell align="center">
                      <Badge 
                        variant={
                          question.difficulty === 'easy' ? 'success' :
                          question.difficulty === 'medium' ? 'warning' :
                          'danger'
                        }
                        size="sm"
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell align="center">{question.points}</TableCell>
                    <TableCell align="center">{question.timeLimit}s</TableCell>
                    <TableCell align="center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingQuestion(question)}
                          icon={Edit3}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(question));
                          }}
                          icon={Copy}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this question?')) {
                              onQuestionDelete(question.id);
                            }
                          }}
                          icon={Trash2}
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {!currentSetId ? 'No Question Set Selected' : 'No Questions Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {!currentSetId 
                  ? 'Select a question set to view and manage questions' 
                  : 'Try adjusting your filters or add new questions'}
              </p>
              {currentSetId && (
                <Button
                  variant="primary"
                  onClick={() => setShowAddQuestionModal(true)}
                  icon={Plus}
                >
                  Add First Question
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Edit Modal */}
      <QuickEditModal
        question={editingQuestion}
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSave={onQuestionEdit}
      />

      {/* Add Question Modal */}
      <Modal
        isOpen={showAddQuestionModal}
        onClose={() => setShowAddQuestionModal(false)}
        title="Add New Question"
        size="lg"
      >
        <QuestionEditor
          question={newQuestionTemplate}
          onSave={async (question) => {
            await onQuestionAdd({
              ...question,
              id: Date.now().toString()
            });
            setShowAddQuestionModal(false);
          }}
          onCancel={() => setShowAddQuestionModal(false)}
          isModal
        />
      </Modal>

      {/* Create Question Set Modal */}
      <Modal
        isOpen={showSetCreator}
        onClose={() => setShowSetCreator(false)}
        title="Create Question Set"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await onQuestionSetCreate({
              name: formData.get('name') as string,
              description: formData.get('description') as string,
              questions: [],
              categories: []
            });
            setShowSetCreator(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Set Name
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none"
              placeholder="e.g., General Knowledge Round 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-electric-500 focus:outline-none resize-none"
              placeholder="Brief description of this question set..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSetCreator(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Set
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};