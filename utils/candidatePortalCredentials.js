const { createNotification } = require('./notificationHelper');
const { FRONTEND_URL } = require('../config');

async function notifyCandidatePortalReady({
  candidate,
  userId,
  title = 'Your Candidate Portal Account Is Ready',
  message,
  actionUrl,
  email,
  phoneNumber,
  html,
}) {
  const finalEmail = email || candidate?.email;
  const finalPhone = phoneNumber || candidate?.phone;
  const finalUserId = userId || candidate?.phone || candidate?.email || candidate?.uniqueCode;

  const defaultMessage = message || 'Your payment is approved. Upload the required documents and select Register to receive your candidate code and password.';

  return createNotification({
    userId: finalUserId,
    title,
    message: defaultMessage,
    type: 'candidate_registration',
    category: 'registration',
    actionUrl: actionUrl || `${FRONTEND_URL}/candidate-portal`,
    entityType: 'candidate',
    entityId: candidate?.uniqueCode || candidate?.candidateId || finalUserId,
    phoneNumber: finalPhone,
    email: finalEmail,
    html: html || `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h2 style="color: #1d4ed8; margin-top: 0;">Complete Your Candidate Registration</h2>
        <p>${defaultMessage}</p>
        <p><a href="${actionUrl || `${FRONTEND_URL}/candidate-portal`}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Open Candidate Portal</a></p>
      </div>
    `,
  });
}

module.exports = {
  notifyCandidatePortalReady,
};
