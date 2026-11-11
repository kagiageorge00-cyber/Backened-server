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
const { candidateMarketplaceEligibilityFilter } = require('../utils/candidateMarketplaceEligibility');

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
    expect(Candidate.find).toHaveBeenCalledWith({
      isVerified: true,
      status: { $in: ['available', 'in_process', 'approved'] },
      ...candidateMarketplaceEligibilityFilter(),
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
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [{ uniqueCode: 'CAND-2026-0102' }],
      isVerified: true,
      status: { $in: ['available', 'in_process', 'approved'] },
      ...candidateMarketplaceEligibilityFilter(),
    });
  });

  test('GET /api/marketplace/candidates/:candidateId resolves Mongo IDs', async () => {
    Candidate.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        uniqueCode: 'CAND-2026-0102',
        fullName: 'Grace Akinyi',
        status: 'available',
        isVerified: true,
      }),
    });

    const app = express();
    app.use('/api/marketplace', marketplaceRoutes);

    const res = await request(app)
      .get('/api/marketplace/candidates/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: '507f1f77bcf86cd799439011',
      candidateCode: 'CAND-2026-0102',
      fullName: 'Grace Akinyi',
    });
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { uniqueCode: '507f1f77bcf86cd799439011' },
        { _id: '507f1f77bcf86cd799439011' },
      ],
      isVerified: true,
      status: { $in: ['available', 'in_process', 'approved'] },
      ...candidateMarketplaceEligibilityFilter(),
    });
  });

  test('GET /api/marketplace/candidates/:candidateId does not expose an unverified candidate', async () => {
    Candidate.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const app = express();
    app.use('/api/marketplace', marketplaceRoutes);

    const res = await request(app).get('/api/marketplace/candidates/CND-2026-0999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [{ uniqueCode: 'CND-2026-0999' }],
      isVerified: true,
      status: { $in: ['available', 'in_process', 'approved'] },
      ...candidateMarketplaceEligibilityFilter(),
    });
  });

  test('marketplace eligibility requires approved payment, credentials, and an uploaded document', () => {
    const filter = candidateMarketplaceEligibilityFilter();

    expect(filter).toMatchObject({
      paymentStatus: /^paid$/i,
      uniqueCode: { $type: 'string', $regex: /\S/ },
      password: { $type: 'string', $regex: /\S/ },
    });
    expect(filter.$and[0].$or).toEqual(expect.arrayContaining([
      { passportUrl: { $type: 'string', $regex: /\S/ } },
      { 'documents.uploads.0': { $exists: true } },
    ]));
  });
});
