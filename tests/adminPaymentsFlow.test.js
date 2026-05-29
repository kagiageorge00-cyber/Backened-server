const express = require('express');
const request = require('supertest');

jest.mock('../models/candidate', () => ({
  findOneAndUpdate: jest.fn(),
}));

const Candidate = require('../models/candidate');
const submitPayments = require('../submitpayments');

describe('Admin payment approval flow', () => {
  test('lists pending submissions and approves them for registration', async () => {
    Candidate.findOneAndUpdate.mockResolvedValue({ phone: '+254700000000' });

    const app = express();
    app.use(express.json());
    app.use('/api', submitPayments);

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
  });
});
