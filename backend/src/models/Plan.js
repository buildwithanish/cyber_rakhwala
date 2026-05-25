import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['credits', 'subscription'],
      default: 'credits'
    },
    billingInterval: {
      type: String,
      enum: ['one_time', 'monthly', 'yearly'],
      default: 'one_time'
    },
    currency: { type: String, default: 'INR' },
    price: { type: Number, required: true, min: 0 },
    credits: { type: Number, default: 0 },
    trialDays: { type: Number, default: 0 },
    features: [{ type: String }],
    quotas: {
      searchesPerDay: { type: Number, default: 0 },
      monthlySearches: { type: Number, default: 0 },
      teamMembers: { type: Number, default: 1 },
      storageMb: { type: Number, default: 512 }
    },
    gatewayRefs: {
      stripePriceId: { type: String, default: '' },
      razorpayPlanId: { type: String, default: '' }
    },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const Plan = mongoose.model('Plan', planSchema);
