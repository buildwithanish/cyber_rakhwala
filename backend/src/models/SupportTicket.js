import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ['user', 'support', 'system'], default: 'user' },
    senderName: { type: String, default: '' },
    message: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: {
      type: String,
      enum: ['contact', 'feedback', 'bug', 'feature', 'improvement', 'support'],
      default: 'support'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    rating: { type: Number, min: 1, max: 5 },
    subject: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    page: { type: String, default: '' },
    category: { type: String, default: '' },
    messages: [ticketMessageSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

supportTicketSchema.index({ subject: 'text', email: 'text', ticketNumber: 'text' });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
