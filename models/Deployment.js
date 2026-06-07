const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true, unique: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  interviewStatus: { type: String, default: 'interview' },
  paymentStatus: { type: String, default: 'pending' },
  contractStatus: { type: String, default: 'generated' },
  visaStatus: { type: String, default: 'pending' },
  ticketStatus: { type: String, default: 'pending' },
  arrivalStatus: { type: String, default: 'pending' },
  deploymentStatus: { type: String, default: 'interview' },
}, { timestamps: true });

module.exports = mongoose.models.Deployment || mongoose.model('Deployment', deploymentSchema);
