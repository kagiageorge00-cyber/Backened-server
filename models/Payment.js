const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    invoiceId: {
      type: String,
      trim: true,
      default: null,
    },
    formLink: {
      type: String,
      trim: true,
      default: null,
    },
    linkGeneratedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    checkoutId: {
      type: String,
      trim: true,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card', 'visa', 'mastercard', 'cash'],
      default: 'mpesa',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'KES',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ candidateId: 1, status: 1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = Payment;