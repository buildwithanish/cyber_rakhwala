import api from './api';

const ENDPOINT = '/account';

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export const accountService = {
  getDashboard: async () => api.get(`${ENDPOINT}/dashboard`),

  getNotifications: async (params = {}) =>
    api.get(`${ENDPOINT}/notifications${toQueryString(params)}`),

  createNotification: async (payload) => api.post(`${ENDPOINT}/notifications`, payload),

  markNotificationRead: async (id) => api.patch(`${ENDPOINT}/notifications/${id}/read`, {}),

  markAllNotificationsRead: async () => api.patch(`${ENDPOINT}/notifications/read-all`, {}),

  clearNotifications: async () => api.delete(`${ENDPOINT}/notifications`),

  getActivities: async (params = {}) =>
    api.get(`${ENDPOINT}/activities${toQueryString(params)}`),

  createActivity: async (payload) => api.post(`${ENDPOINT}/activities`, payload),

  getSearches: async (params = {}) =>
    api.get(`${ENDPOINT}/searches${toQueryString(params)}`),

  getCredits: async () => api.get(`${ENDPOINT}/credits`),

  getSubscriptions: async () => api.get(`${ENDPOINT}/subscriptions`),

  getTickets: async (params = {}) =>
    api.get(`${ENDPOINT}/tickets${toQueryString(params)}`)
};

export default accountService;
