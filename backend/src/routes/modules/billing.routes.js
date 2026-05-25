import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createOrder,
  getPlans,
  myInvoices,
  myPayments,
  mySubscriptions,
  razorpayWebhook,
  stripeWebhook,
  validateRedeemCode,
  verifyOrder
} from '../../controllers/billing.controller.js';
import {
  createOrderSchema,
  listPlansSchema,
  validateCouponSchema,
  verifyPaymentSchema
} from '../../validators/billing.validator.js';

const router = Router();

router.get('/plans', validate(listPlansSchema), getPlans);
router.post('/payments/webhooks/stripe', stripeWebhook);
router.post('/payments/webhooks/razorpay', razorpayWebhook);
router.post('/redeem/validate', authenticate, validate(validateCouponSchema), validateRedeemCode);
router.post('/payments/create-order', authenticate, validate(createOrderSchema), createOrder);
router.post('/payments/verify', authenticate, validate(verifyPaymentSchema), verifyOrder);
router.get('/payments/my', authenticate, myPayments);
router.get('/subscriptions/my', authenticate, mySubscriptions);
router.get('/invoices/my', authenticate, myInvoices);

export default router;
