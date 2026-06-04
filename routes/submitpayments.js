const express = require("express");
const router = express.Router();

// ✅ CORRECT MODEL PATH
const Payment = require("../models/Payment");
const User = require("../models/User");
const { notifyPaymentSuccess } = require("../services/notificationservice");

// ==========================
// SUBMIT PAYMENT HANDLER
// ==========================
async function handleSubmitPayment(req, res) {
  try {
    const {
      userId: userIdFromBody,
      email,
      name,
      amount,
      transactionCode,
      paymentMethod,
      phone,
      candidateId,
    } = req.body;

    const userId = userIdFromBody || phone || candidateId || email;

    if (!userId || !amount || !transactionCode) {
      return res.status(400).json({
        success: false,
        error: "userId, amount, transactionCode required",
      });
    }

    // جلوگیری duplicate
    const exists = await Payment.findOne({
      transactionId: transactionCode,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    const payment = await Payment.create({
      intentId: "intent_" + Date.now(),
      userId,
      amount,
      title: "Application Payment",
      method: paymentMethod || "mpesa",
      status: "pending",
      transactionId: transactionCode,
      metadata: { name, email },
    });

    console.log("✅ Payment saved");

    const notifyUser = {
      email,
      name,
    };

    if (!notifyUser.email && userId) {
      const candidate = await User.findOne({
        $or: [
          { phone: userId },
          { uniqueCode: userId },
          { email: userId },
        ],
      });
      if (candidate) {
        notifyUser.email = candidate.email;
        notifyUser.name = candidate.name || notifyUser.name;
      }
    }

    if (notifyUser.email) {
      await notifyPaymentSuccess(notifyUser);
    }

    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id || payment.id,
      data: payment,
    });

  } catch (err) {
    console.error("❌ Payment error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

router.post('/payments', handleSubmitPayment);

module.exports = router;
module.exports.handleSubmitPayment = handleSubmitPayment;