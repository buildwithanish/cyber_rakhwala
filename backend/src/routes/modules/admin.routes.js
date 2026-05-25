import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorizePermissions } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  analytics,
  apiKeys,
  banUser,
  createUser,
  content,
  coupons,
  createApiKey,
  dashboard,
  datasets,
  featureToggles,
  payments,
  plans,
  providers,
  roles,
  searchLogs,
  settings,
  subscriptions,
  tools,
  threatAlerts,
  threatEvents,
  tickets,
  unbanUser,
  updateApiKey,
  updateTicket,
  updateUser,
  upsertContent,
  upsertCoupon,
  upsertDataset,
  upsertFeatureToggle,
  upsertPlan,
  upsertProvider,
  upsertRole,
  upsertSetting,
  upsertSubscription,
  upsertThreatAlert,
  upsertTool,
  users
} from '../../controllers/admin.controller.js';
import {
  adminBanSchema,
  adminIdParamSchema,
  adminListSchema,
  adminUpsertSchema
} from '../../validators/admin.validator.js';

const router = Router();

router.use(authenticate, authorizePermissions('admin:access'));

router.get('/dashboard', authorizePermissions('admin:access'), dashboard);
router.get('/analytics', authorizePermissions('analytics:read'), analytics);

router.get('/users', authorizePermissions('users:read'), validate(adminListSchema), users);
router.post('/users', authorizePermissions('users:update'), validate(adminUpsertSchema), createUser);
router.patch('/users/:id', authorizePermissions('users:update'), validate(adminUpsertSchema), updateUser);
router.post('/users/:id/ban', authorizePermissions('users:ban'), validate(adminBanSchema), banUser);
router.post('/users/:id/unban', authorizePermissions('users:ban'), validate(adminIdParamSchema), unbanUser);

router.get('/roles', authorizePermissions('roles:manage'), validate(adminListSchema), roles);
router.post('/roles', authorizePermissions('roles:manage'), validate(adminUpsertSchema), upsertRole);
router.put('/roles/:id', authorizePermissions('roles:manage'), validate(adminUpsertSchema), upsertRole);

router.get('/plans', authorizePermissions('plans:manage'), validate(adminListSchema), plans);
router.post('/plans', authorizePermissions('plans:manage'), validate(adminUpsertSchema), upsertPlan);
router.put('/plans/:id', authorizePermissions('plans:manage'), validate(adminUpsertSchema), upsertPlan);

router.get('/payments', authorizePermissions('payments:manage'), validate(adminListSchema), payments);
router.get('/subscriptions', authorizePermissions('subscriptions:manage'), validate(adminListSchema), subscriptions);
router.post('/subscriptions', authorizePermissions('subscriptions:manage'), validate(adminUpsertSchema), upsertSubscription);
router.put('/subscriptions/:id', authorizePermissions('subscriptions:manage'), validate(adminUpsertSchema), upsertSubscription);

router.get('/providers', authorizePermissions('providers:manage'), validate(adminListSchema), providers);
router.post('/providers', authorizePermissions('providers:manage'), validate(adminUpsertSchema), upsertProvider);
router.put('/providers/:id', authorizePermissions('providers:manage'), validate(adminUpsertSchema), upsertProvider);

router.get('/datasets', authorizePermissions('datasets:manage'), validate(adminListSchema), datasets);
router.post('/datasets', authorizePermissions('datasets:manage'), validate(adminUpsertSchema), upsertDataset);
router.put('/datasets/:id', authorizePermissions('datasets:manage'), validate(adminUpsertSchema), upsertDataset);

router.get('/coupons', authorizePermissions('coupons:manage'), validate(adminListSchema), coupons);
router.post('/coupons', authorizePermissions('coupons:manage'), validate(adminUpsertSchema), upsertCoupon);
router.put('/coupons/:id', authorizePermissions('coupons:manage'), validate(adminUpsertSchema), upsertCoupon);

router.get('/api-keys', authorizePermissions('apiKeys:manage'), validate(adminListSchema), apiKeys);
router.post('/api-keys', authorizePermissions('apiKeys:manage'), validate(adminUpsertSchema), createApiKey);
router.put('/api-keys/:id', authorizePermissions('apiKeys:manage'), validate(adminUpsertSchema), updateApiKey);
router.get('/tools', authorizePermissions('providers:manage'), validate(adminListSchema), tools);
router.post('/tools', authorizePermissions('providers:manage'), validate(adminUpsertSchema), upsertTool);
router.put('/tools/:id', authorizePermissions('providers:manage'), validate(adminUpsertSchema), upsertTool);

router.get('/settings', authorizePermissions('settings:manage'), validate(adminListSchema), settings);
router.post('/settings', authorizePermissions('settings:manage'), validate(adminUpsertSchema), upsertSetting);
router.put('/settings/:id', authorizePermissions('settings:manage'), validate(adminUpsertSchema), upsertSetting);

router.get('/feature-toggles', authorizePermissions('featureToggles:manage'), validate(adminListSchema), featureToggles);
router.post('/feature-toggles', authorizePermissions('featureToggles:manage'), validate(adminUpsertSchema), upsertFeatureToggle);
router.put('/feature-toggles/:id', authorizePermissions('featureToggles:manage'), validate(adminUpsertSchema), upsertFeatureToggle);

router.get('/content', authorizePermissions('content:manage'), validate(adminListSchema), content);
router.post('/content', authorizePermissions('content:manage'), validate(adminUpsertSchema), upsertContent);
router.put('/content/:id', authorizePermissions('content:manage'), validate(adminUpsertSchema), upsertContent);

router.get('/search-logs', authorizePermissions('searchLogs:read'), validate(adminListSchema), searchLogs);
router.get('/tickets', authorizePermissions('tickets:manage'), validate(adminListSchema), tickets);
router.put('/tickets/:id', authorizePermissions('tickets:manage'), validate(adminUpsertSchema), updateTicket);

router.get('/threat-events', authorizePermissions('threatMap:manage'), validate(adminListSchema), threatEvents);
router.get('/threat-alerts', authorizePermissions('threatMap:manage'), validate(adminListSchema), threatAlerts);
router.post('/threat-alerts', authorizePermissions('threatMap:manage'), validate(adminUpsertSchema), upsertThreatAlert);
router.put('/threat-alerts/:id', authorizePermissions('threatMap:manage'), validate(adminUpsertSchema), upsertThreatAlert);

export default router;
