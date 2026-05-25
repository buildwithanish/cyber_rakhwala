import { z } from 'zod';

export const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
    category: z.string().optional(),
    page: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const feedbackSchema = z.object({
  body: z.object({
    type: z.string().min(2).max(60),
    rating: z.coerce.number().min(1).max(5),
    message: z.string().min(5).max(5000),
    email: z.string().email().optional(),
    subject: z.string().min(3).max(200).optional(),
    page: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const chatbotMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000),
    conversationId: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const conversationParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    conversationId: z.string().min(1)
  })
});

export const analyticsEventsSchema = z.object({
  body: z.object({
    events: z
      .array(
        z.object({
          category: z.string(),
          action: z.string(),
          label: z.any().optional(),
          value: z.any().optional(),
          timestamp: z.any().optional(),
          sessionId: z.string().optional(),
          url: z.string().optional(),
          userAgent: z.string().optional(),
          context: z.record(z.any()).optional()
        })
      )
      .min(1)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const captchaSchema = z.object({
  body: z.object({
    token: z.string().min(5),
    provider: z.enum(['recaptcha-v2', 'recaptcha-v3', 'turnstile']).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
