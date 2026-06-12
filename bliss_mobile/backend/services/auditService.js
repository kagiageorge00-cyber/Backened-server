const AuditLog = require('../models/AuditLog');

async function logAction({ actionId, actorId, actorType, action, entityType, entityId }) {
  try {
    return await AuditLog.create({
      actionId: actionId || `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actorId,
      actorType,
      action,
      entityType,
      entityId,
    });
  } catch (error) {
    console.warn('Audit log failed:', error.message);
    return null;
  }
}

module.exports = {
  logAction,
};
