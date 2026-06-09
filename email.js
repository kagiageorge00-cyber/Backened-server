const nodemailer = require("nodemailer");
const dns = require("dns");
const { Resend } = require("resend");

dns.setDefaultResultOrder("ipv4first");

let transporter;
let sgMail;
let resend;

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
  if (resend) return resend;
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  
  resend = new Resend(apiKey);
  return resend;
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

async function sendMailWithResend(to, subject, text, html) {
  const r = getResend();
  if (!r) {
    throw new Error("RESEND_API_KEY missing");
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.SENDGRID_FROM ||
    process.env.SMTP_FROM ||
    "noreply@resend.dev";
  
  const response = await r.emails.send({
    from,
    to,
    subject,
    html: html || text,
    text,
  });

  if (response.error) {
    throw new Error(response.error.message || "Resend API error");
  }

  console.log("📧 Resend email sent:", response.data?.id);
  return response.data;
}

async function sendEmail(to, subject, text, html) {
  if (!to) {
    console.warn("⚠️ No recipient email");
    return false;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const sendGridKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_KEY;
  const isSendGridKeyValid = typeof sendGridKey === "string" && sendGridKey.startsWith("SG.");
  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    process.env.SENDGRID_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    "no-reply@blissconnect.com";
  const smtpDisabled = !isSmtpEnabled();
  const isRender = Boolean(
    process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_INTERNAL_HOSTNAME
  );
  const shouldAttemptSmtp = !smtpDisabled && !isRender;

  console.log("📧 sendEmail called", {
    to,
    subject,
    resend: Boolean(resendKey),
    sendGrid: Boolean(sendGridKey),
    sendGridValid: isSendGridKeyValid,
    smtp: !smtpDisabled,
    render: isRender,
    from: fromAddress ? fromAddress.replace(/.(?=.{4})/g, "*") : undefined,
  });

  // Try Resend first (works on Render)
  if (resendKey) {
    try {
      await sendMailWithResend(to, subject, text, html);
      console.log("📧 Resend email sent successfully");
      return true;
    } catch (err) {
      console.error("❌ Resend error:", err.stack || err);
      // Fall through to next method
    }
  }

  // Try SendGrid second
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

  // Fall back to SMTP (works locally only)
  if (!shouldAttemptSmtp) {
    if (isRender) {
      console.error(
        "❌ SMTP fallback disabled on Render. Configure RESEND_API_KEY with a verified sending domain or use a valid SendGrid key."
      );
    } else {
      console.error("❌ SMTP is disabled and no email service is configured.");
    }
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