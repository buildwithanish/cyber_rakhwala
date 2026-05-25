import mongoose from 'mongoose';

const conversationMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    suggestions: [{ type: String }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sessionKey: { type: String, default: '', index: true },
    messages: [conversationMessageSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
