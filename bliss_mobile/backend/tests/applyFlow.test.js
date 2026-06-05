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

jest.mock('../services/notificationservice', () => ({
  notifyPaymentSuccess: jest.fn(async () => true),
}));

const express = require('express');
const request = require('supertest');

jest.mock('../models/candidate', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const Candidate = require('../models/candidate');
const { notifyPaymentSuccess } = require('../services/notificationservice');
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
    expect(notifyPaymentSuccess).toHaveBeenCalledWith({
      email: 'applicant@example.com',
      name: 'Test Applicant',
    });
  });
});
