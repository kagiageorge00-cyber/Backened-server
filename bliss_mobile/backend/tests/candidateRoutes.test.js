jest.mock('../models/candidate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const express = require('express');
const request = require('supertest');

const candidateRoutes = require('../routes/candidateRoutes');
const Candidate = require('../models/candidate');

describe('Candidate portal routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSortResult = (result) => ({
    sort: jest.fn().mockResolvedValue(result),
  });

  test('GET /api/candidates returns a list of candidates', async () => {
    Candidate.find.mockReturnValue(mockSortResult([{ _id: 'cand_1', fullName: 'Test User' }]));

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data).toEqual([{ _id: 'cand_1', fullName: 'Test User' }]);
    expect(Candidate.find).toHaveBeenCalled();
  });

  test('POST /api/candidates creates a candidate', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_2',
      fullName: 'New User',
      email: 'new@example.com',
      phone: '254700000002',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app)
      .post('/api/candidates')
      .send({
        fullName: 'New User',
        email: 'new@example.com',
        phone: '254700000002',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe('cand_2');
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [{ email: 'new@example.com' }, { phone: '254700000002' }],
    });
    expect(Candidate.create).toHaveBeenCalled();
  });

  test('GET /api/candidates/marketplace returns verified available candidates', async () => {
    Candidate.find.mockReturnValue(mockSortResult([{ _id: 'cand_3', fullName: 'Market User' }]));

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/marketplace');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(Candidate.find).toHaveBeenCalledWith({ isVerified: true, status: 'available' });
  });

  test('GET /api/candidates/:id returns a candidate by ID', async () => {
    Candidate.findById.mockResolvedValue({ _id: 'cand_4', fullName: 'Fetched Candidate' });

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/cand_4');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe('cand_4');
    expect(Candidate.findById).toHaveBeenCalledWith('cand_4');
  });

  test('PUT /api/candidates/:id updates candidate data', async () => {
    Candidate.findById.mockResolvedValue({ _id: 'cand_5', fullName: 'Existing Candidate', email: 'existing@example.com', phone: '254700000005', status: 'available', paymentStatus: 'pending' });
    Candidate.findByIdAndUpdate.mockResolvedValue({ _id: 'cand_5', fullName: 'Updated Candidate' });

    const app = express();
    app.use(express.json());
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app)
      .put('/api/candidates/cand_5')
      .send({ fullName: 'Updated Candidate' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Updated Candidate');
    expect(Candidate.findByIdAndUpdate).toHaveBeenCalledWith('cand_5', expect.any(Object), { new: true, runValidators: true });
  });

  test('DELETE /api/candidates/:id removes a candidate', async () => {
    Candidate.findByIdAndDelete.mockResolvedValue({ _id: 'cand_6' });

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).delete('/api/candidates/cand_6');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Candidate deleted successfully');
    expect(Candidate.findByIdAndDelete).toHaveBeenCalledWith('cand_6');
  });
});
