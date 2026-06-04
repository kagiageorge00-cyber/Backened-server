const express = require('express');
const router = express.Router();
const adminRoutes = require('./routes/admin');
const submitPaymentsRoutes = require('./routes/submitpayments');

if (!submitPaymentsRoutes.handleSubmitPayment) {
  throw new Error('submitpayments route must export handleSubmitPayment');
}

router.post('/submitPayment', submitPaymentsRoutes.handleSubmitPayment);
router.use('/admin', adminRoutes);

module.exports = router;
