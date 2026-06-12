const express = require("express");
const router = express.Router();

const Payment = require("./models/Payment");
const User = require("./models/User");
const Candidate = require("./models/candidate");

// ✅ FIX: use notification module (not raw email.js in large apps)
const { sendEmail } = require("./email");

const { FRONTEND_URL } = require("./config");

// ======================
// PAYMENT HANDLER
// ======================
async function handleSubmitPayment(req, res) {
  try {
    const {
      userId: userIdFromBody,
      user_id,
      candidateId,
      candidate_id,
      phone,
      email,
      name,
      amount,
      transactionCode,
      transactionId,
      transaction_id,
      paymentMethod,
    } = req.body;

    const userId = userIdFromBody || user_id || candidateId || candidate_id || phone || email;
    const transactionKey = transactionCode || transactionId || transaction_id;
    const parsedAmount = typeof amount === 'string' ? amount.trim() : amount;

    // ======================
    // VALIDATION
    // ======================
    if (!userId || parsedAmount == null || !transactionKey) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId/candidateId/phone/email, amount, transactionCode/transactionId",
      });
    }

    const finalAmount = Number(parsedAmount);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    // ======================
    // DUPLICATE CHECK
    // ======================
    const exists = await Payment.findOne({
      transactionId: transactionKey,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    // ======================
    // SAVE PAYMENT
    // ======================
    const payment = await Payment.create({
      intentId: "INT_" + Date.now(),
      userId,
      amount: finalAmount,
      title: "Application Payment",
      method: paymentMethod || "mpesa",
      status: "pending",
      transactionId: transactionKey,
      metadata: { name, email, candidateId },
    });

    console.log("✅ Payment saved:", payment._id);

    // ======================
    // RESPONSE FIRST (FAST API)
    // ======================
    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id,
    });

    // ======================
    // BACKGROUND EMAIL (SAFE)
    // ======================
    setImmediate(async () => {
      try {
        let notifyEmail = email;
        let notifyName = name;

        // fallback lookup if email missing
        if (!notifyEmail) {
          const user =
            (await User.findOne({
              $or: [
                { phone: userId },
                { email: userId },
                { uniqueCode: userId },
              ],
            })) ||
            (await Candidate.findOne({
              $or: [
                { phone: userId },
                { email: userId },
                { uniqueCode: userId },
              ],
            }));

          if (user) {
            notifyEmail = user.email;
            notifyName = user.name || user.fullName;
          }
        }

        if (!notifyEmail) {
          console.warn("⚠️ No email found for payment notification");
          return;
        }

        console.log("📧 Sending payment email to:", notifyEmail);

        const emailSent = await sendEmail(
          notifyEmail,
          "Payment Received ✅ - Bliss Connect",
          `Hello ${notifyName || "User"}, your payment has been received successfully.`,
          `
          <div style="font-family:Arial">
            <h2>Payment Received ✅</h2>
            <p>Hello ${notifyName || "User"},</p>
            <p>Your payment has been received successfully.</p>
            <p>We will process your application shortly.</p>
          </div>
          `
        );
        console.log("📧 Payment notification result:", { email: notifyEmail, sent: emailSent });
      } catch (err) {
        console.error("❌ Background email error:", err.message);
      }
    });

  } catch (err) {
    console.error("❌ Payment error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

// ======================
// ROUTES
// ======================
router.post("/payments", handleSubmitPayment);
router.post("/submitPayment", handleSubmitPayment);

module.exports = router;