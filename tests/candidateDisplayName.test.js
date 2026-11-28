const {
  getCandidateDisplayName,
  getCandidateNameValue,
  getCandidatePortalGreetingName,
} = require('../utils/candidateDisplayName');

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

  test('uses a real name field instead of a generic full-name placeholder', () => {
    expect(getCandidateNameValue({
      fullName: 'Candidates',
      name: 'Amina Wanjiku',
    })).toBe('Amina Wanjiku');
  });

  test('supports common application-form name aliases', () => {
    expect(getCandidateNameValue({ candidate_name: 'Mercy Njeri' })).toBe('Mercy Njeri');
    expect(getCandidateNameValue({ first_name: 'Mercy', last_name: 'Njeri' })).toBe('Mercy Njeri');
  });
});
