const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'boss';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'boss@bliss admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_secret_key';
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '1h';
const ADMIN_DEFAULT_ROLE = process.env.ADMIN_DEFAULT_ROLE || 'super_administrator';

const ADMIN_ROLES = [
  'super_administrator',
  'administrator',
  'operations_manager',
  'recruitment_manager',
  'employer_relations_manager',
  'customer_care_manager',
  'travel_manager',
  'visa_manager',
  'finance_manager',
  'marketing_manager',
  'hr_manager',
  'it_administrator',
  'support_supervisor',
  'auditor',
];

const adminTokenBlacklist = new Set();

function normalizeAdminRole(role) {
  if (!role || typeof role !== 'string') return '';
  return role.toString().trim().toLowerCase().replace(/\s+/g, '_');
}

function isValidAdminRole(role) {
  return ADMIN_ROLES.includes(normalizeAdminRole(role));
}

function compareAdminCredentials(username, password) {
  if (!username || !password) return false;
  if (username.toString().trim().toLowerCase() !== ADMIN_USERNAME.toString().trim().toLowerCase()) return false;

  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  }

  return password === ADMIN_PASSWORD;
}

function signAdminToken(payload) {
  const role = isValidAdminRole(payload?.role) ? normalizeAdminRole(payload.role) : ADMIN_DEFAULT_ROLE;
  return jwt.sign({ ...payload, role }, ADMIN_JWT_SECRET, {
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

function requireAdminRole(allowedRoles = []) {
  return (req, res, next) => {
    requireAdminAuth(req, res, () => {
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.admin?.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient admin privileges' });
      }
      next();
    });
  };
}

module.exports = {
  compareAdminCredentials,
  signAdminToken,
  verifyAdminToken,
  requireAdminAuth,
  requireAdminRole,
  revokeAdminToken,
  ADMIN_USERNAME,
  ADMIN_JWT_EXPIRY,
  ADMIN_ROLES,
  isValidAdminRole,
};
