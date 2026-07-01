const { getCandidateDisplayName, getCandidatePortalGreetingName } = require('../utils/candidateDisplayName');

describe('getCandidateDisplayName', () => {
  test('prefers the stored full name over generic placeholders', () => {
    const candidate = { fullName: 'Mary Jane', name: 'Candidate', phone: '254700000001' };
    expect(getCandidateDisplayName(candidate)).toBe('Mary Jane');
  });

  test('falls back to a real identifier when no name fields exist', () => {
    const candidate = { phone: '254700000002', uniqueCode: 'CAND-2026-9999' };
    expect(getCandidateDisplayName(candidate)).toBe('254700000002');
  });

  test('uses a friendly portal greeting with the real full name', () => {
    const candidate = { fullName: 'Elizabeth kamandi makungu', name: 'Candidate', phone: '0742221275' };
    expect(getCandidatePortalGreetingName(candidate)).toBe('Welcome back, Elizabeth kamandi makungu');
  });
});
