const nodemailer = require("nodemailer");

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
    service: "gmail",

    auth: {
      user,
      pass,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    family: 4,
  });

  transporter.verify()
    .then(() => {
      console.log("✅ SMTP Ready");
    })
    .catch((err) => {
      console.error("❌ SMTP Verify Failed:", err.message);
    });

  return transporter;
}

async function sendEmail(to, subject, text, html = null) {
  if (!to) {
    console.warn("⚠️ No recipient email provided");
    return false;
  }

  try {
    const transport = getTransporter();

    if (!transport) {
      return false;
    }

    console.log(`📧 Sending email to ${to}`);

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
    console.error(`❌ Email failed to ${to}`);
    console.error(error);

    return false;
  }
}

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