const { Resend } = require("resend");

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const key = process.env.RESEND_API_KEY || process.env.RESEND_KEY || process.env.RESEND;
  if (!key) {
    console.warn("⚠️ RESEND_API_KEY is not configured on this server.");
    return null;
  }

  try {
    resendClient = new Resend(key);
    return resendClient;
  } catch (err) {
    console.error("❌ Failed to initialize Resend client:", err && (err.stack || err.message || err));
    return null;
  }
}

function normalizeToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function stripHtml(htmlValue) {
  if (!htmlValue) return "";
  return String(htmlValue).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildHtmlContent(textValue, htmlValue) {
  if (typeof htmlValue === "string" && htmlValue.trim()) return htmlValue;

  const safeText = typeof textValue === "string" ? textValue : "";
  if (!safeText) return "<p>Email content</p>";

  if (/<[a-z][\s\S]*>/i.test(safeText)) {
    return safeText;
  }

  return `<p>${safeText.replace(/\n/g, "<br />")}</p>`;
}

async function sendEmail(input, subjectOrText, maybeText, maybeHtml, extraOptions = {}) {
  let to;
  let subject;
  let text;
  let html;
  let replyTo;

  if (input && typeof input === "object" && !Array.isArray(input)) {
    ({ to, subject, text, html, replyTo } = input);
  } else {
    to = input;
    subject = subjectOrText;
    text = maybeText;
    html = maybeHtml;
    replyTo = extraOptions.replyTo || extraOptions.reply_to || null;
  }

  if (!to) {
    console.warn("⚠️ No recipient email provided to sendEmail.");
    return false;
  }

  const finalText = typeof text === "string" ? text : "";
  const finalHtml = buildHtmlContent(finalText, html);
  const finalSubject = subject || "Bliss Connect Notification";
  const finalReplyTo = replyTo || extraOptions.replyTo || extraOptions.reply_to || null;

  const resend = getResendClient();
  if (!resend) {
    console.error("❌ Email not sent: Resend is not configured. Missing RESEND_API_KEY.");
    return false;
  }

  const sender = process.env.FROM_EMAIL || process.env.EMAIL_FROM || "noreply@blissconnect.com";
  const payload = {
    from: `Bliss Connect <${sender}>`,
    to: normalizeToArray(to),
    subject: finalSubject,
    html: finalHtml,
    ...(finalText ? { text: finalText } : { text: stripHtml(finalHtml) || finalSubject }),
    ...(finalReplyTo ? { reply_to: finalReplyTo } : {}),
  };

  try {
    const response = await resend.emails.send(payload);

    if (response && response.error) {
      const errorMessage = response.error && (response.error.message || JSON.stringify(response.error));
      console.error("❌ Resend API error:", errorMessage);
      return false;
    }

    console.log("✅ Resend email queued successfully:", {
      to: normalizeToArray(to),
      subject: finalSubject,
      from: payload.from,
      id: response && response.data && response.data.id ? response.data.id : undefined,
    });

    return response && response.data ? response.data : true;
  } catch (err) {
    console.error("❌ Error sending email with Resend:", err && (err.stack || err.message || err));
    return false;
  }
}

async function notifyPaymentSuccess({ email, name }) {
  if (!email) {
    console.warn("⚠️ notifyPaymentSuccess called without an email address.");
    return false;
  }

  return sendEmail({
    to: email,
    subject: "Payment Successful - Bliss Connect",
    text: `Hello ${name || "there"}, your payment was successful.`,
    html: `<h2>Hello ${name || "there"}</h2><p>Your payment was successful.</p>`,
  });
}

console.log("EMAIL MODULE LOADED with Resend");

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendEmailAsync = sendEmail;
module.exports.notifyPaymentSuccess = notifyPaymentSuccess;
