const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'boss';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'boss123';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_secret_key';
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '1h';
const adminTokenBlacklist = new Set();

function compareAdminCredentials(username, password) {
  if (!username || !password) return false;
  if (username !== ADMIN_USERNAME) return false;

  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  }

  return password === ADMIN_PASSWORD;
}

function signAdminToken(payload) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_JWT_EXPIRY,
  });
}

function verifyAdminToken(token) {
  return jwt.verify(token, ADMIN_JWT_SECRET);
}

function revokeAdminToken(token) {
  if (token) {
    adminTokenBlacklist.add(token);
  }
}

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' });
  }

  const token = authHeader.toString().replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }

  if (adminTokenBlacklist.has(token)) {
    return res.status(401).json({ success: false, error: 'Token revoked' });
  }

  try {
    const decoded = verifyAdminToken(token);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin token' });
  }
}

module.exports = {
  compareAdminCredentials,
  signAdminToken,
  requireAdminAuth,
  revokeAdminToken,
  ADMIN_USERNAME,
  ADMIN_JWT_EXPIRY,
};
