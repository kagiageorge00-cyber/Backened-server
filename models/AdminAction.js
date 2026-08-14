const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  adminId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  candidateId: { type: String, index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.AdminAction || mongoose.model('AdminAction', adminActionSchema);
