import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['credit', 'debit', 'refund', 'grant', 'adjustment'],
      required: true,
      index: true
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    referenceType: { type: String, default: '' },
    referenceId: { type: String, default: '' },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

creditTransactionSchema.index({ createdAt: -1 });

export const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);
