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
    };

    const response = await request(app)
      .post('/api/apply')
      .send(application);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Candidate.create).toHaveBeenCalledWith(
      expect.objectContaining(application),
    );
  });
});
