import { z } from 'zod';

export const accountListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.string().optional()
  }),
  params: z.object({}).optional()
});

export const notificationParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const activityCreateSchema = z.object({
  body: z.object({
    action: z.string().min(2).max(200),
    type: z.string().min(2).max(80).optional(),
    targetType: z.string().max(80).optional(),
    targetId: z.string().max(120).optional(),
    details: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const notificationCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160).optional(),
    message: z.string().min(2).max(500),
    type: z.string().min(2).max(80).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    link: z
      .object({
        label: z.string().optional(),
        path: z.string().optional()
      })
      .optional(),
    metadata: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
