import { z } from 'zod';

export const listEvidenceSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    type: z.string().optional(),
    caseId: z.string().optional(),
    verified: z
      .union([z.literal('true'), z.literal('false')])
      .transform((value) => value === 'true')
      .optional()
  }),
  params: z.object({}).optional()
});

export const evidenceIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const createEvidenceSchema = z.object({
  body: z.object({
    case: z.string().optional(),
    type: z.string().min(2).max(60),
    title: z.string().min(2).max(200),
    data: z.string().min(1).max(5000),
    notes: z.string().max(5000).optional(),
    source: z.string().max(200).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateEvidenceSchema = z.object({
  body: z.object({
    case: z.string().optional(),
    type: z.string().min(2).max(60).optional(),
    title: z.string().min(2).max(200).optional(),
    data: z.string().min(1).max(5000).optional(),
    notes: z.string().max(5000).optional(),
    source: z.string().max(200).optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const verifyEvidenceSchema = z.object({
  body: z.object({
    notes: z.string().max(2000).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const tagSchema = z.object({
  body: z.object({
    tag: z.string().min(1).max(100)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const tagDeleteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    tag: z.string().min(1)
  })
});

export const correlationSchema = z.object({
  body: z.object({
    correlatedId: z.string().min(1),
    correlationType: z.string().min(2).max(100).default('related')
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const correlationDeleteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    correlatedId: z.string().min(1)
  })
});

export const exportEvidenceSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    format: z.enum(['json', 'csv']).default('json'),
    ids: z.string().optional()
  }),
  params: z.object({}).optional()
});

export const bulkIdsSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
