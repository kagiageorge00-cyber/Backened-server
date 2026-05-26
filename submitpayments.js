const express = require('express');
const router = express.Router();

// TEMP: in-memory store (replace with DB later)
const payments = [];

// POST /submitPayment
router.post('/submitPayment', async (req, res) => {
  try {
    const {
      name,
      phone,
      transactionCode,
      paymentMethod,
      amount,
      currency,
      bankAccountName,
      bankName,
      bankAccountNumber
    } = req.body;

    // 🔒 BASIC VALIDATION
    if (!name || !phone || !transactionCode || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // 🔒 PREVENT DUPLICATE TRANSACTION CODES
    const existing = payments.find(
      (p) => p.transactionCode === transactionCode
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Transaction code already used',
      });
    }

    // 🧾 CREATE PAYMENT RECORD
    const payment = {
      id: `PAY_${Date.now()}`,
      name,
      phone,
      transactionCode,
      paymentMethod,
      amount,
      currency,
      bankAccountName,
      bankName,
      bankAccountNumber,

      // IMPORTANT FLAGS
      status: 'pending', // admin must verify
      verified: false,

      createdAt: new Date().toISOString(),
    };

    // 💾 SAVE (TEMP ARRAY — replace with DB later)
    payments.push(payment);

    console.log('✅ NEW PAYMENT:', payment);

    return res.status(200).json({
      success: true,
      message: 'Payment submitted successfully',
      paymentId: payment.id,
    });

  } catch (error) {
    console.error('❌ PAYMENT ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while processing payment',
    });
  }
});


// OPTIONAL: GET ALL PAYMENTS (for admin testing)
router.get('/payments', (req, res) => {
  return res.json({
    success: true,
    data: payments,
  });
});

module.exports = router;