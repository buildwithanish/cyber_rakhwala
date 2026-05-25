import api from './api';

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

export const paymentService = {
  getPlans: async (params = {}) => api.get(`/plans${toQueryString(params)}`),

  validateRedeemCode: async (code, planId) =>
    api.post('/redeem/validate', {
      code,
      planId
    }),

  createOrder: async (payload) => api.post('/payments/create-order', payload),

  verifyOrder: async (payload) => api.post('/payments/verify', payload),

  getPayments: async () => api.get('/payments/my'),

  getSubscriptions: async () => api.get('/subscriptions/my'),

  getInvoices: async () => api.get('/invoices/my')
};

export default paymentService;
