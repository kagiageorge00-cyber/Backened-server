const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Candidate = require("../models/candidate");
const { createNotification } = require("../utils/notificationHelper");
const { sendEmail } = require("../email");
const { FRONTEND_URL } = require('../config');

// ======================
// HEALTH CHECK
// ======================
router.get("/", (req, res) => {
  res.json({ status: "Payment API running ✅" });
});

// ======================
// CREATE PAYMENT
// ======================
router.post("/payment", async (req, res) => {
  try {
    console.log("🔥 BODY:", req.body); // ✅ DEBUG HERE

    const {
      userId, // phone
      amount,
      paymentMethod,
      email,
      name,
      title,
    } = req.body;

    // ======================
    // VALIDATION
    // ======================
    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    let transactionId = null;
    let paymentLink = null;

    // ======================
    // MPESA (SIMULATED)
    // ======================
    if (paymentMethod === "mpesa") {
      transactionId = "MPESA_" + Date.now();
    }

    // ======================
    // CARD (OPTIONAL)
    // ======================
    else if (paymentMethod === "card") {
      try {
        const FlutterwaveService = require("../services/flutterwave");

        const result = await FlutterwaveService.initializePayment({
          amount,
          email,
          name,
          tx_ref: "TX_" + Date.now(),
        });

        if (!result || !result.link) {
          return res.status(400).json({
            success: false,
            error: "Flutterwave failed",
          });
        }

        paymentLink = result.link;
        transactionId = "CARD_" + Date.now();
      } catch (err) {
        console.error("Flutterwave error:", err.message);
        return res.status(500).json({
          success: false,
          error: "Card payment error",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid payment method",
      });
    }

    // ======================
    // SAVE PAYMENT
    // ======================
    const payment = await Payment.create({
      intentId: "INT_" + Date.now(),
      userId,
      amount,
      title: title || "Job Application",
      method: paymentMethod,
      transactionId,
      status: "pending",
    });

    await createNotification({
      userId,
      title: 'Payment Submitted',
      message: 'Your payment is awaiting approval.',
      type: 'payment',
      actionUrl: `/candidate/payments/${payment._id}`,
    });

    return res.json({
      success: true,
      message: "Payment initiated",
      paymentId: payment._id,
      transactionId,
      paymentLink,
    });

  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ======================
// VERIFY PAYMENT
// ======================
router.post("/verify", async (req, res) => {
  try {
    console.log("🔥 VERIFY BODY:", req.body);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId required",
      });
    }

    // GET LATEST PENDING PAYMENT
    const payment = await Payment.findOne({
      userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "No pending payment found",
      });
    }

    // MARK COMPLETE
    payment.status = "completed";
    await payment.save();

    // UPDATE CANDIDATE
    const candidate = await Candidate.findOneAndUpdate(
      { phone: userId },
      {
        isVerified: true,
        paymentStatus: "completed",
        status: "available",
      },
      { new: true }
    );

    await createNotification({
      userId,
      title: 'Payment Approved',
      message: 'Your payment has been approved. Continue your application.',
      type: 'approval',
      actionUrl: `/candidate/form?candidateId=${candidate?.uniqueCode || userId}`,
    });

    if (candidate?.email) {
      const phoneParam = candidate.phone || userId;
      const candidateFormLink = phoneParam
        ? `${FRONTEND_URL}/candidate-form?phone=${encodeURIComponent(phoneParam)}`
        : `${FRONTEND_URL}/candidate-form`;

      setImmediate(async () => {
        try {
          await sendEmail(
            candidate.email,
            "Payment Successful - Bliss Connect ✅",
            `Hello ${candidate.fullName},\n\n✅ Your payment was successful!\n\n🎉 You are now VERIFIED on Bliss Connect.\n\n📋 Complete your candidate form here:\n${candidateFormLink}\n\nWe will connect you to job opportunities soon.\n\n— Bliss Connect Team`, 
            `<html>
              <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #4CAF50;">Payment Successful ✅</h2>
                  <p>Hello <strong>${candidate.fullName}</strong>,</p>
                  <p>Your payment was received successfully!</p>
                  <p style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    🎉 <strong>You are now VERIFIED on Bliss Connect</strong>
                  </p>
                  <p>Please complete your candidate form to get started:</p>
                  <a href="${candidateFormLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Complete Your Form</a>
                  <p>We will connect you to job opportunities soon!</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="color: #666; font-size: 12px;">— Bliss Connect Team</p>
                </div>
              </body>
            </html>`
          );
        } catch (emailErr) {
          console.error('❌ Payment verification email failed:', emailErr.message || emailErr);
        }
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ======================
// VALIDATE PAYMENT FOR FORM LINK (PUBLIC)
// ======================
router.get('/:paymentId/validate', async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) return res.status(400).json({ success: false, error: 'paymentId required' });

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.status !== 'approved') {
      return res.status(200).json({ success: false, message: 'Payment not approved' });
    }

    return res.json({
      success: true,
      paymentId: payment._id,
      formLink: payment.formLink || `${FRONTEND_URL}/#/candidate-form/${payment._id}`,
      userId: payment.userId,
      amount: payment.amount,
      generatedAt: payment.linkGeneratedAt || payment.createdAt,
    });
  } catch (err) {
    console.error('❌ validate payment error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;