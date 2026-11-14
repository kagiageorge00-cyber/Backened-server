jest.mock('../models/Job', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../models/JobApplication', () => ({}));
jest.mock('../models/Notification', () => ({}));
jest.mock('../models/Employer', () => ({}));
jest.mock('../middleware/employerAuth', () => (req, res, next) => next());

const express = require('express');
const request = require('supertest');
const Job = require('../models/Job');
const jobsRoutes = require('../routes/jobs');

const backendJob = {
  jobId: 'JOB-2026-123456',
  title: 'Registered Nurse',
  jobTitle: 'Registered Nurse',
  employerName: 'Global Care Ltd',
  country: 'Kenya',
  city: '',
  location: 'Kenya',
  numberOfVacancies: 3,
  yearsOfExperience: 5,
  requiredSkills: ['Nursing', 'First Aid'],
  jobSummary: 'Provide patient care.',
  description: '',
  featured: true,
  status: 'Active',
};

function createApp() {
  const app = express();
  app.use('/api/jobs', jobsRoutes);
  return app;
}

describe('Marketplace job response compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('maps backend Job fields to the global marketplace card fields', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([backendJob]),
    };
    Job.find.mockReturnValue(query);
    Job.countDocuments.mockResolvedValue(1);

    const response = await request(createApp()).get('/api/jobs/marketplace');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({
      employer: 'Global Care Ltd',
      vacancies: 3,
      experience: '5 years',
      skills: ['Nursing', 'First Aid'],
      description: 'Provide patient care.',
      isFeatured: true,
      city: '',
    });
  });

  test('returns the same compatible fields from job details', async () => {
    Job.findOne.mockResolvedValue(backendJob);
    Job.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const response = await request(createApp()).get('/api/jobs/JOB-2026-123456');

    expect(response.status).toBe(200);
    expect(response.body.job).toMatchObject({
      jobId: 'JOB-2026-123456',
      employer: 'Global Care Ltd',
      vacancies: 3,
      experience: '5 years',
      skills: ['Nursing', 'First Aid'],
      description: 'Provide patient care.',
      isFeatured: true,
      city: '',
    });
  });
});
