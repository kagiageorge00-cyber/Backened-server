const { identifyLoginMethod, buildBlissId } = require('../auth/services/authService');

describe('auth service helpers', () => {
  it('detects bliss ids, candidate ids, emails and phone numbers', () => {
    expect(identifyLoginMethod('BLISS-2026-000001')).toBe('bliss_id');
    expect(identifyLoginMethod('CAND-2026-004512')).toBe('candidate_id');
    expect(identifyLoginMethod('john@example.com')).toBe('email');
    expect(identifyLoginMethod('+254712345678')).toBe('phone');
  });

  it('builds a bliss id in the expected format', () => {
    const value = buildBlissId(2026, 1);
    expect(value).toBe('BLISS-2026-000001');
  });
});
