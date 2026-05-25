import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { Payment } from '../models/Payment.js';
import { SearchLog } from '../models/SearchLog.js';
import { Subscription } from '../models/Subscription.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';

export const ingestAnalyticsEvents = async ({ events, userId }) => {
  if (!events?.length) {
    return 0;
  }

  const docs = events.map((event) => ({
    user: userId,
    sessionId: event.sessionId ?? '',
    category: event.category,
    action: event.action,
    label: event.label ?? '',
    value: event.value ?? null,
    url: event.url ?? '',
    context: {
      timestamp: event.timestamp,
      userAgent: event.userAgent,
      ...event.context
    }
  }));

  await AnalyticsEvent.insertMany(docs, { ordered: false });
  return docs.length;
};

export const getAnalyticsOverview = async () => {
  const [users, activeSubscriptions, paidPayments, searches, tickets, recentEvents] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments({ status: { $in: ['trialing', 'active'] } }),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$finalAmount' } } }
    ]),
    SearchLog.countDocuments(),
    SupportTicket.countDocuments(),
    AnalyticsEvent.find().sort({ createdAt: -1 }).limit(20).lean()
  ]);

  return {
    users,
    activeSubscriptions,
    revenue: paidPayments[0]?.revenue ?? 0,
    searches,
    tickets,
    recentEvents
  };
};
