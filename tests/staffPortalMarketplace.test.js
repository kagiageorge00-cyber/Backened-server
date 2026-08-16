jest.mock('../models/candidate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../middleware/staffAuth', () => (req, res, next) => {
  req.staff = { staffId: 'staff-1' };
  next();
});

const express = require('express');
const request = require('supertest');
const Candidate = require('../models/candidate');
const staffPortalRoutes = require('../routes/staffPortal');

describe('Staff marketplace candidate routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /marketplace/candidates/:id returns a candidate by visible candidate code', async () => {
    const candidate = {
      _id: 'mongo-id-1',
      candidateId: 'CAND-2026-3741',
      uniqueCode: 'CAND-2026-3741',
      fullName: 'Test Candidate',
    };
    Candidate.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(candidate),
    });

    const app = express();
    app.use('/api/staff', staffPortalRoutes);

    const res = await request(app).get('/api/staff/marketplace/candidates/CAND-2026-3741');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: candidate });
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { candidateId: 'CAND-2026-3741' },
        { uniqueCode: 'CAND-2026-3741' },
        { phone: 'CAND-2026-3741' },
        { email: 'CAND-2026-3741' },
      ],
    });
  });

  test('PATCH /marketplace/candidates/:id updates by candidateId', async () => {
    const candidate = { _id: 'mongo-id-1', candidateId: 'CAND-2026-3741', fullName: 'Updated Candidate' };
    Candidate.findOneAndUpdate.mockResolvedValue(candidate);

    const app = express();
    app.use(express.json());
    app.use('/api/staff', staffPortalRoutes);

    const res = await request(app)
      .patch('/api/staff/marketplace/candidates/CAND-2026-3741')
      .send({ fullName: 'Updated Candidate' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(candidate);
    expect(Candidate.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $or: [
          { candidateId: 'CAND-2026-3741' },
          { uniqueCode: 'CAND-2026-3741' },
          { phone: 'CAND-2026-3741' },
          { email: 'CAND-2026-3741' },
        ],
      },
      { $set: { fullName: 'Updated Candidate' } },
      { new: true }
    );
  });
});
