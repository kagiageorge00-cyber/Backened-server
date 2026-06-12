const rateLimits = new Map();

function rateLimiter({ windowMs = 60000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const record = rateLimits.get(key) || { count: 0, expires: now + windowMs };

    if (now > record.expires) {
      record.count = 0;
      record.expires = now + windowMs;
    }

    record.count += 1;
    rateLimits.set(key, record);

    if (record.count > max) {
      return res.status(429).json({ success: false, error: 'Too many requests, please try again later.' });
    }

    next();
  };
}

module.exports = rateLimiter;
