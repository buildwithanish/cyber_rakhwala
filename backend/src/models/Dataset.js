import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    toolIds: [{ type: String, trim: true }],
    sourceType: {
      type: String,
      enum: ['upload', 'manual', 'external_sync'],
      default: 'upload'
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'jsonl'],
      default: 'json'
    },
    fileUrl: { type: String, default: '' },
    mapping: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    recordCount: { type: Number, default: 0 },
    enabled: { type: Boolean, default: false },
    restricted: { type: Boolean, default: false },
    lastSyncedAt: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

export const Dataset = mongoose.model('Dataset', datasetSchema);
