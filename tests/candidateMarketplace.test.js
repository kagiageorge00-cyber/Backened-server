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
});
