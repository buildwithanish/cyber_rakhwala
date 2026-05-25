import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    number: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'void'],
      default: 'issued'
    },
    currency: { type: String, default: 'INR' },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    dueAt: { type: Date },
    pdfUrl: { type: String, default: '' },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        amount: { type: Number, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
