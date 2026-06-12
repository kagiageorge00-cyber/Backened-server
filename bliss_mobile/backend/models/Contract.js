const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  salary: { type: Number, default: 0 },
  country: { type: String, trim: true },
  position: { type: String, trim: true },
  contractFile: { type: String },
  signedByCandidateAt: { type: Date },
  signedByEmployerAt: { type: Date },
  status: { type: String, enum: ['generated', 'candidate_signed', 'employer_signed', 'completed'], default: 'generated', index: true },
}, { timestamps: true });

module.exports = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
