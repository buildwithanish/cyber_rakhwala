import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import authService from '../services/authService';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE = 5 * 60 * 1000;

const normalizeSessionEntry = (session = {}, user = null) => {
  const deviceInfo = session.device?.type || session.device || {};

  return {
    id: session.id || session._id || `session-${Math.random().toString(36).slice(2, 10)}`,
    type: session.revokedAt ? 'logout' : 'login',
    timestamp: session.createdAt || new Date().toISOString(),
    user: user
      ? {
          email: user.email,
          role: user.role,
          name: user.name
        }
      : null,
    device: {
      device: deviceInfo.kind || deviceInfo.device || 'Desktop',
      os: deviceInfo.os || 'Unknown',
      browser: deviceInfo.browser || 'Unknown'
    },
    location: session.location || 'Unknown',
    ip: session.ipAddress || 'Unknown',
    userAgent: session.userAgent || navigator.userAgent,
    success: true,
    isCurrent: Boolean(session.isCurrent),
    lastActivityAt: session.lastActivityAt || session.updatedAt || session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt || null
  };
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  let os = 'Unknown';
  let browser = 'Unknown';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

  return { device, os, browser };
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_TIMEOUT);
  const [loginActivity, setLoginActivity] = useState([]);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  const loadSessions = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoginActivity([]);
      return;
    }

    try {
      const sessions = await authService.getSessions();
      setLoginActivity(
        Array.isArray(sessions) ? sessions.map((item) => normalizeSessionEntry(item, user)) : []
      );
    } catch (error) {
      console.error('[SessionContext] Failed to load sessions:', error);
      setLoginActivity([]);
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const recordLogin = useCallback((userData, type = 'login') => {
    const entry = {
      id: `login-${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      user: userData
        ? {
            email: userData.email,
            role: userData.role,
            name: userData.name
          }
        : null,
      device: getDeviceInfo(),
      location: 'Unknown',
      ip: 'Browser',
      userAgent: navigator.userAgent,
      success: type === 'login' || type === 'logout'
    };

    setLoginActivity((previous) => [entry, ...previous].slice(0, 100));
    return entry;
  }, []);

  const recordLogout = useCallback(
    (reason = 'manual') => {
      const entry = {
        id: `logout-${Date.now()}`,
        type: reason === 'timeout' ? 'session_expired' : 'logout',
        timestamp: new Date().toISOString(),
        user: user
          ? {
              email: user.email,
              role: user.role,
              name: user.name
            }
          : null,
        device: getDeviceInfo(),
        reason,
        success: true
      };

      setLoginActivity((previous) => [entry, ...previous].slice(0, 100));
      return entry;
    },
    [user]
  );

  const resetTimers = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
    setTimeRemaining(SESSION_TIMEOUT);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (isAuthenticated) {
      warningRef.current = setTimeout(() => {
        setShowTimeoutWarning(true);
        setTimeRemaining(WARNING_BEFORE);

        countdownRef.current = setInterval(() => {
          setTimeRemaining((previous) => {
            const nextValue = previous - 1000;
            if (nextValue <= 0) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return nextValue;
          });
        }, 1000);
      }, SESSION_TIMEOUT - WARNING_BEFORE);

      timeoutRef.current = setTimeout(() => {
        recordLogout('timeout');
        logout();
      }, SESSION_TIMEOUT);
    }
  }, [isAuthenticated, logout, recordLogout]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    const handleActivity = () => {
      if (!showTimeoutWarning) {
        resetTimers();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [authLoading, isAuthenticated, resetTimers, showTimeoutWarning]);

  const extendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    resetTimers();
  }, [resetTimers]);

  const getUserActivity = useCallback(() => {
    if (!user?.email) return [];
    return loginActivity.filter((entry) => entry.user?.email === user.email || !entry.user);
  }, [loginActivity, user?.email]);

  const getAllActivity = useCallback(() => loginActivity, [loginActivity]);

  const clearActivity = useCallback(() => {
    setLoginActivity([]);
  }, []);

  const getActivityStats = useCallback(() => {
    const userActivity = getUserActivity();
    const now = Date.now();
    const last24h = userActivity.filter((item) => now - new Date(item.timestamp).getTime() < 24 * 60 * 60 * 1000);
    const last7d = userActivity.filter((item) => now - new Date(item.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000);

    return {
      totalLogins: userActivity.filter((item) => item.type === 'login').length,
      last24Hours: last24h.length,
      last7Days: last7d.length,
      failedAttempts: userActivity.filter((item) => item.type === 'failed_attempt').length,
      sessionExpiries: userActivity.filter((item) => item.type === 'session_expired').length,
      lastLogin: userActivity.find((item) => item.type === 'login')?.timestamp
    };
  }, [getUserActivity]);

  const value = useMemo(
    () => ({
      showTimeoutWarning,
      timeRemaining,
      extendSession,
      recordLogin,
      recordLogout,
      loginActivity,
      getUserActivity,
      getAllActivity,
      clearActivity,
      getActivityStats,
      lastActivity,
      refreshSessions: loadSessions
    }),
    [
      clearActivity,
      extendSession,
      getActivityStats,
      getAllActivity,
      getUserActivity,
      lastActivity,
      loadSessions,
      loginActivity,
      recordLogin,
      recordLogout,
      showTimeoutWarning,
      timeRemaining
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export default SessionContext;
