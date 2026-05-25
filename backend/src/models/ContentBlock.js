import mongoose from 'mongoose';

const contentBlockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    section: { type: String, required: true, trim: true, index: true },
    title: { type: String, default: '', trim: true },
    body: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ContentBlock = mongoose.model('ContentBlock', contentBlockSchema);
