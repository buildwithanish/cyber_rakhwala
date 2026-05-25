import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, default: '', index: true },
    category: { type: String, required: true, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    label: { type: String, default: '', trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    url: { type: String, default: '' },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

analyticsEventSchema.index({ createdAt: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
