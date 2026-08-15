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

function ensureCandidateReference(candidate) {
  if (!candidate) return null;

  const nextValue = candidate.candidateId?.toString().trim();
  if (nextValue) {
    return nextValue;
  }

  const generated = generateCandidateReferenceId();
  candidate.candidateId = generated;
  return generated;
}

module.exports = {
  generateCandidateReferenceId,
  generateCandidatePortalCode,
  ensureCandidateReference,
};
