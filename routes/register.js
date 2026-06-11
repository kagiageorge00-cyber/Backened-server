// routes/register.js

const express = require("express");
const path = require("path");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Candidate = require("../models/candidate");
const { FRONTEND_URL } = require("../config");
const {
  notifyRegistrationSuccess,
  notifyMarketplaceListing,
} = require(path.join(__dirname, "..", "services", "notificationservice"));
const { notifyCandidateRegistered } = require(path.join(__dirname, "..", "utils", "adminNotificationHelper"));

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
      "photoUrl",
      "videoUrl",
      "passportUrl",
      "medicalUrl",
      "conductUrl"
    ],
    optionalFields: [
      "resumeUrl",
      "additionalUrl"
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
      country,
      photoUrl,
      videoUrl,
      passportUrl,
      medicalUrl,
      conductUrl,
      resumeUrl,
      additionalUrl,
    } = req.body;

    const phone = req.body.phone || req.query.phone;

    // ======================
    // VALIDATION
    // ======================
    const requiredFields = [
      { key: 'phone', value: phone },
      { key: 'photoUrl', value: photoUrl },
      { key: 'videoUrl', value: videoUrl },
      { key: 'medicalUrl', value: medicalUrl },
      { key: 'conductUrl', value: conductUrl },
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
    let candidate = await Candidate.findOne({ phone });
    let passwordPlain;
    let uniqueCode;
    
    if (candidate) {
      // Update only the uploaded documents and preserve existing profile data
      candidate.fullName = fullName || candidate.fullName;
      candidate.name = fullName || candidate.name;
      candidate.email = email || candidate.email;
      candidate.country = country || candidate.country;
      candidate.photoUrl = photoUrl || candidate.photoUrl;
      candidate.videoUrl = videoUrl || candidate.videoUrl;
      candidate.passportUrl = passportUrl || candidate.passportUrl;
      candidate.medicalUrl = medicalUrl || candidate.medicalUrl;
      candidate.conductUrl = conductUrl || candidate.conductUrl;
      candidate.resumeUrl = resumeUrl || candidate.resumeUrl;
      candidate.additionalUrl = additionalUrl || candidate.additionalUrl;
      candidate.isVerified = true;
      candidate.paymentStatus = "completed";
      candidate.status = "available";
      candidate.uniqueCode = candidate.uniqueCode || generateCandidateCode();

      if (!candidate.password) {
        passwordPlain = `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
        candidate.password = await bcrypt.hash(passwordPlain, 10);
      }

      await candidate.save();
    } else {
      // ======================
      // GENERATE CREDENTIALS
      // ======================
      // Temporary password format: BLISS####
      passwordPlain = `BLISS${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(passwordPlain, 10);
      uniqueCode = generateCandidateCode();

      // ======================
      // CREATE CANDIDATE
      // ======================
      candidate = await Candidate.create({
        fullName,
        name: fullName, // 🔥 matches your schema
        email,
        phone,
        country,
        photoUrl,
        videoUrl,
        passportUrl,
        medicalUrl,
        conductUrl,
        resumeUrl,
        additionalUrl,
        uniqueCode, // ✅ correct field (not candidateId)
        password: hashedPassword,

        isVerified: true,
        paymentStatus: "completed",
        status: "available",
      });
    }

    const candidateCode = candidate.uniqueCode || uniqueCode;
    const candidatePortalLink = `${FRONTEND_URL}/candidate-portal`;
    const marketplaceProfileLink = `${FRONTEND_URL}/marketplace?candidate=${encodeURIComponent(candidateCode)}`;

    // ======================
    // SEND EMAILS 📧 (BACKGROUND ONLY)
    // ======================
    setImmediate(async () => {
      try {
        await notifyRegistrationSuccess({
          email,
          name: fullName,
          uniqueCode: candidateCode,
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
          uniqueCode: candidateCode,
          marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyMarketplaceListing failed:', notificationError);
      }
    });

    setImmediate(async () => {
      try {
        await notifyCandidateRegistered({
          candidateName: fullName || phone,
          phone,
          candidateCode,
          candidatePassword: passwordPlain,
          marketplaceLink: marketplaceProfileLink,
        });
      } catch (notificationError) {
        console.error('❌ notifyCandidateRegistered failed:', notificationError);
      }
    });

    // ======================
    // RESPONSE
    // ======================
    const resp = {
      success: true,
      message: 'Candidate registered successfully',
      candidateId: candidateCode,
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