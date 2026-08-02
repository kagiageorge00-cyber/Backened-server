const ActivityLog = require('../models/ActivityLog');

module.exports = function audit(action, options = {}) {
  return async (req, res, next) => {
    try {
      const actorId = (req.employer && req.employer.employerId) || (req.user && req.user.employerId) || req.headers['x-user-id'] || null;
      const actorType = req.employer ? 'employer' : req.user ? 'admin' : 'system';
      const entityType = options.entityType || req.params.entityType || 'unknown';
      const entityId = options.entityId || req.params.contractId || req.params.id || null;
      await ActivityLog.create({
        actorId,
        actorType,
        action,
        entityType,
        entityId,
        details: { body: req.body },
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (err) {
      console.warn('Audit log failed', err.message || err);
    }
    next();
  };
};
