const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  transactionReference: { type: String },
  paymentMethod: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paidAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.PaymentRecord || mongoose.model('PaymentRecord', paymentSchema);
