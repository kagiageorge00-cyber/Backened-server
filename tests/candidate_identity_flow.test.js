const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateCandidateReferenceId,
  ensureCandidateReference,
  resolvePublicCandidateId,
} = require('../utils/candidateIdentity');

test('candidate reference is created once and preserved for payment flow', () => {
  const candidateId = generateCandidateReferenceId();

  assert.match(candidateId, /^CND-\d{4}-\d{4}$/);
  assert.equal(candidateId.includes('CND-'), true);
});

test('public candidate id prefers Mongo ObjectId over generated custom codes', () => {
  const candidate = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    candidateId: 'CND-2026-1001',
  };

  const publicId = resolvePublicCandidateId(candidate);

  assert.equal(publicId, '507f1f77bcf86cd799439011');
  assert.ok(!publicId.startsWith('CND-'));
});

test('candidate reference falls back to Mongo ObjectId when present and does not generate a custom ID', () => {
  const candidate = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'missing-ref@example.com',
  };
  const generated = ensureCandidateReference(candidate);

  assert.equal(generated, '507f1f77bcf86cd799439011');
  assert.equal(candidate.candidateId, undefined);
});

test('candidate references do not require portal credentials', () => {
  const candidate = {
    candidateId: 'CND-2026-1001',
    uniqueCode: undefined,
    password: undefined,
  };

  assert.equal(ensureCandidateReference(candidate), 'CND-2026-1001');
  assert.equal(candidate.uniqueCode, undefined);
  assert.equal(candidate.password, undefined);
});
