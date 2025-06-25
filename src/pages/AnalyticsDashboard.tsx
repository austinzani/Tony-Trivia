import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy,
  Target,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  ChevronDown,
  Globe,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  TimeRange, 
  AnalyticsFilters,
  AnalyticsDashboardData,
  ExportOptions
} from '../types/analytics';
import GamePerformanceSection from '../components/analytics/GamePerformanceSection';
import PlayerEngagementSection from '../components/analytics/PlayerEngagementSection';
import QuestionAnalyticsSection from '../components/analytics/QuestionAnalyticsSection';
import HostPerformanceSection from '../components/analytics/HostPerformanceSection';
import AdministrativeReportsSection from '../components/analytics/AdministrativeReportsSection';
import RealTimeMetrics from '../components/analytics/RealTimeMetrics';
import ExportModal from '../components/analytics/ExportModal';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '7d',
    categories: [],
    difficulty: [],
    hostIds: [],
    gameStatus: []
  });

  const [activeSection, setActiveSection] = useState<
    'overview' | 'games' | 'players' | 'questions' | 'hosts' | 'admin'
  >('overview');

  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const { data, loading, error, refetch } = useAnalytics(filters);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = (options: ExportOptions) => {
    // Implementation would connect to export service
    console.log('Exporting data with options:', options);
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'games', label: 'Game Performance', icon: Trophy },
    { id: 'players', label: 'Player Engagement', icon: Users },
    { id: 'questions', label: 'Question Analytics', icon: Target },
    { id: 'hosts', label: 'Host Performance', icon: Zap },
    { id: 'admin', label: 'Administrative', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-electric-50 via-white to-plasma-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-electric-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-electric-500 to-plasma-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Comprehensive insights for hosts and administrators
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Filter Toggle */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-electric-500 text-white border-electric-500' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`} />
              </motion.button>

              {/* Export Button */}
              <motion.button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-electric-500 to-plasma-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                Export Report
              </motion.button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex space-x-1 -mb-px">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeSection === section.id
                      ? 'border-electric-500 text-electric-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? 'auto' : 0 }}
        className="overflow-hidden bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as TimeRange })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <select
                multiple
                value={filters.categories || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({ ...filters, categories: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
              >
                <option value="science">Science</option>
                <option value="history">History</option>
                <option value="sports">Sports</option>
                <option value="entertainment">Entertainment</option>
                <option value="geography">Geography</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <div className="space-y-2">
                {['easy', 'medium', 'hard'].map(level => (
                  <label key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.difficulty?.includes(level as any) || false}
                      onChange={(e) => {
                        const current = filters.difficulty || [];
                        setFilters({
                          ...filters,
                          difficulty: e.target.checked
                            ? [...current, level as any]
                            : current.filter(d => d !== level)
                        });
                      }}
                      className="mr-2 rounded text-electric-500 focus:ring-electric-500"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Status
              </label>
              <div className="space-y-2">
                {['completed', 'abandoned'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.gameStatus?.includes(status as any) || false}
                      onChange={(e) => {
                        const current = filters.gameStatus || [];
                        setFilters({
                          ...filters,
                          gameStatus: e.target.checked
                            ? [...current, status as any]
                            : current.filter(s => s !== status)
                        });
                      }}
                      className="mr-2 rounded text-electric-500 focus:ring-electric-500"
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analytics</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {/* Real-time Metrics Bar */}
            <RealTimeMetrics data={data.realTimeAnalytics} />

            {/* Section Content */}
            <div className="mt-8">
              {activeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GamePerformanceSection 
                    data={data.gamePerformance} 
                    compact 
                  />
                  <PlayerEngagementSection 
                    data={data.playerEngagement} 
                    compact 
                  />
                  <QuestionAnalyticsSection 
                    data={data.questionAnalytics} 
                    compact 
                  />
                  <HostPerformanceSection 
                    data={data.hostPerformance} 
                    compact 
                  />
                </div>
              )}

              {activeSection === 'games' && (
                <GamePerformanceSection data={data.gamePerformance} />
              )}

              {activeSection === 'players' && (
                <PlayerEngagementSection data={data.playerEngagement} />
              )}

              {activeSection === 'questions' && (
                <QuestionAnalyticsSection data={data.questionAnalytics} />
              )}

              {activeSection === 'hosts' && (
                <HostPerformanceSection data={data.hostPerformance} />
              )}

              {activeSection === 'admin' && (
                <AdministrativeReportsSection data={data.administrativeInsights} />
              )}
            </div>

            {/* Last Updated */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Last updated: {format(new Date(data.lastUpdated), 'PPpp')}
            </div>
          </>
        ) : null}
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        availableMetrics={[
          'Game Performance',
          'Player Engagement',
          'Question Analytics',
          'Host Performance',
          'Revenue Metrics',
          'System Health',
          'User Growth',
          'Category Performance',
          'Team Analytics'
        ]}
      />
    </div>
  );
};

export default AnalyticsDashboard;