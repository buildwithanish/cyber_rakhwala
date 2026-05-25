import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    type: {
      type: String,
      enum: ['credits', 'subscription', 'coupon_adjustment', 'manual'],
      default: 'credits'
    },
    provider: {
      type: String,
      enum: ['internal', 'stripe', 'razorpay'],
      default: 'internal'
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded', 'canceled'],
      default: 'created',
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    finalAmount: { type: Number, required: true, min: 0 },
    creditsPurchased: { type: Number, default: 0 },
    orderId: { type: String, default: '', index: true },
    providerPaymentId: { type: String, default: '', index: true },
    providerOrderId: { type: String, default: '' },
    providerInvoiceId: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    paidAt: { type: Date },
    failedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
