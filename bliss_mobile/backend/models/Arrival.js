const mongoose = require('mongoose');

const arrivalSchema = new mongoose.Schema({
  arrivalId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  imageUrl: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  uploadedBy: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Arrival || mongoose.model('Arrival', arrivalSchema);
