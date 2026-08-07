let mockEmployer = {
  employerId: 'EMP-1',
  status: 'active',
  verificationStatus: 'verified_employer',
  companyName: 'Demo Co',
  country: 'USA',
};

jest.mock('../middleware/employerAuth', () => jest.fn((req, res, next) => {
  req.employer = { ...mockEmployer };
  next();
}));

jest.mock('../models/Interview', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
}));

jest.mock('../models/Deployment', () => ({
  create: jest.fn(),
}));

jest.mock('../models/Notification', () => ({
  create: jest.fn(),
}));

jest.setTimeout(30000);

const request = require('supertest');
const app = require('../server');
const Interview = require('../models/Interview');
const Candidate = require('../models/candidate');
const Deployment = require('../models/Deployment');

describe('International recruitment payment flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmployer = {
      employerId: 'EMP-1',
      status: 'active',
      verificationStatus: 'verified_employer',
      companyName: 'Demo Co',
      country: 'USA',
    };
  });

  test('uses fixed USD 1000 deployment fee for international housemaid candidates', async () => {
    Interview.findOne.mockResolvedValue({
      interviewId: 'INT-1',
      employerId: 'EMP-1',
      candidateId: 'CAN-1',
      interviewStatus: 'passed',
    });

    Candidate.findOne.mockResolvedValue({
      _id: 'c1',
      candidateId: 'CAN-1',
      fullName: 'Jane Housemaid',
      jobPosition: 'Housemaid',
    });

    Deployment.create.mockResolvedValue({
      deploymentId: 'INTDEP-1',
      deploymentFee: 1000,
    });

    const response = await request(app)
      .post('/api/international-recruitment/deployment/payment')
      .send({
        interviewId: 'INT-1',
        basicSalary: 2000,
        visaFee: 100,
        flightTicketFee: 50,
        relocationAllowance: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Deployment.create).toHaveBeenCalledWith(expect.objectContaining({
      deploymentFee: 1000,
      employerFee: 1000,
      candidateFee: 0,
      paymentStatus: 'pending',
      deploymentStatus: 'international',
    }));
    expect(response.body.deployment.totalDue).toBe(1000);
  });

  test('uses fixed USD 2500 deployment fee when employer is from Lebanon', async () => {
    mockEmployer.country = 'Lebanon';

    Interview.findOne.mockResolvedValue({
      interviewId: 'INT-3',
      employerId: 'EMP-1',
      candidateId: 'CAN-3',
      interviewStatus: 'passed',
    });

    Candidate.findOne.mockResolvedValue({
      _id: 'c3',
      candidateId: 'CAN-3',
      fullName: 'Nadine Candidate',
      jobPosition: 'Housemaid',
    });

    Deployment.create.mockResolvedValue({
      deploymentId: 'INTDEP-3',
      deploymentFee: 2500,
    });

    const response = await request(app)
      .post('/api/international-recruitment/deployment/payment')
      .send({
        interviewId: 'INT-3',
        basicSalary: 2000,
        visaFee: 100,
        flightTicketFee: 50,
        relocationAllowance: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Deployment.create).toHaveBeenCalledWith(expect.objectContaining({
      deploymentFee: 2500,
      employerFee: 2500,
      candidateFee: 0,
      paymentStatus: 'pending',
      deploymentStatus: 'international',
    }));
    expect(response.body.deployment.totalDue).toBe(2500);
  });

  test('calculates salary-based total due for non-housemaid international candidates', async () => {
    Interview.findOne.mockResolvedValue({
      interviewId: 'INT-2',
      employerId: 'EMP-1',
      candidateId: 'CAN-2',
      interviewStatus: 'passed',
    });

    Candidate.findOne.mockResolvedValue({
      _id: 'c2',
      candidateId: 'CAN-2',
      fullName: 'John Engineer',
      jobPosition: 'Engineer',
    });

    Deployment.create.mockResolvedValue({
      deploymentId: 'INTDEP-2',
      deploymentFee: 2050,
    });

    const response = await request(app)
      .post('/api/international-recruitment/deployment/payment')
      .send({
        interviewId: 'INT-2',
        basicSalary: 2000,
        visaFee: 100,
        flightTicketFee: 50,
        relocationAllowance: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(Deployment.create).toHaveBeenCalledWith(expect.objectContaining({
      deploymentFee: 2050,
      employerFee: 1600,
      candidateFee: 300,
      visaFee: 100,
      flightTicketFee: 50,
      relocationAllowance: 0,
    }));
    expect(response.body.deployment.totalDue).toBe(2050);
  });
});