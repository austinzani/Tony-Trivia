import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  X,
  Search,
  Filter,
  ArrowUpDown,
  CheckCheck,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Users,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type {
  GameNotification,
  NotificationPreferences,
  NotificationState,
  NotificationActions,
} from '../../types/hostControls';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: GameNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  onNotificationAction: (
    action: keyof NotificationActions,
    ...args: any[]
  ) => void;
  className?: string;
}

type FilterType =
  | 'all'
  | 'unread'
  | 'answer_submitted'
  | 'time_warning'
  | 'time_expired'
  | 'round_complete'
  | 'error'
  | 'info';
type SortType = 'newest' | 'oldest' | 'priority' | 'type';

const typeIcons = {
  answer_submitted: CheckCircle,
  time_warning: Clock,
  time_expired: AlertTriangle,
  round_complete: CheckCircle,
  error: XCircle,
  info: Info,
};

const priorityColors = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  preferences,
  onNotificationAction,
  className,
}: NotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText =
          `${notification.title} ${notification.message} ${notification.teamName || ''}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Type filter
      if (filterType === 'unread') {
        return !notification.metadata?.read;
      } else if (filterType !== 'all') {
        return notification.type === filterType;
      }

      return true;
    });

    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case 'oldest':
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [notifications, searchQuery, filterType, sortType]);

  const handleSelectNotification = (id: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotifications(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredAndSortedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(
        new Set(filteredAndSortedNotifications.map(n => n.id))
      );
    }
  };

  const handleBulkAction = (action: 'markAsRead' | 'delete') => {
    selectedNotifications.forEach(id => {
      if (action === 'markAsRead') {
        onNotificationAction('markAsRead', id);
      } else if (action === 'delete') {
        onNotificationAction('removeNotification', id);
      }
    });
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (notification: GameNotification) => {
    const IconComponent = typeIcons[notification.type];
    return (
      <IconComponent
        className={clsx('w-4 h-4', priorityColors[notification.priority])}
      />
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const SettingsPanel = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border-b border-gray-200 p-4 bg-gray-50"
    >
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Notification Settings
      </h3>

      <div className="space-y-3">
        {/* Sound Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Enable Sounds</span>
          </div>
          <button
            onClick={() =>
              onNotificationAction('updatePreferences', {
                enableSounds: !preferences.enableSounds,
              })
            }
            className={clsx(
              'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ease-in-out',
              preferences.enableSounds ? 'bg-blue-600' : 'bg-gray-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out',
                preferences.enableSounds ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Volume Control */}
        {preferences.enableSounds && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.soundVolume}
              onChange={e =>
                onNotificationAction('updatePreferences', {
                  soundVolume: parseFloat(e.target.value),
                })
              }
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {/* Auto-close Settings */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Auto-close Toasts</span>
          <button
            onClick={() =>
              onNotificationAction('updatePreferences', {
                autoCloseToasts: !preferences.autoCloseToasts,
              })
            }
            className={clsx(
              'relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ease-in-out',
              preferences.autoCloseToasts ? 'bg-blue-600' : 'bg-gray-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out',
                preferences.autoCloseToasts
                  ? 'translate-x-4'
                  : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Toast Duration */}
        {preferences.autoCloseToasts && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Toast Duration</span>
            <select
              value={preferences.defaultToastDuration}
              onChange={e =>
                onNotificationAction('updatePreferences', {
                  defaultToastDuration: parseInt(e.target.value),
                })
              }
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={7000}>7s</option>
              <option value={10000}>10s</option>
            </select>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        className
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>{showSettings && <SettingsPanel />}</AnimatePresence>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Filter */}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as FilterType)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="answer_submitted">Answers</option>
                <option value="time_warning">Time Warnings</option>
                <option value="time_expired">Time Expired</option>
                <option value="round_complete">Round Complete</option>
                <option value="error">Errors</option>
                <option value="info">Info</option>
              </select>

              {/* Sort */}
              <select
                value={sortType}
                onChange={e => setSortType(e.target.value as SortType)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
                <option value="type">By Type</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('markAsRead')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark Read</span>
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Select All */}
          {filteredAndSortedNotifications.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedNotifications.size ===
              filteredAndSortedNotifications.length
                ? 'Deselect All'
                : `Select All (${filteredAndSortedNotifications.length})`}
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAndSortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Notifications will appear here as they arrive'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={clsx(
                    'p-4 hover:bg-gray-50 transition-colors',
                    !notification.metadata?.read && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.teamName && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Users className="w-3 h-3 mr-1" />
                              <span>{notification.teamName}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {/* Action Required */}
                          {notification.actionRequired && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}

                          {/* Sound Indicator */}
                          {notification.sound && (
                            <Volume2 className="w-4 h-4 text-gray-400" />
                          )}

                          {/* Timestamp */}
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimestamp(notification.timestamp)}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            {!notification.metadata?.read && (
                              <button
                                onClick={() =>
                                  onNotificationAction(
                                    'markAsRead',
                                    notification.id
                                  )
                                }
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                onNotificationAction(
                                  'removeNotification',
                                  notification.id
                                )
                              }
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {filteredAndSortedNotifications.length} of {notifications.length}{' '}
              notifications
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNotificationAction('markAllAsRead')}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={unreadCount === 0}
              >
                Mark All Read
              </button>
              <button
                onClick={() => onNotificationAction('clearAll')}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={notifications.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
