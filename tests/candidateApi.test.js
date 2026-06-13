jest.mock('../models/candidate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Application', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Job', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/Employer', () => ({
  findOne: jest.fn(),
}));

const express = require('express');
const request = require('supertest');

const Application = require('../models/Application');
const Job = require('../models/Job');
const mockSortResult = (result) => ({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(result),
  }),
});

let candidate;
const mockJwtAuth = jest.fn((req, res, next) => {
  req.candidate = candidate;
  next();
});

jest.mock('../middleware/jwtAuth', () => mockJwtAuth);

const candidateApi = require('../routes/candidate_api');

describe('Candidate API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    candidate = {
      _id: 'cand_123',
      phone: '254700000001',
      email: 'test@example.com',
      uniqueCode: 'CAN-123',
      candidateId: 'CAN-123',
    };
  });

  test('GET /api/candidate_portal/applications returns applications for candidate identifiers', async () => {
    Application.find.mockReturnValue(mockSortResult([
      { _id: 'app_1', candidateId: 'cand_123', jobTitle: 'Housemaid' },
    ]));

    const app = express();
    app.use('/api/candidate_portal', candidateApi);

    const res = await request(app).get('/api/candidate_portal/applications');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(Application.find).toHaveBeenCalledWith({ candidateId: { $in: ['cand_123', '254700000001', 'test@example.com', 'CAN-123'] } });
    expect(mockJwtAuth).toHaveBeenCalled();
  });

  test('GET /api/candidate_portal/applications returns fallback registration application when no applications exist', async () => {
    Application.find.mockReturnValue(mockSortResult([]));
    Job.findOne.mockResolvedValue(null);
    candidate = {
      ...candidate,
      appliedJobTitle: 'Registered Application',
      jobAppliedFor: 'Registered Application',
      country: 'Kenya',
      appliedEmployerId: 'EMP-999',
      appliedEmployerName: 'Test Employer',
      createdAt: new Date('2026-06-13T00:00:00.000Z'),
    };

    const app = express();
    app.use('/api/candidate_portal', candidateApi);

    const res = await request(app).get('/api/candidate_portal/applications');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].jobTitle).toBe('Registered Application');
    expect(Application.find).toHaveBeenCalledWith({ candidateId: { $in: ['cand_123', '254700000001', 'test@example.com', 'CAN-123'] } });
  });
});
