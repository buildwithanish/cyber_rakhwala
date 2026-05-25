import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenId: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', index: true },
    device: {
      type: {
        kind: { type: String, default: 'Desktop' },
        os: { type: String, default: 'Unknown' },
        browser: { type: String, default: 'Unknown' }
      },
      _id: false
    },
    ipAddress: { type: String, default: '' },
    location: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: '' },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    isCurrent: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
