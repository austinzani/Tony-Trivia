import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, FileSpreadsheet, FileJson, Calendar } from 'lucide-react';
import { ExportOptions } from '../../types/analytics';
import { format } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  availableMetrics: string[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, availableMetrics }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(availableMetrics);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const formats = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Best for presentations' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Best for analysis' },
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Best for data import' },
    { value: 'json', label: 'JSON', icon: FileJson, description: 'Best for developers' }
  ];

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      dateRange,
      includeCharts: selectedFormat === 'pdf' ? includeCharts : false,
      includedMetrics: selectedMetrics
    });
    onClose();
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-electric-600" />
                Export Analytics Report
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Export Format</h3>
                <div className="grid grid-cols-2 gap-3">
                  {formats.map(format => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.value}
                        onClick={() => setSelectedFormat(format.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedFormat === format.value
                            ? 'border-electric-500 bg-electric-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          selectedFormat === format.value ? 'text-electric-600' : 'text-gray-600'
                        }`} />
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{format.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-electric-600" />
                  Date Range
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={format(dateRange.start, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={format(dateRange.end, 'yyyy-MM-dd')}
                      onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Include Metrics</h3>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availableMetrics.map(metric => (
                    <label
                      key={metric}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={() => toggleMetric(metric)}
                        className="rounded text-electric-500 focus:ring-electric-500"
                      />
                      <span className="text-sm text-gray-700">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              {selectedFormat === 'pdf' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Options</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="rounded text-electric-500 focus:ring-electric-500"
                    />
                    <span className="text-sm text-gray-700">Include charts and visualizations</span>
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleExport}
                className="px-6 py-2 bg-gradient-to-r from-electric-500 to-plasma-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Export Report
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;