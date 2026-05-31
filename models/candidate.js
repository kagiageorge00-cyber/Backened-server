const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Candidate = require("./candidate");
const Payment = require("./Payment"); // MUST be mongoose model
const sendEmail = require("../email");

// ======================
// GENERATORS
// ======================
function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

function generateCandidateId() {
  return "BLISS-" + Date.now().toString().slice(-6);
}

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
    // CHECK EXISTING USER
    // ======================
    const existing = await Candidate.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Candidate already registered",
      });
    }

    // ======================
    // CHECK PAYMENT
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
    // GENERATE CREDENTIALS
    // ======================
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const uniqueCode = generateCandidateId();

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

      password: hashedPassword, // 🔐 secure
      uniqueCode,

      isVerified: true,
      paymentStatus: "completed",
      status: "available",
    });

    // ======================
    // SEND EMAIL (SAFE)
    // ======================
    try {
      await sendEmail(
        email,
        "Your Bliss Connect Login Details",
        `Hello ${fullName},

✅ Registration successful

Your login details:

ID: ${uniqueCode}
Password: ${rawPassword}

Login here: https://your-portal-link.com

— Bliss Connect`
      );
    } catch (emailErr) {
      console.error("⚠️ Email failed:", emailErr.message);
    }

    // ======================
    // RESPONSE
    // ======================
    res.status(201).json({
      success: true,
      message: "Registered successfully",
      candidateId: uniqueCode,
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