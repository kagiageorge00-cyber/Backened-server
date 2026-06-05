jest.mock('../models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    _id: 'PAY_123',
    id: 'PAY_123',
    transactionId: 'RK7WXYZ9AB',
    metadata: { name: 'Test Applicant', email: 'test@example.com' },
  }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([{ id: 'PAY_123', _id: 'PAY_123', status: 'pending' }]),
  }),
  findById: jest.fn().mockResolvedValue({
    _id: 'PAY_123',
    id: 'PAY_123',
    userId: '+254700000000',
    status: 'pending',
    metadata: { name: 'Test Applicant', email: 'test@example.com' },
    save: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('../models/User', () => ({
  findOne: jest.fn().mockResolvedValue({
    email: 'test@example.com',
    phone: '+254700000000',
    uniqueCode: 'BLISS-123456',
  }),
}));

jest.mock('../services/notificationservice', () => ({
  notifyPaymentApproved: jest.fn(async () => true),
  notifyPaymentSuccess: jest.fn(async () => true),
}));

const express = require('express');
const request = require('supertest');

jest.mock('../models/candidate', () => ({
  findOneAndUpdate: jest.fn(),
}));

const Candidate = require('../models/candidate');
const { notifyPaymentApproved } = require('../services/notificationservice');
const submitPayments = require('../submitpayments');
const adminRoutes = require('../routes/admin');

describe('Admin payment approval flow', () => {
  test('lists pending submissions and approves them for registration', async () => {
    Candidate.findOneAndUpdate.mockResolvedValue({ phone: '+254700000000' });

    const app = express();
    app.use(express.json());
    app.use('/api', submitPayments);
    app.use('/api/admin', adminRoutes);

    const submitRes = await request(app)
      .post('/api/submitPayment')
      .send({
        name: 'Test Applicant',
        phone: '+254700000000',
        transactionCode: 'RK7WXYZ9AB',
        paymentMethod: 'mpesa',
        amount: 1300,
        currency: 'KES',
      });

    expect(submitRes.status).toBe(200);

    const pendingRes = await request(app).get('/api/admin/payments/pending');
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.success).toBe(true);
    expect(pendingRes.body.data.some((item) => item.id === submitRes.body.paymentId)).toBe(true);

    const approveRes = await request(app).post(`/api/admin/payments/${submitRes.body.paymentId}/approve`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.message).toContain('Payment approved');
    expect(notifyPaymentApproved).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        candidateId: 'BLISS-123456',
      })
    );
  });
});
