// routes/register.js

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Candidate = require("../models/candidate");
const Payment = require("../models/Payment");
const sendEmail = require("../email");

// ======================
// 🔐 HELPERS
// ======================
function generatePassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function generateCandidateCode() {
  return "BLISS-" + Math.floor(100000 + Math.random() * 900000); // cleaner ID
}

// ======================
// 🚀 REGISTER CANDIDATE
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
        error: "fullName, email and phone are required",
      });
    }

    // ======================
    // CHECK EXISTING
    // ======================
    const existing = await Candidate.findOne({ phone });
    if (existing) {
      return res.status(409).json({
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
    // GENERATE CREDENTIALS
    // ======================
    const passwordPlain = generatePassword();
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const uniqueCode = generateCandidateCode();

    // ======================
    // CREATE CANDIDATE
    // ======================
    const candidate = await Candidate.create({
      fullName,
      name: fullName, // 🔥 matches your schema
      email,
      phone,
      country,
      skills,
      experience,

      uniqueCode, // ✅ correct field (not candidateId)
      password: hashedPassword,

      isVerified: true,
      paymentStatus: "completed",
      status: "available",
    });

    // ======================
    // SEND EMAIL 📧
    // ======================
    await sendEmail(
      email,
      "Your Bliss Connect Login Details",
      `Hello ${fullName},

✅ Registration successful!

Your login details:

ID: ${uniqueCode}
Password: ${passwordPlain}

Login here: https://your-portal-link.com

— Bliss Connect`
    );

    // ======================
    // RESPONSE
    // ======================
    return res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      candidateId: uniqueCode,
      data: candidate,
    });

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
});

module.exports = router;