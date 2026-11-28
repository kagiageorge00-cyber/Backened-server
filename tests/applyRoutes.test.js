jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const Candidate = require('../models/candidate');
const applyRoutes = require('../routes/applyRoutes');

describe('Candidate application persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saves submitted candidate and job details without requiring an email', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockImplementation(async (candidate) => ({
      ...candidate,
      _id: 'candidate-123',
    }));

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const application = {
      fullName: 'Candidate Example',
      phone: '254700000005',
      country: 'Kenya',
      nationality: 'Kenyan',
      religion: 'Christian',
      education: 'Secondary',
      skills: ['Caregiving', 'Cooking'],
      languages: ['English', 'Swahili'],
      experience: '4',
      gender: 'Female',
      dateOfBirth: '1995-05-12',
      maritalStatus: 'Single',
      numberOfChildren: 1,
      jobPosition: 'Caregiver',
      jobType: 'International',
      applicationType: 'International',
      isInternational: true,
      destinationCountry: 'Canada',
      expectedSalary: 1500,
      jobData: { jobTitle: 'Caregiver', employerId: 'employer-1' },
      password: 'should-not-be-used-before-registration',
    };

    const response = await request(app)
      .post('/api/apply')
      .send(application);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Candidate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: application.fullName,
        phone: application.phone,
        jobPosition: application.jobPosition,
      }),
    );
    const candidatePayload = Candidate.create.mock.calls[0][0];
    expect(candidatePayload.candidateId).toMatch(/^CND-\d{4}-\d{4}$/);
    expect(candidatePayload).not.toHaveProperty('uniqueCode');
    expect(candidatePayload).not.toHaveProperty('password');
  });

  test('matches an application by candidate code before a conflicting phone number', async () => {
    const candidate = {
      _id: 'candidate-7514',
      candidateId: 'cand-2026-7514',
      fullName: 'Old Candidate Name',
      phone: '254700000006',
      save: jest.fn().mockImplementation(function save() { return this; }),
    };
    Candidate.findOne.mockImplementation(async (filter) => (
      filter.$or ? candidate : { _id: 'candidate-matching-phone' }
    ));

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const response = await request(app)
      .post('/api/apply')
      .send({
        candidateId: 'cand-2026-7514',
        fullName: 'Candidate 7514',
        phone: '254700000006',
      });

    expect(response.status).toBe(201);
    expect(Candidate.findOne).toHaveBeenNthCalledWith(1, {
      $or: [
        { candidateId: 'cand-2026-7514' },
        { uniqueCode: 'cand-2026-7514' },
      ],
    });
    expect(candidate.fullName).toBe('Candidate 7514');
    expect(candidate.phone).toBe('254700000006');
  });

  test('stores names submitted under common application-form aliases', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockImplementation(async (candidate) => ({
      ...candidate,
      _id: 'candidate-alias',
    }));

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const response = await request(app)
      .post('/api/apply')
      .send({
        candidate_name: 'Mercy Njeri',
        phone: '254700000007',
      });

    expect(response.status).toBe(201);
    expect(Candidate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Mercy Njeri',
        name: 'Mercy Njeri',
      }),
    );
  });
});
