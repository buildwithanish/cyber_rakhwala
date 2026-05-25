import { asyncHandler } from '../utils/asyncHandler.js';
import {
  banUserAdmin,
  createUserAdmin,
  createApiKeyAdmin,
  getAdminDashboard,
  getAnalyticsAdmin,
  listApiKeysAdmin,
  listContentAdmin,
  listCouponsAdmin,
  listDatasetsAdmin,
  listFeatureTogglesAdmin,
  listPaymentsAdmin,
  listPlansAdmin,
  listProvidersAdmin,
  listRoleProfilesAdmin,
  listSearchLogsAdmin,
  listSettingsAdmin,
  listSubscriptionsAdmin,
  listToolsAdmin,
  listThreatAlertsAdmin,
  listThreatEventsAdmin,
  listTicketsAdmin,
  listUsersAdmin,
  updateApiKeyAdmin,
  updateTicketAdmin,
  updateUserAdmin,
  upsertContentAdmin,
  upsertCouponAdmin,
  upsertDatasetAdmin,
  upsertFeatureToggleAdmin,
  upsertPlanAdmin,
  upsertProviderAdmin,
  upsertRoleProfileAdmin,
  upsertSettingAdmin,
  upsertSubscriptionAdmin,
  upsertToolAdmin,
  upsertThreatAlertAdmin
} from '../services/admin.service.js';

const respondList = async (res, message, promise) => {
  const result = await promise;
  res.success({
    message,
    data: result.items,
    meta: result.meta
  });
};

export const dashboard = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Admin dashboard loaded',
    data: await getAdminDashboard()
  });
});

export const analytics = asyncHandler(async (_req, res) => {
  res.success({
    message: 'Admin analytics loaded',
    data: await getAnalyticsAdmin()
  });
});

export const users = asyncHandler(async (req, res) => respondList(res, 'Users loaded', listUsersAdmin(req.validated.query)));
export const createUser = asyncHandler(async (req, res) => {
  res.success({
    statusCode: 201,
    message: 'User created',
    data: await createUserAdmin({
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const roles = asyncHandler(async (req, res) => respondList(res, 'Role profiles loaded', listRoleProfilesAdmin(req.validated.query)));
export const updateUser = asyncHandler(async (req, res) => {
  res.success({
    message: 'User updated',
    data: await updateUserAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const upsertRole = asyncHandler(async (req, res) => {
  res.success({
    message: 'Role profile saved',
    data: await upsertRoleProfileAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const banUser = asyncHandler(async (req, res) => {
  res.success({
    message: 'User banned',
    data: await banUserAdmin({
      id: req.validated.params.id,
      reason: req.validated.body.reason,
      actor: req.user,
      req,
      banned: true
    })
  });
});
export const unbanUser = asyncHandler(async (req, res) => {
  res.success({
    message: 'User unbanned',
    data: await banUserAdmin({
      id: req.validated.params.id,
      reason: '',
      actor: req.user,
      req,
      banned: false
    })
  });
});

export const plans = asyncHandler(async (req, res) => respondList(res, 'Plans loaded', listPlansAdmin(req.validated.query)));
export const upsertPlan = asyncHandler(async (req, res) => {
  res.success({
    message: 'Plan saved',
    data: await upsertPlanAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});

export const payments = asyncHandler(async (req, res) => respondList(res, 'Payments loaded', listPaymentsAdmin(req.validated.query)));
export const subscriptions = asyncHandler(async (req, res) =>
  respondList(res, 'Subscriptions loaded', listSubscriptionsAdmin(req.validated.query))
);
export const upsertSubscription = asyncHandler(async (req, res) => {
  res.success({
    message: 'Subscription saved',
    data: await upsertSubscriptionAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const providers = asyncHandler(async (req, res) =>
  respondList(res, 'Providers loaded', listProvidersAdmin(req.validated.query))
);
export const upsertProvider = asyncHandler(async (req, res) => {
  res.success({
    message: 'Provider saved',
    data: await upsertProviderAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const datasets = asyncHandler(async (req, res) =>
  respondList(res, 'Datasets loaded', listDatasetsAdmin(req.validated.query))
);
export const upsertDataset = asyncHandler(async (req, res) => {
  res.success({
    message: 'Dataset saved',
    data: await upsertDatasetAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const coupons = asyncHandler(async (req, res) =>
  respondList(res, 'Coupons loaded', listCouponsAdmin(req.validated.query))
);
export const upsertCoupon = asyncHandler(async (req, res) => {
  res.success({
    message: 'Coupon saved',
    data: await upsertCouponAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const apiKeys = asyncHandler(async (req, res) =>
  respondList(res, 'API keys loaded', listApiKeysAdmin(req.validated.query))
);
export const tools = asyncHandler(async (req, res) =>
  respondList(res, 'Tools loaded', listToolsAdmin(req.validated.query))
);
export const upsertTool = asyncHandler(async (req, res) => {
  res.success({
    message: 'Tool saved',
    data: await upsertToolAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const createApiKey = asyncHandler(async (req, res) => {
  res.success({
    statusCode: 201,
    message: 'API key created',
    data: await createApiKeyAdmin({
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const updateApiKey = asyncHandler(async (req, res) => {
  res.success({
    message: 'API key updated',
    data: await updateApiKeyAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const settings = asyncHandler(async (req, res) =>
  respondList(res, 'Settings loaded', listSettingsAdmin(req.validated.query))
);
export const upsertSetting = asyncHandler(async (req, res) => {
  res.success({
    message: 'Setting saved',
    data: await upsertSettingAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const featureToggles = asyncHandler(async (req, res) =>
  respondList(res, 'Feature toggles loaded', listFeatureTogglesAdmin(req.validated.query))
);
export const upsertFeatureToggle = asyncHandler(async (req, res) => {
  res.success({
    message: 'Feature toggle saved',
    data: await upsertFeatureToggleAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const content = asyncHandler(async (req, res) =>
  respondList(res, 'Homepage content loaded', listContentAdmin(req.validated.query))
);
export const upsertContent = asyncHandler(async (req, res) => {
  res.success({
    message: 'Homepage content saved',
    data: await upsertContentAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const searchLogs = asyncHandler(async (req, res) =>
  respondList(res, 'Search logs loaded', listSearchLogsAdmin(req.validated.query))
);
export const tickets = asyncHandler(async (req, res) =>
  respondList(res, 'Tickets loaded', listTicketsAdmin(req.validated.query))
);
export const updateTicket = asyncHandler(async (req, res) => {
  res.success({
    message: 'Ticket updated',
    data: await updateTicketAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
export const threatEvents = asyncHandler(async (req, res) =>
  respondList(res, 'Threat events loaded', listThreatEventsAdmin(req.validated.query))
);
export const threatAlerts = asyncHandler(async (req, res) =>
  respondList(res, 'Threat alerts loaded', listThreatAlertsAdmin(req.validated.query))
);
export const upsertThreatAlert = asyncHandler(async (req, res) => {
  res.success({
    message: 'Threat alert saved',
    data: await upsertThreatAlertAdmin({
      id: req.validated.params.id,
      payload: req.validated.body,
      actor: req.user,
      req
    })
  });
});
