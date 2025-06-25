import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Server, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Database,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import { AdministrativeInsights } from '../../types/analytics';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AdministrativeReportsSectionProps {
  data: AdministrativeInsights;
}

const AdministrativeReportsSection: React.FC<AdministrativeReportsSectionProps> = ({ data }) => {
  const [activeReport, setActiveReport] = useState<'health' | 'growth' | 'revenue' | 'usage'>('health');

  const revenueChartData = {
    labels: data.revenue.revenueByPeriod.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Revenue',
      data: data.revenue.revenueByPeriod.map(d => d.amount),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const userGrowthData = {
    labels: ['Today', 'This Week', 'This Month'],
    datasets: [{
      label: 'New Users',
      data: [
        data.userGrowth.newUsersToday,
        data.userGrowth.newUsersThisWeek,
        data.userGrowth.newUsersThisMonth
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ]
    }]
  };

  const chartOptions = {
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

  const getHealthStatusIcon = () => {
    switch (data.platformHealth.status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getHealthStatusColor = () => {
    switch (data.platformHealth.status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 border ${getHealthStatusColor()}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {getHealthStatusIcon()}
            Platform Status: {data.platformHealth.status.charAt(0).toUpperCase() + data.platformHealth.status.slice(1)}
          </h3>
          <div className="text-sm">
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-sm opacity-75">Uptime</div>
            <div className="text-xl font-bold">{data.platformHealth.uptime}%</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-sm opacity-75">Error Rate</div>
            <div className="text-xl font-bold">{data.platformHealth.errorRate}%</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-sm opacity-75">Avg Response</div>
            <div className="text-xl font-bold">{data.platformHealth.averageResponseTime}ms</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="text-sm opacity-75">Server Load</div>
            <div className="text-xl font-bold">{data.systemUsage.serverLoad}%</div>
          </div>
        </div>
      </motion.div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'health', label: 'System Health', icon: Server },
              { id: 'growth', label: 'User Growth', icon: Users },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'usage', label: 'System Usage', icon: Activity }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveReport(tab.id as any)}
                  className={`py-4 border-b-2 transition-colors flex items-center gap-2 ${
                    activeReport === tab.id
                      ? 'border-electric-500 text-electric-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeReport === 'health' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Zap className="w-8 h-8 text-electric-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">System Performance</div>
                  <div className="text-2xl font-bold text-gray-900">{data.platformHealth.averageResponseTime}ms</div>
                  <div className="text-xs text-gray-500 mt-1">Response time</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>CPU Usage</span>
                      <span className="font-semibold">42%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Memory Usage</span>
                      <span className="font-semibold">68%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <Server className="w-8 h-8 text-plasma-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Server Status</div>
                  <div className="text-2xl font-bold text-gray-900">{data.platformHealth.uptime}%</div>
                  <div className="text-xs text-gray-500 mt-1">Uptime</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Active Servers</span>
                      <span className="font-semibold">4/4</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Load Balanced</span>
                      <span className="font-semibold text-green-600">Yes</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <Database className="w-8 h-8 text-green-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Database Health</div>
                  <div className="text-2xl font-bold text-gray-900">{data.systemUsage.databaseSize} GB</div>
                  <div className="text-xs text-gray-500 mt-1">Database size</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Query Time</span>
                      <span className="font-semibold">12ms avg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Connections</span>
                      <span className="font-semibold">87/200</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Recent Issues</h4>
                <div className="space-y-2 text-sm text-yellow-800">
                  <div>• Minor spike in response times detected at 2:30 PM</div>
                  <div>• Database backup completed with warnings</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeReport === 'growth' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-700">Growth Rate</div>
                  <div className="text-2xl font-bold text-green-900">{data.userGrowth.growthRate}%</div>
                  <div className="text-xs text-green-600">Monthly</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <div className="text-sm text-red-700">Churn Rate</div>
                  <div className="text-2xl font-bold text-red-900">{data.userGrowth.churnRate}%</div>
                  <div className="text-xs text-red-600">Monthly</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-700">Net Growth</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(data.userGrowth.growthRate - data.userGrowth.churnRate).toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-600">Effective</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="text-sm text-purple-700">Projected Users</div>
                  <div className="text-2xl font-bold text-purple-900">5.2K</div>
                  <div className="text-xs text-purple-600">Next month</div>
                </div>
              </div>

              <div className="h-64">
                <Bar data={userGrowthData} options={chartOptions} />
              </div>

              <div className="bg-electric-50 rounded-lg p-4 border border-electric-200">
                <h4 className="font-semibold text-electric-900 mb-2">Growth Insights</h4>
                <ul className="space-y-1 text-sm text-electric-700">
                  <li>• Highest growth from social media referrals (35%)</li>
                  <li>• Weekend signups increased by 22% this month</li>
                  <li>• Mobile app downloads up 45% month-over-month</li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeReport === 'revenue' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <DollarSign className="w-6 h-6 text-green-700 mb-2" />
                  <div className="text-sm text-green-700">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-900">
                    ${data.revenue.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <TrendingUp className="w-6 h-6 text-blue-700 mb-2" />
                  <div className="text-sm text-blue-700">ARPU</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ${data.revenue.averageRevenuePerUser.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <BarChart3 className="w-6 h-6 text-purple-700 mb-2" />
                  <div className="text-sm text-purple-700">MRR</div>
                  <div className="text-2xl font-bold text-purple-900">
                    ${(data.revenue.totalRevenue / 12).toFixed(0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                  <Activity className="w-6 h-6 text-yellow-700 mb-2" />
                  <div className="text-sm text-yellow-700">Growth</div>
                  <div className="text-2xl font-bold text-yellow-900">+18%</div>
                </div>
              </div>

              <div className="h-64">
                <Line data={revenueChartData} options={chartOptions} />
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Top Revenue Games</h4>
                <div className="space-y-2">
                  {data.revenue.topRevenueGames.map((game, index) => (
                    <div key={game.gameId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{game.gameName}</span>
                      </div>
                      <span className="font-bold text-green-600">${game.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeReport === 'usage' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Users className="w-8 h-8 text-electric-600 mb-3" />
                  <div className="text-sm text-gray-600">Peak Concurrent</div>
                  <div className="text-2xl font-bold text-gray-900">{data.systemUsage.peakConcurrentUsers}</div>
                  <div className="text-xs text-gray-500">users</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Activity className="w-8 h-8 text-plasma-600 mb-3" />
                  <div className="text-sm text-gray-600">Daily Active</div>
                  <div className="text-2xl font-bold text-gray-900">{data.systemUsage.averageDailyActiveUsers}</div>
                  <div className="text-xs text-gray-500">avg users</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Server className="w-8 h-8 text-green-600 mb-3" />
                  <div className="text-sm text-gray-600">Server Load</div>
                  <div className="text-2xl font-bold text-gray-900">{data.systemUsage.serverLoad}%</div>
                  <div className="text-xs text-gray-500">current</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Database className="w-8 h-8 text-yellow-600 mb-3" />
                  <div className="text-sm text-gray-600">Storage Used</div>
                  <div className="text-2xl font-bold text-gray-900">{data.systemUsage.databaseSize} GB</div>
                  <div className="text-xs text-gray-500">of 10 GB</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-electric-50 to-plasma-50 rounded-lg p-6 border border-electric-200">
                <h4 className="font-semibold text-gray-900 mb-4">Resource Utilization</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span className="font-semibold">42%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-electric-500 to-plasma-500 h-3 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span className="font-semibold">68%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-electric-500 to-plasma-500 h-3 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Bandwidth</span>
                      <span className="font-semibold">35%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-electric-500 to-plasma-500 h-3 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdministrativeReportsSection;