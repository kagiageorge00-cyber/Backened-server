// routes/register.js

const express = require("express");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Candidate = require("../models/candidate");
const {
  notifyRegistrationSuccess,
  notifyMarketplaceListing,
} = require(path.join(__dirname, "..", "services", "notificationservice"));

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
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `CAND-${year}-${seq}`;
}

// ======================
// REGISTER ROUTE INFO
// ======================
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Use POST /api/register with candidate data to register a candidate.",
    requiredFields: [
      "fullName",
      "email",
      "phone",
      "country",
      "skills",
      "experience",
      "photoUrl",
      "videoUrl",
      "passportUrl",
      "medicalUrl",
    ],
  });
});

// ======================
// 🚀 REGISTER CANDIDATE
// ======================
router.post("/", async (req, res) => {
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
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
    } = req.body;

    // ======================
    // VALIDATION
    // ======================
    const requiredFields = [
      { key: 'fullName', value: fullName },
      { key: 'phone', value: phone },
      { key: 'country', value: country },
      { key: 'skills', value: skills },
      { key: 'experience', value: experience },
      { key: 'photoUrl', value: photoUrl },
      { key: 'videoUrl', value: videoUrl },
      { key: 'passportUrl', value: passportUrl },
      { key: 'medicalUrl', value: medicalUrl },
    ];

    const missingField = requiredFields.find((field) => {
      const value = field.value;
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });

    if (missingField) {
      return res.status(400).json({
        success: false,
        error: `${missingField.key} is required`,
      });
    }

    // ======================
    // CHECK EXISTING
    // ======================
    const existing = await Candidate.findOne({
      $or: [{ phone }, { email }],
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Candidate already registered",
      });
    }

    // ======================
    // GENERATE CREDENTIALS
    // ======================
    // Temporary password format: BLISS####
    const passwordPlain = `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
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
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      resumeUrl,
      additionalUrl,
      uniqueCode, // ✅ correct field (not candidateId)
      password: hashedPassword,

      isVerified: true,
      paymentStatus: "completed",
      status: "available",
    });

    const candidatePortalLink = `${FRONTEND_URL}/candidate-portal`;
    const marketplaceProfileLink = `${FRONTEND_URL}/marketplace?candidate=${encodeURIComponent(uniqueCode)}`;

    // ======================
    // SEND EMAILS 📧 (BACKGROUND ONLY)
    // ======================
    setImmediate(async () => {
      try {
        await notifyRegistrationSuccess({
          email,
          name: fullName,
          uniqueCode,
          password: passwordPlain,
          candidatePortalLink,
          marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyRegistrationSuccess failed:', notificationError);
      }
    });

    setImmediate(async () => {
      try {
        await notifyMarketplaceListing({
          email,
          name: fullName,
          uniqueCode,
          marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyMarketplaceListing failed:', notificationError);
      }
    });

    // ======================
    // RESPONSE
    // ======================
    const resp = {
      success: true,
      message: 'Candidate registered successfully',
      candidateId: uniqueCode,
      data: candidate,
      candidatePortalLink,
      marketplaceProfileLink,
    };

    // include plain password so frontend can display it once (only on create)
    if (passwordPlain) {
      resp.password = passwordPlain;
    }

    return res.status(201).json(resp);

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
});

module.exports = router;