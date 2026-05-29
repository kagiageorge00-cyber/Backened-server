const mongoose = require('mongoose');

const paymentSubmissionSchema = new mongoose.Schema({
  candidateId: { type: String, default: '' },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  transactionCode: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'KES' },
  bankAccountName: { type: String, default: '' },
  bankName: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  verified: { type: Boolean, default: false },
  approvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.PaymentSubmission || mongoose.model('PaymentSubmission', paymentSubmissionSchema);
