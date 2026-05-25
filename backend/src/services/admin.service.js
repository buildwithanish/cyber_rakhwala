import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { ApiKey } from '../models/ApiKey.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { Coupon } from '../models/Coupon.js';
import { Dataset } from '../models/Dataset.js';
import { FeatureToggle } from '../models/FeatureToggle.js';
import { Payment } from '../models/Payment.js';
import { Plan } from '../models/Plan.js';
import { ProviderConfig } from '../models/ProviderConfig.js';
import { RoleProfile } from '../models/RoleProfile.js';
import { SearchLog } from '../models/SearchLog.js';
import { Setting } from '../models/Setting.js';
import { Subscription } from '../models/Subscription.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ThreatAlert } from '../models/ThreatAlert.js';
import { ThreatEvent } from '../models/ThreatEvent.js';
import { ToolCatalog } from '../models/ToolCatalog.js';
import { User } from '../models/User.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { createFingerprint, createRandomToken } from '../utils/crypto.js';
import { buildKeywordQuery, slugify } from '../utils/helpers.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { getAnalyticsOverview } from './analytics.service.js';
import { createAuditLog } from './audit.service.js';

const listWithPagination = async ({ model, query, searchFields = [], baseFilter = {}, sort = { createdAt: -1 } }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...baseFilter,
    ...buildKeywordQuery(query.search, searchFields)
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.role) {
    filter.role = query.role;
  }
  if (query.group) {
    filter.group = query.group;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.department) {
    filter.department = query.department;
  }
  if (query.type) {
    filter.type = query.type;
  }

  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const getAdminDashboard = async () => {
  const [analytics, recentUsers, recentPayments, recentTickets] = await Promise.all([
    getAnalyticsOverview(),
    User.find().sort({ createdAt: -1 }).limit(10).lean(),
    Payment.find().sort({ createdAt: -1 }).limit(10).populate('user plan').lean(),
    SupportTicket.find().sort({ createdAt: -1 }).limit(10).lean()
  ]);

  return {
    analytics,
    recentUsers,
    recentPayments,
    recentTickets
  };
};

export const listUsersAdmin = (query) =>
  listWithPagination({
    model: User,
    query,
    searchFields: ['name', 'email', 'username', 'organization', 'department']
  });

export const createUserAdmin = async ({ payload, actor, req }) => {
  const email = String(payload.email || '')
    .toLowerCase()
    .trim();
  const existing = await User.findOne({ email });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const passwordHash = payload.password
    ? await bcrypt.hash(payload.password, 12)
    : undefined;

  const user = await User.create({
    name: payload.name,
    username: payload.username,
    email,
    passwordHash,
    role: payload.role || 'user',
    permissions: payload.permissions || [],
    department: payload.department || '',
    credits: payload.credits ?? (payload.role === 'user' ? 100 : 50),
    creditLimit: payload.creditLimit ?? 1000,
    organization: payload.organization,
    phone: payload.phone,
    bio: payload.bio,
    isEmailVerified: payload.isEmailVerified ?? true,
    isActive: payload.isActive ?? true,
    metadata: payload.metadata || {}
  });

  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: 'admin.user.create',
    resourceType: 'User',
    resourceId: String(user._id),
    changes: {
      after: user.toObject()
    },
    req
  });

  return user;
};

export const listRoleProfilesAdmin = (query) =>
  listWithPagination({
    model: RoleProfile,
    query,
    searchFields: ['name', 'slug', 'department', 'description']
  });

export const upsertRoleProfileAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    slug: payload.slug || slugify(payload.name || payload.slug || `role-${Date.now()}`)
  };
  const roleProfile = id
    ? await RoleProfile.findByIdAndUpdate(id, data, { new: true })
    : await RoleProfile.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.role.update' : 'admin.role.create',
    resourceType: 'RoleProfile',
    resourceId: String(roleProfile._id),
    changes: {
      after: roleProfile.toObject()
    },
    req
  });
  return roleProfile;
};

export const updateUserAdmin = async ({ id, payload, actor, req }) => {
  const nextPayload = { ...payload };

  if (payload.password) {
    nextPayload.passwordHash = await bcrypt.hash(payload.password, 12);
    delete nextPayload.password;
  }

  const user = await User.findByIdAndUpdate(id, nextPayload, {
    new: true
  });
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: 'admin.user.update',
    resourceType: 'User',
    resourceId: String(id),
    changes: {
      after: user?.toObject()
    },
    req
  });
  return user;
};

export const banUserAdmin = async ({ id, reason, actor, req, banned }) => {
  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        isBanned: banned,
        isActive: !banned,
        banReason: banned ? reason : ''
      }
    },
    { new: true }
  );
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: banned ? 'admin.user.ban' : 'admin.user.unban',
    resourceType: 'User',
    resourceId: String(id),
    metadata: {
      reason
    },
    req
  });
  return user;
};

export const listPlansAdmin = (query) =>
  listWithPagination({
    model: Plan,
    query,
    searchFields: ['name', 'slug', 'description']
  });

export const upsertPlanAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    slug: payload.slug || slugify(payload.name || payload.slug || `plan-${Date.now()}`)
  };
  const plan = id
    ? await Plan.findByIdAndUpdate(id, data, { new: true })
    : await Plan.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.plan.update' : 'admin.plan.create',
    resourceType: 'Plan',
    resourceId: String(plan._id),
    changes: {
      after: plan.toObject()
    },
    req
  });
  return plan;
};

export const listPaymentsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['orderId', 'couponCode', 'providerPaymentId'])
  };
  if (query.status) {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user plan subscription')
      .lean(),
    Payment.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const listSubscriptionsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['providerSubscriptionId', 'providerCustomerId'])
  };
  if (query.status) {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user plan')
      .lean(),
    Subscription.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertSubscriptionAdmin = async ({ id, payload, actor, req }) => {
  const userId = payload.user || payload.userId;
  const planId = payload.plan || payload.planId;

  if (!userId || !planId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription requires both user and plan');
  }

  const data = {
    ...payload,
    user: userId,
    plan: planId,
    provider: payload.provider || 'internal'
  };
  const subscription = id
    ? await Subscription.findByIdAndUpdate(id, data, { new: true })
    : await Subscription.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.subscription.update' : 'admin.subscription.create',
    resourceType: 'Subscription',
    resourceId: String(subscription._id),
    changes: {
      after: subscription.toObject()
    },
    req
  });
  return subscription;
};

export const listProvidersAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['name', 'slug', 'baseUrl'])
  };
  if (query.status) {
    filter.enabled = query.status === 'active';
  }
  if (query.type) {
    filter.type = query.type;
  }

  const [items, total] = await Promise.all([
    ProviderConfig.find(filter).sort({ priority: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ProviderConfig.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertProviderAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    slug: payload.slug || slugify(payload.name || payload.slug || `provider-${Date.now()}`)
  };
  const provider = id
    ? await ProviderConfig.findByIdAndUpdate(id, data, { new: true })
    : await ProviderConfig.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.provider.update' : 'admin.provider.create',
    resourceType: 'ProviderConfig',
    resourceId: String(provider._id),
    changes: {
      after: provider.toObject()
    },
    req
  });
  return provider;
};

export const listDatasetsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['name', 'slug', 'description'])
  };
  if (query.status) {
    filter.enabled = query.status === 'active';
  }

  const [items, total] = await Promise.all([
    Dataset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploadedBy').lean(),
    Dataset.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertDatasetAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    slug: payload.slug || slugify(payload.name || payload.slug || `dataset-${Date.now()}`),
    uploadedBy: actor._id
  };
  const dataset = id
    ? await Dataset.findByIdAndUpdate(id, data, { new: true })
    : await Dataset.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.dataset.update' : 'admin.dataset.create',
    resourceType: 'Dataset',
    resourceId: String(dataset._id),
    changes: {
      after: dataset.toObject()
    },
    req
  });
  return dataset;
};

export const listCouponsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['code', 'name', 'description'])
  };
  if (query.status) {
    filter.isActive = query.status === 'active';
  }

  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Coupon.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertCouponAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    code: String(payload.code || '').toUpperCase()
  };
  const coupon = id
    ? await Coupon.findByIdAndUpdate(id, data, { new: true })
    : await Coupon.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.coupon.update' : 'admin.coupon.create',
    resourceType: 'Coupon',
    resourceId: String(coupon._id),
    changes: {
      after: coupon.toObject()
    },
    req
  });
  return coupon;
};

export const listApiKeysAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['name', 'keyPrefix'])
  };
  if (query.status) {
    filter.isActive = query.status === 'active';
  }

  const [items, total] = await Promise.all([
    ApiKey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner').lean(),
    ApiKey.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const listToolsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['toolId', 'name', 'category', 'description'])
  };
  if (query.status) {
    filter.isEnabled = query.status === 'active';
  }
  if (query.category) {
    filter.category = query.category;
  }

  const [items, total] = await Promise.all([
    ToolCatalog.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit).lean(),
    ToolCatalog.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertToolAdmin = async ({ id, payload, actor, req }) => {
  const data = {
    ...payload,
    toolId: String(payload.toolId || payload.slug || payload.id || payload.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
  };
  const tool = id
    ? await ToolCatalog.findByIdAndUpdate(id, data, { new: true })
    : await ToolCatalog.create(data);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.tool.update' : 'admin.tool.create',
    resourceType: 'ToolCatalog',
    resourceId: String(tool._id),
    changes: {
      after: tool.toObject()
    },
    req
  });
  return tool;
};

export const createApiKeyAdmin = async ({ payload, actor, req }) => {
  const rawKey = `cr_${createRandomToken(24)}`;
  const apiKey = await ApiKey.create({
    owner: payload.owner || undefined,
    name: payload.name,
    keyPrefix: rawKey.slice(0, 8),
    keyHash: createFingerprint(rawKey),
    scopes: payload.scopes || [],
    expiresAt: payload.expiresAt || undefined,
    metadata: payload.metadata || {}
  });
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: 'admin.api_key.create',
    resourceType: 'ApiKey',
    resourceId: String(apiKey._id),
    req
  });
  return {
    apiKey,
    rawKey
  };
};

export const updateApiKeyAdmin = async ({ id, payload, actor, req }) => {
  const apiKey = await ApiKey.findByIdAndUpdate(id, payload, {
    new: true
  });
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: 'admin.api_key.update',
    resourceType: 'ApiKey',
    resourceId: String(id),
    req
  });
  return apiKey;
};

export const listSettingsAdmin = (query) =>
  listWithPagination({
    model: Setting,
    query,
    searchFields: ['group', 'key', 'description']
  });

export const upsertSettingAdmin = async ({ id, payload, actor, req }) => {
  const setting = id
    ? await Setting.findByIdAndUpdate(id, payload, { new: true })
    : await Setting.create(payload);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.setting.update' : 'admin.setting.create',
    resourceType: 'Setting',
    resourceId: String(setting._id),
    req
  });
  return setting;
};

export const listFeatureTogglesAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['key', 'description'])
  };
  if (query.status) {
    filter.enabled = query.status === 'active';
  }

  const [items, total] = await Promise.all([
    FeatureToggle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FeatureToggle.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertFeatureToggleAdmin = async ({ id, payload, actor, req }) => {
  const toggle = id
    ? await FeatureToggle.findByIdAndUpdate(id, payload, { new: true })
    : await FeatureToggle.create(payload);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.feature_toggle.update' : 'admin.feature_toggle.create',
    resourceType: 'FeatureToggle',
    resourceId: String(toggle._id),
    req
  });
  return toggle;
};

export const listContentAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['key', 'section', 'title'])
  };
  if (query.status) {
    filter.isPublished = query.status === 'active';
  }
  if (query.category) {
    filter.section = query.category;
  }

  const [items, total] = await Promise.all([
    ContentBlock.find(filter).sort({ section: 1, key: 1 }).skip(skip).limit(limit).lean(),
    ContentBlock.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const upsertContentAdmin = async ({ id, payload, actor, req }) => {
  const content = id
    ? await ContentBlock.findByIdAndUpdate(id, payload, { new: true })
    : await ContentBlock.create(payload);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.content.update' : 'admin.content.create',
    resourceType: 'ContentBlock',
    resourceId: String(content._id),
    req
  });
  return content;
};

export const listSearchLogsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['query', 'toolName', 'searchType'])
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.searchType = query.category;
  }

  const [items, total] = await Promise.all([
    SearchLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user').lean(),
    SearchLog.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const listTicketsAdmin = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    ...buildKeywordQuery(query.search, ['subject', 'email', 'ticketNumber'])
  };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.type = query.category;
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user')
      .lean(),
    SupportTicket.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const updateTicketAdmin = async ({ id, payload, actor, req }) => {
  const ticket = await SupportTicket.findByIdAndUpdate(id, payload, { new: true });
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: 'admin.ticket.update',
    resourceType: 'SupportTicket',
    resourceId: String(id),
    req
  });
  return ticket;
};

export const getAnalyticsAdmin = async () => ({
  overview: await getAnalyticsOverview(),
  events: await AnalyticsEvent.find().sort({ createdAt: -1 }).limit(100).lean()
});

export const listThreatEventsAdmin = (query) =>
  listWithPagination({
    model: ThreatEvent,
    query,
    searchFields: ['attackType', 'region', 'sourceCity.name', 'targetCity.name']
  });

export const listThreatAlertsAdmin = (query) =>
  listWithPagination({
    model: ThreatAlert,
    query,
    searchFields: ['title', 'message']
  });

export const upsertThreatAlertAdmin = async ({ id, payload, actor, req }) => {
  const alert = id
    ? await ThreatAlert.findByIdAndUpdate(id, payload, { new: true })
    : await ThreatAlert.create(payload);
  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: id ? 'admin.threat_alert.update' : 'admin.threat_alert.create',
    resourceType: 'ThreatAlert',
    resourceId: String(alert._id),
    req
  });
  return alert;
};
