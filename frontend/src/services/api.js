import { fetchWithRetry, checkCircuitBreaker } from '../utils/apiClient';
import { trackAPICall } from '../utils/analytics';
import { enqueueRequest } from '../utils/requestQueue';
import { recordApiCall } from '../utils/debugStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let authToken = null;
let refreshPromise = null;

const isPublicAuthEndpoint = (endpoint) =>
  endpoint === '/auth/login' ||
  endpoint === '/auth/register' ||
  endpoint === '/auth/demo' ||
  endpoint === '/auth/google' ||
  endpoint === '/auth/forgot-password' ||
  endpoint === '/auth/reset-password' ||
  endpoint === '/auth/verify-email' ||
  endpoint === '/auth/send-otp' ||
  endpoint === '/auth/verify-otp';

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('cyberRakhwala_token', token);
  } else {
    localStorage.removeItem('cyberRakhwala_token');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('cyberRakhwala_token');
  }
  return authToken;
};

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });

    const payload = await response.json().catch(() => ({}));
    const data = payload?.data || payload;

    if (!response.ok || !data?.accessToken) {
      setAuthToken(null);
      localStorage.removeItem('cyberRakhwala_user');
      throw new ApiError(payload?.message || 'Session expired', response.status, payload);
    }

    setAuthToken(data.accessToken || data.token);
    if (data.user) {
      localStorage.setItem('cyberRakhwala_user', JSON.stringify(data.user));
    }

    return data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

const fetchWithAuth = async (endpoint, options = {}, retryOnAuth = true) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  checkCircuitBreaker();

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  if (isFormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    credentials: 'include',
    headers
  };

  const startTime = performance.now();

  try {
    const response = await fetchWithRetry(url, config, {
      returnMeta: true,
      throwOnHttpError: false
    });
    const payload = response.data;

    if (
      response.status === 401 &&
      retryOnAuth &&
      token &&
      endpoint !== '/auth/refresh-token' &&
      !isPublicAuthEndpoint(endpoint)
    ) {
      await refreshAccessToken();
      return fetchWithAuth(endpoint, options, false);
    }

    if (!response.ok) {
      const duration = performance.now() - startTime;
      const requestId = response.headers['x-request-id'] || null;
      trackAPICall(endpoint, method, duration, false, payload);
      recordApiCall({
        endpoint,
        method,
        url,
        ok: false,
        status: response.status,
        duration: Math.round(duration),
        requestId,
        response: payload
      });

      if (response.status === 429) {
        enqueueRequest({
          endpoint,
          method: options.method || 'GET',
          body:
            options.body && typeof options.body === 'string'
              ? JSON.parse(options.body)
              : undefined
        });
      }

      const apiError = new ApiError(
        payload?.message || payload?.error || 'An error occurred',
        response.status,
        payload
      );
      apiError.logged = true;
      throw apiError;
    }

    const duration = performance.now() - startTime;
    const requestId = response.headers['x-request-id'] || null;
    trackAPICall(endpoint, method, duration, true);
    recordApiCall({
      endpoint,
      method,
      url,
      ok: true,
      status: response.status,
      duration: Math.round(duration),
      requestId
    });

    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      if (payload.success === false) {
        throw new ApiError(payload.message || 'Request failed', response.status, payload);
      }
      return payload.data;
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError && error.logged) {
      throw error;
    }

    const duration = performance.now() - startTime;
    trackAPICall(endpoint, method, duration, false, error);
    recordApiCall({
      endpoint,
      method,
      url,
      ok: false,
      status: error?.status || 0,
      duration: Math.round(duration),
      requestId: null,
      response: error?.data || null,
      error: error?.message || 'Network error occurred'
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error.message || 'Network error occurred', 0, null);
  }
};

export const api = {
  get: (endpoint, options = {}) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, data, options = {}) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),

  put: (endpoint, data, options = {}) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),

  patch: (endpoint, data, options = {}) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),

  delete: (endpoint, options = {}) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' })
};

export default api;
