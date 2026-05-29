const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// ✅ CORRECT MODEL PATH
const Payment = require("../models/Payment");

// ==========================
// EMAIL SETUP
// ==========================
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email credentials missing");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

// ==========================
// SEND EMAIL
// ==========================
async function sendPaymentEmail(email, name) {
  try {
    const transport = getTransporter();
    if (!transport) return;

    await transport.sendMail({
      from: `"Bliss Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Payment Submitted",
      html: `
        <h2>Hello ${name || "User"}</h2>
        <p>Your payment has been received.</p>
        <p>Status: <b>Pending Approval</b></p>
      `,
    });

    console.log("📧 Email sent");
  } catch (err) {
    console.log("❌ Email error:", err.message);
  }
}

// ==========================
// SUBMIT PAYMENT
// ==========================
router.post("/payments", async (req, res) => {
  try {
    const {
      userId,
      email,
      name,
      amount,
      transactionCode,
      paymentMethod,
    } = req.body;

    if (!userId || !amount || !transactionCode) {
      return res.status(400).json({
        success: false,
        error: "userId, amount, transactionCode required",
      });
    }

    // جلوگیری duplicate
    const exists = await Payment.findOne({
      transactionId: transactionCode,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    const payment = await Payment.create({
      intentId: "intent_" + Date.now(),
      userId,
      amount,
      title: "Application Payment",
      method: paymentMethod || "mpesa",
      status: "pending",
      transactionId: transactionCode,
      metadata: { name, email },
    });

    console.log("✅ Payment saved");

    if (email) sendPaymentEmail(email, name);

    res.status(201).json({
      success: true,
      message: "Payment submitted",
      data: payment,
    });

  } catch (err) {
    console.error("❌ Payment error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;