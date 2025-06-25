import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  ScheduledGameNotificationService, 
  type GameNotification 
} from '../services/scheduledGameNotifications';

export function useScheduledGameNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification to the list
  const addNotification = useCallback((notification: GameNotification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear a specific notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Subscribe to notifications when user is logged in
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = ScheduledGameNotificationService.subscribeToNotifications(
      user.id,
      addNotification
    );

    return unsubscribe;
  }, [user?.id, addNotification]);

  // Start reminder checking interval
  useEffect(() => {
    const checkReminders = async () => {
      try {
        await ScheduledGameNotificationService.checkAndSendReminders();
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    
    // Check immediately on mount
    checkReminders();

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };
}