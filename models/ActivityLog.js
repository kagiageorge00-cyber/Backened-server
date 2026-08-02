const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  actorId: String,
  actorType: String,
  action: String,
  entityType: String,
  entityId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
