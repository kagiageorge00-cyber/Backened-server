const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true, unique: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  candidateName: { type: String },
  candidateCountry: { type: String },
  candidateEmail: { type: String },
  interviewId: { type: String, index: true },
  deploymentFee: { type: Number, default: 1000 },
  paymentStatus: { type: String, enum: ['pending', 'submitted', 'verified', 'failed'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['bank_transfer', 'western_union', 'moneygram', 'other'], default: 'bank_transfer' },
  referenceNumber: { type: String },
  receiptUrl: { type: String },
  paymentNotes: { type: String },
  adminVerified: { type: Boolean, default: false, index: true },
  verifiedAt: { type: Date },
  verifiedBy: { type: String },
  documentUrls: [{ type: String }],
  visaStatus: { type: String, enum: ['pending', 'awaiting_submission', 'submitted', 'verified'], default: 'pending', index: true },
  visaUrl: { type: String },
  visaUploadedAt: { type: Date },
  currentStage: {
    type: String,
    enum: ['Interview Passed', 'Payment', 'Documents', 'Visa', 'Contract', 'Ticket', 'Arrival', 'Active'],
    default: 'Interview Passed',
    index: true,
  },
  progress: { type: Number, default: 0 },
  contractStatus: { type: String, enum: ['generated', 'candidate_signed', 'employer_signed', 'completed'], default: 'generated' },
  ticketStatus: { type: String, enum: ['pending', 'uploaded', 'confirmed'], default: 'pending' },
  arrivalStatus: { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
  deploymentStatus: { type: String, enum: ['interview', 'active', 'completed', 'cancelled'], default: 'interview' },
}, { timestamps: true });

module.exports = mongoose.models.Deployment || mongoose.model('Deployment', deploymentSchema);
