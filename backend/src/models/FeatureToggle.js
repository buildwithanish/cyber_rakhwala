import mongoose from 'mongoose';

const featureToggleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    roles: [{ type: String }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const FeatureToggle = mongoose.model('FeatureToggle', featureToggleSchema);
