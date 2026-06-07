console.log("🔥🔥🔥 ADMIN ROUTES FILE LOADED 🔥🔥🔥");


const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Candidate = require("../models/candidate");
const { notifyPaymentApproved } = require("../services/notificationservice");
const sendEmail = require("../email");
const { FRONTEND_URL } = require('../config');

// ======================
// ADMIN CREDENTIALS (Secured in environment)
// ======================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "boss";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "boss123", 10);

// ======================
// SESSION STORAGE (Use Redis in production)
// ======================
const adminSessions = new Map();

// ======================
// MIDDLEWARE: REQUIRE ADMIN LOGIN
// ======================
function requireAdminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
  
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ success: false, error: "Unauthorized - Please login first" });
  }
  
  // Check if token has expired (1 hour expiry)
  const session = adminSessions.get(token);
  if (Date.now() - session.createdAt > 3600000) {
    adminSessions.delete(token);
    return res.status(401).json({ success: false, error: "Session expired - Please login again" });
  }
  
  next();
}

// ======================
// ADMIN LOGIN ROUTE
// ======================
router.post("/login", async (req, res) => {
  try {
    // Debug: log incoming request details to help diagnose 400/404 issues
    console.log("🔔 Admin login request headers:", req.headers);
    console.log("🔔 Admin login body:", req.body);

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password required"
      });
    }
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
    
    const passwordMatch = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
    
    // Generate session token
    const token = require("crypto").randomBytes(32).toString("hex");
    adminSessions.set(token, {
      createdAt: Date.now(),
      username
    });
    
    console.log("✅ Admin login successful:", username);
    
    return res.json({
      success: true,
      message: "Login successful",
      token,
      expiresIn: 3600 // 1 hour in seconds
    });
    
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// ADMIN LOGOUT ROUTE
// ======================
router.post("/logout", (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// TEST ROUTE (VERY IMPORTANT)
// ======================
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working ✅" });
});

// ======================
// GET ALL CANDIDATES (Protected)
// ======================
router.get("/candidates", requireAdminAuth, async (req, res) => {
  console.log("/api/admin/candidates endpoint hit");
  try {
    const candidates = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: candidates.length,
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
// VERIFY USER (Protected)
// ======================
router.post("/verify-user", requireAdminAuth, async (req, res) => {
  try {
    const { phone } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { isVerified: true }
    );

    res.json({ success: true, message: "User verified" });
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ======================
// UPDATE STATUS (Protected)
// ======================
router.post("/status", requireAdminAuth, async (req, res) => {
  try {
    const { phone, status } = req.body;

    await User.findOneAndUpdate(
      { phone },
      { status }
    );

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("❌ STATUS ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// ======================
// GET PENDING PAYMENTS (Protected)
// ======================
const Payment = require("../models/Payment");

router.get("/payments/pending", requireAdminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ status: "pending" }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (err) {
    console.error("❌ GET PENDING PAYMENTS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// APPROVE PAYMENT (Protected - with improved notification)
// ======================
router.post("/payments/:paymentId/approve", requireAdminAuth, async (req, res) => {
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
      candidateId: payment.userId,
    };

    if (payment.userId) {
      let candidate = await User.findOne({
        $or: [
          { phone: payment.userId },
          { uniqueCode: payment.userId },
          { email: payment.userId },
        ],
      });

      if (!candidate) {
        candidate = await Candidate.findOne({
          $or: [
            { phone: payment.userId },
            { uniqueCode: payment.userId },
            { email: payment.userId },
          ],
        });
      }

      if (candidate) {
        notificationTarget.email = notificationTarget.email || candidate.email;
        notificationTarget.name = notificationTarget.name || candidate.name || candidate.fullName;
        notificationTarget.phone = notificationTarget.phone || candidate.phone;
        notificationTarget.candidateId = candidate.uniqueCode || payment.userId;
      }
    }

    if (!notificationTarget.candidateId) {
      notificationTarget.candidateId = payment.metadata?.candidateId ||
        (typeof payment.userId === 'string' && payment.userId.startsWith('BLISS-') ? payment.userId : null);
    }

    if (!notificationTarget.email) {
      console.warn('⚠️ No email found for payment approval notification', {
        paymentId: paymentId,
        userId: payment.userId,
        metadata: payment.metadata,
      });
    }

    let approvalEmailSent = false;
    if (notificationTarget.email) {
      // STEP 3: Send payment approval email with candidate form link
      const frontendUrl = FRONTEND_URL.replace(/\/$/, '');
      // Use phone in approval links. Do NOT include candidate.uniqueCode at this stage.
      const phoneParam = notificationTarget.phone || (typeof payment.userId === 'string' ? payment.userId : null);
      const candidateFormLink = phoneParam
        ? `${frontendUrl}/candidate-form?phone=${encodeURIComponent(phoneParam)}`
        : `${frontendUrl}/candidate-form`;
      
      console.log("📧 Sending payment approval email to", notificationTarget.email);
      
      await sendEmail(
        notificationTarget.email,
        "Payment Approved ✅ - Complete Your Registration",
        `Hello ${notificationTarget.name || 'there'},\n\nExciting news! Your payment has been approved! ✅\n\nReference: ${phoneParam || ''}\n\nNow, complete your candidate registration:\n${candidateFormLink}\n\nBest regards,\nBliss Connect Admin`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #4CAF50; text-align: center;">Payment Approved ✅</h2>
            <p>Hello ${notificationTarget.name || 'there'},</p>
            <p>Great news! Your payment has been <strong>approved by our admin team</strong>! 🎉</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #2e7d32;"><strong>Reference (phone):</strong> <code style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${phoneParam || ''}</code></p>
            </div>
            
            <p><strong>Next Step: Complete Your Candidate Registration</strong></p>
            <p>Please fill out your candidate form with the following documents:</p>
            <ul>
              <li>Passport (PDF)</li>
              <li>Recent Photo (JPG/PNG)</li>
              <li>Medical Report (PDF)</li>
              <li>Video Introduction (MP4)</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${candidateFormLink}" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">Complete Your Registration</a>
            </p>
            
            <p style="color: #666; font-size: 13px; background-color: #f9f9f9; padding: 10px; border-left: 3px solid #4CAF50;">
              If the button doesn't work, copy this link:<br/>
              <code style="word-break: break-all;">${candidateFormLink}</code>
            </p>
            
            <p style="color: #666; margin-top: 20px;">
              Once you complete your registration, you will receive a confirmation with your login credentials to access the candidate portal!
            </p>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Bliss Connect Team<br/>
              <a href="${frontendUrl}" style="color: #4CAF50; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </div>`
      );
      approvalEmailSent = true;
    }

    return res.json({
      success: true,
      message: "Payment approved and notification sent",
      data: payment,
      notification: {
        approvalEmailSent,
        candidateName: notificationTarget.name,
        candidateEmail: notificationTarget.email,
        candidateId: notificationTarget.candidateId,
      },
    });
  } catch (err) {
    console.error("❌ APPROVE PAYMENT ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;