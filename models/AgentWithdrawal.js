const mongoose = require('mongoose');

const agentWithdrawalSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'mobile_money', 'intasend'],
      default: 'bank_transfer',
    },
    destination: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    payoutReference: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const AgentWithdrawal = mongoose.models.AgentWithdrawal || mongoose.model('AgentWithdrawal', agentWithdrawalSchema);
module.exports = AgentWithdrawal;
