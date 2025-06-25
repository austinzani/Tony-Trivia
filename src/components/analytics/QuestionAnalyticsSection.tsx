import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Brain, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { QuestionAnalytics } from '../../types/analytics';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface QuestionAnalyticsSectionProps {
  data: QuestionAnalytics;
  compact?: boolean;
}

const QuestionAnalyticsSection: React.FC<QuestionAnalyticsSectionProps> = ({ data, compact = false }) => {
  const [activeTab, setActiveTab] = useState<'difficulty' | 'categories' | 'performance'>('difficulty');

  const difficultyData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [{
      data: [
        data.difficultyDistribution.easy,
        data.difficultyDistribution.medium,
        data.difficultyDistribution.hard
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const categoryData = {
    labels: data.questionsByCategory.map(c => c.category),
    datasets: [
      {
        label: 'Questions',
        data: data.questionsByCategory.map(c => c.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Correct Rate %',
        data: data.questionsByCategory.map(c => c.averageCorrectRate),
        backgroundColor: 'rgba(168, 85, 247, 0.8)'
      }
    ]
  };

  const responseTimeData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [{
      label: 'Avg Response Time (seconds)',
      data: [
        data.averageResponseTimeByDifficulty.easy,
        data.averageResponseTimeByDifficulty.medium,
        data.averageResponseTimeByDifficulty.hard
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-electric-600" />
            Question Analytics
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.totalQuestions}</div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.questionsByCategory.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {((data.difficultyDistribution.easy / data.totalQuestions) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Easy Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((data.averageResponseTimeByDifficulty.easy + 
                data.averageResponseTimeByDifficulty.medium + 
                data.averageResponseTimeByDifficulty.hard) / 3)}s
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Brain className="w-8 h-8 text-electric-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{data.totalQuestions}</div>
          <div className="text-sm text-gray-600">Total Questions</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Target className="w-8 h-8 text-plasma-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{data.questionsByCategory.length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Clock className="w-8 h-8 text-yellow-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {Math.round((data.averageResponseTimeByDifficulty.easy + 
              data.averageResponseTimeByDifficulty.medium + 
              data.averageResponseTimeByDifficulty.hard) / 3)}s
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(data.questionsByCategory.reduce((sum, c) => sum + c.averageCorrectRate, 0) / data.questionsByCategory.length)}%
          </div>
          <div className="text-sm text-gray-600">Avg Success Rate</div>
        </motion.div>
      </div>

      {/* Tabbed Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'difficulty', label: 'Difficulty Analysis' },
              { id: 'categories', label: 'Category Performance' },
              { id: 'performance', label: 'Question Performance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-electric-500 text-electric-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'difficulty' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Distribution</h4>
                <div className="h-64">
                  <Pie data={difficultyData} options={chartOptions} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Response Time by Difficulty</h4>
                <div className="h-64">
                  <Bar data={responseTimeData} options={barOptions} />
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h4>
              <div className="space-y-4">
                {data.questionsByCategory.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{category.category}</h5>
                      <span className="text-sm text-gray-600">{category.count} questions</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              category.averageCorrectRate > 70 ? 'bg-green-500' :
                              category.averageCorrectRate > 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${category.averageCorrectRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {category.averageCorrectRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Most Difficult Questions
                </h4>
                <div className="space-y-3">
                  {data.mostDifficultQuestions.map((question, index) => (
                    <div key={question.id} className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {question.questionText.length > 60 
                          ? question.questionText.substring(0, 60) + '...' 
                          : question.questionText}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{question.category}</span>
                        <span className="font-semibold text-red-600">
                          {question.correctRate.toFixed(1)}% correct
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Easiest Questions
                </h4>
                <div className="space-y-3">
                  {data.easiestQuestions.map((question, index) => (
                    <div key={question.id} className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {question.questionText.length > 60 
                          ? question.questionText.substring(0, 60) + '...' 
                          : question.questionText}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{question.category}</span>
                        <span className="font-semibold text-green-600">
                          {question.correctRate.toFixed(1)}% correct
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalyticsSection;