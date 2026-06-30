const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/whatsappController');

router.post('/exchange_token', [
  body('accessToken').isString().notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const result = await controller.exchangeToken(req.body.accessToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/save_connection', [
  body('businessId').isString().notEmpty(),
  body('wabaId').isString().notEmpty(),
  body('phoneNumberId').isString().notEmpty(),
  body('accessToken').isString().notEmpty(),
  body('displayName').optional().isString(),
  body('phoneNumber').optional().isString()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const result = await controller.saveConnection(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Webhook verification & events
router.get('/webhook', controller.verifyWebhook);
router.post('/webhook', controller.handleWebhookEvent);

module.exports = router;
