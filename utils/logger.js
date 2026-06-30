function formatMessage(level, message, meta = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  return JSON.stringify(payload);
}

function info(message, meta = {}) {
  console.log(formatMessage('info', message, meta));
}

function warn(message, meta = {}) {
  console.warn(formatMessage('warn', message, meta));
}

function error(message, meta = {}) {
  console.error(formatMessage('error', message, meta));
}

module.exports = {
  info,
  warn,
  error,
};
