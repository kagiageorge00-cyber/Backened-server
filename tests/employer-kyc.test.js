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
});
