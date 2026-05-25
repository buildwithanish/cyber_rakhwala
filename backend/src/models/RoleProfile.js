import mongoose from 'mongoose';

const roleProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    baseRole: {
      type: String,
      enum: [
        'super_admin',
        'admin',
        'operations_manager',
        'support_admin',
        'support_agent',
        'analyst',
        'provider_manager',
        'content_manager'
      ],
      default: 'admin'
    },
    department: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    permissions: [{ type: String, trim: true }],
    accessibleModules: [{ type: String, trim: true }],
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const RoleProfile = mongoose.model('RoleProfile', roleProfileSchema);
