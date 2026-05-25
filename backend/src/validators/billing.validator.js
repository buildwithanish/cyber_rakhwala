import { z } from 'zod';

export const listPlansSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    category: z.enum(['credits', 'subscription']).optional()
  }),
  params: z.object({}).optional()
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    planId: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const createOrderSchema = z.object({
  body: z.object({
    planId: z.string().min(1),
    provider: z.enum(['internal', 'stripe', 'razorpay']).default('razorpay'),
    currency: z.string().min(3).max(3).default('INR'),
    amount: z.coerce.number().positive().optional(),
    redeemCode: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    paymentId: z.string().optional(),
    signature: z.string().optional(),
    providerReference: z.string().optional()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});
