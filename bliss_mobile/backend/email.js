const nodemailer = require("nodemailer");

// ======================
// CREATE TRANSPORTER (ONCE)
// ======================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error("❌ EMAIL_USER or EMAIL_PASS missing - emails will not work");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email transporter verification failed:", error.message);
    } else {
      console.log("✅ Email transporter verified and ready");
    }
  });

  return transporter;
}

// ======================
// SEND EMAIL FUNCTION (ASYNC)
// ======================
async function sendEmail(to, subject, text, html = null) {
  if (!to) {
    console.warn("⚠️ No recipient email provided");
    return false;
  }

  try {
    const transport = getTransporter();

    if (!transport) {
      console.error("❌ Email transporter not initialized - credentials missing");
      return false;
    }

    const mailOptions = {
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    };

    console.log(`📧 Sending email to ${to} with subject: "${subject}"`);
    
    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to} | MessageID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error(`❌ Email failed to ${to}: ${error.message}`);
    console.error("Error details:", error.stack);
    return false;
  }
}

// Wrapper for async calls (fire-and-forget)
function sendEmailAsync(to, subject, text, html = null) {
  sendEmail(to, subject, text, html).catch(err => {
    console.error("Error in sendEmailAsync:", err);
  });
}

module.exports = sendEmail;
module.exports.sendEmailAsync = sendEmailAsync;