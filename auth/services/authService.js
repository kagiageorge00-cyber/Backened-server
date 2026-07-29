const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { promisify } = require('util');
const setTimeoutPromise = promisify(setTimeout);

const JWT_SECRET = process.env.BLISS_JWT_SECRET || 'bliss-auth-secret';
const ACCESS_TTL = process.env.BLISS_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.BLISS_REFRESH_TTL || '30d';

function buildBlissId(year = new Date().getFullYear(), sequence = 1) {
  return `BLISS-${year}-${String(sequence).padStart(6, '0')}`;
}

function identifyLoginMethod(identifier) {
  const value = String(identifier || '').trim();
  if (!value) return 'unknown';
  if (/^BLISS-\d{4}-\d{6}$/i.test(value)) return 'bliss_id';
  if (/^CAND-\d{4}-\d{6}$/i.test(value)) return 'candidate_id';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^\+?[1-9]\d{7,14}$/.test(value.replace(/\s+/g, ''))) return 'phone';
  return 'unknown';
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

async function delay(ms) {
  if (!ms) return;
  return setTimeoutPromise(ms);
}

module.exports = {
  buildBlissId,
  identifyLoginMethod,
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  randomOtp,
  randomToken,
  delay,
};
