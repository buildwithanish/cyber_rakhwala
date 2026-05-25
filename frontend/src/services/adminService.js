import api, { setAuthToken } from './api';
import { ADMIN_API_BASE } from '../utils/appRoutes';

const ENDPOINT = ADMIN_API_BASE;
const USER_STORAGE_KEY = 'cyberRakhwala_user';

const persistAdminAuth = (response) => {
  if (response?.accessToken || response?.token) {
    setAuthToken(response.accessToken || response.token);
  }

  if (response?.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }

  return response;
};

export const adminService = {
  login: async (email, password) =>
    persistAdminAuth(
      await api.post(`${ENDPOINT}/auth/login`, {
        email,
        password
      })
    ),

  getDashboard: async () => api.get(`${ENDPOINT}/dashboard`),

  getAnalytics: async () => api.get(`${ENDPOINT}/analytics`),

  getProviders: async (query = '') => api.get(`${ENDPOINT}/providers${query ? `?${query}` : ''}`),

  getApiKeys: async (query = '') => api.get(`${ENDPOINT}/api-keys${query ? `?${query}` : ''}`),

  getSettings: async (query = '') => api.get(`${ENDPOINT}/settings${query ? `?${query}` : ''}`),

  getFeatureToggles: async (query = '') =>
    api.get(`${ENDPOINT}/feature-toggles${query ? `?${query}` : ''}`),

  getUsers: async (query = '') => api.get(`${ENDPOINT}/users${query ? `?${query}` : ''}`),

  createUser: async (payload) => api.post(`${ENDPOINT}/users`, payload),

  updateUser: async (id, payload) => api.patch(`${ENDPOINT}/users/${id}`, payload),

  banUser: async (id, reason) => api.post(`${ENDPOINT}/users/${id}/ban`, { reason }),

  unbanUser: async (id) => api.post(`${ENDPOINT}/users/${id}/unban`, {}),

  getRoles: async (query = '') => api.get(`${ENDPOINT}/roles${query ? `?${query}` : ''}`),

  saveRole: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/roles/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/roles`, payload),

  getPlans: async (query = '') => api.get(`${ENDPOINT}/plans${query ? `?${query}` : ''}`),

  savePlan: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/plans/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/plans`, payload),

  getPayments: async (query = '') => api.get(`${ENDPOINT}/payments${query ? `?${query}` : ''}`),

  getSubscriptions: async (query = '') => api.get(`${ENDPOINT}/subscriptions${query ? `?${query}` : ''}`),

  saveSubscription: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/subscriptions/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/subscriptions`, payload),

  saveProvider: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/providers/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/providers`, payload),

  getDatasets: async (query = '') => api.get(`${ENDPOINT}/datasets${query ? `?${query}` : ''}`),

  saveDataset: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/datasets/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/datasets`, payload),

  getCoupons: async (query = '') => api.get(`${ENDPOINT}/coupons${query ? `?${query}` : ''}`),

  saveCoupon: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/coupons/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/coupons`, payload),

  getContent: async (query = '') => api.get(`${ENDPOINT}/content${query ? `?${query}` : ''}`),

  saveContent: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/content/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/content`, payload),

  saveApiKey: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/api-keys/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/api-keys`, payload),

  getTools: async (query = '') => api.get(`${ENDPOINT}/tools${query ? `?${query}` : ''}`),

  saveTool: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/tools/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/tools`, payload),

  getSearchLogs: async (query = '') => api.get(`${ENDPOINT}/search-logs${query ? `?${query}` : ''}`),

  getTickets: async (query = '') => api.get(`${ENDPOINT}/tickets${query ? `?${query}` : ''}`),

  updateTicket: async (id, payload) => api.put(`${ENDPOINT}/tickets/${id}`, payload),

  getThreatEvents: async (query = '') => api.get(`${ENDPOINT}/threat-events${query ? `?${query}` : ''}`),

  getThreatAlerts: async (query = '') => api.get(`${ENDPOINT}/threat-alerts${query ? `?${query}` : ''}`),

  saveThreatAlert: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/threat-alerts/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/threat-alerts`, payload),

  saveSetting: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/settings/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/settings`, payload),

  saveFeatureToggle: async (payload) =>
    payload?._id || payload?.id
      ? api.put(`${ENDPOINT}/feature-toggles/${payload._id || payload.id}`, payload)
      : api.post(`${ENDPOINT}/feature-toggles`, payload)
};

export default adminService;
