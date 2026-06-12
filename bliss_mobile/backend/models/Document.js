const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  candidateId: { type: String, required: true, index: true },
  documentType: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['Uploaded','Verified','Rejected'], default: 'Uploaded' },
}, { timestamps: true });

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);
