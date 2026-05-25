import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  bootstrap,
  chatbotClear,
  chatbotHistory,
  chatbotMessage,
  optionalAuth,
  postAnalyticsEvents,
  submitContact,
  submitFeedback,
  verifyCaptcha
} from '../../controllers/public.controller.js';
import {
  analyticsEventsSchema,
  captchaSchema,
  chatbotMessageSchema,
  contactSchema,
  conversationParamSchema,
  feedbackSchema
} from '../../validators/public.validator.js';

const router = Router();

router.get('/public/bootstrap', bootstrap);
router.post('/contact', optionalAuth, validate(contactSchema), submitContact);
router.post('/feedback', optionalAuth, validate(feedbackSchema), submitFeedback);
router.post('/chatbot/message', optionalAuth, validate(chatbotMessageSchema), chatbotMessage);
router.get('/chatbot/history/:conversationId', optionalAuth, validate(conversationParamSchema), chatbotHistory);
router.delete('/chatbot/history/:conversationId', optionalAuth, validate(conversationParamSchema), chatbotClear);
router.post('/analytics/events', optionalAuth, validate(analyticsEventsSchema), postAnalyticsEvents);
router.post('/verify-captcha', validate(captchaSchema), verifyCaptcha);
router.post('/verify-turnstile', validate(captchaSchema), verifyCaptcha);

export default router;
