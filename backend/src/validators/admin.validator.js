import { z } from 'zod';

export const adminListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    approvalStatus: z.string().optional(),
    role: z.string().optional(),
    group: z.string().optional(),
    category: z.string().optional(),
    department: z.string().optional(),
    type: z.string().optional()
  }),
  params: z.object({}).optional()
});

export const adminIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const adminUpsertSchema = z.object({
  body: z.record(z.any()),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().optional()
  })
});

export const adminApprovalSchema = z.object({
  body: z.object({
    approvalStatus: z.enum(['approved', 'rejected']),
    approvalNotes: z.string().max(500).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const adminBanSchema = z.object({
  body: z.object({
    reason: z.string().min(3).max(500)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});
