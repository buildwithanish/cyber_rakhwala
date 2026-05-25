import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['action', 'case', 'evidence', 'tool', 'credits', 'auth', 'investigation', 'watchlist'],
      default: 'action',
      index: true
    },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
