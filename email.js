const nodemailer = require("nodemailer");

// ======================
// TRANSPORTER
// ======================
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error("❌ EMAIL_USER or EMAIL_PASS missing");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user,
      pass,
    },
  });

  transporter.verify((err) => {
    if (err) {
      console.error("❌ SMTP Verify Failed:", err.message);
    } else {
      console.log("✅ SMTP Ready");
    }
  });

  return transporter;
}

// ======================
// SEND EMAIL
// ======================
async function sendEmail(to, subject, text, html = null) {
  if (!to) {
    console.warn("⚠️ No recipient email provided");
    return false;
  }

  try {
    const transport = getTransporter();

    if (!transport) {
      console.error("❌ Transporter not available");
      return false;
    }

    const info = await transport.sendMail({
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });

    console.log(
      `✅ Email sent to ${to} | Message ID: ${info.messageId}`
    );

    return true;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return false;
  }
}

// ======================
// FIRE-AND-FORGET
// ======================
function sendEmailAsync(to, subject, text, html = null) {
  setImmediate(async () => {
    try {
      await sendEmail(to, subject, text, html);
    } catch (err) {
      console.error("❌ sendEmailAsync error:", err);
    }
  });
}

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendEmailAsync = sendEmailAsync;