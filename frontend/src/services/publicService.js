import api from './api';

const normalizeMessage = (value) => String(value ?? '').trim();

export const publicService = {
  submitContact: async (payload = {}) =>
    api.post('/contact', {
      name: String(payload.name ?? '').trim(),
      email: String(payload.email ?? '').trim(),
      subject: String(payload.subject ?? '').trim(),
      message: normalizeMessage(payload.message ?? payload.body),
      category: payload.category,
      page: payload.page
    }),

  submitFeedback: async (payload = {}) =>
    api.post('/feedback', {
      type: String(payload.type ?? '').trim(),
      rating: payload.rating,
      message: normalizeMessage(payload.message ?? payload.body),
      email: payload.email ? String(payload.email).trim() : undefined,
      subject: payload.subject ? String(payload.subject).trim() : undefined,
      page: payload.page,
      metadata: payload.metadata
    }),

  sendChatMessage: async ({ message, conversationId } = {}) => {
    const normalizedMessage = normalizeMessage(message);
    if (!normalizedMessage) {
      throw new Error('Please enter a message before sending.');
    }

    return api.post('/chatbot/message', {
      message: normalizedMessage,
      conversationId: conversationId || undefined
    });
  },

  getChatHistory: async (conversationId) => api.get(`/chatbot/history/${conversationId}`),

  clearChatHistory: async (conversationId) => api.delete(`/chatbot/history/${conversationId}`),

  getBootstrap: async () => api.get('/public/bootstrap')
};

export default publicService;
