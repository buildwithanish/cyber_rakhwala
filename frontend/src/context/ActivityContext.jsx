import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import accountService from '../services/accountService';
import { useAuth } from './AuthContext';

const ActivityContext = createContext(null);

const normalizeNotification = (item = {}) => ({
  ...item,
  id: item.id || item._id || `notif-${Math.random().toString(36).slice(2, 10)}`,
  title: item.title || 'Notification',
  message: item.message || '',
  type: item.type || 'info',
  link: item.link?.path || item.link || null,
  read: item.read ?? item.isRead ?? false,
  isRead: item.isRead ?? item.read ?? false,
  timestamp: item.timestamp || item.createdAt || new Date().toISOString()
});

const normalizeActivity = (item = {}) => ({
  ...item,
  id: item.id || item._id || `activity-${Math.random().toString(36).slice(2, 10)}`,
  action: item.action || item.title || 'Activity recorded',
  details: item.details || item.metadata || {},
  metadata: item.metadata || item.details || {},
  type: item.type || 'action',
  timestamp: item.timestamp || item.createdAt || new Date().toISOString()
});

const normalizeActivityType = (type = 'action') => {
  const supported = new Set([
    'action',
    'case',
    'evidence',
    'tool',
    'credits',
    'auth',
    'investigation',
    'watchlist'
  ]);

  return supported.has(type) ? type : 'action';
};

const parseActivityInput = (action, details = {}) => {
  if (typeof action === 'object' && action !== null) {
    const activity = action;
    return {
      action:
        activity.action ||
        activity.title ||
        activity.description ||
        activity.message ||
        'Activity recorded',
      type: normalizeActivityType(activity.type || activity.category),
      details: {
        ...activity,
        type: undefined,
        category: undefined,
        action: undefined,
        title: undefined,
        description: undefined,
        message: undefined
      }
    };
  }

  return {
    action,
    type: normalizeActivityType(details.type),
    details
  };
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !(item.read ?? item.isRead)).length,
    [notifications]
  );

  const loadActivity = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setActivities([]);
      setNotifications([]);
      return;
    }

    try {
      const [activityPayload, notificationPayload] = await Promise.all([
        accountService.getActivities({ limit: 100 }),
        accountService.getNotifications({ limit: 50 })
      ]);

      setActivities(Array.isArray(activityPayload) ? activityPayload.map(normalizeActivity) : []);
      setNotifications(
        Array.isArray(notificationPayload) ? notificationPayload.map(normalizeNotification) : []
      );
    } catch (error) {
      console.error('[ActivityContext] Failed to load account activity:', error);
      setActivities([]);
      setNotifications([]);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const logActivity = useCallback(
    (action, details = {}) => {
      const payload = parseActivityInput(action, details);
      const entry = normalizeActivity({
        action: payload.action,
        type: payload.type,
        details: payload.details,
        actorName: user?.name || 'Current User',
        timestamp: new Date().toISOString()
      });

      setActivities((previous) => [entry, ...previous].slice(0, 100));

      if (isAuthenticated) {
        accountService
          .createActivity({
            action: entry.action,
            type: entry.type,
            details: entry.details
          })
          .then((stored) => {
            setActivities((previous) =>
              previous.map((item) => (item.id === entry.id ? normalizeActivity(stored) : item))
            );
          })
          .catch((error) => {
            console.error('[ActivityContext] Failed to persist activity:', error);
          });
      }

      return entry;
    },
    [isAuthenticated, user?.name]
  );

  const addNotification = useCallback((message, type = 'info', link = null) => {
    const entry = normalizeNotification({
      title: type === 'error' ? 'Action failed' : 'Update',
      message,
      type,
      link,
      read: false,
      timestamp: new Date().toISOString()
    });

    setNotifications((previous) => [entry, ...previous].slice(0, 50));

    if (isAuthenticated) {
      accountService
        .createNotification({
          title: entry.title,
          message: entry.message,
          type: entry.type,
          link:
            typeof link === 'string'
              ? {
                  path: link
                }
              : link || undefined
        })
        .then((stored) => {
          setNotifications((previous) =>
            previous.map((item) => (item.id === entry.id ? normalizeNotification(stored) : item))
          );
        })
        .catch((error) => {
          console.error('[ActivityContext] Failed to persist notification:', error);
        });
    }

    return entry;
  }, [isAuthenticated]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notificationId || item._id === notificationId
          ? {
              ...item,
              read: true,
              isRead: true
            }
          : item
      )
    );

    if (isAuthenticated) {
      accountService.markNotificationRead(notificationId).catch((error) => {
        console.error('[ActivityContext] Failed to mark notification as read:', error);
      });
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(() => {
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true,
        isRead: true
      }))
    );

    if (isAuthenticated) {
      accountService.markAllNotificationsRead().catch((error) => {
        console.error('[ActivityContext] Failed to mark all notifications as read:', error);
      });
    }
  }, [isAuthenticated]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);

    if (isAuthenticated) {
      accountService.clearNotifications().catch((error) => {
        console.error('[ActivityContext] Failed to clear notifications:', error);
      });
    }
  }, [isAuthenticated]);

  const getRecentActivities = useCallback(
    (count = 10) => activities.slice(0, count),
    [activities]
  );

  const getActivitiesByType = useCallback(
    (type) => activities.filter((item) => item.type === type),
    [activities]
  );

  const formatTimeAgo = useCallback((timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }, []);

  const value = useMemo(
    () => ({
      activities,
      notifications,
      unreadCount,
      logActivity,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      getRecentActivities,
      getActivitiesByType,
      formatTimeAgo,
      refreshActivity: loadActivity
    }),
    [
      activities,
      notifications,
      unreadCount,
      logActivity,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      getRecentActivities,
      getActivitiesByType,
      formatTimeAgo,
      loadActivity
    ]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

export default ActivityContext;
