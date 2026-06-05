// Centralized backend configuration
// Use process.env.FRONTEND_URL if set, otherwise fallback to the correct production URL
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://blissconnect12.netlify.app').replace(/\/$/, '');

module.exports = {
  FRONTEND_URL,
};
