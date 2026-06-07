const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  contractFile: { type: String },
  signedFile: { type: String },
  status: { type: String, enum: ['generated', 'candidate_signed', 'employer_signed', 'completed'], default: 'generated' },
}, { timestamps: true });

module.exports = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
