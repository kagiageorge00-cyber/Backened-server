require('dotenv').config();

const DEFAULT_BACKEND_URL = 'https://backened_server_1.onrender.com';

function normalizeUrl(value) {
  if (!value) return null;
  return String(value).trim().replace(/\/+$/, '');
}

function getBackendBaseUrl() {
  return normalizeUrl(
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    DEFAULT_BACKEND_URL
  ) || DEFAULT_BACKEND_URL;
}

function getApiBaseUrl(path = '') {
  const baseUrl = getBackendBaseUrl();
  const normalizedPath = path ? `/${String(path).replace(/^\/+/, '')}` : '';
  return `${baseUrl}${normalizedPath}`;
}

const FRONTEND_URL = normalizeUrl(process.env.FRONTEND_URL || 'https://blissconnect12.netlify.app') || 'https://blissconnect12.netlify.app';

module.exports = {
  FRONTEND_URL,
  BACKEND_URL: getBackendBaseUrl(),
  API_BASE_URL: getBackendBaseUrl(),
  getBackendBaseUrl,
  getApiBaseUrl,
};
