import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { SearchLog } from '../models/SearchLog.js';
import { Subscription } from '../models/Subscription.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { listCreditTransactions } from './credit.service.js';

const paginate = async (model, filter, query, sort = { createdAt: -1 }) => {
  const { page, limit, skip } = getPagination(query);
  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter)
  ]);
  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const getDashboardSummary = async (user) => {
  const [notifications, activities, searches, credits, subscription, tickets] = await Promise.all([
    Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    ActivityLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    SearchLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    listCreditTransactions(user._id, 10),
    Subscription.findOne({ user: user._id, status: { $in: ['trialing', 'active'] } }).populate('plan').lean(),
    SupportTicket.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).lean()
  ]);

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits
    },
    notifications,
    activities,
    searches,
    credits,
    subscription,
    tickets
  };
};

export const listNotifications = (userId, query) =>
  paginate(Notification, { user: userId }, query);

export const markNotificationRead = async (userId, id) =>
  Notification.findOneAndUpdate(
    { _id: id, user: userId },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    },
    { new: true }
  );

export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany(
    {
      user: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

export const clearNotifications = async (userId) => {
  await Notification.deleteMany({
    user: userId
  });
};

export const listActivities = (userId, query) =>
  paginate(ActivityLog, { user: userId }, query);

export const createUserActivity = async (payload) =>
  ActivityLog.create(payload);

export const createUserNotification = async (payload) =>
  Notification.create(payload);

export const listSearches = (userId, query) =>
  paginate(SearchLog, { user: userId }, query);

export const listTickets = (userId, query) =>
  paginate(SupportTicket, { user: userId }, query);
