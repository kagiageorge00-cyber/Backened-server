const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
  visaId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  employerId: { type: String, required: true, index: true },
  candidateId: { type: String, required: true, index: true },
  visaNumber: { type: String, trim: true },
  expiryDate: { type: Date },
  fileUrl: { type: String },
  uploadedBy: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Visa || mongoose.model('Visa', visaSchema);
