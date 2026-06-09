const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const User = require("../models/User");
const Candidate = require("../models/candidate");

// ✅ SINGLE CLEAN EMAIL FUNCTION
const { sendEmail } = require("../email");

// ==========================
// SUBMIT PAYMENT HANDLER
// ==========================
async function handleSubmitPayment(req, res) {
  try {
    const {
      userId: userIdFromBody,
      user_id,
      candidateId,
      candidate_id,
      email,
      name,
      amount,
      transactionCode,
      transactionId,
      transaction_id,
      paymentMethod,
      phone,
    } = req.body;

    const userId = userIdFromBody || user_id || phone || candidateId || candidate_id || email;
    const transactionKey = transactionCode || transactionId || transaction_id;
    const parsedAmount = typeof amount === 'string' ? amount.trim() : amount;

    if (!userId || parsedAmount == null || !transactionKey) {
      return res.status(400).json({
        success: false,
        error: "userId, amount, transactionCode/transactionId required",
      });
    }

    const finalAmount = Number(parsedAmount);
    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      });
    }

    // ==========================
    // CHECK DUPLICATE PAYMENT
    // ==========================
    const exists = await Payment.findOne({
      transactionId: transactionKey,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    // ==========================
    // SAVE PAYMENT
    // ==========================
    const payment = await Payment.create({
      intentId: "intent_" + Date.now(),
      userId,
      amount: finalAmount,
      title: "Application Payment",
      method: paymentMethod || "mpesa",
      status: "pending",
      transactionId: transactionKey,
      metadata: { name, email },
    });

    console.log("✅ Payment saved:", payment._id);

    // ==========================
    // RESPOND FAST (IMPORTANT)
    // ==========================
    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id,
      data: payment,
    });

    // ==========================
    // BACKGROUND EMAIL (SAFE)
    // ==========================
    setImmediate(async () => {
      try {
        let notifyEmail = email;
        let notifyName = name;

        // 🔍 fallback lookup if missing email
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

        await sendEmail(
          notifyEmail,
          "Payment Received ✅ - Bliss Connect",
          `Hello ${notifyName || "User"}, your payment has been received successfully.`,
          `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Payment Received ✅</h2>
            <p>Hello ${notifyName || "User"},</p>
            <p>Your payment has been received successfully.</p>
            <p>Status: <b>Pending Verification</b></p>
            <br/>
            <p>Bliss Connect Team</p>
          </div>
          `
        );
      } catch (err) {
        console.error("Background email error:", err);
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

// ==========================
// ROUTES
// ==========================
router.post("/payments", handleSubmitPayment);
router.post("/submitPayment", handleSubmitPayment);

module.exports = router;