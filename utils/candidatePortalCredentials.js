const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationHelper');
const { FRONTEND_URL } = require('../config');
const { generateCandidateReferenceId } = require('./candidateIdentity');

function generateCandidateCode(year = new Date().getFullYear()) {
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CAND-${year}-${seq}`;
}

function generateTemporaryPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i += 1) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function ensureCandidatePortalCredentials(candidate) {
  if (!candidate) return { candidate, candidateId: null, uniqueCode: null, password: null };

  let passwordPlain = null;
  let changed = false;

  if (!candidate.candidateId) {
    candidate.candidateId = generateCandidateReferenceId();
    changed = true;
  }

  if (!candidate.password) {
    passwordPlain = generateTemporaryPassword();
    candidate.password = await bcrypt.hash(passwordPlain, 10);
    changed = true;
  }

  if (changed && typeof candidate.save === 'function') {
    await candidate.save();
  }

  return {
    candidate,
    candidateId: candidate.candidateId,
    uniqueCode: candidate.uniqueCode || null,
    password: passwordPlain,
  };
}

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

  const defaultMessage = message || `Your candidate portal account is ready. Use your Candidate ID and password to sign in and continue your registration.`;

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
        <h2 style="color: #1d4ed8; margin-top: 0;">Your Candidate Portal Account Is Ready</h2>
        <p>${defaultMessage}</p>
        <p><a href="${actionUrl || `${FRONTEND_URL}/candidate-portal`}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Open Candidate Portal</a></p>
      </div>
    `,
  });
}

module.exports = {
  generateCandidateCode,
  generateTemporaryPassword,
  ensureCandidatePortalCredentials,
  notifyCandidatePortalReady,
};
