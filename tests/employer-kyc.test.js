const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../models/Employer', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../models/EmployerNotification', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../models/Interview', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../models/Deployment', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../email', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../whatsapp', () => ({
  sendWhatsAppMessage: jest.fn(),
}));

jest.mock('../services/notificationservice', () => ({
  notifyEmployerWelcome: jest.fn(),
  sendNotification: jest.fn(),
}));

const Employer = require('../models/Employer');
const EmployerNotification = require('../models/EmployerNotification');
const Interview = require('../models/Interview');
const Deployment = require('../models/Deployment');
const employerRoutes = require('../routes/employers');

describe('employer KYC endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a valid employer KYC submission and returns verified status', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/employers', employerRoutes);

    const token = jwt.sign(
      {
        employerId: 'EMP-2026-0001',
        email: 'vicky@example.com',
        role: 'employer',
      },
      process.env.JWT_SECRET || 'employer_secret_key',
      { expiresIn: '7d' }
    );

    const employer = {
      employerId: 'EMP-2026-0001',
      email: 'vicky@example.com',
      isVerified: false,
      verificationStatus: 'new_registration',
      documents: [],
      save: jest.fn().mockResolvedValue(true),
    };

    Employer.findOne.mockResolvedValue(employer);

    const response = await request(app)
      .post('/api/employers/kyc')
      .set('Authorization', `Bearer ${token}`)
      .send({
        documents: [
          {
            type: 'company_registration',
            label: 'Company Registration',
            filePath: '/tmp/company.pdf',
            url: '/tmp/company.pdf',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.employer.isVerified).toBe(true);
    expect(employer.save).toHaveBeenCalled();
  });

  it('serves employer dashboard stats with an active KYC check', async () => {
    const app = express();
    app.use('/api/employers', employerRoutes);

    const token = jwt.sign(
      { employerId: 'EMP-2026-0001' },
      process.env.JWT_SECRET || 'employer_secret_key',
      { expiresIn: '7d' }
    );
    const employer = {
      employerId: 'EMP-2026-0001',
      verificationStatus: 'under_review',
    };
    Employer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(employer),
    });
    Interview.countDocuments.mockResolvedValue(3);
    Deployment.countDocuments
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    Deployment.aggregate.mockResolvedValue([{ _id: null, total: 4500 }]);
    EmployerNotification.countDocuments.mockResolvedValue(7);

    const response = await request(app)
      .get('/api/employers/dashboard-stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      activeInterviews: 3,
      candidatesBooked: 4,
      contractsPending: 2,
      visasProcessing: 1,
      totalDeployments: 5,
      completedContracts: 1,
      unreadNotifications: 7,
      pendingPayments: 2,
      totalPaymentsProcessed: 4500,
    });
  });
});
