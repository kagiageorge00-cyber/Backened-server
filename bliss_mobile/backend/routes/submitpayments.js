const express = require("express");
const router = express.Router();

// ✅ CORRECT MODEL PATH
const Payment = require("../models/Payment");
const User = require("../models/User");
const { notifyPaymentSuccess } = require("../services/notificationservice");
const sendEmail = require("../email");

// ==========================
// SUBMIT PAYMENT HANDLER (OPTIMIZED)
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

    // Check for duplicate - but do this asynchronously
    let isDuplicate = false;
    try {
      const exists = await Payment.findOne({
        transactionId: transactionCode,
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          error: "Transaction already exists",
        });
      }
    } catch (checkErr) {
      console.warn("Could not check for duplicates:", checkErr.message);
      // Continue anyway - better to process than block
    }

    // Save payment to database
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

    // ⚡ RETURN IMMEDIATELY - Don't wait for email
    res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId: payment._id || payment.id,
      data: payment,
    });

    // ⚡ SEND NOTIFICATIONS IN BACKGROUND (Don't wait)
    setImmediate(async () => {
      try {
        const notifyUser = {
          email,
          name,
        };

        if (!notifyUser.email && userId) {
          try {
            const candidate = await User.findOne({
              $or: [
                { phone: userId },
                { uniqueCode: userId },
                { email: userId },
              ],
            });
            if (candidate) {
              notifyUser.email = candidate.email;
              notifyUser.name = candidate.name || notifyUser.name;
            }
          } catch (err) {
            console.warn("Could not fetch candidate:", err.message);
          }
        }

        if (notifyUser.email) {
          // STEP 1: Send payment submission email (user receives this immediately)
          console.log("📧 Sending payment submission email to", notifyUser.email);
          
          await sendEmail(
            notifyUser.email,
            "Payment Received ✅ - Bliss Connect",
            `Hello ${notifyUser.name || 'there'},\n\nWe have received your payment of KES ${amount}! ✅\n\nOur team is now verifying your payment.\nOnce approved, you will receive a confirmation email with your candidate form link.\n\nThank you for joining Bliss Connect!\n\nBest regards,\nBliss Connect Team`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
              <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #4CAF50; text-align: center;">Payment Received ✅</h2>
                <p>Hello ${notifyUser.name || 'there'},</p>
                <p>We have successfully received your payment of <strong>KES ${amount}</strong>.</p>
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; color: #2e7d32;"><strong>Status:</strong> Payment Received and Under Verification</p>
                </div>
                <p><strong>What happens next?</strong></p>
                <ol>
                  <li>Our team verifies your payment (usually within a few hours)</li>
                  <li>You receive a confirmation email with approval</li>
                  <li>You can then complete your candidate form</li>
                </ol>
                <p>We appreciate your patience!</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                  Bliss Connect Team<br/>
                  <a href="https://blisssconnect12.netlify.app" style="color: #4CAF50; text-decoration: none;">Visit our website</a>
                </p>
              </div>
            </div>`
          );
        }
      } catch (err) {
        console.error("Background notification error:", err.message);
        // Don't fail the request - it's already returned
      }
    });

  } catch (err) {
    console.error("❌ Payment error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

router.post('/payments', handleSubmitPayment);
router.post('/submitPayment', handleSubmitPayment);

module.exports = router;
module.exports.handleSubmitPayment = handleSubmitPayment;