const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentcontroller');
const { verifyPaymentWebhook } = require('../middleware/paymentWebhookMiddleware');

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Payments API is running.' });
});

router.post('/create', paymentController.createPayment);
router.post('/stk', paymentController.createStkPayment);
router.post('/card', paymentController.createCardPayment);
router.post('/webhook', verifyPaymentWebhook, paymentController.handleWebhook);
router.post('/verify', paymentController.verifyPayment);
router.get('/status/:id', paymentController.getPaymentStatus);

module.exports = router;
