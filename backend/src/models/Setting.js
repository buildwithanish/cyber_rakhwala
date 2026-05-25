import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    group: { type: String, required: true, trim: true, index: true },
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    isPublic: { type: Boolean, default: false },
    description: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

settingSchema.index({ group: 1, key: 1 }, { unique: true });

export const Setting = mongoose.model('Setting', settingSchema);
