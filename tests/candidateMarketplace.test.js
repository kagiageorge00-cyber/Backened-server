const { computeBlissMatchScore } = require('../services/candidateMarketplaceService');

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
});
