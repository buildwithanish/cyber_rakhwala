import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const hasToken = authService.hasAccessToken();
      const storedUser = hasToken ? authService.getUser() : null;

      if (!hasToken) {
        authService.clearLocal();
        if (mounted) {
          setUser(null);
          setIsDemo(false);
          setIsLoading(false);
        }
        return;
      }

      if (storedUser && mounted) {
        setUser(storedUser);
        setIsDemo(localStorage.getItem('cyberRakhwala_isDemo') === 'true');
      }

      if (!storedUser) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        if (!mounted) return;
        setUser(currentUser);
      } catch {
        try {
          const refreshed = await authService.refreshToken();
          if (!mounted) return;
          setUser(refreshed.user || authService.getUser());
        } catch (error) {
          authService.clearLocal();
          if (!mounted) return;
          setUser(null);
          setIsDemo(false);
          setAuthError(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSession = useCallback((userData, demoSession) => {
    localStorage.setItem('cyberRakhwala_user', JSON.stringify(userData));
    localStorage.setItem('cyberRakhwala_isDemo', String(demoSession));
  }, []);

  const updateUser = useCallback(
    (userData, demoSession = isDemo) => {
      setUser(userData);
      if (userData) {
        persistSession(userData, demoSession);
      }
    },
    [isDemo, persistSession]
  );

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    updateUser(currentUser);
    return currentUser;
  }, [updateUser]);

  const loginAsDemo = useCallback(
    async (role) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const response = await authService.demoLogin(role);
        const userData = response.user || authService.getUser();
        updateUser(userData, true);
        setIsDemo(true);
        persistSession(userData, true);
        return { success: true, user: userData };
      } catch (error) {
        setAuthError(error.message || 'Demo login failed');
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const response = await authService.login(email, password);
        const userData = response.user || authService.getUser();
        updateUser(userData, false);
        setIsDemo(false);
        persistSession(userData, false);
        return { success: true, user: userData };
      } catch (error) {
        setAuthError(error.message || 'Login failed');
        return {
          success: false,
          error: error.message,
          code: error?.data?.code || null,
          details: error?.data || null
        };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const signup = useCallback(
    async (userData) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const response = await authService.register(userData);
        setIsDemo(false);
        const needsApproval = response?.needsApproval || response?.approvalStatus === 'pending';

        if (!needsApproval && (response?.accessToken || response?.token || response?.user)) {
          const nextUser = response.user || authService.getUser();
          updateUser(nextUser, false);
          persistSession(nextUser, false);
          return { success: true, user: nextUser, response };
        }

        authService.clearLocal();
        setUser(null);
        localStorage.removeItem('cyberRakhwala_isDemo');
        return {
          success: true,
          response,
          pendingApproval: needsApproval
        };
      } catch (error) {
        setAuthError(error.message || 'Signup failed');
        return {
          success: false,
          error: error.message,
          code: error?.data?.code || null,
          details: error?.data || null
        };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession, updateUser]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsDemo(false);
    setAuthError(null);
    localStorage.removeItem('cyberRakhwala_isDemo');
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    isLoading,
    isDemo,
    authError,
    isAuthenticated: !!user && authService.hasAccessToken(),
    login,
    loginAsDemo,
    signup,
    logout,
    clearError,
    refreshUser,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
