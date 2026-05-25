import { AuditLog } from '../models/AuditLog.js';

export const createAuditLog = async ({
  actor,
  actorRole = 'system',
  action,
  resourceType,
  resourceId = '',
  changes = {},
  metadata = {},
  req
}) =>
  AuditLog.create({
    actor: actor?._id ?? actor ?? undefined,
    actorRole,
    action,
    resourceType,
    resourceId,
    ipAddress: req?.context?.ipAddress ?? '',
    userAgent: req?.context?.userAgent ?? '',
    changes,
    metadata
  });
