const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'employer_secret_key';
const EMPLOYER_JWT_EXPIRY = process.env.EMPLOYER_JWT_EXPIRY || '7d';

function signEmployerToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EMPLOYER_JWT_EXPIRY });
}

function verifyEmployerToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signEmployerToken,
  verifyEmployerToken,
};
