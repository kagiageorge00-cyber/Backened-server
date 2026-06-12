const jwt = require('jsonwebtoken');
const Candidate = require('../models/candidate');

const JWT_SECRET = process.env.CANDIDATE_JWT_SECRET || 'candidate_secret_key';

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: 'Missing authorization header' });

  const token = (authHeader || '').toString().replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const candidate = await Candidate.findById(decoded.id);
    if (!candidate) return res.status(401).json({ success: false, error: 'Invalid token user' });
    req.candidate = candidate;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
