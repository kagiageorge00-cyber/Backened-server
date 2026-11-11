jest.mock('../models/Payment', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({
    _id: 'PAY_123',
    id: 'PAY_123',
    transactionId: 'RK7WXYZ9AB',
    metadata: { name: 'Test Applicant', email: 'test@example.com' },
  }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([{
      id: 'PAY_123',
      _id: 'PAY_123',
      status: 'pending',
      toObject: jest.fn().mockReturnValue({ id: 'PAY_123', _id: 'PAY_123', status: 'pending' }),
    }]),
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
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

jest.mock('../models/PaymentRecord', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
}));

jest.mock('../models/Deployment', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../email', () => ({
  sendEmail: jest.fn(async () => true),
}));

jest.mock('../services/notificationservice', () => ({
  notifyPaymentApproved: jest.fn(async () => true),
  notifyPaymentSuccess: jest.fn(async () => true),
}));

jest.mock('../utils/adminNotificationHelper', () => ({
  notifyPaymentApproved: jest.fn(async () => true),
  createAdminNotification: jest.fn(async () => true),
}));

jest.mock('../utils/notificationHelper', () => ({
  createNotification: jest.fn(async () => true),
}));

const express = require('express');
const request = require('supertest');

jest.mock('../models/candidate', () => ({
  find: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue([]),
  }),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
}));

const Candidate = require('../models/candidate');
const Payment = require('../models/Payment');
const PaymentRecord = require('../models/PaymentRecord');
const Deployment = require('../models/Deployment');
const submitPayments = require('../submitpayments');
const adminRoutes = require('../routes/admin');
const { signAdminToken } = require('../middleware/adminAuth');

describe('Admin payment approval flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Payment.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{
        id: 'PAY_123',
        _id: 'PAY_123',
        status: 'pending',
        toObject: jest.fn().mockReturnValue({
          id: 'PAY_123',
          _id: 'PAY_123',
          status: 'pending',
        }),
      }]),
    });
  });

  test('lists candidate payments in any non-approved status within 30 days', async () => {
    const payment = {
      _id: 'PAY-FAILED-123',
      status: 'failed',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {},
      toObject() {
        return { _id: this._id, status: this.status, metadata: this.metadata };
      },
    };
    Payment.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([payment]),
    });

    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    const token = signAdminToken({ username: 'test-admin', role: 'administrator' });

    const response = await request(app)
      .get('/api/admin/payments/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({ _id: 'PAY-FAILED-123', status: 'failed' }),
    ]);
    expect(Payment.find).toHaveBeenCalledWith({
      status: { $nin: ['approved', 'paid', 'completed'] },
      createdAt: { $gt: expect.any(Date) },
    });
    expect(Payment.deleteMany).toHaveBeenCalledWith({
      status: { $nin: ['approved', 'paid', 'completed'] },
      $or: expect.arrayContaining([
        { createdAt: { $lte: expect.any(Date) } },
        { expiresAt: { $lte: expect.any(Date) } },
      ]),
    });
  });

  test('lists pending submissions and approves them for registration', async () => {
    Candidate.findOneAndUpdate.mockResolvedValue({ phone: '+254700000000' });
    Candidate.findOne.mockResolvedValue({
      _id: 'cand_1',
      phone: '+254700000000',
      email: 'test@example.com',
      uniqueCode: 'BLISS-123456',
      fullName: 'Test Applicant',
      save: jest.fn().mockResolvedValue(true),
    });

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

    // Use environment variables for test credentials
    const testAdminUsername = process.env.TEST_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
    const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!testAdminUsername || !testAdminPassword) {
      console.warn('⚠️ TEST_ADMIN_USERNAME or TEST_ADMIN_PASSWORD not configured. Skipping login test.');
      return;
    }

    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({
        username: testAdminUsername,
        password: testAdminPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.token;

    const pendingRes = await request(app)
      .get('/api/admin/payments/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.success).toBe(true);
    expect(pendingRes.body.data.some((item) => item._id === submitRes.body.paymentId)).toBe(true);

    const paymentsRes = await request(app)
      .get('/api/admin/payments')
      .set('Authorization', `Bearer ${token}`);

    expect(paymentsRes.status).toBe(200);
    expect(paymentsRes.body.success).toBe(true);
    expect(paymentsRes.body.data.some((item) => item._id === submitRes.body.paymentId)).toBe(true);

    const approveRes = await request(app)
      .post(`/api/admin/payments/${submitRes.body.paymentId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.message).toContain('Payment approved');
  });

  test('lists and approves employer deployment payments', async () => {
    const payment = {
      paymentId: 'PAY-DEP-123',
      deploymentId: 'DEP-123',
      employerId: 'EMP-1',
      amount: 1200,
      currency: 'KES',
      paymentMethod: 'bank_transfer',
      transactionReference: 'TXN-123',
      paymentStatus: 'submitted',
      toObject() {
        return { ...this, toObject: undefined };
      },
      save: jest.fn().mockResolvedValue(true),
    };
    const deployment = {
      deploymentId: 'DEP-123',
      employerId: 'EMP-1',
      candidateId: 'CAN-1',
      candidateName: 'Test Candidate',
      jobPosition: 'Caregiver',
      receiptUrl: 'https://example.com/receipt.pdf',
      save: jest.fn().mockResolvedValue(true),
    };
    PaymentRecord.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([payment]),
    });
    PaymentRecord.findOne.mockResolvedValue(payment);
    Deployment.find.mockResolvedValue([deployment]);
    Deployment.findOne.mockResolvedValue(deployment);

    const app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    const token = signAdminToken({ username: 'test-admin', role: 'administrator' });

    const pendingRes = await request(app)
      .get('/api/admin/deployments/payments/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data).toEqual([
      expect.objectContaining({
        paymentId: 'PAY-DEP-123',
        paymentStatus: 'submitted',
        candidateName: 'Test Candidate',
        receiptUrl: 'https://example.com/receipt.pdf',
      }),
    ]);

    const approveRes = await request(app)
      .post('/api/admin/deployments/payments/PAY-DEP-123/approve')
      .set('Authorization', `Bearer ${token}`);

    expect(approveRes.status).toBe(200);
    expect(payment.paymentStatus).toBe('verified');
    expect(payment.expiresAt).toBeNull();
    expect(deployment.paymentStatus).toBe('verified');
    expect(deployment.adminVerified).toBe(true);
    expect(deployment.documentsReleased).toBe(true);
    expect(payment.save).toHaveBeenCalled();
    expect(deployment.save).toHaveBeenCalled();
    expect(PaymentRecord.find).toHaveBeenCalledWith({
      paymentStatus: { $nin: ['verified', 'completed'] },
      createdAt: { $gt: expect.any(Date) },
    });
  });
});
