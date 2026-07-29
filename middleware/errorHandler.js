const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    message: err?.message,
    stack: err?.stack,
    path: req?.path,
  });

  const statusCode = err?.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : err?.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
