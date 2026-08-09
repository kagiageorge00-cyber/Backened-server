jest.mock('../models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    _id: 'PAY_123',
    id: 'PAY_123',
    transactionId: 'RK7WXYZ9AB',
  }),
}));

jest.mock('../models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../email', () => ({
  sendEmail: jest.fn(async () => true),
}));

const express = require('express');
const request = require('supertest');

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const Candidate = require('../models/candidate');
const { sendEmail } = require('../email');
const applyRoutes = require('../routes/applyRoutes');
const submitPayments = require('../submitpayments');

describe('Apply flow end to end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('stores the candidate application and accepts the payment submission payload', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_123',
      fullName: 'Test Applicant',
      email: 'applicant@example.com',
      phone: '+254700000000',
      country: 'Kenya',
      status: 'in_process',
      paymentStatus: 'pending',
      isVerified: false,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);
    app.use('/api', submitPayments);

    const applyRes = await request(app)
      .post('/api/apply')
      .send({
        fullName: 'Test Applicant',
        email: 'applicant@example.com',
        phone: '+254700000000',
        country: 'Kenya',
      });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.success).toBe(true);
    expect(applyRes.body.message).toContain('Application received successfully');

    const paymentRes = await request(app)
      .post('/api/submitPayment')
      .send({
        name: 'Test Applicant',
        email: 'applicant@example.com',
        phone: '+254700000000',
        transactionCode: 'RK7WXYZ9AB',
        paymentMethod: 'mpesa',
        amount: 1300,
        currency: 'KES',
      });

    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body.success).toBe(true);
    expect(paymentRes.body.paymentId).toBeDefined();
    expect(paymentRes.body.message).toContain('Payment submitted successfully');

    await new Promise(resolve => setImmediate(resolve));

    expect(sendEmail).toHaveBeenCalledWith(
      'applicant@example.com',
      'Payment Received ✅ - Bliss Connect',
      expect.any(String),
      expect.any(String)
    );
  });

  test('normalizes frontend job application fields for backend persistence', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_456',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+254700000001',
      country: 'Kenya',
      status: 'in_process',
      paymentStatus: 'pending',
      isVerified: false,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const res = await request(app)
      .post('/api/apply')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+254700000001',
        country: 'Kenya',
        jobPosition: 'Housekeeper',
        destinationCountry: 'Saudi Arabia',
        expectedSalary: 120000,
        skills: ['cleaning', 'cooking'],
        languages: ['English', 'Arabic'],
      });

    expect(res.status).toBe(201);
    const payload = Candidate.create.mock.calls[0][0];
    expect(payload.jobPosition).toBe('Housekeeper');
    expect(payload.jobAppliedFor).toBe('Housekeeper');
    expect(payload.destinationCountry).toBe('Saudi Arabia');
    expect(payload.destinationPreference).toEqual(['Saudi Arabia']);
  });

  test('preserves explicit zero values and maps frontend job fields to backend aliases', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_789',
      fullName: 'Noah Kim',
      email: 'noah@example.com',
      phone: '+254700000002',
      country: 'Kenya',
      status: 'in_process',
      paymentStatus: 'pending',
      isVerified: false,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const res = await request(app)
      .post('/api/apply')
      .send({
        fullName: 'Noah Kim',
        email: 'noah@example.com',
        phone: '+254700000002',
        country: 'Kenya',
        jobPosition: 'Cleaner',
        destinationCountry: 'UAE',
        expectedSalary: 0,
        numberOfChildren: 0,
        skills: ['cleaning'],
        languages: ['English'],
      });

    expect(res.status).toBe(201);
    const payload = Candidate.create.mock.calls[0][0];
    expect(payload.jobPosition).toBe('Cleaner');
    expect(payload.jobAppliedFor).toBe('Cleaner');
    expect(payload.destinationCountry).toBe('UAE');
    expect(payload.destinationPreference).toEqual(['UAE']);
    expect(payload.expectedSalary).toBe(0);
    expect(payload.numberOfChildren).toBe(0);
  });

  test('persists job application metadata for the saved candidate record', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_999',
      fullName: 'Amina Yusuf',
      email: 'amina@example.com',
      phone: '+254700000003',
      country: 'Kenya',
      status: 'in_process',
      paymentStatus: 'pending',
      isVerified: false,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const res = await request(app)
      .post('/api/apply')
      .send({
        fullName: 'Amina Yusuf',
        email: 'amina@example.com',
        phone: '+254700000003',
        country: 'Kenya',
        appliedJobId: 'JOB-123',
        appliedJobTitle: 'Housekeeper',
        appliedEmployerId: 'EMP-789',
        appliedEmployerName: 'Bliss Connect',
      });

    expect(res.status).toBe(201);
    const payload = Candidate.create.mock.calls[0][0];
    expect(payload.appliedJobId).toBe('JOB-123');
    expect(payload.appliedJobTitle).toBe('Housekeeper');
    expect(payload.appliedEmployerId).toBe('EMP-789');
    expect(payload.appliedEmployerName).toBe('Bliss Connect');
  });

  test('persists full document and good conduct data from the application payload', async () => {
    Candidate.findOne.mockResolvedValue(null);
    Candidate.create.mockResolvedValue({
      _id: 'cand_1000',
      fullName: 'Moses Otieno',
      email: 'moses@example.com',
      phone: '+254700000004',
      country: 'Kenya',
      status: 'in_process',
      paymentStatus: 'pending',
      isVerified: false,
    });

    const app = express();
    app.use(express.json());
    app.use('/api/apply', applyRoutes);

    const res = await request(app)
      .post('/api/apply')
      .send({
        fullName: 'Moses Otieno',
        email: 'moses@example.com',
        phone: '+254700000004',
        country: 'Kenya',
        gender: 'Male',
        dateOfBirth: '1994-04-10',
        maritalStatus: 'Single',
        numberOfChildren: 0,
        goodConductUrl: 'https://example.com/good-conduct.pdf',
        documents: {
          passportPhoto: 'https://example.com/passport.jpg',
          cv: 'https://example.com/cv.pdf',
          certificates: ['https://example.com/cert.pdf'],
          coverLetter: 'https://example.com/cover.pdf',
        },
        candidateFormLink: 'https://example.com/form',
      });

    expect(res.status).toBe(201);
    const payload = Candidate.create.mock.calls[0][0];
    expect(payload.gender).toBe('Male');
    expect(payload.maritalStatus).toBe('Single');
    expect(payload.numberOfChildren).toBe(0);
    expect(payload.goodConductUrl).toBe('https://example.com/good-conduct.pdf');
    expect(payload.documents.passportPhoto).toBe('https://example.com/passport.jpg');
    expect(payload.documents.cv).toBe('https://example.com/cv.pdf');
    expect(payload.documents.certificates).toEqual(['https://example.com/cert.pdf']);
    expect(payload.candidateFormLink).toBe('https://example.com/form');
  });
});
