import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { Case } from '../models/Case.js';
import { Evidence } from '../models/Evidence.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { buildKeywordQuery, createNumberSequence } from '../utils/helpers.js';
import { createActivity } from './activity.service.js';
import { createAuditLog } from './audit.service.js';

const caseProjection = {
  id: (doc) => String(doc._id),
  caseId: (doc) => doc.caseNumber,
  caseNumber: (doc) => doc.caseNumber
};

const presentCase = (doc) => {
  const value = doc.toObject ? doc.toObject() : doc;
  return {
    ...value,
    ...Object.fromEntries(Object.entries(caseProjection).map(([key, getter]) => [key, getter(value)]))
  };
};

const findOwnedCase = async (id, user) => {
  const filter = {
    $or: [
      ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
      { caseNumber: id }
    ]
  };

  if (!['admin', 'super_admin'].includes(user.role)) {
    filter.owner = user._id;
  }

  const caseItem = await Case.findOne(filter).populate('evidence');
  if (!caseItem) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Case not found');
  }

  return caseItem;
};

export const listCases = async ({ query, user }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['title', 'description', 'caseNumber'])
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (!['admin', 'super_admin'].includes(user.role)) {
    filter.owner = user._id;
  }

  const sortField = query.sortBy || 'updatedAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Case.find(filter)
      .populate('evidence')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit),
    Case.countDocuments(filter)
  ]);

  return {
    items: items.map(presentCase),
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const getCaseById = async ({ id, user }) => presentCase(await findOwnedCase(id, user));

export const createCaseRecord = async ({ payload, user, req }) => {
  const total = await Case.countDocuments();
  const caseItem = await Case.create({
    caseNumber: createNumberSequence('CR', total + 1),
    title: payload.title,
    description: payload.description,
    owner: user._id,
    status: payload.status || 'active',
    priority: payload.priority || 'medium',
    progress: payload.progress || 0,
    tags: payload.tags || [],
    checklist: payload.checklist || [],
    team: [
      {
        user: user._id,
        name: user.name,
        email: user.email,
        role: 'owner',
        avatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
        online: true
      }
    ],
    timeline: [
      {
        event: 'Case created',
        type: 'system'
      }
    ]
  });

  await Promise.all([
    createActivity({
      user,
      actorName: user.name,
      action: 'Case created',
      type: 'case',
      targetType: 'case',
      targetId: String(caseItem._id),
      details: {
        caseNumber: caseItem.caseNumber
      }
    }),
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'case.create',
      resourceType: 'Case',
      resourceId: String(caseItem._id),
      changes: {
        after: presentCase(caseItem)
      },
      req
    })
  ]);

  return presentCase(caseItem);
};

export const updateCaseRecord = async ({ id, payload, user, req }) => {
  const caseItem = await findOwnedCase(id, user);
  const before = presentCase(caseItem);
  Object.assign(caseItem, payload);
  caseItem.timeline.push({
    event: 'Case updated',
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.update',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    changes: {
      before,
      after: presentCase(caseItem)
    },
    req
  });

  return presentCase(caseItem);
};

export const deleteCaseRecord = async ({ id, user, req }) => {
  const caseItem = await findOwnedCase(id, user);
  await Case.deleteOne({ _id: caseItem._id });
  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.delete',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    changes: {
      before: presentCase(caseItem)
    },
    req
  });
};

export const linkEvidenceToCase = async ({ caseId, evidenceId, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  const evidence = await Evidence.findOne({
    _id: evidenceId,
    owner: ['admin', 'super_admin'].includes(user.role) ? { $exists: true } : user._id
  });

  if (!evidence) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Evidence not found');
  }

  if (!caseItem.evidence.some((item) => String(item) === String(evidence._id))) {
    caseItem.evidence.push(evidence._id);
  }
  evidence.case = caseItem._id;
  await Promise.all([caseItem.save(), evidence.save()]);

  caseItem.timeline.push({
    event: `Evidence linked: ${evidence.title}`,
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.evidence.link',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      evidenceId: String(evidence._id)
    },
    req
  });

  return presentCase(await findOwnedCase(caseId, user));
};

export const unlinkEvidenceFromCase = async ({ caseId, evidenceId, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  caseItem.evidence = caseItem.evidence.filter((item) => String(item) !== String(evidenceId));
  caseItem.timeline.push({
    event: `Evidence removed`,
    type: 'action'
  });
  await caseItem.save();

  await Evidence.findByIdAndUpdate(evidenceId, {
    $unset: {
      case: 1
    }
  });

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.evidence.unlink',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      evidenceId: String(evidenceId)
    },
    req
  });

  return presentCase(await findOwnedCase(caseId, user));
};

export const addCaseNote = async ({ caseId, content, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  caseItem.notes.push({
    content,
    authorName: user.name
  });
  caseItem.timeline.push({
    event: 'Note added',
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.note.add',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    req
  });

  return presentCase(caseItem);
};

export const addCaseTeamMember = async ({ caseId, payload, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  caseItem.team.push({
    ...payload,
    online: false
  });
  caseItem.timeline.push({
    event: `Team member added: ${payload.name}`,
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.team.add',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: payload,
    req
  });

  return presentCase(caseItem);
};

export const addCaseTimelineEvent = async ({ caseId, payload, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  caseItem.timeline.push({
    event: payload.event,
    type: payload.type || 'action',
    notes: payload.notes || '',
    attachments: payload.attachments || [],
    isMilestone: Boolean(payload.isMilestone),
    user: payload.user || user.name
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.timeline.add',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: payload,
    req
  });

  return presentCase(caseItem);
};

export const updateCaseTimelineEvent = async ({ caseId, timelineId, payload, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  const timelineEntry = caseItem.timeline.id(timelineId);

  if (!timelineEntry) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Timeline event not found');
  }

  if (payload.event !== undefined) timelineEntry.event = payload.event;
  if (payload.type !== undefined) timelineEntry.type = payload.type;
  if (payload.notes !== undefined) timelineEntry.notes = payload.notes;
  if (payload.attachments !== undefined) timelineEntry.attachments = payload.attachments;
  if (payload.isMilestone !== undefined) timelineEntry.isMilestone = Boolean(payload.isMilestone);
  if (payload.user !== undefined) timelineEntry.user = payload.user;
  if (payload.time !== undefined) {
    const nextTime = new Date(payload.time);
    if (!Number.isNaN(nextTime.getTime())) {
      timelineEntry.time = nextTime;
    }
  }

  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.timeline.update',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      timelineId,
      payload
    },
    req
  });

  return presentCase(caseItem);
};

export const deleteCaseTimelineEvent = async ({ caseId, timelineId, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  const timelineEntry = caseItem.timeline.id(timelineId);

  if (!timelineEntry) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Timeline event not found');
  }

  const removedEvent = timelineEntry.event;
  timelineEntry.deleteOne();
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.timeline.delete',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      timelineId,
      event: removedEvent
    },
    req
  });

  return presentCase(caseItem);
};

export const removeCaseTeamMember = async ({ caseId, memberId, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  const existing = caseItem.team.find((member) => String(member._id) === String(memberId));

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team member not found');
  }

  caseItem.team = caseItem.team.filter((member) => String(member._id) !== String(memberId));
  caseItem.timeline.push({
    event: `Team member removed: ${existing.name}`,
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.team.remove',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      memberId,
      name: existing.name
    },
    req
  });

  return presentCase(caseItem);
};

export const updateCaseTeamMemberRole = async ({ caseId, memberId, role, user, req }) => {
  const caseItem = await findOwnedCase(caseId, user);
  const member = caseItem.team.find((entry) => String(entry._id) === String(memberId));

  if (!member) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Team member not found');
  }

  member.role = role;
  caseItem.timeline.push({
    event: `Team role updated: ${member.name} -> ${role}`,
    type: 'action'
  });
  await caseItem.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'case.team.role.update',
    resourceType: 'Case',
    resourceId: String(caseItem._id),
    metadata: {
      memberId,
      role
    },
    req
  });

  return presentCase(caseItem);
};

export const getCaseStatistics = async (user) => {
  const filter = ['admin', 'super_admin'].includes(user.role) ? {} : { owner: user._id };
  const cases = await Case.find(filter).lean();
  const byPriority = Object.fromEntries(['low', 'medium', 'high', 'critical'].map((key) => [key, 0]));

  for (const item of cases) {
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  }

  return {
    total: cases.length,
    active: cases.filter((item) => item.status === 'active').length,
    pending: cases.filter((item) => item.status === 'pending').length,
    closed: cases.filter((item) => ['completed', 'archived'].includes(item.status)).length,
    avgProgress: cases.length
      ? Math.round(cases.reduce((sum, item) => sum + (item.progress || 0), 0) / cases.length)
      : 0,
    byPriority
  };
};

export const exportCases = async ({ user, format = 'json' }) => {
  const filter = ['admin', 'super_admin'].includes(user.role) ? {} : { owner: user._id };
  const items = await Case.find(filter).lean();
  if (format === 'csv') {
    const header = ['caseNumber', 'title', 'status', 'priority', 'progress'];
    const rows = items.map((item) => header.map((field) => item[field] ?? '').join(','));
    return [header.join(','), ...rows].join('\n');
  }

  return items.map(presentCase);
};
