jest.mock('../middleware/adminAuth', () => ({
  compareAdminCredentials: jest.fn(),
  signAdminToken: jest.fn(),
  requireAdminAuth: (req, res, next) => next(),
  revokeAdminToken: jest.fn(),
  ADMIN_ROLES: [],
  ADMIN_DEFAULT_ROLE: 'admin',
  isValidAdminRole: jest.fn(() => true),
}));

jest.mock('../models/candidate', () => ({
  findOneAndUpdate: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const Candidate = require('../models/candidate');
const adminRoutes = require('../routes/admin');

describe('Admin candidate status route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approves a candidate using the visible candidate ID', async () => {
    const candidate = {
      _id: 'mongo-id-1',
      candidateId: 'CAND-2026-3741',
      status: 'approved',
    };
    Candidate.findOneAndUpdate.mockResolvedValue(candidate);

    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    const res = await request(app)
      .patch('/api/admin/marketplace/candidates/CAND-2026-3741/status')
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Candidate status updated to approved',
      data: candidate,
    });
    expect(Candidate.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $or: [
          { candidateId: 'CAND-2026-3741' },
          { phone: 'CAND-2026-3741' },
        ],
      },
      { status: 'approved' },
      { new: true }
    );
  });
});