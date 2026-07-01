jest.mock('../models/candidate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../middleware/employerAuth', () => jest.fn((req, res, next) => {
  req.employer = { status: 'active', verificationStatus: 'verified_employer' };
  next();
}));

const express = require('express');
const request = require('supertest');
const Candidate = require('../models/candidate');
const marketplaceRoutes = require('../routes/marketplace');

describe('Marketplace routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/marketplace/candidates returns mapped candidate list with sanitized names', async () => {
    const mockFindQuery = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        {
          _id: 'cand_1',
          candidateId: 'CAND-2026-0101',
          fullName: '+254700000001',
          name: 'candidate@example.com',
          status: 'available',
          isVerified: true,
          nationality: 'Kenyan',
          religion: 'Christian',
          education: 'High School',
          experience: '4',
          skills: ['Cleaning'],
          languages: ['English'],
        }
      ]),
    };
    Candidate.find.mockReturnValue(mockFindQuery);

    const app = express();
    app.use('/api/marketplace', marketplaceRoutes);

    const res = await request(app).get('/api/marketplace/candidates');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      candidateId: 'CAND-2026-0101',
      fullName: null,
      name: null,
      nationality: 'Kenyan',
      religion: 'Christian',
    });
  });

  test('GET /api/marketplace/candidates/:candidateId returns a candidate card with sanitized name', async () => {
    const mockFindOneQuery = {
      select: jest.fn().mockResolvedValue({
        _id: 'cand_2',
        candidateId: 'CAND-2026-0102',
        fullName: '254700000001',
        name: 'candidate@example.com',
        status: 'available',
        isVerified: true,
        nationality: 'Kenyan',
        religion: 'Christian',
        education: 'High School',
        experience: '4',
        skills: ['Nursing'],
        languages: ['English'],
      }),
    };
    Candidate.findOne.mockReturnValue(mockFindOneQuery);

    const app = express();
    app.use('/api/marketplace', marketplaceRoutes);

    const res = await request(app).get('/api/marketplace/candidates/CAND-2026-0102');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      candidateId: 'CAND-2026-0102',
      fullName: null,
      name: null,
      nationality: 'Kenyan',
      religion: 'Christian',
    });
  });
});
