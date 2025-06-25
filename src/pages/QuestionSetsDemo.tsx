import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Upload, Settings } from 'lucide-react';
import { QuestionSetList } from '../components/questionSets/QuestionSetList';
import { QuestionSetEditor } from '../components/questionSets/QuestionSetEditor';
import type { QuestionSet } from '../types/questionSets';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/host/Card';
import Button from '../components/ui/host/Button';
import Badge from '../components/ui/host/Badge';

export const QuestionSetsDemo: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionSet | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'viewer'>('list');

  const handleCreateNew = () => {
    setSelectedQuestionSet(null);
    setShowEditor(true);
  };

  const handleEditQuestionSet = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setShowEditor(true);
  };

  const handleViewQuestionSet = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setViewMode('viewer');
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedQuestionSet(null);
  };

  const handleEditorSave = (questionSet: QuestionSet) => {
    // In a real app, this would trigger a refresh of the question sets list
    console.log('Question set saved:', questionSet);
    setShowEditor(false);
    setSelectedQuestionSet(null);
  };

  const QuestionSetViewer: React.FC<{ questionSet: QuestionSet }> = ({ questionSet }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{questionSet.title}</h1>
          {questionSet.description && (
            <p className="text-gray-600 mt-1">{questionSet.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={() => setViewMode('list')}
          >
            Back to List
          </Button>
          <Button
            onClick={() => handleEditQuestionSet(questionSet)}
          >
            Edit Question Set
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-electric-600">
                {questionSet.question_count}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {questionSet.is_public ? 'Public' : 'Private'}
              </div>
              <div className="text-sm text-gray-600">Visibility</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {questionSet.tags?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Tags</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {questionSet.tags && questionSet.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {questionSet.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="default"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Question Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Question preview will be available when you add questions to this set.
          </p>
          <Button
            className="mt-4"
            onClick={() => handleEditQuestionSet(questionSet)}
          >
            Add Questions
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white shadow-sm border-b border-electric-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-electric-700">
                Custom Question Sets Feature Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create, manage, and organize your custom trivia questions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="new" className="animate-pulse">
                New Feature
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-electric-100' : ''}
              >
                Question Sets
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Plus className="w-8 h-8 text-electric-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Create Question Sets</h3>
              <p className="text-sm text-gray-600 mt-1">
                Build custom collections of trivia questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Organize & Tag</h3>
              <p className="text-sm text-gray-600 mt-1">
                Use tags and categories to organize questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Import & Export</h3>
              <p className="text-sm text-gray-600 mt-1">
                Share question sets with other hosts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Advanced Features</h3>
              <p className="text-sm text-gray-600 mt-1">
                Multiple question types and difficulty levels
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {viewMode === 'list' && (
            <QuestionSetList
              onCreateNew={handleCreateNew}
              onEditQuestionSet={handleEditQuestionSet}
              onViewQuestionSet={handleViewQuestionSet}
            />
          )}

          {viewMode === 'viewer' && selectedQuestionSet && (
            <QuestionSetViewer questionSet={selectedQuestionSet} />
          )}
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Feature Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Question Management</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-electric-500 rounded-full mr-3"></div>
                      Multiple choice, true/false, and short answer questions
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-electric-500 rounded-full mr-3"></div>
                      Customizable points and time limits per question
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-electric-500 rounded-full mr-3"></div>
                      Difficulty levels and category organization
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-electric-500 rounded-full mr-3"></div>
                      Drag-and-drop question reordering
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Organization & Sharing</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Tag-based organization system
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Public/private visibility controls
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Import/export functionality (JSON format)
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Question set duplication and templates
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-electric-50 border border-electric-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BookOpen className="w-5 h-5 text-electric-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-electric-800">
                Demo Environment
              </h3>
              <p className="text-sm text-electric-700 mt-1">
                This is a demonstration of the Custom Question Sets feature. In the full implementation, 
                question sets would integrate seamlessly with the game hosting interface, allowing hosts 
                to select custom question sets when creating games. The feature includes full CRUD 
                operations, real-time collaboration, and advanced search capabilities.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Question Set Editor Modal */}
      <QuestionSetEditor
        questionSet={selectedQuestionSet}
        isOpen={showEditor}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    </div>
  );
};