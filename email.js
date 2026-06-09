const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

let transporter;
let sgMail;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing");
  }

  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "465", 10) || 465;
  const secure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === "true"
    : port === 465;
  const service = process.env.EMAIL_SERVICE || process.env.SMTP_SERVICE || null;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || user;

  const transportOptions = {
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  };

  if (service) {
    transportOptions.service = service;
  } else {
    transportOptions.host = host;
    transportOptions.port = port;
    transportOptions.secure = secure;
  }

  console.log("📧 SMTP config:", {
    host: service ? undefined : host,
    port: service ? undefined : port,
    secure: service ? undefined : secure,
    service,
    from: fromAddress ? fromAddress.replace(/.(?=.{4})/g, "*") : undefined,
  });

  transporter = nodemailer.createTransport(transportOptions);

  transporter
    .verify()
    .then(() => console.log("✅ SMTP ready"))
    .catch((err) => console.error("❌ SMTP verify failed:", err.stack || err));

  return transporter;
}

function getSendGrid() {
  if (sgMail) return sgMail;

  const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
  if (!apiKey) return null;

  sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(apiKey);
  return sgMail;
}

async function sendMailWithSendGrid(to, subject, text, html) {
  const sg = getSendGrid();
  if (!sg) {
    throw new Error("SENDGRID_API_KEY missing");
  }

  const from = process.env.EMAIL_FROM || process.env.SENDGRID_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
  const msg = {
    to,
    from,
    subject,
    text,
    html,
  };

  const [response] = await sg.send(msg);
  if (response && response.headers) {
    console.log("📧 SendGrid response status:", response.statusCode);
  }
  return response;
}

async function sendEmail(to, subject, text, html) {
  if (!to) {
    console.warn("⚠️ No recipient email");
    return false;
  }

  const sendGridKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
  console.log("📧 sendEmail called", {
    to,
    subject,
    sendGrid: Boolean(sendGridKey),
    from: fromAddress ? fromAddress.replace(/.(?=.{4})/g, "*") : undefined,
  });

  if (sendGridKey) {
    try {
      await sendMailWithSendGrid(to, subject, text, html);
      console.log("📧 SendGrid email queued");
      return true;
    } catch (err) {
      console.error("❌ SendGrid error:", err.message || err);
      if (process.env.EMAIL_DISABLE_SMTP_FALLBACK === "true") {
        return false;
      }
      console.log("🔁 Falling back to SMTP transport");
    }
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"Bliss Connect" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 SMTP email sent:", info.messageId, info);
    return true;
  } catch (err) {
    console.error("❌ SMTP Email error:", err.stack || err);
    if (err.response) {
      console.error("❌ SMTP response:", err.response);
    }
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