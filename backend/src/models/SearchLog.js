import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    toolId: { type: String, required: true, trim: true, index: true },
    toolName: { type: String, required: true, trim: true },
    searchType: { type: String, required: true, trim: true, index: true },
    query: { type: String, required: true, trim: true, index: true },
    normalizedQuery: { type: String, default: '', index: true },
    status: {
      type: String,
      enum: ['success', 'failed', 'blocked', 'queued'],
      default: 'success',
      index: true
    },
    creditsCharged: { type: Number, default: 0 },
    resultSummary: { type: String, default: '' },
    bookmarked: { type: Boolean, default: false },
    providerSource: { type: String, default: '' },
    datasetSource: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset' },
    requestPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    responsePayload: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

searchLogSchema.index({ query: 'text', resultSummary: 'text', toolName: 'text' });

export const SearchLog = mongoose.model('SearchLog', searchLogSchema);
