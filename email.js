const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  transporter.verify((err) => {
    if (err) console.error("❌ SMTP error:", err);
    else console.log("✅ SMTP ready");
  });

  return transporter;
}

async function sendEmail(to, subject, text, html) {
  if (!to) {
    console.warn("⚠️ No recipient email");
    return false;
  }

  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false;
  }
}

/**
 * SIMPLE ALIAS (THIS FIXES YOUR BUG)
 */
async function notifyPaymentSuccess({ email, name }) {
  return sendEmail(
    email,
    "Payment Successful - Bliss Connect",
    `Hello ${name}, your payment was successful.`,
    `<h2>Hello ${name}</h2><p>Your payment was successful.</p>`
  );
}

console.log("EMAIL MODULE LOADED");
console.log("sendEmail type:", typeof sendEmail);

module.exports = {
  sendEmail,
  sendEmailAsync: sendEmail,
  notifyPaymentSuccess,
};