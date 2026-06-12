const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true, unique: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  interviewId: { type: String, index: true },
  deploymentFee: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
  currentStage: {
    type: String,
    enum: ['Interview Passed', 'Payment', 'Documents', 'Contract', 'Visa', 'Ticket', 'Arrival', 'Active'],
    default: 'Interview Passed',
    index: true,
  },
  progress: { type: Number, default: 0 },
  contractStatus: { type: String, enum: ['generated', 'candidate_signed', 'employer_signed', 'completed'], default: 'generated' },
  visaStatus: { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
  ticketStatus: { type: String, enum: ['pending', 'uploaded', 'confirmed'], default: 'pending' },
  arrivalStatus: { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
  deploymentStatus: { type: String, enum: ['interview', 'active', 'completed', 'cancelled'], default: 'interview' },
}, { timestamps: true });

module.exports = mongoose.models.Deployment || mongoose.model('Deployment', deploymentSchema);
