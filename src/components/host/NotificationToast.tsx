import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { GameNotification } from '../../types/hostControls';

interface NotificationToastProps {
  notification: GameNotification;
  onClose: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  className?: string;
}

const typeConfig = {
  answer_submitted: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700',
  },
  time_warning: {
    icon: Clock,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
  },
  time_expired: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
  },
  round_complete: {
    icon: CheckCircle,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
  },
};

const priorityConfig = {
  low: {
    borderWidth: 'border-l-2',
    shadow: 'shadow-sm',
  },
  medium: {
    borderWidth: 'border-l-4',
    shadow: 'shadow-md',
  },
  high: {
    borderWidth: 'border-l-4',
    shadow: 'shadow-lg',
  },
  critical: {
    borderWidth: 'border-l-8',
    shadow: 'shadow-xl',
    pulse: true,
  },
};

export function NotificationToast({
  notification,
  onClose,
  onMarkAsRead,
  className,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    notification.sound !== false
  );

  const config = typeConfig[notification.type];
  const priority = priorityConfig[notification.priority];
  const IconComponent = config.icon;

  // Auto-close timer
  useEffect(() => {
    if (notification.autoClose !== false && notification.duration) {
      setTimeRemaining(notification.duration);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 100) {
            clearInterval(interval);
            handleClose();
            return null;
          }
          return prev - 100;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification.autoClose, notification.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const formatTimeRemaining = (ms: number) => {
    return `${Math.ceil(ms / 1000)}s`;
  };

  const getTeamInfo = () => {
    if (notification.teamName) {
      return (
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <Users className="w-3 h-3 mr-1" />
          <span>{notification.teamName}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={clsx(
            'relative max-w-sm w-full rounded-lg border',
            config.bgColor,
            config.borderColor,
            priority.borderWidth,
            priority.shadow,
            'p-4 mb-3',
            {
              'animate-pulse':
                priority.pulse && notification.priority === 'critical',
            },
            className
          )}
          role="alert"
          aria-live={
            notification.priority === 'critical' ? 'assertive' : 'polite'
          }
        >
          {/* Progress bar for auto-close */}
          {timeRemaining !== null && notification.duration && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
              <motion.div
                className="h-full bg-gray-400"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: notification.duration / 1000,
                  ease: 'linear',
                }}
              />
            </div>
          )}

          <div className="flex items-start">
            {/* Icon */}
            <div className="flex-shrink-0">
              <IconComponent
                className={clsx('w-5 h-5', config.iconColor)}
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={clsx('text-sm font-medium', config.titleColor)}>
                    {notification.title}
                  </p>
                  <p className={clsx('text-sm mt-1', config.messageColor)}>
                    {notification.message}
                  </p>
                  {getTeamInfo()}
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-1 ml-2">
                  {/* Sound toggle */}
                  {notification.sound !== false && (
                    <button
                      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                      className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                      title={isSoundEnabled ? 'Mute sounds' : 'Enable sounds'}
                    >
                      {isSoundEnabled ? (
                        <Volume2 className="w-4 h-4 text-gray-500" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Time remaining */}
                  {timeRemaining !== null && (
                    <span className="text-xs text-gray-500 min-w-fit">
                      {formatTimeRemaining(timeRemaining)}
                    </span>
                  )}

                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Action required indicator */}
              {notification.actionRequired && (
                <div className="mt-2 flex items-center text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-red-600 font-medium">
                    Action Required
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-500">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Mark as read button for unread notifications */}
          {!notification.metadata?.read && (
            <button
              onClick={handleMarkAsRead}
              className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
              title="Mark as read"
              aria-label="Mark notification as read"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NotificationToastContainerProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
  onMute?: () => void;
  isMuted?: boolean;
  maxVisible?: number;
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
  onMute,
  isMuted = false,
  maxVisible = 5,
}: NotificationToastContainerProps) {
  // Show only the most recent notifications that should be displayed as toasts
  const visibleNotifications = notifications
    .filter(n => n.autoClose !== false) // Only show auto-closing notifications in toasts
    .slice(0, maxVisible);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={onDismiss}
            onMarkAsRead={onDismiss}
          />
        ))}
      </AnimatePresence>

      {/* Overflow indicator */}
      {notifications.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm text-center"
        >
          +{notifications.length - maxVisible} more notifications
        </motion.div>
      )}
    </div>
  );
}
