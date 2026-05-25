import api from './api';

const ENDPOINT = '/tools/search-history';

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

export const searchHistoryService = {
  list: async (params = {}) => api.get(`${ENDPOINT}${toQueryString(params)}`),

  clear: async (params = {}) => api.delete(`${ENDPOINT}${toQueryString(params)}`),

  remove: async (id) => api.delete(`${ENDPOINT}/${id}`),

  setBookmark: async (id, bookmarked) =>
    api.patch(`${ENDPOINT}/${id}/bookmark`, { bookmarked })
};

export default searchHistoryService;
