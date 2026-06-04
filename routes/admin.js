console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");


const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { notifyPaymentApproved } = require("../services/notificationservice");

// ======================
// TEST ROUTE (VERY IMPORTANT)
// ======================
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working ✅" });
});

// ======================
// GET ALL CANDIDATES
// ======================
router.get("/candidates", async (req, res) => {
  console.log("/api/admin/candidates endpoint hit");
  try {
    const candidates = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (err) {
    console.error("❌ GET CANDIDATES ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ======================
// VERIFY USER
// ======================
router.post("/verify-user", async (req, res) => {
  try {
    const { phone } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { isVerified: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ======================
// UPDATE STATUS
// ======================
router.post("/status", async (req, res) => {
  try {
    const { phone, status } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { status }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ======================
// GET PENDING PAYMENTS
// ======================
const Payment = require("../models/Payment");

router.get("/payments/pending", async (req, res) => {
  try {
    const payments = await Payment.find({ status: "pending" }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments,
    });
  } catch (err) {
    console.error("❌ GET PENDING PAYMENTS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// APPROVE PAYMENT
// ======================
router.post("/payments/:paymentId/approve", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    payment.status = "completed";
    await payment.save();

    let notificationTarget = {
      email: payment.metadata?.email,
      name: payment.metadata?.name,
      phone: null,
      candidateId: null,
    };

    if (payment.userId) {
      const candidate = await User.findOne({
        $or: [
          { phone: payment.userId },
          { uniqueCode: payment.userId },
          { email: payment.userId },
        ],
      });

      if (candidate) {
        notificationTarget.email = notificationTarget.email || candidate.email;
        notificationTarget.name = notificationTarget.name || candidate.name;
        notificationTarget.phone = notificationTarget.phone || candidate.phone;
        notificationTarget.candidateId = candidate.uniqueCode || notificationTarget.candidateId;
      }
    }

    if (!notificationTarget.candidateId) {
      notificationTarget.candidateId = payment.metadata?.candidateId ||
        (typeof payment.userId === 'string' && payment.userId.startsWith('BLISS-') ? payment.userId : null);
    }

    let approvalEmailSent = false;
    if (notificationTarget.email) {
      await notifyPaymentApproved(notificationTarget);
      approvalEmailSent = true;
    }

    return res.json({
      success: true,
      message: "Payment approved",
      data: payment,
      notification: {
        approvalEmailSent,
      },
    });
  } catch (err) {
    console.error("❌ APPROVE PAYMENT ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;