const mongoose = require('mongoose');

const deploymentPaymentSchema = new mongoose.Schema({
  deploymentPaymentId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  transactionId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  method: { type: String, trim: true },
  paidAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.DeploymentPayment || mongoose.model('DeploymentPayment', deploymentPaymentSchema);
