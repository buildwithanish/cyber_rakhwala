import { z } from 'zod';

export const toolActionSchema = z.object({
  body: z.record(z.any()).optional(),
  query: z.record(z.any()).optional(),
  params: z.object({
    category: z.string().min(1),
    action: z.string().min(1),
    entityId: z.string().optional()
  })
});

export const osintActionSchema = z.object({
  body: z.record(z.any()).optional(),
  query: z.record(z.any()).optional(),
  params: z.object({
    action: z.enum(['email', 'phone', 'domain', 'ip', 'username', 'image', 'social', 'threat']),
    id: z.string().optional()
  })
});

export const searchLogListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    toolId: z.string().optional(),
    searchType: z.string().optional(),
    bookmarked: z
      .union([z.literal('true'), z.literal('false')])
      .transform((value) => value === 'true')
      .optional()
  }),
  params: z.object({}).optional()
});

export const searchLogBookmarkSchema = z.object({
  body: z.object({
    bookmarked: z.boolean()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const searchLogIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});
