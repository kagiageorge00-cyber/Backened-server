const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();

const BlissCommunicationUser = require('../models/BlissCommunicationUser');
const BlissCommunicationProfile = require('../models/BlissCommunicationProfile');
const BlissCandidateLink = require('../models/BlissCandidateLink');
const BlissVerificationToken = require('../models/BlissVerificationToken');
const BlissPhoneOtp = require('../models/BlissPhoneOtp');
const Candidate = require('../models/candidate');

const JWT_SECRET = process.env.BLISS_JWT_SECRET || 'bliss_comms_secret';
const JWT_TTL = process.env.BLISS_JWT_TTL || '7d';

function generateBlissId() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `BLISS-${year}-${seq}`;
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}

function normalizeIdentifier(value) {
  return String(value || '').trim();
}

function isStrongPassword(password) {
  if (password.length < 8) return false;
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

async function ensureProfile(userId) {
  const existing = await BlissCommunicationProfile.findOne({ userId });
  if (existing) return existing;
  return BlissCommunicationProfile.create({ userId });
}

async function maybeLinkCandidate(user, candidateId) {
  if (!candidateId) return null;
  const existing = await BlissCandidateLink.findOne({ userId: user._id, candidateId });
  if (existing) return existing;
  const candidate = await Candidate.findOne({ $or: [{ uniqueCode: candidateId }, { candidateId }, { phone: candidateId }, { email: candidateId }] });
  if (!candidate) return null;
  return BlissCandidateLink.create({
    userId: user._id,
    blissId: user.blissId,
    candidateId,
    candidateCode: candidate?.uniqueCode || candidate?.candidateId || candidateId,
  });
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    blissId: user.blissId,
    candidateId: user.candidateId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    memberSince: user.memberSince,
    profileStatus: user.profileStatus,
    isActive: user.isActive,
  };
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, country, password, confirmPassword } = req.body;
    if (!fullName || !email || !phone || !country || !password || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: 'Use a stronger password with uppercase, lowercase, numbers, and symbols.' });
    }
    const normalizedEmail = normalizeIdentifier(email).toLowerCase();
    const normalizedPhone = normalizeIdentifier(phone);
    const existing = await BlissCommunicationUser.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account already exists with this email or phone.' });
    }

    let blissId = generateBlissId();
    while (await BlissCommunicationUser.findOne({ blissId })) {
      blissId = generateBlissId();
    }

    const user = await BlissCommunicationUser.create({
      blissId,
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      country,
      password,
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
    });

    await ensureProfile(user._id);

    const token = createToken({ id: user._id.toString(), blissId: user.blissId });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email before accessing Bliss Communication.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = normalizeIdentifier(req.body.identifier || req.body.candidateId || req.body.blissId || req.body.email || req.body.phone);
    const password = String(req.body.password || '');
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required.' });
    }

    const candidateQuery = { $or: [{ blissId: identifier }, { candidateId: identifier }, { email: identifier.toLowerCase() }, { phone: identifier }] };
    const user = await BlissCommunicationUser.findOne(candidateQuery);
    if (!user) {
      const candidate = await Candidate.findOne({ $or: [{ uniqueCode: identifier }, { candidateId: identifier }, { phone: identifier }, { email: identifier.toLowerCase() }] });
      if (!candidate) {
        return res.status(401).json({ success: false, error: 'Account not found.' });
      }
      const isMatch = await candidate.password && (await require('bcryptjs').compare(password, candidate.password));
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect password.' });
      }
      const blissId = generateBlissId();
      const createdUser = await BlissCommunicationUser.create({
        blissId,
        candidateId: candidate.uniqueCode || candidate.candidateId || identifier,
        fullName: candidate.fullName || candidate.name || 'Candidate',
        email: candidate.email || '',
        phone: candidate.phone || '',
        country: candidate.country || 'Unknown',
        password,
        emailVerified: Boolean(candidate.isVerified),
        phoneVerified: Boolean(candidate.isVerified),
      });
      await ensureProfile(createdUser._id);
      await maybeLinkCandidate(createdUser, createdUser.candidateId);
      const token = createToken({ id: createdUser._id.toString(), blissId: createdUser.blissId });
      return res.json({ success: true, token, user: sanitizeUser(createdUser) });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }

    user.lastLoginAt = new Date();
    await user.save();
    await ensureProfile(user._id);
    const token = createToken({ id: user._id.toString(), blissId: user.blissId });
    return res.json({ success: true, token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Login failed.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ success: false, error: 'Session expired.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await BlissCommunicationUser.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'Session expired.' });
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Session expired.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ success: false, error: 'Identifier is required.' });
    const user = await BlissCommunicationUser.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] });
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
    const token = crypto.randomBytes(24).toString('hex');
    await BlissVerificationToken.create({
      userId: user._id,
      token,
      type: 'password-reset',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    return res.json({ success: true, message: 'A password reset link has been sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Password reset failed.' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token, code } = req.body;
    if (!token && !code) return res.status(400).json({ success: false, error: 'Token or verification code is required.' });
    const record = token
      ? await BlissVerificationToken.findOne({ token, type: 'email' })
      : await BlissVerificationToken.findOne({ token: code, type: 'email' });
    if (!record) return res.status(404).json({ success: false, error: 'Verification token is invalid.' });
    const user = await BlissCommunicationUser.findById(record.userId);
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
    user.emailVerified = true;
    await user.save();
    record.usedAt = new Date();
    await record.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Email verification failed.' });
  }
});

router.post('/verify-whatsapp', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Verification code is required.' });
    const otpRecord = await BlissPhoneOtp.findOne({ otp: code, verifiedAt: null }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(404).json({ success: false, error: 'WhatsApp verification code is invalid.' });
    if (otpRecord.expiresAt < new Date()) return res.status(410).json({ success: false, error: 'WhatsApp verification code has expired.' });
    const user = await BlissCommunicationUser.findById(otpRecord.userId);
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
    user.phoneVerified = true;
    await user.save();
    otpRecord.verifiedAt = new Date();
    await otpRecord.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'WhatsApp verification failed.' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required.' });
    const user = await BlissCommunicationUser.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await BlissPhoneOtp.create({ userId: user._id, phone, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
    return res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'OTP sending failed.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, error: 'Phone and OTP are required.' });
    const record = await BlissPhoneOtp.findOne({ phone, otp, verifiedAt: null }).sort({ createdAt: -1 });
    if (!record) return res.status(404).json({ success: false, error: 'OTP is invalid.' });
    if (record.expiresAt < new Date()) return res.status(410).json({ success: false, error: 'OTP has expired.' });
    const user = await BlissCommunicationUser.findById(record.userId);
    user.phoneVerified = true;
    await user.save();
    record.verifiedAt = new Date();
    await record.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'OTP verification failed.' });
  }
});

module.exports = router;
