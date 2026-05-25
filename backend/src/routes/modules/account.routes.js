import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  activities,
  clearNotifications,
  createClientActivity,
  createClientNotification,
  credits,
  dashboard,
  notifications,
  readNotification,
  readAllNotifications,
  searches,
  subscriptions,
  tickets
} from '../../controllers/account.controller.js';
import {
  activityCreateSchema,
  accountListSchema,
  notificationCreateSchema,
  notificationParamSchema
} from '../../validators/account.validator.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', dashboard);
router.get('/notifications', validate(accountListSchema), notifications);
router.post('/notifications', validate(notificationCreateSchema), createClientNotification);
router.patch('/notifications/:id/read', validate(notificationParamSchema), readNotification);
router.patch('/notifications/read-all', readAllNotifications);
router.delete('/notifications', clearNotifications);
router.get('/activities', validate(accountListSchema), activities);
router.post('/activities', validate(activityCreateSchema), createClientActivity);
router.get('/searches', validate(accountListSchema), searches);
router.get('/credits', credits);
router.get('/subscriptions', subscriptions);
router.get('/tickets', validate(accountListSchema), tickets);

export default router;
