const { buildCandidateMarketplaceProfile, computeBlissMatchScore } = require('../services/candidateMarketplaceService');

describe('candidate marketplace scoring', () => {
  test('computes a strong match for aligned candidates', () => {
    const score = computeBlissMatchScore(
      {
        skills: ['Cleaning', 'Driving', 'Customer Service'],
        experience: '5 Years',
        country: 'Kenya',
        destinationCountry: 'Saudi Arabia',
      },
      {
        skills: ['Cleaning', 'Driving'],
        experience: 3,
        country: 'Saudi Arabia',
      }
    );

    expect(score).toBeGreaterThan(70);
  });

  test('keeps score capped at 100', () => {
    const score = computeBlissMatchScore(
      {
        skills: ['Cleaning', 'Driving', 'Forklift', 'Electrical'],
        experience: '20 Years',
        country: 'Kenya',
        destinationCountry: 'Kenya',
      },
      {
        skills: ['Cleaning', 'Driving', 'Forklift', 'Electrical'],
        experience: 20,
        country: 'Kenya',
      }
    );

    expect(score).toBe(100);
  });

  test('uses introductionVideoUrl when building the marketplace profile', () => {
    const profile = buildCandidateMarketplaceProfile({
      _id: 'cand-123',
      uniqueCode: 'CAND-0001',
      fullName: 'Grace Akinyi',
      introductionVideoUrl: 'https://cdn.example.com/intro.mp4',
    });

    expect(profile.videoUrl).toBe('https://cdn.example.com/intro.mp4');
  });

  test('does not label a candidate ID as a candidate code', () => {
    const profile = buildCandidateMarketplaceProfile({
      _id: '6a8f2bd483e1a2536900b841',
      candidateId: 'CND-2026-5124',
      fullName: 'SUSAN WAMBUI MAINA',
    });

    expect(profile.candidateId).toBe('CND-2026-5124');
    expect(profile.candidateCode).toBe('');
  });

  test('does not invent work, education, certificate, or summary data', () => {
    const profile = buildCandidateMarketplaceProfile({
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Grace Akinyi',
      skills: ['Nursing'],
      education: [],
      certificates: [],
    });

    expect(profile.professionalSummary).toBe('');
    expect(profile.workExperience).toEqual([]);
    expect(profile.education).toEqual([]);
    expect(profile.certificates).toEqual([]);
    expect(profile.employmentHistory).toEqual([]);
  });
});
