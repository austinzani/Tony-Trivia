import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Bell, VolumeX } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  hasNewNotifications: boolean;
  soundsEnabled: boolean;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'prominent';
}

export function NotificationBell({
  unreadCount,
  hasNewNotifications,
  soundsEnabled,
  onClick,
  className,
  size = 'md',
  variant = 'default',
}: NotificationBellProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const badgeSizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'text-gray-500 hover:text-gray-700';
      case 'prominent':
        return 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100';
      default:
        return 'text-gray-600 hover:text-blue-600 hover:bg-gray-100';
    }
  };

  const formatUnreadCount = (count: number): string => {
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'relative rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        buttonSizeClasses[size],
        getVariantClasses(),
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <div className="relative">
        {hasNewNotifications ? (
          <motion.div
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -10, 10, -5, 5, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: hasNewNotifications ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            <Bell
              className={clsx(sizeClasses[size], 'text-blue-600 fill-current')}
            />
          </motion.div>
        ) : (
          <Bell className={sizeClasses[size]} />
        )}

        {/* Sound Disabled Indicator */}
        {!soundsEnabled && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <VolumeX className="w-2.5 h-2.5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={clsx(
            'absolute -top-1 -right-1 bg-red-500 text-white font-medium rounded-full flex items-center justify-center min-w-0',
            badgeSizeClasses[size]
          )}
        >
          <span className="leading-none">{formatUnreadCount(unreadCount)}</span>
        </motion.div>
      )}

      {/* Pulse Animation for New Notifications */}
      {hasNewNotifications && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-blue-400"
          initial={{ opacity: 0, scale: 1 }}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}
