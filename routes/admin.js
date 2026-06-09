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

      res.json({
        success: true,
        message: "Payment approved",
      });

      if (email) {
        setImmediate(async () => {
          try {
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
          } catch (emailErr) {
            console.error("❌ Approval email error:", emailErr);
          }
        });
      }
    } catch (err) {
      console.error("❌ APPROVE ERROR:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

// ======================
// MARKETPLACE - VIEW CANDIDATES (ADMIN PANEL)
// ======================
router.get("/candidates", requireAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, status = "available" } = req.query;

    const filter = status ? { status } : {};

    const candidates = await Candidate.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await Candidate.countDocuments(filter);

    res.json({
      success: true,
      data: candidates,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/candidates/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findOne({
      $or: [
        { _id: id },
        { uniqueCode: id },
        { phone: id },
        { email: id },
      ],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/marketplace/candidates", requireAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, status = "available" } = req.query;

    const filter = status ? { status } : {};

    const candidates = await Candidate.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await Candidate.countDocuments(filter);

    res.json({
      success: true,
      data: candidates,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// MARKETPLACE - GET CANDIDATE DETAILS
// ======================
router.get("/marketplace/candidates/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findOne({
      $or: [
        { _id: id },
        { uniqueCode: id },
        { phone: id },
        { email: id },
      ],
    });

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// MARKETPLACE - SEARCH CANDIDATES
// ======================
router.get("/marketplace/search", requireAdminAuth, async (req, res) => {
  try {
    const { query, skills, country, status } = req.query;

    let filter = {};

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ];
    }

    if (skills) {
      filter.skills = { $regex: skills, $options: "i" };
    }

    if (country) {
      filter.country = { $regex: country, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    const candidates = await Candidate.find(filter).limit(50).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
      total: candidates.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// MARKETPLACE - UPDATE CANDIDATE STATUS
// ======================
router.patch("/marketplace/candidates/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    const candidate = await Candidate.findOneAndUpdate(
      {
        $or: [
          { _id: id },
          { uniqueCode: id },
          { phone: id },
        ],
      },
      { status },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }

    res.json({
      success: true,
      message: `Candidate status updated to ${status}`,
      data: candidate,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;