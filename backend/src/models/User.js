import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema(
  {
    theme: { type: String, default: 'dark' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false }
    },
    privacy: {
      analyticsEnabled: { type: Boolean, default: false },
      saveSensitiveData: { type: Boolean, default: false }
    },
    ui: {
      soundEffects: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true }
    },
    security: {
      twoFactor: { type: Boolean, default: false },
      loginAlerts: { type: Boolean, default: true }
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: [
        'super_admin',
        'admin',
        'operations_manager',
        'support_admin',
        'support_agent',
        'analyst',
        'provider_manager',
        'content_manager',
        'user',
        'student'
      ],
      default: 'student',
      index: true
    },
    permissions: [{ type: String }],
    department: { type: String, trim: true, default: '' },
    avatar: { type: String },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true
    },
    approvalRequestedAt: { type: Date },
    approvalReviewedAt: { type: Date },
    approvalReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalNotes: { type: String, trim: true, default: '' },
    credits: { type: Number, default: 100 },
    creditLimit: { type: Number, default: 1000 },
    organization: { type: String, trim: true },
    phone: { type: String, trim: true },
    bio: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, trim: true },
    googleId: { type: String, index: true, sparse: true },
    lastLoginAt: { type: Date },
    lastSeenAt: { type: Date },
    preferences: { type: preferenceSchema, default: () => ({}) },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ username: 1 });

export const User = mongoose.model('User', userSchema);
