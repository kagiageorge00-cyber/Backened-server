const jwt = require('jsonwebtoken');

function authenticateStaff(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    return res.status(503).json({ success: false, error: 'Staff authentication is not configured' });
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authorization token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'bliss-staff-secret';
    const decoded = jwt.verify(token, secret);
    req.staff = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = authenticateStaff;
