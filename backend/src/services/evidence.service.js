import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Case } from '../models/Case.js';
import { Evidence } from '../models/Evidence.js';
import { ApiError } from '../utils/ApiError.js';
import { buildKeywordQuery } from '../utils/helpers.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { createActivity } from './activity.service.js';
import { createAuditLog } from './audit.service.js';

const presentEvidence = (doc) => {
  const value = doc.toObject ? doc.toObject() : doc;
  return {
    ...value,
    id: String(value._id)
  };
};

const buildAccessFilter = (user) =>
  ['admin', 'super_admin'].includes(user.role) ? {} : { owner: user._id };

const findOwnedEvidence = async (id, user) => {
  const item = await Evidence.findOne({
    _id: id,
    ...buildAccessFilter(user)
  });

  if (!item) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Evidence not found');
  }

  return item;
};

export const listEvidence = async ({ query, user }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildAccessFilter(user),
    ...buildKeywordQuery(query.search, ['title', 'data', 'notes', 'source'])
  };

  if (query.type) {
    filter.type = query.type;
  }

  if (query.caseId) {
    filter.case = query.caseId;
  }

  if (typeof query.verified === 'boolean') {
    filter.verified = query.verified;
  }

  const [items, total] = await Promise.all([
    Evidence.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Evidence.countDocuments(filter)
  ]);

  return {
    items: items.map(presentEvidence),
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const getEvidenceById = async ({ id, user }) => presentEvidence(await findOwnedEvidence(id, user));

export const createEvidenceRecord = async ({ payload, user, req }) => {
  let caseId = payload.case;
  if (caseId) {
    const caseItem = await Case.findOne({
      $or: [
        ...(mongoose.isValidObjectId(caseId) ? [{ _id: caseId }] : []),
        { caseNumber: caseId }
      ]
    });
    caseId = caseItem?._id ?? caseId;
  }

  const item = await Evidence.create({
    ...payload,
    case: caseId || undefined,
    owner: user._id
  });

  if (caseId) {
    await Case.findByIdAndUpdate(caseId, {
      $addToSet: {
        evidence: item._id
      }
    });
  }

  await Promise.all([
    createActivity({
      user,
      actorName: user.name,
      action: 'Evidence created',
      type: 'evidence',
      targetType: 'evidence',
      targetId: String(item._id)
    }),
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'evidence.create',
      resourceType: 'Evidence',
      resourceId: String(item._id),
      changes: {
        after: presentEvidence(item)
      },
      req
    })
  ]);

  return presentEvidence(item);
};

export const updateEvidenceRecord = async ({ id, payload, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  const before = presentEvidence(item);
  Object.assign(item, payload);
  await item.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.update',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    changes: {
      before,
      after: presentEvidence(item)
    },
    req
  });

  return presentEvidence(item);
};

export const deleteEvidenceRecord = async ({ id, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  await Evidence.deleteOne({ _id: item._id });
  if (item.case) {
    await Case.findByIdAndUpdate(item.case, {
      $pull: {
        evidence: item._id
      }
    });
  }
  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.delete',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    changes: {
      before: presentEvidence(item)
    },
    req
  });
};

export const verifyEvidenceRecord = async ({ id, notes, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  item.verified = true;
  item.verifiedAt = new Date();
  item.verifiedBy = user._id;
  item.metadata = {
    ...item.metadata,
    verificationNotes: notes || ''
  };
  await item.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.verify',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    req
  });

  return presentEvidence(item);
};

export const unverifyEvidenceRecord = async ({ id, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  item.verified = false;
  item.verifiedAt = undefined;
  item.verifiedBy = undefined;
  await item.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.unverify',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    req
  });

  return presentEvidence(item);
};

export const addEvidenceTag = async ({ id, tag, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  if (!item.tags.includes(tag)) {
    item.tags.push(tag);
    await item.save();
  }

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.tag.add',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    metadata: {
      tag
    },
    req
  });

  return presentEvidence(item);
};

export const removeEvidenceTag = async ({ id, tag, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  item.tags = item.tags.filter((value) => value !== tag);
  await item.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.tag.remove',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    metadata: {
      tag
    },
    req
  });

  return presentEvidence(item);
};

export const addEvidenceCorrelation = async ({
  id,
  correlatedId,
  correlationType,
  user,
  req
}) => {
  const item = await findOwnedEvidence(id, user);
  await findOwnedEvidence(correlatedId, user);

  const exists = item.correlations.some(
    (correlation) => String(correlation.evidenceId) === String(correlatedId)
  );
  if (!exists) {
    item.correlations.push({
      evidenceId: correlatedId,
      type: correlationType
    });
    await item.save();
  }

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.correlation.add',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    metadata: {
      correlatedId,
      correlationType
    },
    req
  });

  return presentEvidence(item);
};

export const removeEvidenceCorrelation = async ({ id, correlatedId, user, req }) => {
  const item = await findOwnedEvidence(id, user);
  item.correlations = item.correlations.filter(
    (correlation) => String(correlation.evidenceId) !== String(correlatedId)
  );
  await item.save();

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.correlation.remove',
    resourceType: 'Evidence',
    resourceId: String(item._id),
    metadata: {
      correlatedId
    },
    req
  });

  return presentEvidence(item);
};

export const getEvidenceStatistics = async (user) => {
  const items = await Evidence.find(buildAccessFilter(user)).lean();
  return {
    total: items.length,
    verified: items.filter((item) => item.verified).length,
    unverified: items.filter((item) => !item.verified).length,
    byType: items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {})
  };
};

export const exportEvidence = async ({ user, format = 'json', ids = [] }) => {
  const filter = {
    ...buildAccessFilter(user)
  };
  if (ids.length) {
    filter._id = { $in: ids };
  }
  const items = await Evidence.find(filter).lean();
  if (format === 'csv') {
    const header = ['type', 'title', 'source', 'verified', 'createdAt'];
    const rows = items.map((item) => header.map((field) => item[field] ?? '').join(','));
    return [header.join(','), ...rows].join('\n');
  }

  return items.map(presentEvidence);
};

export const bulkDeleteEvidence = async ({ ids, user, req }) => {
  const filter = {
    _id: { $in: ids },
    ...buildAccessFilter(user)
  };
  const items = await Evidence.find(filter);
  await Evidence.deleteMany(filter);
  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.bulk_delete',
    resourceType: 'Evidence',
    resourceId: ids.join(','),
    metadata: {
      count: items.length
    },
    req
  });
  return items.length;
};

export const bulkVerifyEvidence = async ({ ids, user, req }) => {
  const filter = {
    _id: { $in: ids },
    ...buildAccessFilter(user)
  };
  const result = await Evidence.updateMany(filter, {
    $set: {
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: user._id
    }
  });
  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'evidence.bulk_verify',
    resourceType: 'Evidence',
    resourceId: ids.join(','),
    metadata: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    },
    req
  });
  return result.modifiedCount;
};
