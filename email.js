const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

let transporter;
let sgMail;
let resendClient;

function isSmtpEnabled() {
  return !(process.env.EMAIL_DISABLE_SMTP === "true" || process.env.DISABLE_SMTP === "true");
}

function isSmtpFallbackEnabled() {
  return !(process.env.EMAIL_DISABLE_SMTP_FALLBACK === "true");
}

function buildTransportOptions(overrides = {}) {
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

  const transportOptions = {
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    family: 4,
    ...overrides,
  };

  if (service) {
    transportOptions.service = service;
  } else {
    transportOptions.host = host;
    transportOptions.port = port;
    transportOptions.secure = secure;
  }

  return { transportOptions, service, host, port, secure };
}

async function getTransporter() {
  if (!isSmtpEnabled()) {
    throw new Error("SMTP is disabled by environment configuration");
  }

  if (transporter) return transporter;

  const { transportOptions, service, host, port, secure } = buildTransportOptions();
  const currentTransport = nodemailer.createTransport(transportOptions);

  currentTransport
    .verify()
    .then(() => {
      transporter = currentTransport;
      console.log("✅ SMTP ready");
    })
    .catch((err) => {
      transporter = null;
      console.error("❌ SMTP verify failed:", err.stack || err);
    });

  console.log("📧 SMTP config:", {
    host: service ? undefined : host,
    port: service ? undefined : port,
    secure: service ? undefined : secure,
    service,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
  });

  return currentTransport;
}

async function getFallbackTransport() {
  if (!isSmtpEnabled() || !isSmtpFallbackEnabled()) {
    return null;
  }

  const { transportOptions, service, host } = buildTransportOptions({
    port: 587,
    secure: false,
    requireTLS: true,
  });

  const fallbackTransport = nodemailer.createTransport(transportOptions);

  fallbackTransport
    .verify()
    .then(() => {
      transporter = fallbackTransport;
      console.log("✅ SMTP fallback ready");
    })
    .catch((err) => {
      console.error("❌ SMTP fallback verify failed:", err.stack || err);
    });

  console.log("📧 SMTP fallback config:", {
    host: service ? undefined : host,
    port: 587,
    secure: false,
    service,
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER,
  });

  return fallbackTransport;
}

function getSendGrid() {
  if (sgMail) return sgMail;

  const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
  if (!apiKey) return null;

  sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(apiKey);
  return sgMail;
}

function getResend() {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY || process.env.RESEND;
  if (!key) return null;
  try {
    const { Resend } = require('resend');
    resendClient = new Resend(key);
    return resendClient;
  } catch (err) {
    console.warn('⚠️ Resend package not available or failed to initialize:', err.message || err);
    return null;
  }
}

async function sendMailWithResend(to, subject, text, html) {
  const resend = getResend();
  if (!resend) throw new Error('RESEND_API_KEY missing');

  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.EMAIL_USER || 'no-reply@blissconnect.com';

  const resp = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
  console.log('📧 Resend response:', resp && resp.id ? resp.id : resp);
  return resp;
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
  const isSendGridKeyValid = typeof sendGridKey === "string" && sendGridKey.startsWith("SG.");
  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.SENDGRID_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    "no-reply@blissconnect.com";
  const smtpDisabled = !isSmtpEnabled();

  console.log("📧 sendEmail called", {
    to,
    subject,
    sendGrid: Boolean(sendGridKey),
    sendGridValid: isSendGridKeyValid,
    smtp: !smtpDisabled,
    from: fromAddress ? fromAddress.replace(/.(?=.{4})/g, "*") : undefined,
  });

  // Try Resend first (preferred for this deployment)
  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY || process.env.RESEND;
  const hasResend = typeof resendKey === 'string' && resendKey.startsWith('re_');
  if (hasResend) {
    try {
      await sendMailWithResend(to, subject, text, html);
      console.log('📧 Resend email queued');
      return true;
    } catch (err) {
      console.error('❌ Resend error:', err.stack || err);
      // fall through to other providers
    }
  }

  // Try SendGrid (if key is valid)
  if (sendGridKey) {
    if (!isSendGridKeyValid) {
      console.warn("⚠️ Skipping SendGrid: invalid SENDGRID_API_KEY format");
    } else {
      try {
        await sendMailWithSendGrid(to, subject, text, html);
        console.log("📧 SendGrid email queued");
        return true;
      } catch (err) {
        console.error("❌ SendGrid error:", err.stack || err);
        // Fall through to SMTP
      }
    }
  }

  // Fall back to SMTP
  if (smtpDisabled) {
    console.error("❌ SMTP is disabled and no valid email service is configured.");
    return false;
  }

  try {
    const transport = await getTransporter();
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

    console.log("🔁 Retrying SMTP with fallback transport (port 587 / STARTTLS)");
    transporter = null;
    try {
      const fallbackTransport = await getFallbackTransport();
      if (!fallbackTransport) {
        return false;
      }

      const fallbackInfo = await fallbackTransport.sendMail({
        from: `"Bliss Connect" <${fromAddress}>`,
        to,
        subject,
        text,
        html,
      });

      console.log("📧 SMTP fallback email sent:", fallbackInfo.messageId, fallbackInfo);
      return true;
    } catch (fallbackErr) {
      console.error("❌ SMTP fallback error:", fallbackErr.stack || fallbackErr);
      if (fallbackErr.response) {
        console.error("❌ SMTP fallback response:", fallbackErr.response);
      }
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