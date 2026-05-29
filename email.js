const nodemailer = require("nodemailer");

// ======================
// CREATE TRANSPORTER (ONCE)
// ======================
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

// ======================
// SEND EMAIL FUNCTION
// ======================
async function sendEmail(to, subject, text, html = null) {
  if (!to) {
    console.warn("⚠️ No recipient email provided");
    return false;
  }

  try {
    const transport = getTransporter();

    if (!transport) {
      console.warn("⚠️ Email transporter not initialized");
      return false;
    }

    const mailOptions = {
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || undefined, // optional HTML support
    };

    const info = await transport.sendMail(mailOptions);

    console.log("📧 Email sent:", info.messageId);

    return true;

  } catch (error) {
    console.error("❌ Email error:", error.message);
    return false;
  }
}

module.exports = sendEmail;