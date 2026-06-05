const nodemailer = require('nodemailer');
const { FRONTEND_URL } = require('../config');

// ======================
// ✅ EMAIL CONFIG
// ======================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// ✅ GENERIC EMAIL SENDER
// ======================
async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({
      from: `"Bliss Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: message,
    });

    console.log('✅ Email sent to', to);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
}

// ======================
// ✅ PAYMENT SUBMITTED EMAIL
// ======================
async function notifyPaymentSuccess(user) {
  if (!user.email) return;

  const message = `
    <h2>Payment Submitted ✅</h2>
    <p>Hello ${user.name || 'User'},</p>
    <p>Your payment has been successfully submitted.</p>
    <p>Our team is currently verifying it.</p>
    <br/>
    <p>Bliss Support Team</p>
  `;

  await sendEmail(user.email, 'Payment Submitted - Bliss Connect', message);
}

// ======================
// ✅ REGISTRATION EMAIL
// ======================
async function notifyRegistrationSuccess(user) {
  if (!user.email) return;

  const portalUrl = FRONTEND_URL.replace(/\/$/, '');
  const loginUrl = user.uniqueCode
    ? `${portalUrl}/candidatePortal?candidateId=${encodeURIComponent(user.uniqueCode)}`
    : `${portalUrl}/candidatePortal`;

  const message = `
    <h2>Registration Complete 🎉</h2>
    <p>Hello ${user.name || 'Candidate'},</p>
    <p>Your registration is now complete.</p>
    <p>Use the following credentials to log in to the candidate portal:</p>
    <ul>
      <li><strong>Candidate ID:</strong> ${user.uniqueCode}</li>
      <li><strong>Password:</strong> ${user.password}</li>
    </ul>
    <p>Login here: <a href="${loginUrl}">${loginUrl}</a></p>
    <p>Please keep these details safe.</p>
  `;

  await sendEmail(user.email, 'Bliss Connect Registration Successful', message);
}

// ======================
// ✅ MARKETPLACE LISTING EMAIL
// ======================
async function notifyMarketplaceListing(user) {
  if (!user.email) return;

  const message = `
    <h2>Your profile is now on the market</h2>
    <p>Hello ${user.name || 'Candidate'},</p>
    <p>Your application is now visible to employers on the Bliss Connect marketplace.</p>
    <p>We will notify you when potential employers are available.</p>
    <p>Thank you for joining Bliss Connect.</p>
  `;

  await sendEmail(user.email, 'Your Application is Now on the Market', message);
}

// ======================
// ✅ PAYMENT APPROVAL EMAIL
// ======================
async function notifyPaymentApproved(user) {
  if (!user.email) return;

  const portalUrl = FRONTEND_URL.replace(/\/$/, '');
  const formUrl = `${portalUrl}/candidate-form${user.candidateId ? `?candidateId=${encodeURIComponent(user.candidateId)}` : ''}`;

  const message = `
    <h2>Payment Approved ✅</h2>
    <p>Hello ${user.name || 'Candidate'},</p>
    <p>Your payment has been approved by our team.</p>
    ${user.candidateId ? `<p>Your Candidate ID is <strong>${user.candidateId}</strong>.</p>` : ''}
    <p>Please complete your registration in the candidate form:</p>
    <p><a href="${formUrl}">${formUrl}</a></p>
    <p>Once your registration is complete, you will receive login details and marketplace confirmation.</p>
  `;

  await sendEmail(user.email, 'Payment Approved — Complete Your Registration', message);
}

// ======================
// ✅ APPLICATION UPDATE
// ======================
async function notifyApplicationUpdate(user, status) {
  if (!user.email) return;

  const message = `
    <h2>Application Update</h2>
    <p>Hello ${user.name},</p>
    <p>Your application status is now: <b>${status}</b></p>
  `;

  await sendEmail(user.email, 'Application Update', message);
}

// ======================
// ✅ GENERIC NOTIFICATION
// ======================
async function sendNotification(user, text) {
  if (!user.email) return;

  const message = `
    <p>Hello ${user.name || 'User'},</p>
    <p>${text}</p>
  `;

  await sendEmail(user.email, 'Bliss Notification', message);
}

module.exports = {
  notifyPaymentSuccess,
  notifyPaymentApproved,
  notifyRegistrationSuccess,
  notifyMarketplaceListing,
  notifyApplicationUpdate,
  sendNotification,
};