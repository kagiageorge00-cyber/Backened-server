const express = require('express');
const router = express.Router();
const {
  createPayment,
  createStkPayment,
  createCardPayment,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
} = require('../controllers/paymentcontroller');
const { verifyPaymentWebhook } = require('../middleware/paymentWebhookMiddleware');

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Payment API running.' });
});

router.post('/create', createPayment);
router.post('/stk', createStkPayment);
router.post('/card', createCardPayment);
router.post('/webhook', verifyPaymentWebhook, handleWebhook);
router.get('/status/:id', getPaymentStatus);
router.get('/:id', getPaymentStatus);

router.post('/payment', createPayment);
router.post('/verify', verifyPayment);

module.exports = router;