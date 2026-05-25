import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';

export const createActivity = async ({
  user,
  actorName = 'System',
  action,
  type = 'action',
  targetType = '',
  targetId = '',
  details = {}
}) =>
  ActivityLog.create({
    user: user?._id ?? user ?? undefined,
    actorName,
    action,
    type,
    targetType,
    targetId,
    details
  });

export const createNotification = async ({
  user,
  title,
  message,
  type = 'info',
  priority = 'medium',
  link = {},
  metadata = {}
}) =>
  Notification.create({
    user: user?._id ?? user,
    title,
    message,
    type,
    priority,
    link,
    metadata
  });
