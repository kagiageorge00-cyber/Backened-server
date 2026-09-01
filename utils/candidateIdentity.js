function generateCandidateReferenceId() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CND-${year}-${seq}`;
}

function generateCandidatePortalCode() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `CAND-${year}-${seq}`;
}

function resolvePublicCandidateId(candidate) {
  if (!candidate) return null;

  if (candidate._id && typeof candidate._id.toString === 'function') {
    const objectIdValue = candidate._id.toString();
    if (objectIdValue && objectIdValue !== 'null' && objectIdValue !== 'undefined') {
      return objectIdValue;
    }
  }

  const nextValue = candidate.candidateId?.toString().trim();
  if (nextValue) {
    return nextValue;
  }

  const generated = generateCandidateReferenceId();
  candidate.candidateId = generated;
  return generated;
}

function ensureCandidateReference(candidate) {
  if (!candidate) return null;

  if (candidate._id && typeof candidate._id.toString === 'function') {
    const objectIdValue = candidate._id.toString();
    if (objectIdValue && objectIdValue !== 'null' && objectIdValue !== 'undefined') {
      return objectIdValue;
    }
  }

  const nextValue = candidate.candidateId?.toString().trim();
  if (nextValue) {
    return nextValue;
  }

  return null;
}

module.exports = {
  generateCandidateReferenceId,
  generateCandidatePortalCode,
  ensureCandidateReference,
  resolvePublicCandidateId,
};
