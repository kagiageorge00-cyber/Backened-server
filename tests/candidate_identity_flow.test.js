const test = require('node:test');
const assert = require('node:assert/strict');

const { generateCandidateReferenceId } = require('../utils/candidateIdentity');
const { ensureCandidatePortalCredentials } = require('../utils/candidatePortalCredentials');

test('candidate reference is created once and preserved for payment flow', () => {
  const candidateId = generateCandidateReferenceId();

  assert.match(candidateId, /^CND-\d{4}-\d{4}$/);
  assert.equal(candidateId.includes('CND-'), true);
});

test('payment approval preserves candidate reference and leaves portal login code for the registration step', async () => {
  const candidate = {
    candidateId: 'CND-2026-1001',
    email: 'test@example.com',
    phone: '+254712345678',
  };

  const result = await ensureCandidatePortalCredentials(candidate);

  assert.equal(result.candidateId, 'CND-2026-1001');
  assert.equal(candidate.candidateId, 'CND-2026-1001');
  assert.equal(result.uniqueCode, null);
  assert.ok(result.password && result.password.length >= 8);
});
