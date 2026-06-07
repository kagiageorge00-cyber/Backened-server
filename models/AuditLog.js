const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  actionId: { type: String, required: true, unique: true, index: true },
  actorId: { type: String },
  actorType: { type: String },
  action: { type: String },
  entityType: { type: String },
  entityId: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
