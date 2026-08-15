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

module.exports = {
  generateCandidateReferenceId,
  generateCandidatePortalCode,
};
