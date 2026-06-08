console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Candidate = require("../models/candidate");
const Payment = require("../models/Payment");

// ✅ FIX: correct import
const { sendEmail } = require("../email");

const { FRONTEND_URL } = require("../config");

// ======================
// ADMIN CREDENTIALS
// ======================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "boss";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || "boss123",
  10
);

// ======================
// SESSION STORE
// ======================
const adminSessions = new Map();

// ======================
// AUTH MIDDLEWARE
// ======================
function requireAdminAuth(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.body.token;

  if (!token || !adminSessions.has(token)) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthorized" });
  }

  const session = adminSessions.get(token);

  if (Date.now() - session.createdAt > 3600000) {
    adminSessions.delete(token);
    return res
      .status(401)
      .json({ success: false, error: "Session expired" });
  }

  next();
}

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Missing fields" });
    }

    if (username !== ADMIN_USERNAME) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const match = bcrypt.compareSync(
      password,
      ADMIN_PASSWORD_HASH
    );

    if (!match) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = require("crypto")
      .randomBytes(32)
      .toString("hex");

    adminSessions.set(token, {
      createdAt: Date.now(),
      username,
    });

    res.json({
      success: true,
      token,
      expiresIn: 3600,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// GET PAYMENTS
// ======================
router.get("/payments/pending", requireAdminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({
      status: "pending",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// APPROVE PAYMENT (FIXED CLEAN VERSION)
// ======================
router.post(
  "/payments/:paymentId/approve",
  requireAdminAuth,
  async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res
          .status(404)
          .json({ success: false, error: "Payment not found" });
      }

      payment.status = "completed";
      await payment.save();

      let user = null;

      if (payment.userId) {
        user =
          (await User.findOne({
            $or: [
              { phone: payment.userId },
              { email: payment.userId },
              { uniqueCode: payment.userId },
            ],
          })) ||
          (await Candidate.findOne({
            $or: [
              { phone: payment.userId },
              { email: payment.userId },
              { uniqueCode: payment.userId },
            ],
          }));
      }

      const email = user?.email || payment.metadata?.email;
      const name =
        user?.name || user?.fullName || payment.metadata?.name;

      if (!email) {
        console.warn("⚠️ No email found for approval");
        return res.json({
          success: true,
          message: "Payment approved (no email sent)",
        });
      }

      const phoneParam = user?.phone || payment.userId;

      const link = `${FRONTEND_URL}/candidate-form?phone=${encodeURIComponent(
        phoneParam
      )}`;

      console.log("📧 Sending approval email:", email);

      await sendEmail(
        email,
        "Payment Approved ✅",
        `Hello ${name}, your payment is approved.`,
        `<h2>Payment Approved ✅</h2>
         <p>Hello ${name}</p>
         <p>Complete form:</p>
         <a href="${link}">Open Form</a>`
      );

      res.json({
        success: true,
        message: "Payment approved",
      });
    } catch (err) {
      console.error("❌ APPROVE ERROR:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

module.exports = router;