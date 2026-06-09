console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Candidate = require("../models/candidate");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { createNotification } = require("../utils/notificationHelper");

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
    req.query.token ||
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

      payment.status = "approved";
      // generate application form link and save
      try {
        const formLink = `${FRONTEND_URL}/#/candidate-form/${payment._id}`;
        payment.formLink = formLink;
        payment.linkGeneratedAt = new Date();
        await payment.save();
      } catch (linkErr) {
        console.error('❌ Failed to generate/save form link:', linkErr);
      }
      await payment.save();

      const candidate = await Candidate.findOne({
        $or: [
          { phone: payment.userId },
          { email: payment.userId },
          { uniqueCode: payment.userId },
        ],
      });

      if (candidate) {
        candidate.isVerified = true;
        candidate.paymentStatus = "completed";
        candidate.status = "approved";
        await candidate.save();
      }

      await createNotification({
        userId: payment.userId,
        title: 'Payment Approved',
        message: 'Your payment has been approved. Continue your application.',
        type: 'approval',
        actionUrl: `/candidate-form?phone=${encodeURIComponent(candidate?.phone || payment.userId)}`,
      });

      res.json({
        success: true,
        message: "Payment approved successfully",
        formLink: payment.formLink || null,
      });

      const email = candidate?.email || payment.metadata?.email;
      const name = candidate?.fullName || candidate?.name || payment.metadata?.name || 'Candidate';
      const phoneParam = candidate?.phone || payment.userId;
      const link = `${FRONTEND_URL}/candidate-form?phone=${encodeURIComponent(phoneParam)}`;

      if (email) {
        setImmediate(async () => {
          try {
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

async function fetchCandidates(req, res) {
  try {
    const { limit = 50, skip = 0, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const candidates = await Candidate.find(filter)
      .select("_id fullName phone email status createdAt")
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .sort({ createdAt: -1 });

    const total = await Candidate.countDocuments(filter);

    res.json({
      success: true,
      count: total,
      data: candidates,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function fetchCandidateById(req, res) {

// ======================
// GET FORM LINK (ADMIN)
// ======================
router.get('/payments/:paymentId/form-link', requireAdminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    const candidate = await Candidate.findOne({ $or: [ { phone: payment.userId }, { email: payment.userId }, { uniqueCode: payment.userId } ] });

    return res.json({
      success: true,
      paymentId: payment._id,
      phone: payment.userId,
      candidateName: candidate ? (candidate.fullName || candidate.name) : null,
      formLink: payment.formLink || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
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

    const payment = await Payment.findOne({
      userId: { $in: [candidate.phone, candidate.email, candidate.uniqueCode, candidate._id.toString()] },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      candidate,
      payment: payment || null,
      documents: candidate.documents || {
        passportPhoto: candidate.passportUrl || null,
        cv: candidate.resumeUrl || null,
        certificates: [],
        coverLetter: null,
        nationalId: null,
        uploads: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function fetchCandidateDocuments(req, res) {
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

    return res.json({
      success: true,
      documents: {
        passportPhoto: candidate.documents?.passportPhoto || null,
        nationalId: candidate.documents?.nationalId || null,
        cv: candidate.documents?.cv || null,
        certificates: candidate.documents?.certificates || [],
        coverLetter: candidate.documents?.coverLetter || null,
        uploads: candidate.documents?.uploads || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/candidates", requireAdminAuth, fetchCandidates);
router.get("/marketplace/candidates", requireAdminAuth, fetchCandidates);
router.get("/candidates/:id", requireAdminAuth, fetchCandidateById);
router.get("/marketplace/candidates/:id", requireAdminAuth, fetchCandidateById);
router.get("/candidates/:id/documents", requireAdminAuth, fetchCandidateDocuments);
router.post("/payments/:paymentId/reject", requireAdminAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    payment.status = "rejected";
    await payment.save();

    await createNotification({
      userId: payment.userId,
      title: 'Payment Rejected',
      message: 'Your payment could not be verified.',
      type: 'rejection',
      actionUrl: `/candidate/support`,
    });

    res.json({ success: true, message: 'Payment rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', requireAdminAuth, (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    if (token) {
      adminSessions.delete(token);
    }
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/verify-user', requireAdminAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone is required' });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { phone },
      { isVerified: true },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, message: 'Candidate verified', data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/status', requireAdminAuth, async (req, res) => {
  try {
    const { phone, status } = req.body;
    if (!phone || !status) {
      return res.status(400).json({ success: false, error: 'Phone and status are required' });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { phone },
      { status },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    return res.json({ success: true, message: `Status updated to ${status}`, data: candidate });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/notifications/count', requireAdminAuth, async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ isRead: false });
    return res.json({ success: true, total, unread });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.get('/notifications/counts', requireAdminAuth, async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ isRead: false });
    return res.json({ success: true, total, unread });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/dashboard/summary', requireAdminAuth, async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const approvedPayments = await Payment.countDocuments({ status: 'approved' });
    const rejectedPayments = await Payment.countDocuments({ status: 'rejected' });
    const notifications = await Notification.countDocuments();

    return res.json({
      success: true,
      totalCandidates,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      notifications,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
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