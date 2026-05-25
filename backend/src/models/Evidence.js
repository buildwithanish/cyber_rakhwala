import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'document', index: true },
    title: { type: String, required: true, trim: true },
    data: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    source: { type: String, default: 'Manual Entry' },
    tags: [{ type: String, trim: true }],
    verified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correlations: [
      {
        evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' },
        type: { type: String, default: 'related' },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

evidenceSchema.index({ title: 'text', data: 'text', notes: 'text', source: 'text' });

export const Evidence = mongoose.model('Evidence', evidenceSchema);
