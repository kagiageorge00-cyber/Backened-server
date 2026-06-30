jest.mock('../models/candidate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
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
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      _id: 'cand_1',
      fullName: 'Test User',
      name: 'Test User',
      uniqueCode: 'cand_1',
      candidateId: 'cand_1',
      skills: [],
      languages: [],
      profileCompletion: 0,
    }));
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

  test('GET /api/candidates/marketplace returns verified available candidates with profile fields', async () => {
    Candidate.find.mockReturnValue(mockSortResult([{ _id: 'cand_3', fullName: 'Market User', uniqueCode: 'CAND-2026-0003', status: 'available', nationality: 'Kenyan', religion: 'Christian', education: 'High School', experience: '4', skills: ['Cleaning', 'Child Care'], languages: ['English', 'Arabic'], dateOfBirth: '2000-01-01' }]));

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/marketplace');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      candidateId: 'CAND-2026-0003',
      name: 'Market User',
      fullName: 'Market User',
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'High School',
      experience: '4 Years',
      languagesLabel: 'English, Arabic',
      skillsLabel: 'Cleaning, Child Care',
      destinationPreference: null,
      availability: 'Immediately Available',
      availabilityBadge: 'Verified',
    }));
    expect(Candidate.find).toHaveBeenCalledWith({ isVerified: true, status: 'available' });
  });

  test('GET /api/candidates/marketplace/profile/:candidateId returns a single formatted candidate card', async () => {
    Candidate.findOne.mockResolvedValue({ _id: 'cand_4', fullName: 'Card User', uniqueCode: 'CAND-2026-0004', candidateId: 'CAND-2026-0004', status: 'available', nationality: 'Kenyan', religion: 'Christian', education: 'High School', experience: '4', skills: ['Cleaning', 'Child Care'], languages: ['English', 'Arabic'], dateOfBirth: '2000-01-01', photoUrl: 'https://example.com/photo.jpg' });

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/marketplace/profile/CAND-2026-0004');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expect.objectContaining({
      candidateId: 'CAND-2026-0004',
      name: 'Card User',
      fullName: 'Card User',
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'High School',
      experience: '4 Years',
      languagesLabel: 'English, Arabic',
      skillsLabel: 'Cleaning, Child Care',
      availability: 'Immediately Available',
      photoUrl: 'https://example.com/photo.jpg',
      profilePhoto: 'https://example.com/photo.jpg',
    }));
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { uniqueCode: 'CAND-2026-0004' },
        { candidateId: 'CAND-2026-0004' },
        { phone: 'CAND-2026-0004' },
        { email: 'CAND-2026-0004' }
      ],
      isVerified: true,
      status: 'available',
    });
  });

  test('GET /api/candidates/marketplace maps legacy Mongo fields into marketplace values', async () => {
    Candidate.find.mockReturnValue(mockSortResult([{ _id: 'cand_legacy', fullName: 'Legacy User', uniqueCode: 'CAND-2026-0999', status: 'available', jobAppliedFor: 'Housekeeper', preferredDestination: ['Dubai'], experience: '6', nationality: 'Kenyan', religion: 'Christian', education: 'High School' }]));

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/marketplace');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      candidateId: 'CAND-2026-0999',
      jobPosition: 'Housekeeper',
      destinationPreference: 'Dubai',
      experience: '6 Years',
    }));
  });

  test('GET /api/candidates/:id returns a candidate by ID', async () => {
    Candidate.findOne.mockResolvedValue({ _id: 'cand_4', fullName: 'Fetched Candidate' });

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).get('/api/candidates/cand_4');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe('cand_4');
    expect(Candidate.findOne).toHaveBeenCalledWith({
      $or: [
        { uniqueCode: 'cand_4' },
        { phone: 'cand_4' },
        { email: 'cand_4' }
      ]
    });
  });

  test('PUT /api/candidates/:id updates candidate data', async () => {
    Candidate.findOneAndUpdate.mockResolvedValue({ _id: 'cand_5', fullName: 'Updated Candidate' });

    const app = express();
    app.use(express.json());
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app)
      .put('/api/candidates/cand_5')
      .send({ fullName: 'Updated Candidate' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Updated Candidate');
    expect(Candidate.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $or: [
          { uniqueCode: 'cand_5' },
          { phone: 'cand_5' },
          { email: 'cand_5' }
        ]
      },
      { $set: { fullName: 'Updated Candidate' } },
      { new: true }
    );
  });

  test('DELETE /api/candidates/:id removes a candidate', async () => {
    Candidate.findOneAndDelete.mockResolvedValue({ _id: 'cand_6' });

    const app = express();
    app.use('/api/candidates', candidateRoutes);

    const res = await request(app).delete('/api/candidates/cand_6');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Candidate deleted successfully');
    expect(Candidate.findOneAndDelete).toHaveBeenCalledWith({
      $or: [
        { uniqueCode: 'cand_6' },
        { phone: 'cand_6' },
        { email: 'cand_6' }
      ]
    });
  });
});
