import mongoose from 'mongoose';

const threatAlertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      required: true,
      index: true
    },
    regions: [{ type: String }],
    attackTypes: [{ type: String }],
    isRead: { type: Boolean, default: false },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ThreatAlert = mongoose.model('ThreatAlert', threatAlertSchema);
