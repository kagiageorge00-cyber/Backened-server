const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const RegistrationEvent = require('../models/RegistrationEvent');
const AdminAction = require('../models/AdminAction');

function getRequestMeta(req) {
  const realIp = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  return {
    ip: Array.isArray(realIp) ? realIp[0] : String(realIp),
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date().toISOString(),
  };
}

router.post('/registration', async (req, res) => {
  try {
    const { candidateId, eventType, details } = req.body || {};

    if (!candidateId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'candidateId and eventType are required',
      });
    }

    const record = await RegistrationEvent.create({
      id: `REG-${randomUUID()}`,
      candidateId,
      eventType,
      details: {
        ...(details || {}),
        meta: getRequestMeta(req),
      },
    });

    return res.json({
      success: true,
      eventId: record.id,
      candidateId,
      eventType,
      data: record,
    });
  } catch (err) {
    console.error('Registration log error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post('/admin-actions', async (req, res) => {
  try {
    const { adminId, action, candidateId, details } = req.body || {};

    if (!adminId || !action) {
      return res.status(400).json({
        success: false,
        error: 'adminId and action are required',
      });
    }

    const record = await AdminAction.create({
      id: `AUD-${randomUUID()}`,
      adminId,
      action,
      candidateId,
      details: {
        ...(details || {}),
        meta: getRequestMeta(req),
      },
    });

    return res.json({
      success: true,
      auditId: record.id,
      adminId,
      action,
      data: record,
    });
  } catch (err) {
    console.error('Admin action log error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
