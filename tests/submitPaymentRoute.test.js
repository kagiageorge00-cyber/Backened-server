const express = require('express');
const request = require('supertest');

const submitPayments = require('../submitpayments');

describe('Apply-flow payment submission route', () => {
  test('POST /api/submitPayment accepts the payment payload used by the apply flow', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', submitPayments);

    const res = await request(app)
      .post('/api/submitPayment')
      .send({
        name: 'Test Applicant',
        phone: '+254700000000',
        transactionCode: 'RK7WXYZ9AB',
        paymentMethod: 'mpesa',
        amount: 1300,
        currency: 'KES',
        bankAccountName: 'Bliss Connect',
        bankName: 'Equity Bank',
        bankAccountNumber: '0640179700069',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.message).toContain('Payment submitted successfully');
  });
});
