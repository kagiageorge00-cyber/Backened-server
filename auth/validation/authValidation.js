function validateRegisterPayload(payload) {
  const errors = [];
  const { fullName, email, phone, country, password, confirmPassword } = payload || {};

  if (!fullName || String(fullName).trim().length < 2) {
    errors.push('Full name is required.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    errors.push('A valid email is required.');
  }
  if (!phone || !/^\+?[1-9]\d{7,14}$/.test(String(phone).replace(/\s+/g, ''))) {
    errors.push('A valid phone number is required.');
  }
  if (!country || String(country).trim().length < 2) {
    errors.push('Country is required.');
  }
  if (!password || String(password).length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }
  if (password && !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include uppercase, lowercase, numbers, and symbols.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLoginPayload(payload) {
  const { identifier, password } = payload || {};
  const errors = [];

  if (!identifier || String(identifier).trim().length < 2) {
    errors.push('Identifier is required.');
  }
  if (!password || String(password).length < 1) {
    errors.push('Password is required.');
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
