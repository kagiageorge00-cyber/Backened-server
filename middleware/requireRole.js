const { verifyEmployerToken } = require('../services/jwtService');

module.exports = function requireRole(role) {
  return (req, res, next) => {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.toString().startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization header missing' });
    }
    const token = auth.toString().replace(/^Bearer\s+/i, '');
    try {
      const decoded = verifyEmployerToken(token);
      if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });
      // Role can be array or single
      const tokenRole = decoded.role || decoded.roles || null;
      if (!tokenRole) return res.status(403).json({ success: false, error: 'Role not present in token' });
      if (Array.isArray(tokenRole)) {
        if (!tokenRole.includes(role)) return res.status(403).json({ success: false, error: 'Insufficient role' });
      } else {
        if (tokenRole !== role) return res.status(403).json({ success: false, error: 'Insufficient role' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  };
};
