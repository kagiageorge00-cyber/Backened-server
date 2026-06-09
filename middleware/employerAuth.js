const { verifyEmployerToken } = require('../services/jwtService');
const Employer = require('../models/Employer');

module.exports = async function employerAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.toString().replace(/^Bearer\s+/i, '');
  try {
    const decoded = verifyEmployerToken(token);
    if (!decoded || !decoded.employerId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }

    const employer = await Employer.findOne({ employerId: decoded.employerId }).select('-password');
    if (!employer) {
      return res.status(401).json({ success: false, error: 'Employer account not found' });
    }

    req.employer = employer;
    req.employerToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
