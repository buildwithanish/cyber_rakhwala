import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { Coupon } from '../models/Coupon.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Plan } from '../models/Plan.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createNumberSequence } from '../utils/helpers.js';
import { createActivity, createNotification } from './activity.service.js';
import { createAuditLog } from './audit.service.js';
import { applyCreditTransaction } from './credit.service.js';

let stripeClient;
let razorpayClient;

const DEFAULT_PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    category: 'credits',
    billingInterval: 'one_time',
    currency: 'INR',
    price: 99,
    credits: 100,
    features: ['Basic lookup access', 'Single-user workspace'],
    isActive: true,
    displayOrder: 1
  },
  {
    slug: 'basic',
    name: 'Basic',
    category: 'credits',
    billingInterval: 'one_time',
    currency: 'INR',
    price: 199,
    credits: 250,
    features: ['Standard lookup access', 'Search history'],
    isActive: true,
    displayOrder: 2
  },
  {
    slug: 'pro',
    name: 'Pro',
    category: 'credits',
    billingInterval: 'one_time',
    currency: 'INR',
    price: 349,
    credits: 500,
    features: ['Advanced lookup access', 'Evidence workflows'],
    isPopular: true,
    isActive: true,
    displayOrder: 3
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    category: 'credits',
    billingInterval: 'one_time',
    currency: 'INR',
    price: 599,
    credits: 1000,
    features: ['High-volume investigations', 'Priority support'],
    isActive: true,
    displayOrder: 4
  },
  {
    slug: 'professional-monthly',
    name: 'Professional Monthly',
    category: 'subscription',
    billingInterval: 'monthly',
    currency: 'INR',
    price: 1499,
    credits: 1000,
    quotas: {
      searchesPerDay: 200,
      monthlySearches: 6000,
      teamMembers: 5,
      storageMb: 5120
    },
    features: ['Recurring subscription', 'Priority tools', 'Team collaboration'],
    isActive: true,
    displayOrder: 10
  }
];

const getStripe = () => {
  if (!env.stripe.secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey);
  }
  return stripeClient;
};

const getRazorpay = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret
    });
  }
  return razorpayClient;
};

const presentPlan = (plan) => {
  const value = plan.toObject ? plan.toObject() : plan;
  return {
    ...value,
    id: String(value._id)
  };
};

const getDefaultPlanRecord = (planId) =>
  DEFAULT_PLANS.find((plan) => plan.slug === String(planId || '').toLowerCase()) || null;

const ensureDefaultPlanDocument = async (planId) => {
  const defaultPlan = getDefaultPlanRecord(planId);
  if (!defaultPlan) {
    return null;
  }

  await Plan.updateOne({ slug: defaultPlan.slug }, { $setOnInsert: defaultPlan }, { upsert: true });
  return Plan.findOne({ slug: defaultPlan.slug, isActive: true });
};

const ensureDefaultPlans = async ({ category } = {}) => {
  const defaults = category
    ? DEFAULT_PLANS.filter((plan) => plan.category === category)
    : DEFAULT_PLANS;

  if (defaults.length === 0) {
    return;
  }

  await Promise.all(
    defaults.map((plan) =>
      Plan.updateOne({ slug: plan.slug }, { $setOnInsert: plan }, { upsert: true })
    )
  );
};

export const ensurePlan = async (planId) => {
  const plan = await Plan.findOne({
    $or: [
      ...(mongoose.isValidObjectId(planId) ? [{ _id: planId }] : []),
      { slug: planId }
    ],
    isActive: true
  });

  if (plan) {
    return plan;
  }

  const defaultPlan = await ensureDefaultPlanDocument(planId);
  if (defaultPlan) {
    return defaultPlan;
  }

  throw new ApiError(StatusCodes.NOT_FOUND, 'Plan not found');
};

export const listPlans = async ({ category } = {}) => {
  const filter = { isActive: true };
  if (category) {
    filter.category = category;
  }
  let plans = await Plan.find(filter).sort({ displayOrder: 1, price: 1 }).lean();

  if (plans.length === 0) {
    await ensureDefaultPlans({ category });
    plans = await Plan.find(filter).sort({ displayOrder: 1, price: 1 }).lean();
  }

  return plans.map(presentPlan);
};

export const validateCoupon = async ({ code, plan }) => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true
  });

  if (!coupon) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired coupon');
  }

  if (coupon.startsAt && coupon.startsAt > new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon is not active yet');
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon has expired');
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon usage limit reached');
  }

  if (coupon.applicablePlanSlugs.length && !coupon.applicablePlanSlugs.includes(plan.slug)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon is not valid for this plan');
  }

  const discountAmount =
    coupon.discountType === 'percentage'
      ? Math.round(plan.price * (coupon.discountValue / 100))
      : coupon.discountValue;

  return {
    coupon,
    discountAmount: Math.min(discountAmount, plan.price),
    finalAmount: Math.max(plan.price - discountAmount, 0)
  };
};

const createInvoice = async ({ payment, plan, subscription }) => {
  const count = await Invoice.countDocuments();
  return Invoice.create({
    payment: payment._id,
    user: payment.user,
    subscription: subscription?._id,
    number: createNumberSequence('INV', count + 1),
    currency: payment.currency,
    subtotal: payment.amount,
    discount: payment.discountAmount,
    total: payment.finalAmount,
    dueAt: new Date(),
    lineItems: [
      {
        description: plan.name,
        quantity: 1,
        amount: payment.finalAmount
      }
    ]
  });
};

const activatePaymentBenefits = async ({ payment, user }) => {
  let subscription = null;

  if (payment.type === 'credits' && payment.creditsPurchased > 0) {
    await applyCreditTransaction({
      userId: user._id,
      amount: payment.creditsPurchased,
      type: 'credit',
      reason: 'Credits purchased',
      referenceType: 'payment',
      referenceId: String(payment._id)
    });
  }

  if (payment.type === 'subscription' && payment.plan) {
    const plan = await Plan.findById(payment.plan);
    const now = new Date();
    const periodEnd =
      plan.billingInterval === 'yearly'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    subscription = await Subscription.findOneAndUpdate(
      { user: user._id, status: { $in: ['trialing', 'active'] } },
      {
        $set: {
          plan: plan._id,
          provider: payment.provider,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          providerCustomerId: payment.metadata.providerCustomerId || '',
          providerSubscriptionId: payment.providerPaymentId || payment.providerOrderId || ''
        }
      },
      { new: true, upsert: true }
    );
  }

  const plan = payment.plan ? await Plan.findById(payment.plan) : null;
  if (plan) {
    await createInvoice({
      payment,
      plan,
      subscription
    });
  }

  return subscription;
};

export const createPaymentOrder = async ({ payload, user, req }) => {
  const plan = await ensurePlan(payload.planId);
  let finalAmount = plan.price;
  let couponCode = '';
  let discountAmount = 0;

  if (payload.redeemCode) {
    const discount = await validateCoupon({
      code: payload.redeemCode,
      plan
    });
    finalAmount = discount.finalAmount;
    discountAmount = discount.discountAmount;
    couponCode = discount.coupon.code;
  }

  const payment = await Payment.create({
    user: user._id,
    plan: plan._id,
    type: plan.category === 'subscription' ? 'subscription' : 'credits',
    provider: payload.provider,
    status: 'created',
    amount: plan.price,
    currency: payload.currency || plan.currency || env.billing.defaultCurrency,
    finalAmount,
    creditsPurchased: plan.credits,
    orderId: createNumberSequence('ORD', await Payment.countDocuments() + 1),
    couponCode,
    discountAmount
  });

  const response = {
    orderId: payment.orderId,
    amount: finalAmount,
    currency: payment.currency,
    discountAmount,
    finalAmount,
    provider: payment.provider
  };

  if (payload.provider === 'stripe') {
    const stripe = getStripe();
    if (!stripe) {
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Stripe is not configured');
    }

    const session = await stripe.checkout.sessions.create({
      mode: plan.category === 'subscription' ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: payment.currency.toLowerCase(),
            product_data: {
              name: plan.name
            },
            unit_amount: Math.round(finalAmount * 100),
            recurring:
              plan.category === 'subscription'
                ? {
                    interval: plan.billingInterval === 'yearly' ? 'year' : 'month'
                  }
                : undefined
          },
          quantity: 1
        }
      ],
      success_url: `${env.frontendUrl}/dashboard/user/recharge?payment=success`,
      cancel_url: `${env.frontendUrl}/dashboard/user/recharge?payment=canceled`,
      client_reference_id: payment.orderId,
      metadata: {
        paymentId: String(payment._id),
        userId: String(user._id)
      }
    });

    payment.providerOrderId = session.id;
    await payment.save();
    response.checkoutUrl = session.url;
    response.providerReference = session.id;
  } else if (payload.provider === 'razorpay') {
    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Razorpay is not configured');
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: payment.currency,
      receipt: payment.orderId
    });

    payment.providerOrderId = order.id;
    await payment.save();
    response.providerReference = order.id;
    response.gateway = {
      keyId: env.razorpay.keyId,
      orderId: order.id
    };
  } else {
    response.nextAction =
      env.nodeEnv === 'production'
        ? 'manual_review_required'
        : 'development_internal_provider_ready';
  }

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'payment.order.create',
    resourceType: 'Payment',
    resourceId: String(payment._id),
    metadata: response,
    req
  });

  return response;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) => {
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generated === signature;
};

const markPaymentAsPaid = async ({ payment, paymentId, metadata = {}, req }) => {
  if (payment.status === 'paid') {
    return payment;
  }

  payment.status = 'paid';
  payment.providerPaymentId = paymentId || payment.providerPaymentId;
  payment.paidAt = new Date();
  payment.metadata = {
    ...payment.metadata,
    ...metadata
  };
  await payment.save();

  const subscription = await activatePaymentBenefits({
    payment,
    user: { _id: payment.user }
  });
  const plan = payment.plan ? await Plan.findById(payment.plan) : null;
  if (payment.couponCode) {
    await Coupon.updateOne(
      { code: payment.couponCode },
      {
        $inc: {
          usedCount: 1
        }
      }
    );
  }

  await Promise.all([
    createNotification({
      user: payment.user,
      title: 'Payment successful',
      message: plan
        ? `${plan.name} has been applied to your account.`
        : 'Your payment has been processed successfully.',
      type: 'payment',
      priority: 'high'
    }),
    createActivity({
      user: payment.user,
      actorName: 'System',
      action: 'Payment completed',
      type: 'credits',
      targetType: 'payment',
      targetId: String(payment._id),
      details: {
        orderId: payment.orderId,
        finalAmount: payment.finalAmount,
        subscriptionId: subscription?._id
      }
    }),
    createAuditLog({
      actor: payment.user,
      actorRole: 'user',
      action: 'payment.verify',
      resourceType: 'Payment',
      resourceId: String(payment._id),
      metadata: {
        orderId: payment.orderId,
        paymentId
      },
      req
    })
  ]);

  return payment;
};

const resolvePaymentFromStripeSession = async (session) => {
  if (session.metadata?.paymentId) {
    return Payment.findById(session.metadata.paymentId);
  }

  if (session.client_reference_id) {
    return Payment.findOne({ orderId: session.client_reference_id });
  }

  return null;
};

export const verifyPayment = async ({ payload, user, req }) => {
  const payment = await Payment.findOne({
    orderId: payload.orderId,
    user: user._id
  });

  if (!payment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Payment order not found');
  }

  if (payment.provider === 'stripe') {
    const stripe = getStripe();
    if (!stripe) {
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Stripe is not configured');
    }

    const session = await stripe.checkout.sessions.retrieve(
      payload.providerReference || payment.providerOrderId
    );
    if (session.payment_status !== 'paid') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Stripe payment is not complete');
    }

    await markPaymentAsPaid({
      payment,
      paymentId: session.payment_intent || session.id,
      metadata: {
        providerCustomerId: session.customer || ''
      },
      req
    });
  } else if (payment.provider === 'razorpay') {
    if (
      !verifyRazorpaySignature({
        orderId: payment.providerOrderId,
        paymentId: payload.paymentId,
        signature: payload.signature,
        secret: env.razorpay.keySecret
      })
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Razorpay signature');
    }

    await markPaymentAsPaid({
      payment,
      paymentId: payload.paymentId,
      req
    });
  } else if (env.nodeEnv !== 'production' || payment.finalAmount === 0) {
    await markPaymentAsPaid({
      payment,
      paymentId: payload.paymentId || payment.orderId,
      metadata: {
        provider: 'internal'
      },
      req
    });
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Internal payments are disabled in production');
  }

  const freshUser = await User.findById(user._id).lean();

  return {
    success: true,
    credits: payment.creditsPurchased,
    newBalance: freshUser?.credits ?? user.credits
  };
};

export const listMyPayments = async (userId) =>
  Payment.find({ user: userId }).sort({ createdAt: -1 }).populate('plan').lean();

export const listMySubscriptions = async (userId) =>
  Subscription.find({ user: userId }).sort({ createdAt: -1 }).populate('plan').lean();

export const listMyInvoices = async (userId) =>
  Invoice.find({ user: userId }).sort({ createdAt: -1 }).populate('payment').lean();

export const handleStripeWebhook = async ({ signature, rawBody, req }) => {
  const stripe = getStripe();
  if (!stripe || !env.stripe.webhookSecret) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Stripe webhooks are not configured');
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const payment = await resolvePaymentFromStripeSession(session);
    if (payment) {
      await markPaymentAsPaid({
        payment,
        paymentId: session.payment_intent || session.id,
        metadata: {
          providerCustomerId: session.customer || ''
        },
        req
      });
    }
  }

  return {
    received: true,
    type: event.type
  };
};

export const handleRazorpayWebhook = async ({ signature, rawBody, payload, req }) => {
  if (!env.razorpay.webhookSecret) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Razorpay webhooks are not configured');
  }

  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expected !== signature) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Razorpay webhook signature');
  }

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};
    const payment = await Payment.findOne({
      $or: [{ providerOrderId: entity.order_id }, { providerPaymentId: entity.id }]
    });

    if (payment) {
      await markPaymentAsPaid({
        payment,
        paymentId: entity.id,
        metadata: {
          razorpayEvent: payload.event
        },
        req
      });
    }
  }

  return {
    received: true,
    type: payload.event
  };
};
