import React, { useState, useCallback } from 'react';
import { useHostNotifications, useReviewManagement } from '../hooks/useHostNotifications';

interface HostNotificationCenterProps {
  gameId: string;
  className?: string;
}

export function HostNotificationCenter({ gameId, className = '' }: HostNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'reviews' | 'alerts'>('notifications');
  
  const {
    state: notificationState,
    actions: notificationActions,
    isLoading,
    error
  } = useHostNotifications({
    gameId,
    enabled: true,
    config: {
      enableAnswerReviewAlerts: true,
      enableScoreDisputeAlerts: true,
      enableGameProgressAlerts: true,
      enablePerformanceAlerts: true,
      autoApproveThreshold: 0.8,
      escalationTimeout: 5, // 5 minutes
    },
    onNotification: (notification) => {
      console.log('New notification:', notification);
      // Could trigger toast notification here
    },
    onReviewRequest: (request) => {
      console.log('New review request:', request);
      // Could trigger sound notification here
    },
    onGameControlAlert: (alert) => {
      console.log('Game control alert:', alert);
      // Could trigger urgent notification here
    },
    onPerformanceAlert: (alert) => {
      console.log('Performance alert:', alert);
      // Could trigger system notification here
    },
  });
  
  const {
    pendingReviews,
    escalatedReviews,
    reviewQueueLength,
    selectedReview,
    selectReview,
    clearSelection,
    approveSelectedReview,
    rejectSelectedReview,
    submitAnswerForReview,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useReviewManagement(gameId, true);
  
  // Demo functions to simulate notifications
  const handleTestNotification = useCallback(() => {
    const notification = {
      id: `test-${Date.now()}`,
      type: 'info',
      message: 'This is a test notification',
      timestamp: new Date(),
    };
    // This would normally come from the real-time system
    console.log('Test notification created:', notification);
  }, []);
  
  const handleTestReviewRequest = useCallback(async () => {
    await submitAnswerForReview(
      'team-123',
      'Team Alpha',
      'question-456',
      'What is the capital of France?',
      'paris',
      'Paris',
      5,
      'medium'
    );
  }, [submitAnswerForReview]);
  
  const handleApproveReview = useCallback(async () => {
    if (selectedReview) {
      await approveSelectedReview('Answer is correct', undefined);
    }
  }, [selectedReview, approveSelectedReview]);
  
  const handleRejectReview = useCallback(async () => {
    if (selectedReview) {
      await rejectSelectedReview('Answer is incorrect or incomplete');
    }
  }, [selectedReview, rejectSelectedReview]);
  
  if (isLoading || reviewsLoading) {
    return (
      <div className={`host-notification-center ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }
  
  if (error || reviewsError) {
    return (
      <div className={`host-notification-center ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading notifications</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || reviewsError}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`host-notification-center bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Host Notification Center</h2>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              notificationState.isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {notificationState.isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {reviewQueueLength > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {reviewQueueLength} pending reviews
              </span>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications ({notificationState.notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews ({pendingReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts ({notificationState.gameControlAlerts.length + notificationState.performanceAlerts.length})
            </button>
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {/* Demo Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Controls</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Test Notification
                </button>
                <button
                  onClick={handleTestReviewRequest}
                  className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  Test Review Request
                </button>
              </div>
            </div>
            
            {notificationState.notifications.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M9 7H6a1 1 0 00-1 1v9a1 1 0 001 1h2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">All caught up! No new notifications.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationState.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <button
                      onClick={() => notificationActions.clearNotification(notification.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reviews</h3>
                <p className="mt-1 text-sm text-gray-500">All answers have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <div 
                    key={review.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReview?.id === review.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectReview(review)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{review.teamName}</h4>
                        <p className="text-xs text-gray-500">Question: {review.questionId}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        review.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Review Actions */}
            {selectedReview && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  Review: {selectedReview.teamName}
                </h4>
                <div className="flex space-x-3">
                  <button
                    onClick={handleApproveReview}
                    className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleRejectReview}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {notificationState.gameControlAlerts.length === 0 && notificationState.performanceAlerts.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active alerts</h3>
                <p className="mt-1 text-sm text-gray-500">All systems are running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Game Control Alerts */}
                {notificationState.gameControlAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">{alert.type}</p>
                      <p className="text-sm text-red-700">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => notificationActions.resolveGameControlAlert(alert.id)}
                      className="flex-shrink-0 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
                
                {/* Performance Alerts */}
                {notificationState.performanceAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-900">{alert.type}</p>
                      <p className="text-sm text-yellow-700">{alert.metric}: {alert.value}</p>
                    </div>
                    <button
                      onClick={() => notificationActions.resolvePerformanceAlert(alert.id)}
                      className="flex-shrink-0 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Last updated: {notificationState.lastUpdated?.toLocaleTimeString() || 'Never'}
          </span>
          <button
            onClick={notificationActions.clearAllNotifications}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear all notifications
          </button>
        </div>
      </div>
    </div>
  );
}

export default HostNotificationCenter;
