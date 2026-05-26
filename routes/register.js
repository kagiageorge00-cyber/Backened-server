const express = require("express");
const router = express.Router();
const Candidate = require("../models/Candidate");
const Payment = require("../models/Payment"); // make sure this exists
const sendEmail = require("../email"); // your email service

// ======================
// REGISTER CANDIDATE
// ======================
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      country,
      skills,
      experience,
      photoUrl,
      videoUrl,
    } = req.body;

    // ======================
    // VALIDATION
    // ======================
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // ======================
    // CHECK IF ALREADY EXISTS
    // ======================
    const existing = await Candidate.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Candidate already registered",
      });
    }

    // ======================
    // CHECK PAYMENT FIRST 🔒
    // ======================
    const payment = await Payment.findOne({
      userId: phone,
      status: "completed",
    });

    if (!payment) {
      return res.status(403).json({
        success: false,
        error: "Complete payment before registering",
      });
    }

    // ======================
    // CREATE CANDIDATE
    // ======================
    const candidate = await Candidate.create({
      fullName,
      email,
      phone,
      country,
      skills,
      experience,
      photoUrl,
      videoUrl,

      // 🔥 SYSTEM FLAGS
      isVerified: true,
      paymentStatus: "completed",
      status: "available",
    });

    // ======================
    // SEND EMAIL 📧
    // ======================
    await sendEmail(
      email,
      "Application Successful - Bliss Connect",
      `Hello ${fullName},

🎉 Your application has been received successfully.

✅ You are now a verified candidate on Bliss Connect.

We will match you with available jobs soon.

Thank you for trusting us.

— Bliss Connect`
    );

    // ======================
    // RESPONSE
    // ======================
    res.json({
      success: true,
      message: "Candidate registered successfully",
      data: candidate,
    });

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;