const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const User = require("../models/User");
const Candidate = require("../models/candidate");

const { notifyPaymentSuccess } = require("../email");

const { FRONTEND_URL } = require("../config");

// ==========================
// SUBMIT PAYMENT HANDLER
// ==========================
async function handleSubmitPayment(req, res) {
  try {
    const {
      userId: userIdFromBody,
      email,
      name,
      amount,
      transactionCode,
      paymentMethod,
      phone,
      candidateId,
    } = req.body;

    const userId = userIdFromBody || phone || candidateId || email;

    if (!userId || !amount || !transactionCode) {
      return res.status(400).json({
        success: false,
        error: "userId, amount, transactionCode required",
      });
    }

    // Check duplicate transaction
    const exists = await Payment.findOne({
      transactionId: transactionCode,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        error: "Transaction already exists",
      });
    }

    // Save payment
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

    console.log("✅ Payment saved:", payment._id);

    // Return response immediately
    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id,
      data: payment,
    });

    // ==========================
    // BACKGROUND EMAIL SENDING
    // ==========================
    setImmediate(async () => {
      try {
        const notifyUser = {
          email,
          name,
        };

        // Resolve email if missing
        if (!notifyUser.email && userId) {
          let candidate = await User.findOne({
            $or: [
              { phone: userId },
              { uniqueCode: userId },
              { email: userId },
            ],
          });

          if (!candidate) {
            candidate = await Candidate.findOne({
              $or: [
                { phone: userId },
                { uniqueCode: userId },
                { email: userId },
              ],
            });
          }

          if (candidate) {
            notifyUser.email = candidate.email;
            notifyUser.name = candidate.name || candidate.fullName;
          }
        }

        if (!notifyUser.email) {
          console.warn("⚠️ No email found for payment notification");
          return;
        }

        console.log(
          "📧 Sending payment submission email to",
          notifyUser.email
        );

        await notifyPaymentSuccess({
          email: notifyUser.email,
          name: notifyUser.name,
        });
      } catch (err) {
        console.error("Background notification error:", err);
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
module.exports.handleSubmitPayment = handleSubmitPayment;