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
      { new: true, runValidators: true }
    );
  });

  test('PATCH /marketplace/candidates/:id persists all candidate profile aliases', async () => {
    const candidate = { _id: 'mongo-id-1', candidateId: 'CAND-2026-3741' };
    Candidate.findOneAndUpdate.mockResolvedValue(candidate);

    const app = express();
    app.use(express.json());
    app.use('/api/staff', staffPortalRoutes);

    const res = await request(app)
      .patch('/api/staff/marketplace/candidates/CAND-2026-3741')
      .send({
        email: 'updated@example.com',
        phone: '+254700000999',
        jobtype: 'Full-time',
        gender: 'Female',
        dateofbirth: '1998-05-15',
        maritalstatus: 'Married',
        noofchildren: 2,
        passportphoto: 'https://example.com/passport.jpg',
        goodconduct: 'https://example.com/good-conduct.pdf',
        medicaldocument: 'https://example.com/medical.pdf',
      });

    expect(res.status).toBe(200);
    expect(Candidate.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $or: [
          { candidateId: 'CAND-2026-3741' },
          { uniqueCode: 'CAND-2026-3741' },
          { phone: 'CAND-2026-3741' },
          { email: 'CAND-2026-3741' },
        ],
      },
      {
        $set: {
          email: 'updated@example.com',
          phone: '+254700000999',
          jobType: 'Full-time',
          gender: 'Female',
          dateOfBirth: '1998-05-15',
          maritalStatus: 'Married',
          numberOfChildren: 2,
          photoUrl: 'https://example.com/passport.jpg',
          passportUrl: 'https://example.com/passport.jpg',
          'documents.passportPhoto': 'https://example.com/passport.jpg',
          goodConductUrl: 'https://example.com/good-conduct.pdf',
          medicalUrl: 'https://example.com/medical.pdf',
        },
      },
      { new: true, runValidators: true }
    );
  });
});
