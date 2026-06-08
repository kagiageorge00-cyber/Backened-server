const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

// ======================
// TRANSPORTER
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// SEND EMAIL (CORE FUNCTION)
// ======================
async function sendEmail(to, subject, text, html) {
  try {
    if (!to) {
      console.warn("⚠️ No recipient email");
      return false;
    }

    const info = await transporter.sendMail({
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent to:", to, "| ID:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false;
  }
}

// ======================
// ASYNC WRAPPER (NON-BLOCKING)
// ======================
function sendEmailAsync(to, subject, text, html) {
  setImmediate(async () => {
    try {
      await sendEmail(to, subject, text, html);
    } catch (err) {
      console.error("❌ Async email error:", err.message);
    }
  });
}

// ======================
// DEBUG LOG (SAFE)
// ======================
console.log("EMAIL MODULE LOADED");
console.log("TYPE OF sendEmail:", typeof sendEmail);

module.exports = {
  sendEmail,
  sendEmailAsync,
};