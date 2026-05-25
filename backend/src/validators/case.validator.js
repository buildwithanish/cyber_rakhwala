import { z } from 'zod';

const caseStatuses = ['active', 'paused', 'completed', 'pending', 'archived'];
const priorities = ['low', 'medium', 'high', 'critical'];

export const listCasesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
    status: z.enum(caseStatuses).optional(),
    priority: z.enum(priorities).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'progress', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  }),
  params: z.object({}).optional()
});

export const caseIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const createCaseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(5000).optional(),
    status: z.enum(caseStatuses).optional(),
    priority: z.enum(priorities).optional(),
    progress: z.coerce.number().min(0).max(100).optional(),
    dataPoints: z.coerce.number().min(0).optional(),
    correlations: z.coerce.number().min(0).optional(),
    creditsSpent: z.coerce.number().min(0).optional(),
    tags: z.array(z.string().min(1)).optional(),
    checklist: z.array(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateCaseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(caseStatuses).optional(),
    priority: z.enum(priorities).optional(),
    progress: z.coerce.number().min(0).max(100).optional(),
    dataPoints: z.coerce.number().min(0).optional(),
    correlations: z.coerce.number().min(0).optional(),
    creditsSpent: z.coerce.number().min(0).optional(),
    tags: z.array(z.string().min(1)).optional(),
    checklist: z.array(z.any()).optional(),
    graphNodes: z.array(z.any()).optional(),
    graphEdges: z.array(z.any()).optional(),
    toolResults: z.array(z.any()).optional(),
    watchlistItems: z.array(z.any()).optional(),
    watchlistAlerts: z.array(z.any()).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const caseEvidenceSchema = z.object({
  body: z.object({
    evidenceId: z.string().min(1)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const caseEvidenceDeleteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    evidenceId: z.string().min(1)
  })
});

export const caseNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(3000)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const caseTeamSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().optional(),
    role: z.string().min(2).max(60).optional(),
    avatar: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const caseTeamMemberParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    memberId: z.string().min(1)
  })
});

export const caseTeamMemberUpdateSchema = z.object({
  body: z.object({
    role: z.string().min(2).max(60)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    memberId: z.string().min(1)
  })
});

export const caseTimelineSchema = z.object({
  body: z.object({
    event: z.string().min(2).max(300),
    type: z.string().min(2).max(80).optional(),
    notes: z.string().max(3000).optional(),
    attachments: z.array(z.any()).optional(),
    isMilestone: z.boolean().optional(),
    user: z.string().min(1).max(120).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  })
});

export const caseTimelineParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    timelineId: z.string().min(1)
  })
});

export const caseTimelineUpdateSchema = z.object({
  body: z.object({
    event: z.string().min(2).max(300).optional(),
    type: z.string().min(2).max(80).optional(),
    notes: z.string().max(3000).optional(),
    attachments: z.array(z.any()).optional(),
    isMilestone: z.boolean().optional(),
    user: z.string().min(1).max(120).optional(),
    time: z.string().min(1).optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1),
    timelineId: z.string().min(1)
  })
});

export const exportCasesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    format: z.enum(['json', 'csv']).default('json')
  }),
  params: z.object({}).optional()
});
