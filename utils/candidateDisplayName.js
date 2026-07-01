function isPhoneLike(value) {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isEmailLike(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeNameValue(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  if (isPhoneLike(trimmed) || isEmailLike(trimmed)) return '';
  return trimmed;
}

function getCandidateNameValue(candidate) {
  const normalized = normalizeNameValue(candidate?.fullName) || normalizeNameValue(candidate?.name);
  return normalized || null;
}

function getCandidateDisplayName(candidate) {
  const directName = getCandidateNameValue(candidate);
  if (directName) {
    return directName;
  }

  const fallback = normalizeNameValue(candidate?.email || candidate?.phone || candidate?.uniqueCode || candidate?.candidateId);
  if (fallback) {
    return fallback;
  }

  return 'Candidate';
}

function getCandidatePortalGreetingName(candidate) {
  const realName = normalizeNameValue(candidate?.fullName || candidate?.name);
  if (!realName) {
    return 'Candidate';
  }
  return `Welcome back, ${realName}`;
}

module.exports = {
  getCandidateDisplayName,
  getCandidatePortalGreetingName,
  getCandidateNameValue,
};
