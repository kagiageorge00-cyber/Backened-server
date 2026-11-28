const genericNameValues = new Set(['candidate', 'candidates', 'n/a', 'na']);

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
  if (genericNameValues.has(trimmed.toLowerCase())) return '';
  return trimmed;
}

function getCandidateNameValue(candidate) {
  const firstLastName = [candidate?.firstName || candidate?.first_name, candidate?.lastName || candidate?.last_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ');
  const candidates = [
    candidate?.fullName,
    candidate?.name,
    candidate?.candidateName,
    candidate?.candidate_name,
    candidate?.full_name,
    firstLastName,
  ];
  return candidates.map(normalizeNameValue).find(Boolean) || null;
}

function getCandidateDisplayName(candidate) {
  const directName = getCandidateNameValue(candidate);
  if (directName) {
    return directName;
  }

  const fallback = [candidate?.phone, candidate?.uniqueCode, candidate?.candidateId]
    .map((value) => typeof value === 'string' ? value.trim() : '')
    .find((value) => value && !genericNameValues.has(value.toLowerCase()));
  if (fallback) {
    return fallback;
  }

  return 'Candidate';
}

function getCandidatePortalGreetingName(candidate) {
  const realName = getCandidateNameValue(candidate);
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
