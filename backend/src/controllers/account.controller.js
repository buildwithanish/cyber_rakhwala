import { asyncHandler } from '../utils/asyncHandler.js';
import { createActivity, createNotification } from '../services/activity.service.js';
import {
  clearNotifications as clearUserNotifications,
  getDashboardSummary,
  listActivities,
  listNotifications,
  listSearches,
  listTickets,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/account.service.js';
import { listCreditTransactions } from '../services/credit.service.js';
import { listMySubscriptions } from '../services/billing.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  res.success({
    message: 'Dashboard summary loaded',
    data: await getDashboardSummary(req.user)
  });
});

export const notifications = asyncHandler(async (req, res) => {
  const result = await listNotifications(req.user._id, req.validated.query);
  res.success({
    message: 'Notifications loaded',
    data: result.items,
    meta: result.meta
  });
});

export const readNotification = asyncHandler(async (req, res) => {
  res.success({
    message: 'Notification updated',
    data: await markNotificationRead(req.user._id, req.validated.params.id)
  });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user._id);
  res.success({
    message: 'All notifications marked as read'
  });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await clearUserNotifications(req.user._id);
  res.success({
    message: 'Notifications cleared'
  });
});

export const activities = asyncHandler(async (req, res) => {
  const result = await listActivities(req.user._id, req.validated.query);
  res.success({
    message: 'Activity loaded',
    data: result.items,
    meta: result.meta
  });
});

const normalizeActivityType = (type = 'action') => {
  const supported = new Set([
    'action',
    'case',
    'evidence',
    'tool',
    'credits',
    'auth',
    'investigation',
    'watchlist'
  ]);

  return supported.has(type) ? type : 'action';
};

export const createClientActivity = asyncHandler(async (req, res) => {
  const item = await createActivity({
    user: req.user,
    actorName: req.user.name,
    action: req.validated.body.action,
    type: normalizeActivityType(req.validated.body.type),
    targetType: req.validated.body.targetType,
    targetId: req.validated.body.targetId,
    details: req.validated.body.details || {}
  });

  res.success({
    statusCode: 201,
    message: 'Activity created',
    data: item
  });
});

export const createClientNotification = asyncHandler(async (req, res) => {
  const item = await createNotification({
    user: req.user,
    title: req.validated.body.title || 'Notification',
    message: req.validated.body.message,
    type: req.validated.body.type || 'info',
    priority: req.validated.body.priority || 'medium',
    link: req.validated.body.link || {},
    metadata: req.validated.body.metadata || {}
  });

  res.success({
    statusCode: 201,
    message: 'Notification created',
    data: item
  });
});

export const searches = asyncHandler(async (req, res) => {
  const result = await listSearches(req.user._id, req.validated.query);
  res.success({
    message: 'Search history loaded',
    data: result.items,
    meta: result.meta
  });
});

export const credits = asyncHandler(async (req, res) => {
  res.success({
    message: 'Credit history loaded',
    data: await listCreditTransactions(req.user._id, 50)
  });
});

export const subscriptions = asyncHandler(async (req, res) => {
  res.success({
    message: 'Subscriptions loaded',
    data: await listMySubscriptions(req.user._id)
  });
});

export const tickets = asyncHandler(async (req, res) => {
  const result = await listTickets(req.user._id, req.validated.query);
  res.success({
    message: 'Tickets loaded',
    data: result.items,
    meta: result.meta
  });
});
