import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationCenter } from './NotificationCenter';
import { NotificationToast } from './NotificationToast';

interface NotificationSystemProps {
  gameId: string;
  className?: string;
  bellSize?: 'sm' | 'md' | 'lg';
  bellVariant?: 'default' | 'minimal' | 'prominent';
  maxToastCount?: number;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationSystem({
  gameId,
  className,
  bellSize = 'md',
  bellVariant = 'default',
  maxToastCount = 3,
  toastPosition = 'top-right',
}: NotificationSystemProps) {
  const [isCenterOpen, setIsCenterOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    hasNewNotifications,
    preferences,
    teamSubmissionStatus,
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    updatePreferences,
    markAllAsRead,
  } = useNotifications(gameId);

  // Get visible toasts (most recent, up to maxToastCount)
  const visibleToasts = notifications
    .filter(
      notification =>
        !notification.dismissed &&
        (preferences.showToasts || notification.priority === 'critical')
    )
    .slice(0, maxToastCount);

  const handleBellClick = useCallback(() => {
    setIsCenterOpen(true);
  }, []);

  const handleCenterClose = useCallback(() => {
    setIsCenterOpen(false);
  }, []);

  const handleToastClose = useCallback(
    (notificationId: string) => {
      removeNotification(notificationId);
    },
    [removeNotification]
  );

  const handleToastMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId);
    },
    [markAsRead]
  );

  const getToastPositionClasses = () => {
    switch (toastPosition) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default: // top-right
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className={className}>
        <NotificationBell
          unreadCount={unreadCount}
          hasNewNotifications={hasNewNotifications}
          soundsEnabled={preferences.soundEnabled}
          onClick={handleBellClick}
          size={bellSize}
          variant={bellVariant}
        />
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={isCenterOpen}
        onClose={handleCenterClose}
        notifications={notifications}
        teamSubmissionStatus={teamSubmissionStatus}
        preferences={preferences}
        onUpdatePreferences={updatePreferences}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRemoveNotification={removeNotification}
        onClearAll={clearAllNotifications}
      />

      {/* Toast Notifications */}
      <div
        className={`fixed z-50 flex flex-col space-y-2 ${getToastPositionClasses()}`}
      >
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((notification, index) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onClose={handleToastClose}
              onMarkAsRead={handleToastMarkAsRead}
              soundEnabled={preferences.soundEnabled}
              style={{
                zIndex: 1000 - index, // Ensure proper stacking order
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// Export individual components for granular usage
export { NotificationBell } from './NotificationBell';
export { NotificationCenter } from './NotificationCenter';
export { NotificationToast } from './NotificationToast';
