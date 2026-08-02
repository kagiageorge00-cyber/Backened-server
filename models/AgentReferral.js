const mongoose = require('mongoose');

const agentReferralSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    referredName: { type: String, required: true, trim: true },
    referredEmail: { type: String, default: '' },
    referredPhone: { type: String, default: '' },
    referralType: {
      type: String,
      enum: ['candidate', 'employer'],
      default: 'candidate',
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'converted', 'rejected'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const AgentReferral = mongoose.models.AgentReferral || mongoose.model('AgentReferral', agentReferralSchema);
module.exports = AgentReferral;
