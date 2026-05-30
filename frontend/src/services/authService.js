import api, { setAuthToken, getAuthToken } from './api';

const ENDPOINT = '/auth';
const USER_STORAGE_KEY = 'cyberRakhwala_user';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const getStoredUser = () => {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

const saveUser = (user) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const clearUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('cyberRakhwala_token');
};

const persistAuth = (response) => {
  if (response?.accessToken || response?.token) {
    setAuthToken(response.accessToken || response.token);
  }
  if (response?.user) {
    saveUser(response.user);
  }
  return response;
};

export const authService = {
  login: async (email, password) => persistAuth(await api.post(`${ENDPOINT}/login`, { email, password })),

  verifyLoginOtp: async (email, code) => persistAuth(await api.post(`${ENDPOINT}/verify-login-otp`, { email, code })),

  register: async (userData) => api.post(`${ENDPOINT}/register`, userData),

  demoLogin: async (role) => persistAuth(await api.post(`${ENDPOINT}/demo`, { role })),

  logout: async () => {
    try {
      await api.post(`${ENDPOINT}/logout`);
    } finally {
      clearUser();
      setAuthToken(null);
    }

    return { success: true };
  },

  getCurrentUser: async () => {
    const user = await api.get(`${ENDPOINT}/me`);
    saveUser(user);
    return user;
  },

  updateProfile: async (updates) => {
    const response = await api.put(`${ENDPOINT}/profile`, updates);
    const nextUser = response?.user || response;
    if (nextUser) {
      saveUser(nextUser);
    }
    return nextUser;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/uploads/image', formData);
    const upload = response?.file || response;

    if (!upload?.url) {
      return upload;
    }

    return {
      ...upload,
      absoluteUrl: upload.url.startsWith('http') ? upload.url : `${API_ORIGIN}${upload.url}`
    };
  },

  changePassword: async (currentPassword, newPassword) =>
    api.post(`${ENDPOINT}/change-password`, {
      currentPassword,
      newPassword
    }),

  requestPasswordReset: async (email) => api.post(`${ENDPOINT}/forgot-password`, { email }),

  resetPassword: async (token, newPassword) =>
    api.post(`${ENDPOINT}/reset-password`, { token, newPassword }),

  verifyEmail: async (token) => api.post(`${ENDPOINT}/verify-email`, { token }),

  getSessions: async () => api.get(`${ENDPOINT}/sessions`),

  revokeSession: async (sessionId) => api.delete(`${ENDPOINT}/sessions/${sessionId}`),

  revokeAllSessions: async () => api.delete(`${ENDPOINT}/sessions`),

  hasAccessToken: () => !!getAuthToken(),

  isAuthenticated: () => !!getAuthToken() && !!getStoredUser(),

  getUser: () => getStoredUser(),

  refreshToken: async () => persistAuth(await api.post(`${ENDPOINT}/refresh-token`)),

  clearLocal: () => {
    clearUser();
    setAuthToken(null);
  }
};

export default authService;
