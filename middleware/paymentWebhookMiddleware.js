const crypto = require('crypto');
const logger = require('../utils/logger');
const { intasendConfig } = require('../config/payment');

function verifyPaymentWebhook(req, res, next) {
  const signature = req.get('x-intasend-signature')
    || req.get('x-intasend-webhook-signature')
    || req.get('x-signature')
    || '';

  if (!intasendConfig.webhookSecret) {
    logger.error('INTASEND_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ success: false, error: 'Webhook secret is not configured.' });
  }

  if (!signature) {
    logger.warn('Missing IntaSend webhook signature');
    return res.status(401).json({ success: false, error: 'Missing webhook signature.' });
  }

  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
  const expectedSignature = crypto
    .createHmac('sha256', intasendConfig.webhookSecret)
    .update(rawBody)
    .digest('hex');

  const providedSignature = signature.trim();
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    logger.warn('Invalid IntaSend webhook signature', { signature: providedSignature });
    return res.status(401).json({ success: false, error: 'Invalid webhook signature.' });
  }

  next();
}

module.exports = {
  verifyPaymentWebhook,
};
