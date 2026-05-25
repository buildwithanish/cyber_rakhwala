import mongoose from 'mongoose';

const datasetRecordSchema = new mongoose.Schema(
  {
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true, index: true },
    toolIds: [{ type: String, trim: true, index: true }],
    primaryValue: { type: String, required: true, trim: true, index: true },
    normalizedValue: { type: String, required: true, trim: true, index: true },
    secondaryValues: [{ type: String, trim: true }],
    searchableText: { type: String, default: '' },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    confidence: { type: Number, default: 100 }
  },
  {
    timestamps: true
  }
);

datasetRecordSchema.index({ searchableText: 'text' });

export const DatasetRecord = mongoose.model('DatasetRecord', datasetRecordSchema);
