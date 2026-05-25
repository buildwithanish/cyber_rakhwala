import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createPaymentOrder,
  handleRazorpayWebhook,
  handleStripeWebhook,
  ensurePlan,
  listMyInvoices,
  listMyPayments,
  listMySubscriptions,
  listPlans,
  validateCoupon,
  verifyPayment
} from '../services/billing.service.js';

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await listPlans(req.validated.query);
  res.success({
    message: 'Plans loaded',
    data: plans
  });
});

export const validateRedeemCode = asyncHandler(async (req, res) => {
  const plan = req.validated.body.planId ? await ensurePlan(req.validated.body.planId) : null;
  if (!plan) {
    res.success({
      message: 'Plan not found',
      data: {
        valid: false
      }
    });
    return;
  }
  const result = await validateCoupon({
    code: req.validated.body.code,
    plan
  });
  res.success({
    message: 'Coupon validated',
    data: {
      valid: true,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount
    }
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await createPaymentOrder({
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    statusCode: 201,
    message: 'Payment order created',
    data: order
  });
});

export const verifyOrder = asyncHandler(async (req, res) => {
  const result = await verifyPayment({
    payload: req.validated.body,
    user: req.user,
    req
  });
  res.success({
    message: 'Payment verified',
    data: result
  });
});

export const myPayments = asyncHandler(async (req, res) => {
  const data = await listMyPayments(req.user._id);
  res.success({
    message: 'Payments loaded',
    data
  });
});

export const mySubscriptions = asyncHandler(async (req, res) => {
  const data = await listMySubscriptions(req.user._id);
  res.success({
    message: 'Subscriptions loaded',
    data
  });
});

export const myInvoices = asyncHandler(async (req, res) => {
  const data = await listMyInvoices(req.user._id);
  res.success({
    message: 'Invoices loaded',
    data
  });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const result = await handleStripeWebhook({
    signature: req.get('stripe-signature'),
    rawBody: req.rawBody,
    req
  });
  res.success({
    message: 'Stripe webhook processed',
    data: result
  });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const result = await handleRazorpayWebhook({
    signature: req.get('x-razorpay-signature'),
    rawBody: req.rawBody,
    payload: req.body,
    req
  });
  res.success({
    message: 'Razorpay webhook processed',
    data: result
  });
});
