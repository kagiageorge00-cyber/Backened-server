const bcrypt = require('bcryptjs');

const BOSS_USERNAME = process.env.BOSS_USERNAME || process.env.ADMIN_USERNAME || '';
const BOSS_PASSWORD = process.env.BOSS_PASSWORD || process.env.ADMIN_PASSWORD || '';
const BOSS_PASSWORD_HASH = process.env.BOSS_PASSWORD_HASH || null;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

function normalizeUsername(value) {
  return value ? value.toString().trim().toLowerCase() : '';
}

function hasBossDevCredentials() {
  return !!BOSS_USERNAME && !!BOSS_PASSWORD && !isProduction;
}

function compareBossCredentials(username, password) {
  if (!username || !password || !hasBossDevCredentials()) return false;
  if (normalizeUsername(username) !== normalizeUsername(BOSS_USERNAME)) return false;

  if (BOSS_PASSWORD_HASH) {
    return bcrypt.compareSync(password, BOSS_PASSWORD_HASH);
  }

  return password === BOSS_PASSWORD;
}

module.exports = {
  BOSS_USERNAME,
  BOSS_PASSWORD,
  BOSS_PASSWORD_HASH,
  isProduction,
  hasBossDevCredentials,
  compareBossCredentials,
};
