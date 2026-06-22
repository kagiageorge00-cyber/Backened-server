console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Candidate = require("../models/candidate");
const Employer = require("../models/Employer");
const EmployerNotification = require("../models/EmployerNotification");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { createNotification } = require("../utils/notificationHelper");
const {
  notifyPaymentApproved,
  notifyPaymentRejected,
} = require("../utils/adminNotificationHelper");

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

function sanitizeValue(value) {
  return typeof value === 'string' ? value.trim() : value;
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

      // Notify admin about payment approval
      if (process.env.NODE_ENV !== 'test') {
        setImmediate(async () => {
          try {
            await notifyPaymentApproved({
              candidateName: candidate?.fullName || candidate?.name || 'Candidate',
              amount: payment.amount,
              currency: payment.metadata?.currency || 'KES',
              paymentId: payment._id,
            });
          } catch (err) {
            console.error('❌ Error creating admin notification:', err);
          }
        });
      }

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
              "Payment Approved – Bliss Connect",
              `Hello ${name}, your payment has been approved. Please complete the next step by submitting your candidate form.`,
              `
              <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px;">
                  <div>
                    <img src="https://blissconnect12.netlify.app/assets/images/logo.png" alt="Bliss Connect" style="max-height: 48px;" />
                  </div>
                  <div style="text-align: right; color: #777; font-size: 14px;">
                    <p style="margin: 0;">Payment Approved</p>
                  </div>
                </div>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hello ${name},</p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your payment has been reviewed and approved successfully. Thank you for completing this step.</p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Please proceed to complete your candidate form using the link below:</p>
                <p style="margin: 0 0 24px;"><a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: #0056d6; color: #ffffff; text-decoration: none; border-radius: 4px;">Complete Candidate Form</a></p>
                <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">If you need assistance, reply to this email and our support team will be happy to help.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
                  <p style="margin: 0;">Bliss Connect</p>
                  <p style="margin: 4px 0 0;">Dedicated support for overseas placement.</p>
                  <p style="margin: 4px 0 0;">Need assistance? Email <a href="mailto:blssspprtteam@gmail.com" style="color: #0056d6; text-decoration: none;">blssspprtteam@gmail.com</a></p>
                </div>
              </div>
              `
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
      .select('-password')
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
    const { reason } = req.body;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const candidate = await Candidate.findOne({
      $or: [
        { phone: payment.userId },
        { email: payment.userId },
        { uniqueCode: payment.userId },
      ],
    });

    payment.status = "rejected";
    await payment.save();

    await createNotification({
      userId: payment.userId,
      title: 'Payment Rejected',
      message: 'Your payment could not be verified.',
      type: 'rejection',
      actionUrl: `/candidate/support`,
    });

    // Notify admin about payment rejection
    setImmediate(async () => {
      try {
        await notifyPaymentRejected({
          candidateName: candidate?.fullName || candidate?.name || 'Candidate',
          amount: payment.amount,
          currency: payment.metadata?.currency || 'KES',
          paymentId: payment._id,
          reason: reason || 'No reason provided',
        });
      } catch (err) {
        console.error('❌ Error creating admin notification:', err);
      }
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
    const total = await Notification.countDocuments({ userType: 'admin' });
    const unread = await Notification.countDocuments({ userType: 'admin', isRead: false });
    return res.json({ success: true, total, unread });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// ADMIN NOTIFICATION CENTER
// ======================

// Get all admin notifications
router.get('/notifications', requireAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, category, isRead } = req.query;
    
    const filter = { userType: 'admin' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10));

    const total = await Notification.countDocuments(filter);
    const unread = await Notification.countDocuments({ ...filter, isRead: false });

    return res.json({ 
      success: true, 
      data: notifications, 
      total,
      unread,
      count: notifications.length 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get unread notification count
router.get('/notifications/unread/count', requireAdminAuth, async (req, res) => {
  try {
    const unread = await Notification.countDocuments({ userType: 'admin', isRead: false });
    return res.json({ success: true, unread });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get single notification
router.get('/notifications/:notificationId', requireAdminAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({ notificationId });
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    return res.json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', requireAdminAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { notificationId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    return res.json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mark all notifications as read
router.patch('/notifications/read-all', requireAdminAuth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userType: 'admin', isRead: false },
      { isRead: true }
    );
    
    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete notification
router.delete('/notifications/:notificationId', requireAdminAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await Notification.deleteOne({ notificationId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete all notifications
router.delete('/notifications', requireAdminAuth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userType: 'admin' });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Search notifications
router.get('/notifications/search/query', requireAdminAuth, async (req, res) => {
  try {
    const { q, category } = req.query;
    
    const filter = { userType: 'admin' };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } },
        { candidateName: { $regex: q, $options: 'i' } },
        { employerName: { $regex: q, $options: 'i' } },
      ];
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ success: true, data: notifications, count: notifications.length });
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
    const totalEmployers = await Employer.countDocuments();
    const pendingEmployers = await Employer.countDocuments({ status: 'pending' });
    const activeEmployers = await Employer.countDocuments({ status: 'active' });

    return res.json({
      success: true,
      totalCandidates,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      notifications,
      totalEmployers,
      pendingEmployers,
      activeEmployers,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employers', requireAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, status, verificationStatus, query } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (query) {
      filter.$or = [
        { employerId: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    const employers = await Employer.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10));

    const total = await Employer.countDocuments(filter);

    return res.json({ success: true, data: employers, count: employers.length, total });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/employers/:employerId', requireAdminAuth, async (req, res) => {
  try {
    const { employerId } = req.params;
    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
    if (!employer) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    return res.json({ success: true, data: employer });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/employers/:employerId/approve', requireAdminAuth, async (req, res) => {
  try {
    const { employerId } = req.params;
    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
    if (!employer) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    if (!employer.emailVerified || !employer.phoneVerified) {
      return res.status(400).json({
        success: false,
        error: 'Employer must verify email and phone before approval',
      });
    }

    employer.status = 'active';
    employer.verificationStatus = 'verified_employer';
    employer.verificationHistory = employer.verificationHistory || [];
    employer.verificationHistory.push({
      action: 'approved',
      by: 'admin',
      reason: req.body.reason || 'Approved by admin',
      timestamp: new Date(),
    });
    await employer.save();

    await EmployerNotification.create({
      employerId: employer.employerId,
      type: 'approval',
      category: 'info',
      title: 'Employer Approved',
      message: 'Your employer account has been approved and is now active.',
      data: { employerId: employer.employerId },
    });

    if (employer.email) {
      await sendEmail(
        employer.email,
        'Your Bliss Connect Employer Account Is Approved',
        `Hello ${employer.companyName || employer.fullName}, your employer account has been approved and is now active.`,
        `<p>Hello ${employer.companyName || employer.fullName},</p><p>Your employer account has been approved and is now active. You can now access the marketplace and manage your candidate requests.</p>`
      );
    }

    return res.json({ success: true, message: 'Employer approved', data: employer });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/employers/:employerId/reject', requireAdminAuth, async (req, res) => {
  try {
    const { employerId } = req.params;
    const { reason } = req.body;
    const employer = await Employer.findOne({ employerId: sanitizeValue(employerId) });
    if (!employer) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    employer.status = 'pending';
    employer.verificationHistory = employer.verificationHistory || [];
    employer.verificationHistory.push({
      action: 'rejected',
      by: 'admin',
      reason: reason || 'Rejected by admin',
      timestamp: new Date(),
    });
    await employer.save();

    await EmployerNotification.create({
      employerId: employer.employerId,
      type: 'rejection',
      category: 'info',
      title: 'Employer Registration Rejected',
      message: reason || 'Your employer registration was rejected. Please reopen the application for next steps.',
      data: { employerId: employer.employerId },
    });

    if (employer.email) {
      await sendEmail(
        employer.email,
        'Your Bliss Connect Employer Account Needs Attention',
        `Hello ${employer.companyName || employer.fullName}, your employer registration was not approved. ${reason || ''}`,
        `<p>Hello ${employer.companyName || employer.fullName},</p><p>Your employer registration was not approved. ${reason || ''}</p>`
      );
    }

    return res.json({ success: true, message: 'Employer rejected', data: employer });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/employers/:employerId/status', requireAdminAuth, async (req, res) => {
  try {
    const { employerId } = req.params;
    const { status, verificationStatus } = req.body;
    if (!status && !verificationStatus) {
      return res.status(400).json({ success: false, error: 'status or verificationStatus is required' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (verificationStatus) updates.verificationStatus = verificationStatus;
    updates.verificationHistory = (updates.verificationHistory || []).concat({
      action: 'status_update',
      by: 'admin',
      status,
      verificationStatus,
      timestamp: new Date(),
    });

    const employer = await Employer.findOneAndUpdate(
      { employerId: sanitizeValue(employerId) },
      updates,
      { new: true }
    );

    if (!employer) {
      return res.status(404).json({ success: false, error: 'Employer not found' });
    }

    return res.json({ success: true, message: 'Employer status updated', data: employer });
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