console.log("EMAIL MODULE LOADED");
console.log("TYPE OF sendEmail:", typeof sendEmail);

const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS environment variable missing"
    );
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user,
      pass,
    },

    tls: {
      rejectUnauthorized: false,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Verify Failed:", error);
  } else {
    console.log("✅ SMTP Ready");
  }
});
  return transporter;
}

async function sendEmail(to, subject, text, html) {
  try {
    if (!to) {
      console.warn("⚠️ No recipient email");
      return false;
    }

    const transport = getTransporter();

    console.log(`📧 Sending email to ${to}`);

    const info = await transport.sendMail({
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `✅ Email sent to ${to} | Message ID: ${info.messageId}`
    );

    return true;
  } catch (err) {
    console.error(`❌ Email failed to ${to}`);
    console.error(err);

    return false;
  }
}

function sendEmailAsync(to, subject, text, html) {
  setImmediate(async () => {
    try {
      await sendEmail(to, subject, text, html);
    } catch (err) {
      console.error("❌ Async email error:", err);
    }
  });
}

module.exports = {
  sendEmail,
  sendEmailAsync,
};