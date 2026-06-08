const { sendEmail } = require("../email");

/**
 * ==========================
 * PAYMENT SUCCESS NOTIFICATION
 * ==========================
 */
async function notifyPaymentSuccess({ email, name, amount }) {
  try {
    if (!email) {
      console.warn("⚠️ notifyPaymentSuccess: missing email");
      return false;
    }

    const subject = "Payment Successful - Bliss Connect ✅";

    const text = `
Hello ${name || "User"},

Your payment was successful.
Amount: ${amount || "N/A"}

You are now verified on Bliss Connect.

— Bliss Connect Team
    `;

    const html = `
      <div style="font-family:Arial;padding:20px">
        <h2 style="color:green;">Payment Successful ✅</h2>
        <p>Hello <b>${name || "User"}</b>,</p>
        <p>Your payment was successful.</p>

        <p><b>Amount:</b> ${amount || "N/A"}</p>

        <p style="margin-top:20px;">
          You are now <b>verified</b> on Bliss Connect.
        </p>

        <hr/>
        <small>Bliss Connect Team</small>
      </div>
    `;

    return await sendEmail(email, subject, text, html);
  } catch (err) {
    console.error("❌ notifyPaymentSuccess error:", err.message);
    return false;
  }
}

/**
 * ==========================
 * PAYMENT APPROVAL NOTIFICATION (ADMIN)
 * ==========================
 */
async function notifyPaymentApproved({ email, name }) {
  try {
    if (!email) return false;

    return await sendEmail(
      email,
      "Payment Approved 🎉",
      `Hello ${name}, your payment has been approved.`,
      `<h2>Payment Approved 🎉</h2><p>Hello ${name}, your payment is approved.</p>`
    );
  } catch (err) {
    console.error("❌ notifyPaymentApproved error:", err.message);
    return false;
  }
}

/**
 * ==========================
 * EXPORTS
 * ==========================
 */
module.exports = {
  notifyPaymentSuccess,
  notifyPaymentApproved,
};