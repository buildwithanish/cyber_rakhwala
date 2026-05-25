import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    keyPrefix: { type: String, required: true, index: true },
    keyHash: { type: String, required: true, unique: true },
    scopes: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
