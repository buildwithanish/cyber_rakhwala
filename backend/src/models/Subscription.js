import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    provider: {
      type: String,
      enum: ['internal', 'stripe', 'razorpay'],
      default: 'internal'
    },
    providerSubscriptionId: { type: String, default: '', index: true },
    providerCustomerId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['trialing', 'active', 'paused', 'past_due', 'canceled', 'expired'],
      default: 'active',
      index: true
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialEndsAt: { type: Date },
    cancelAt: { type: Date },
    canceledAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
