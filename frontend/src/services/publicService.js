import api from './api';

export const publicService = {
  submitContact: async (payload) => api.post('/contact', payload),

  submitFeedback: async (payload) => api.post('/feedback', payload),

  sendChatMessage: async ({ message, conversationId }) =>
    api.post('/chatbot/message', {
      message,
      conversationId
    }),

  getChatHistory: async (conversationId) => api.get(`/chatbot/history/${conversationId}`),

  clearChatHistory: async (conversationId) => api.delete(`/chatbot/history/${conversationId}`),

  getBootstrap: async () => api.get('/public/bootstrap')
};

export default publicService;
