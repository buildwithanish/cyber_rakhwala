import mongoose from 'mongoose';

const providerConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['http', 'dataset', 'payment', 'mail', 'chatbot', 'threat_feed'],
      required: true
    },
    toolIds: [{ type: String, trim: true }],
    baseUrl: { type: String, default: '' },
    authType: {
      type: String,
      enum: ['none', 'api_key_header', 'bearer', 'basic', 'query'],
      default: 'none'
    },
    secretRef: { type: String, default: '' },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    queryTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    bodyTemplate: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH'],
      default: 'POST'
    },
    enabled: { type: Boolean, default: false },
    priority: { type: Number, default: 100 },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ProviderConfig = mongoose.model('ProviderConfig', providerConfigSchema);
