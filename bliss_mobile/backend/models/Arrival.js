const mongoose = require('mongoose');

const arrivalSchema = new mongoose.Schema({
  arrivalId: { type: String, required: true, unique: true, index: true },
  deploymentId: { type: String, required: true, index: true },
  selfieImage: { type: String },
  uploadedBy: { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.Arrival || mongoose.model('Arrival', arrivalSchema);
