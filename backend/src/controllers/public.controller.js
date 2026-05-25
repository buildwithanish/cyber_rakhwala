import { asyncHandler } from '../utils/asyncHandler.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import { ingestAnalyticsEvents } from '../services/analytics.service.js';
import { sendChatbotMessage } from '../services/chatbot.service.js';
import {
  clearConversationHistory,
  createSupportEntry,
  getConversationHistory,
  getPublicBootstrap,
  verifyCaptchaToken
} from '../services/public.service.js';

export const optionalAuth = optionalAuthenticate;

export const submitContact = asyncHandler(async (req, res) => {
  const ticket = await createSupportEntry({
    payload: req.validated.body,
    type: 'contact',
    user: req.user,
    req
  });
  res.success({
    statusCode: 201,
    message: 'Contact request submitted',
    data: {
      ticketNumber: ticket.ticketNumber
    }
  });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const ticket = await createSupportEntry({
    payload: req.validated.body,
    type: req.validated.body.type,
    user: req.user,
    req
  });
  res.success({
    statusCode: 201,
    message: 'Feedback submitted',
    data: {
      ticketNumber: ticket.ticketNumber
    }
  });
});

export const chatbotMessage = asyncHandler(async (req, res) => {
  const response = await sendChatbotMessage({
    user: req.user,
    conversationId: req.validated.body.conversationId,
    message: req.validated.body.message
  });
  res.success({
    message: 'Chatbot response generated',
    data: {
      conversationId: response.conversation._id,
      reply: response.reply,
      messages: response.conversation.messages
    }
  });
});

export const chatbotHistory = asyncHandler(async (req, res) => {
  const conversation = await getConversationHistory({
    conversationId: req.validated.params.conversationId,
    user: req.user
  });
  res.success({
    message: 'Conversation loaded',
    data: conversation
  });
});

export const chatbotClear = asyncHandler(async (req, res) => {
  await clearConversationHistory({
    conversationId: req.validated.params.conversationId,
    user: req.user
  });
  res.success({
    message: 'Conversation cleared'
  });
});

export const postAnalyticsEvents = asyncHandler(async (req, res) => {
  const count = await ingestAnalyticsEvents({
    events: req.validated.body.events,
    userId: req.user?._id
  });
  res.success({
    statusCode: 202,
    message: 'Analytics events ingested',
    data: {
      count
    }
  });
});

export const bootstrap = asyncHandler(async (_req, res) => {
  const data = await getPublicBootstrap();
  res.success({
    message: 'Public bootstrap loaded',
    data
  });
});

export const verifyCaptcha = asyncHandler(async (req, res) => {
  const result = await verifyCaptchaToken(req.validated.body);
  res.success({
    message: 'Captcha verified',
    data: result,
    meta: {
      success: Boolean(result.success)
    }
  });
});
