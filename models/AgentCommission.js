const mongoose = require('mongoose');

const agentCommissionSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    payoutMethod: { type: String, default: 'bank_transfer' },
    payoutReference: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const AgentCommission = mongoose.models.AgentCommission || mongoose.model('AgentCommission', agentCommissionSchema);
module.exports = AgentCommission;
