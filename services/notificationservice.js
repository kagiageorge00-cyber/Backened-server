const nodemailer = require('nodemailer');

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

  const message = `
    <h2>Welcome to Bliss Connect 🎉</h2>
    <p>Hello ${user.name},</p>
    <p>Your registration was successful.</p>
    <p>Please proceed with your application.</p>
  `;

  await sendEmail(user.email, 'Welcome to Bliss Connect', message);
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
  notifyRegistrationSuccess,
  notifyApplicationUpdate,
  sendNotification,
};